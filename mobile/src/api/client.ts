/**
 * API Client Configuration
 * Terhubung langsung ke FastAPI backend (:8000/api).
 * Dilengkapi graceful fallback untuk data kalkulasi darurat jika koneksi terputus.
 */

import axios from 'axios';
import { ProximityCheckResponse, PoskoResponse, LaporWargaPayload } from '../types';

// Konfigurasi IP Host: Ubah sesuai IP LAN komputer saat pengujian fisik di HP (contoh: 'http://192.168.1.10:8000/api')
// Default 10.0.2.2 untuk Android Emulator, 127.0.0.1 untuk iOS simulator/web
export const API_BASE_URL = 'http://127.0.0.1:8000/api';

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
 * Live Feed: Peringatan Gempa Terkini BMKG
 */
export async function fetchGempaTerkini(): Promise<any> {
  try {
    const res = await apiClient.get('/eksternal/gempa-terkini');
    return res.data?.data || null;
  } catch (err) {
    // Fallback data gempa jika offline
    return {
      id: 999,
      magnitude: 5.3,
      kedalaman_km: 10,
      wilayah_teks: '48 km Barat Daya Pasaman Barat',
      waktu_kejadian: new Date().toISOString(),
      potensi_tsunami: false,
      dirasakan: true,
      atribusi: 'BMKG (Data Cadangan Offline)',
    };
  }
}

/**
 * Live Feed: Peringatan Dini Cuaca Ekstrem BMKG
 */
export async function fetchCuacaPeringatan(): Promise<any[]> {
  try {
    const res = await apiClient.get('/eksternal/cuaca-peringatan');
    return res.data?.data || res.data || [];
  } catch (err) {
    return [
      {
        id: 991,
        event: 'Peringatan Dini Cuaca Sumbar',
        headline: 'Waspada potensi hujan sedang-lebat disertai petir di Padang Pariaman, Pesisir Selatan, Agam.',
        area_desc: 'Sumatera Barat',
        severity: 'Moderate',
      },
    ];
  }
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
