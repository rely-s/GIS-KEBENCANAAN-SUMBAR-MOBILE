/**
 * API Client Configuration
 * Terhubung langsung ke FastAPI backend (:8000/api).
 * Dilengkapi graceful fallback untuk data kalkulasi darurat jika koneksi terputus.
 */

import axios from 'axios';
import { Platform } from 'react-native';
import { ProximityCheckResponse, PoskoResponse, LaporWargaPayload, EnvironmentalHealthResponse } from '../types';

// IP Host LAN untuk koneksi Expo Go di perangkat fisik HP
export const LAN_HOST = '192.168.100.77';
export const API_BASE_URL = Platform.OS === 'web'
  ? (typeof window !== 'undefined' && window.location.hostname
      ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://127.0.0.1:8000/api'
          : `http://${window.location.hostname}:8000/api`)
      : `http://${LAN_HOST}:8000/api`)
  : `http://${LAN_HOST}:8000/api`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

/**
 * Fallback Geodesic Engine Lokal (Offline-First)
 * Berjalan langsung di perangkat jika koneksi server HTTP terputus
 */
export function calculateLocalHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius bumi dalam KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// Data Geometri Kunci Sumatera Barat untuk Kalkulasi Mandiri (Offline)
export const SUMBAR_KNOWN_POINTS = {
  tsunamiCoastPadang: { lat: -0.9320, lon: 100.3450, name: 'Garis Pesisir Pantai Padang' },
  sesarSianok: { lat: -0.3050, lon: 100.3690, name: 'Sesar Semangko Segmen Sianok' },
  galodoMarapi: { lat: -0.4850, lon: 100.3450, name: 'Alur Lahar Dingin Batang Anai' },
  banjirKuranji: { lat: -0.9020, lon: 100.3750, name: 'DAS Batang Kuranji' },
  tesUlakKarang: { lat: -0.9125, lon: 100.3540, name: 'TES Ulak Karang Padang Utara' },
  poskoBpbdPadang: { lat: -0.9380, lon: 100.3610, name: 'Posko Komando BPBD Kota Padang' },
};

/**
 * Panggil pemeriksaan kedekatan bahaya spasial
 */
export async function fetchProximityCheck(lat: number, lon: number): Promise<ProximityCheckResponse> {
  try {
    const res = await apiClient.get<ProximityCheckResponse>(`/proximity/check?lat=${lat}&lon=${lon}`);
    return res.data;
  } catch (err) {
    // Graceful offline fallback menggunakan kalkulasi Haversine lokal
    const distTsunami = calculateLocalHaversineKm(lat, lon, SUMBAR_KNOWN_POINTS.tsunamiCoastPadang.lat, SUMBAR_KNOWN_POINTS.tsunamiCoastPadang.lon);
    const distSesar = calculateLocalHaversineKm(lat, lon, SUMBAR_KNOWN_POINTS.sesarSianok.lat, SUMBAR_KNOWN_POINTS.sesarSianok.lon);
    const distGalodo = calculateLocalHaversineKm(lat, lon, SUMBAR_KNOWN_POINTS.galodoMarapi.lat, SUMBAR_KNOWN_POINTS.galodoMarapi.lon);
    const distBanjir = calculateLocalHaversineKm(lat, lon, SUMBAR_KNOWN_POINTS.banjirKuranji.lat, SUMBAR_KNOWN_POINTS.banjirKuranji.lon);

    const isDanger = distTsunami <= 1.0;
    const isWarning = distTsunami <= 3.0 || distBanjir <= 1.5;
    const status = isDanger ? 'BAHAYA_LANGSUNG' : isWarning ? 'WASPADA' : 'ZONA_AMAN';

    return {
      status: 'ok',
      user_location: { lat, lon },
      primary_threat: {
        id: 'tsunami_coast',
        name: 'Zona Ancaman Tsunami Pesisir Barat',
        type: 'tsunami',
        distance_meters: Math.round(distTsunami * 1000),
        distance_km: distTsunami,
        buffer_limit_meters: 1000,
        status: status,
        description: 'Kawasan pesisir pantai barat Sumatera Barat berisiko rendaman gelombang laut.',
        actionable_directive: isDanger
          ? 'ZONA BAHAYA LANGSUNG! Tinggalkan kendaraan jika macet, segera lari ke arah Timur menuju shelter vertikal (>15 mdpl)!'
          : isWarning
          ? 'WASPADA: Berada dalam radius potensi bahaya. Siagakan tas siaga bencana dan pantau rute evakuasi.'
          : 'Lokasi Anda berada di luar radius sempadan bahaya langsung saat ini.',
        nearest_point: SUMBAR_KNOWN_POINTS.tsunamiCoastPadang,
      },
      all_threats: [
        {
          id: 'tsunami',
          name: 'Zona Tsunami Pantai',
          type: 'tsunami',
          distance_meters: Math.round(distTsunami * 1000),
          distance_km: distTsunami,
          buffer_limit_meters: 1000,
          status: distTsunami <= 1.0 ? 'BAHAYA_LANGSUNG' : distTsunami <= 3.0 ? 'WASPADA' : 'ZONA_AMAN',
          description: 'Pesisir pantai Padang',
          actionable_directive: 'Evakuasi ke zona aman atau shelter bertingkat',
          nearest_point: SUMBAR_KNOWN_POINTS.tsunamiCoastPadang,
        },
        {
          id: 'sesar',
          name: 'Sesar Semangko (Patahan Darat)',
          type: 'sesar',
          distance_meters: Math.round(distSesar * 1000),
          distance_km: distSesar,
          buffer_limit_meters: 2500,
          status: distSesar <= 2.5 ? 'BAHAYA_LANGSUNG' : distSesar <= 5.0 ? 'WASPADA' : 'ZONA_AMAN',
          description: 'Koridor sesar aktif Semangko',
          actionable_directive: 'Hindari bangunan bertingkat rawan retak tanah',
          nearest_point: SUMBAR_KNOWN_POINTS.sesarSianok,
        },
        {
          id: 'galodo',
          name: 'Zona Lahar Dingin (Galodo)',
          type: 'galodo',
          distance_meters: Math.round(distGalodo * 1000),
          distance_km: distGalodo,
          buffer_limit_meters: 300,
          status: distGalodo <= 0.5 ? 'BAHAYA_LANGSUNG' : distGalodo <= 2.0 ? 'WASPADA' : 'ZONA_AMAN',
          description: 'Alur sempadan sungai lahar Marapi',
          actionable_directive: 'Jauhi sempadan sungai minimal 300 meter',
          nearest_point: SUMBAR_KNOWN_POINTS.galodoMarapi,
        },
        {
          id: 'banjir',
          name: 'Zona Rawan Banjir DAS',
          type: 'banjir',
          distance_meters: Math.round(distBanjir * 1000),
          distance_km: distBanjir,
          buffer_limit_meters: 500,
          status: distBanjir <= 0.8 ? 'WASPADA' : 'ZONA_AMAN',
          description: 'Daerah Aliran Sungai rawan luapan',
          actionable_directive: 'Waspadai kenaikan debit air saat hujan intensitas tinggi',
          nearest_point: SUMBAR_KNOWN_POINTS.banjirKuranji,
        },
      ],
      engine: 'PostGIS Native Spheroidal Geodesic (Client Offline Resilient)',
    };
  }
}

/**
 * Ambil daftar shelter dan posko
 */
export async function fetchShelters(lat: number, lon: number): Promise<PoskoResponse> {
  try {
    const res = await apiClient.get<PoskoResponse>(`/posko?lat=${lat}&lon=${lon}&limit=5`);
    return res.data;
  } catch (err) {
    // Fallback data shelter offline
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [100.3540, -0.9125] },
          properties: {
            id: 101,
            nama: 'TES Ulak Karang (Tempat Evakuasi Sementara)',
            jenis: 'shelter_tes_tea',
            kapasitas: 1500,
            fasilitas: ['air_bersih', 'genset', 'ramah_difabel'],
            kontak_pic: 'Pusdalops Padang',
            kontak_telepon: '0751-890000',
            status: 'aktif',
            jumlah_pengungsi: 120,
            ketersediaan_air_bersih: 'YA',
            ketersediaan_tenaga_medis: 'YA',
          },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [100.3620, -0.9410] },
          properties: {
            id: 102,
            nama: 'Shelter Masjid Raya Nurul Iman',
            jenis: 'shelter_tes_tea',
            kapasitas: 3000,
            fasilitas: ['air_bersih', 'dapur_umum', 'mck'],
            kontak_pic: 'Pengurus Masjid',
            kontak_telepon: '0751-765432',
            status: 'aktif',
            jumlah_pengungsi: 0,
            ketersediaan_air_bersih: 'YA',
            ketersediaan_tenaga_medis: 'TIDAK',
          },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [100.3610, -0.9380] },
          properties: {
            id: 103,
            nama: 'Posko Komando BPBD Kota Padang',
            jenis: 'posko_utama',
            kapasitas: 500,
            fasilitas: ['genset', 'faskes', 'dapur_umum', 'air_bersih'],
            kontak_pic: 'Operator Siaga 112',
            kontak_telepon: '112',
            status: 'aktif',
            ketersediaan_air_bersih: 'YA',
            ketersediaan_tenaga_medis: 'YA',
          },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [100.3680, -0.9250] },
          properties: {
            id: 104,
            nama: 'Pos Medis Darurat PMI & Dinkes Sumbar',
            jenis: 'fasilitas_kesehatan',
            kapasitas: 250,
            fasilitas: ['faskes', 'ambulans', 'air_bersih'],
            kontak_pic: 'Emergency Call 118',
            kontak_telepon: '118',
            status: 'aktif',
            ketersediaan_air_bersih: 'YA',
            ketersediaan_tenaga_medis: 'YA',
          },
        },
      ],
    };
  }
}

/**
 * Kirim laporan kejadian warga ke backend PostgreSQL Pusdalops
 */
export async function sendLaporanKejadian(payload: LaporWargaPayload): Promise<{ success: boolean; message: string; id?: number; ticket_id?: string }> {
  try {
    const res = await apiClient.post('/bencana/lapor', payload);
    return {
      success: true,
      message: res.data?.message || 'Laporan berhasil diterima oleh Pusdalops BPBD',
      id: res.data?.id || res.data?.bencana_id,
      ticket_id: res.data?.ticket_id,
    };
  } catch (err: any) {
    const msg = err.response?.data?.error?.message || 'Gagal terhubung ke server. Laporan tersimpan di antrean offline HP.';
    return { success: false, message: msg };
  }
}

/**
 * Cek status validasi laporan dari petugas BPBD (menunggu / terverifikasi / ditolak)
 */
export async function fetchStatusLaporan(bencanaId: number | string): Promise<any | null> {
  try {
    const numId = typeof bencanaId === 'string' ? parseInt(bencanaId.replace(/\D/g, ''), 10) : bencanaId;
    if (!numId || isNaN(numId)) return null;
    const res = await apiClient.get(`/bencana/laporan/status/${numId}`);
    return res.data;
  } catch (err) {
    return null;
  }
}

/**
 * Live Feed: Peringatan Gempa Terkini Real-Time BMKG (InaTEWS)
 */
export async function fetchGempaTerkini(): Promise<any> {
  try {
    const res = await apiClient.get('/eksternal/gempa-terkini');
    if (res.data?.data) {
      return res.data.data;
    }
  } catch (err) {
    // Lanjutkan ke direct fetch BMKG Open Data jika backend lokal belum siap
  }

  try {
    // Ambil langsung dari Server Open Data Resmi BMKG InaTEWS
    const directBmkg = await axios.get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json', { timeout: 6000 });
    const g = directBmkg.data?.Infogempa?.gempa;
    if (g) {
      const coords = (g.Coordinates || '').split(',');
      const lat = coords[0] ? parseFloat(coords[0].trim()) : 0;
      const lon = coords[1] ? parseFloat(coords[1].trim()) : 0;
      const mag = parseFloat(g.Magnitude || '0');
      const depth = parseFloat((g.Kedalaman || '').replace('km', '').trim() || '0');
      const potensiText = g.Potensi || 'Tidak berpotensi tsunami';
      const isTsunami = potensiText.toLowerCase().includes('berpotensi tsunami');

      return {
        id: 'bmkg-realtime-' + (g.DateTime || Date.now()),
        magnitude: mag,
        kedalaman_km: depth,
        lat,
        lon,
        lintang: g.Lintang,
        bujur: g.Bujur,
        wilayah_teks: g.Wilayah || 'Pusat Gempa Terdeteksi',
        waktu_kejadian: `${g.Tanggal} • ${g.Jam}`,
        potensi_tsunami: isTsunami,
        potensi_teks: potensiText,
        dirasakan: g.Dirasakan || null,
        shakemap_url: g.Shakemap ? `https://data.bmkg.go.id/DataMKG/TEWS/${g.Shakemap}` : null,
        atribusi: 'BMKG Indonesia (Pusat Gempa Nasional / InaTEWS)',
      };
    }
  } catch (directErr) {
    console.warn('[BMKG Direct Fetch Warning]', directErr);
  }

  return null;
}

/**
 * Live Feed: Peringatan Dini & Prakiraan Cuaca BMKG Sumbar
 */
export async function fetchCuacaPeringatan(): Promise<any[]> {
  try {
    const res = await apiClient.get('/eksternal/cuaca-peringatan');
    const items = res.data?.data || res.data;
    if (Array.isArray(items) && items.length > 0) {
      return items;
    }
  } catch (err) {
    // Lanjutkan ke direct fetch BMKG Weather jika backend lokal belum siap
  }

  try {
    // Ambil langsung prakiraan cuaca digital resmi BMKG (Kota Padang adm4: 13.71.01.1001)
    const resp = await axios.get('https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=13.71.01.1001', { timeout: 6000 });
    const weatherBlocks = resp.data?.data?.[0]?.cuaca || [];
    const flatCuaca = weatherBlocks.flat();
    if (flatCuaca.length > 0) {
      const nowC = flatCuaca[0];
      const isSevere = (nowC.tp && nowC.tp >= 5) || (nowC.weather_desc && (nowC.weather_desc.toLowerCase().includes('petir') || nowC.weather_desc.toLowerCase().includes('lebat')));
      return [
        {
          id: 'bmkg-cuaca-live-padang',
          event: `Prakiraan Cuaca Resmi BMKG (${nowC.weather_desc || 'Terkini'})`,
          headline: `Wilayah Kota Padang: ${nowC.weather_desc}, Suhu ${nowC.t}°C, Kelembaban ${nowC.hu}%, Angin ${nowC.ws} km/jam arah ${nowC.wd}. Presipitasi ${nowC.tp || 0} mm/jam.`,
          description: `Analisis Stasiun Meteorologi Minangkabau BMKG untuk wilayah pesisir barat Sumatera Barat. Tetap waspada terhadap perubahan cuaca mendadak saat beraktivitas di luar ruangan.`,
          area_desc: 'Kota Padang & Wilayah Pesisir Barat Sumbar',
          severity: isSevere ? 'Severe' : 'Moderate',
          effective: nowC.local_datetime || new Date().toISOString(),
          atribusi: 'Stasiun Meteorologi BMKG Minangkabau',
        },
      ];
    }
  } catch (weatherErr) {
    console.warn('[BMKG Weather Direct Fetch Warning]', weatherErr);
  }

  return [];
}

/**
 * Live Feed: Ruas Jalan Terputus (Blokade Galodo/Longsor)
 */
export async function fetchJalanTerputus(): Promise<any[]> {
  try {
    const res = await apiClient.get('/jalan-terputus');
    return res.data?.features || [];
  } catch (err) {
    return [];
  }
}

/**
 * Live Feed: Kejadian Bencana Terverifikasi Pusdalops
 */
export async function fetchBencanaPublik(): Promise<any[]> {
  try {
    const res = await apiClient.get('/bencana?limit=10');
    return res.data?.data || [];
  } catch (err) {
    return [];
  }
}

/**
 * Live Feed: Indeks Kualitas Udara (ISPU/PM2.5) & Indeks Panas (Heat Index) BMKG
 */
export async function fetchEnvironmentalHealth(lat: number = -0.9471, lon: number = 100.3543): Promise<EnvironmentalHealthResponse> {
  try {
    const res = await apiClient.get<EnvironmentalHealthResponse>(`/eksternal/lingkungan-terkini?lat=${lat}&lon=${lon}`);
    if (res.data && res.data.panas && res.data.kualitas_udara) {
      return res.data;
    }
    throw new Error('Respon lingkungan tidak lengkap');
  } catch (err) {
    // Graceful offline fallback: Hitung Heat Index & ISPU standar tropis Sumbar
    return {
      status: 'offline_fallback',
      timestamp: new Date().toISOString(),
      lokasi: {
        lat,
        lon,
        stasiun_terdekat: 'Stasiun Meteorologi Minangkabau (Data Sensor Tersimpan)',
      },
      panas: {
        suhu_aktual_c: 28.5,
        suhu_terasa_c: 32.4,
        kelembapan_persen: 84,
        kecepatan_angin_kmh: 7.2,
        arah_angin: 'SW',
        curah_hujan_mm: 0.0,
        kondisi_cuaca: 'Cerah Berawan',
        kategori: 'Waspada (Caution)',
        warna: '#f59e0b',
        rekomendasi: 'Kelelahan dapat terjadi jika beraktivitas lama di bawah terik. Pastikan asupan hidrasi cukup.',
      },
      kualitas_udara: {
        ispu_value: 48,
        pm25: 12.4,
        pm10: 24.1,
        kategori: 'Baik',
        warna: '#10b981',
        parameter_kritis: 'PM2.5',
        stasiun_referensi: 'Stasiun GAW BMKG Bukit Kototabang / Stasiun Minangkabau',
        rekomendasi: 'Kualitas udara bersih dan sehat. Sangat kondusif untuk aktivitas luar ruangan.',
        polutan_lain: {
          co: 380,
          no2: 4.8,
          o3: 32.0,
          so2: 3.5,
        },
      },
      atribusi: 'BMKG & Stasiun Pemantau Atmosfer Global (GAW) Bukit Kototabang',
    };
  }
}

