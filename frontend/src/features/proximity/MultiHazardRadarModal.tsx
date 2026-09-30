import React, { useMemo, useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  X,
  Crosshair,
  Navigation,
  Mountain,
  Waves,
  CloudRain,
  Flame,
  Milestone,
  Building2,
  MapPin,
  Info
} from 'lucide-react';

import { 
  calculateHaversineDistanceKm
} from '../../utils/geoUtils';

export interface MultiHazardRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoords: { lat: number; lng: number } | null;
  onPickLocationOnMap: () => void;
  onStartRouteTo: (dest: { lat: number; lng: number; nama: string; id?: number }) => void;
  bencanaList?: any[];
  poskoList?: any[];
  jalanList?: any[];
}

// Alias untuk kompatibilitas internal
export const calculateDistanceKm = calculateHaversineDistanceKm;

// Master Titik Bahaya Geologis & Vulkanik Sumatera Barat (Berdasarkan Kajian PVMBG & BPBD)
const GEOLOGICAL_FAULTS = [
  {
    id: 'sianok',
    nama: 'Sesar Semangko — Segmen Sianok (Ngarai Sianok - Bukittinggi)',
    lat: -0.305,
    lng: 100.369,
    bufferBahayaKm: 2.5,
    bufferWaspadaKm: 5.0,
    keterangan: 'Patahan aktif darat pemicu gempa kerak dangkal (slip rate 11 mm/tahun)'
  },
  {
    id: 'sumani',
    nama: 'Sesar Semangko — Segmen Sumani (Singkarak - Solok)',
    lat: -0.750,
    lng: 100.620,
    bufferBahayaKm: 2.0,
    bufferWaspadaKm: 4.5,
    keterangan: 'Jalur patahan aktif melintasi pesisir timur Danau Singkarak & Kota Solok'
  },
  {
    id: 'suliti',
    nama: 'Sesar Semangko — Segmen Suliti (Surian - Solok Selatan)',
    lat: -1.520,
    lng: 101.230,
    bufferBahayaKm: 2.0,
    bufferWaspadaKm: 4.5,
    keterangan: 'Patahan darat aktif di lembah pegunungan Solok Selatan'
  },
  {
    id: 'barumun',
    nama: 'Sesar Semangko — Segmen Barumun / Angkola (Pasaman - Rao)',
    lat: 0.450,
    lng: 100.050,
    bufferBahayaKm: 2.5,
    bufferWaspadaKm: 5.0,
    keterangan: 'Segmen patahan utara Sumbar berbatasan dengan Sumut'
  }
];

const GALODO_CORRIDORS = [
  {
    id: 'anai',
    nama: 'Koridor Batang Anai (Lembah Anai / Air Mancur)',
    lat: -0.485,
    lng: 100.345,
    bufferBahayaKm: 0.5,
    bufferWaspadaKm: 2.0,
    keterangan: 'Jalur utama aliran lahar dingin Gunung Marapi & Singgalang'
  },
  {
    id: 'batabuah',
    nama: 'Bukik Batabuah & Canduang (Lereng Timur Marapi)',
    lat: -0.340,
    lng: 100.450,
    bufferBahayaKm: 0.8,
    bufferWaspadaKm: 2.5,
    keterangan: 'Zona terdampak galodo lahar hujan Marapi Mei 2024'
  },
  {
    id: 'sungai_pua',
    nama: 'Aliran Batang Aia Angek - Sungai Pua (Lereng Barat Marapi)',
    lat: -0.360,
    lng: 100.405,
    bufferBahayaKm: 0.6,
    bufferWaspadaKm: 2.0,
    keterangan: 'Hulu sungai pembawa material batu besar & pasir vulkanik'
  },
  {
    id: 'lembah_gumanti',
    nama: 'Lembah Gumanti & Danau Kembar (Lereng Gunung Talang)',
    lat: -1.025,
    lng: 100.702,
    bufferBahayaKm: 0.6,
    bufferWaspadaKm: 2.0,
    keterangan: 'Aliran galodo perbukitan Talang & luapan ke permukiman'
  },
  {
    id: 'batang_lembang',
    nama: 'Aliran DAS Batang Lembang (Kota Solok)',
    lat: -0.798,
    lng: 100.655,
    bufferBahayaKm: 0.4,
    bufferWaspadaKm: 1.5,
    keterangan: 'Sungai utama luapan banjir kiriman hulu Solok'
  }
];

const MEGATHRUST_ZONES = [
  {
    id: 'megathrust_siberut',
    nama: 'Zona Megathrust Mentawai (Segmen Siberut Mw 8.9)',
    lat: -1.250,
    lng: 99.500,
    bufferBahayaKm: 40.0,
    bufferWaspadaKm: 80.0,
    keterangan: 'Zona subduksi lempeng Indo-Australia terhadap Eurasia'
  },
  {
    id: 'pantai_padang',
    nama: 'Garis Sempadan Pantai Padang (Zona Bahaya KRB III Tsunami)',
    lat: -0.935,
    lng: 100.350,
    bufferBahayaKm: 1.5,
    bufferWaspadaKm: 3.5,
    keterangan: 'Zona rendaman tsunami jika gempa megathrust > M8.5'
  }
];

export const MultiHazardRadarModal: React.FC<MultiHazardRadarModalProps> = ({
  isOpen,
  onClose,
  userCoords,
  onPickLocationOnMap,
  onStartRouteTo,
  bencanaList = [],
  poskoList = [],
  jalanList = []
}) => {
  const [activeTab, setActiveTab] = useState<'semua' | 'sesar' | 'galodo' | 'tsunami' | 'kejadian' | 'fasilitas'>('semua');

  // Titik Acuan Pengguna (Fallback: Kantor Gubernur / Kota Padang jika belum diizinkan)
  const currentLat = userCoords?.lat ?? -0.9471;
  const currentLng = userCoords?.lng ?? 100.3543;
  const isDefaultLocation = !userCoords;

  // Ingest Spasial PostGIS Real-Time dari Backend
  const [postgisThreats, setPostgisThreats] = useState<any[] | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch(`/api/proximity/threats?lat=${currentLat}&lon=${currentLng}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.all_threats && data.all_threats.length > 0) {
          setPostgisThreats(data.all_threats);
        }
      })
      .catch(() => {});
  }, [isOpen, currentLat, currentLng]);

  // 1. Hitung Jarak ke Sesar Semangko (PostGIS GiST Spheroidal Geodesic)
  const faultsWithDistance = useMemo(() => {
    if (postgisThreats) {
      const sesar = postgisThreats.filter((t) => t.type === 'sesar');
      if (sesar.length > 0) {
        return sesar.map((t) => ({
          id: t.id,
          nama: t.name,
          lat: t.nearest_point?.lat ?? currentLat,
          lng: t.nearest_point?.lon ?? currentLng,
          bufferBahayaKm: (t.buffer_limit_meters || 2000) / 1000,
          bufferWaspadaKm: ((t.buffer_limit_meters || 2000) * 2.5) / 1000,
          keterangan: t.description || 'Patahan aktif darat Sumatera Barat (PostGIS GiST)',
          distanceKm: t.distance_km,
          status: (t.status === 'BAHAYA_LANGSUNG' ? 'BAHAYA' : t.status === 'WASPADA' ? 'WASPADA' : 'AMAN') as 'BAHAYA' | 'WASPADA' | 'AMAN'
        })).sort((a, b) => a.distanceKm - b.distanceKm);
      }
    }
    return GEOLOGICAL_FAULTS.map((f) => {
      const dist = calculateDistanceKm(currentLat, currentLng, f.lat, f.lng);
      let status: 'BAHAYA' | 'WASPADA' | 'AMAN' = 'AMAN';
      if (dist <= f.bufferBahayaKm) status = 'BAHAYA';
      else if (dist <= f.bufferWaspadaKm) status = 'WASPADA';
      return { ...f, distanceKm: dist, status };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [currentLat, currentLng, postgisThreats]);

  // 2. Hitung Jarak ke Koridor Galodo & Lahar Dingin (PostGIS GiST)
  const galodoWithDistance = useMemo(() => {
    if (postgisThreats) {
      const galodo = postgisThreats.filter((t) => t.type === 'galodo');
      if (galodo.length > 0) {
        return galodo.map((t) => ({
          id: t.id,
          nama: t.name,
          lat: t.nearest_point?.lat ?? currentLat,
          lng: t.nearest_point?.lon ?? currentLng,
          bufferBahayaKm: (t.buffer_limit_meters || 300) / 1000,
          bufferWaspadaKm: ((t.buffer_limit_meters || 300) * 2.5) / 1000,
          keterangan: t.description || 'Alur lahar hujan Marapi (PostGIS GiST)',
          distanceKm: t.distance_km,
          status: (t.status === 'BAHAYA_LANGSUNG' ? 'BAHAYA' : t.status === 'WASPADA' ? 'WASPADA' : 'AMAN') as 'BAHAYA' | 'WASPADA' | 'AMAN'
        })).sort((a, b) => a.distanceKm - b.distanceKm);
      }
    }
    return GALODO_CORRIDORS.map((g) => {
      const dist = calculateDistanceKm(currentLat, currentLng, g.lat, g.lng);
      let status: 'BAHAYA' | 'WASPADA' | 'AMAN' = 'AMAN';
      if (dist <= g.bufferBahayaKm) status = 'BAHAYA';
      else if (dist <= g.bufferWaspadaKm) status = 'WASPADA';
      return { ...g, distanceKm: dist, status };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [currentLat, currentLng, postgisThreats]);

  // 3. Hitung Jarak ke Megathrust & Tsunami (PostGIS GiST)
  const megathrustWithDistance = useMemo(() => {
    if (postgisThreats) {
      const mega = postgisThreats.filter((t) => t.type === 'megathrust');
      if (mega.length > 0) {
        return mega.map((t) => ({
          id: t.id,
          nama: t.name,
          lat: t.nearest_point?.lat ?? currentLat,
          lng: t.nearest_point?.lon ?? currentLng,
          bufferBahayaKm: (t.buffer_limit_meters || 45000) / 1000,
          bufferWaspadaKm: ((t.buffer_limit_meters || 45000) * 2.5) / 1000,
          keterangan: t.description || 'Zona subduksi aktif Megathrust Mentawai (PostGIS GiST)',
          distanceKm: t.distance_km,
          status: (t.status === 'BAHAYA_LANGSUNG' ? 'BAHAYA' : t.status === 'WASPADA' ? 'WASPADA' : 'AMAN') as 'BAHAYA' | 'WASPADA' | 'AMAN'
        })).sort((a, b) => a.distanceKm - b.distanceKm);
      }
    }
    return MEGATHRUST_ZONES.map((m) => {
      const dist = calculateDistanceKm(currentLat, currentLng, m.lat, m.lng);
      let status: 'BAHAYA' | 'WASPADA' | 'AMAN' = 'AMAN';
      if (dist <= m.bufferBahayaKm) status = 'BAHAYA';
      else if (dist <= m.bufferWaspadaKm) status = 'WASPADA';
      return { ...m, distanceKm: dist, status };
    }).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [currentLat, currentLng, postgisThreats]);

  // 4. Hitung Jarak ke Titik Bencana Riil Terdekat (Database `/api/bencana`)
  const activeBencanaWithDistance = useMemo(() => {
    if (!bencanaList || bencanaList.length === 0) return [];
    return bencanaList
      .filter((b) => b.lokasi && typeof b.lokasi.lat === 'number' && typeof b.lokasi.lon === 'number')
      .map((b) => {
        const dist = calculateDistanceKm(currentLat, currentLng, b.lokasi.lat, b.lokasi.lon);
        let status: 'BAHAYA' | 'WASPADA' | 'AMAN' = 'AMAN';
        if (dist <= 1.0) status = 'BAHAYA';
        else if (dist <= 5.0) status = 'WASPADA';
        return {
          id: b.id,
          nama: b.deskripsi || `Kejadian ${b.jenis_bencana}`,
          jenis: b.jenis_bencana,
          wilayah: b.wilayah,
          lat: b.lokasi.lat,
          lng: b.lokasi.lon,
          distanceKm: dist,
          status,
          dampak: b.dampak
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 6);
  }, [bencanaList, currentLat, currentLng]);

  // 5. Hitung Jarak ke Jalan Terputus Terdekat
  const jalanTerputusWithDistance = useMemo(() => {
    if (!jalanList || jalanList.length === 0) return [];
    return jalanList
      .map((j) => {
        let lat = 0;
        let lng = 0;
        if (j.geometry?.type === 'Point' && Array.isArray(j.geometry.coordinates)) {
          lng = j.geometry.coordinates[0];
          lat = j.geometry.coordinates[1];
        } else if (j.geometry?.type === 'LineString' && Array.isArray(j.geometry.coordinates?.[0])) {
          lng = j.geometry.coordinates[0][0];
          lat = j.geometry.coordinates[0][1];
        }
        if (!lat || !lng) return null;
        const dist = calculateDistanceKm(currentLat, currentLng, lat, lng);
        return {
          id: j.properties?.id || Math.random(),
          nama: j.properties?.deskripsi || 'Jalan Terputus',
          alasan: j.properties?.alasan || 'longsor',
          lat,
          lng,
          distanceKm: dist
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm)
      .slice(0, 4);
  }, [jalanList, currentLat, currentLng]);

  // 6. Hitung Fasilitas Evakuasi Terdekat (Shelter TES & Posko Pengungsi)
  const facilitiesWithDistance = useMemo(() => {
    if (!poskoList || poskoList.length === 0) return [];
    return poskoList
      .map((p) => {
        let lat = 0;
        let lng = 0;
        if (p.geometry?.coordinates) {
          lng = p.geometry.coordinates[0];
          lat = p.geometry.coordinates[1];
        }
        if (!lat || !lng) return null;
        const dist = calculateDistanceKm(currentLat, currentLng, lat, lng);
        const props = p.properties || {};
        return {
          id: props.id,
          nama: props.nama,
          jenis: props.jenis,
          kapasitas: props.kapasitas,
          kontak: props.kontak_pic || props.kontak_telepon,
          lat,
          lng,
          distanceKm: dist,
          distanceMeters: Math.round(dist * 1000)
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm)
      .slice(0, 6);
  }, [poskoList, currentLat, currentLng]);

  // Status Bahaya Keseluruhan Lokasi Pengguna
  const overallSafetyStatus = useMemo(() => {
    const dangerousThreats = [
      ...faultsWithDistance.filter((f) => f.status === 'BAHAYA'),
      ...galodoWithDistance.filter((g) => g.status === 'BAHAYA'),
      ...megathrustWithDistance.filter((m) => m.status === 'BAHAYA'),
      ...activeBencanaWithDistance.filter((b) => b.status === 'BAHAYA')
    ];

    if (dangerousThreats.length > 0) {
      const top = dangerousThreats[0];
      return {
        level: 'BAHAYA',
        color: 'rose',
        title: `LOKASI DALAM RADIUS BAHAYA: ${top.nama}`,
        desc: `Titik Anda terdeteksi berada di dalam zona bahaya langsung (${top.distanceKm.toFixed(1)} km dari ${top.nama}). Kenali segera shelter evakuasi dan jalur penyelamatan terdekat di bawah.`,
      };
    }

    const warningThreats = [
      ...faultsWithDistance.filter((f) => f.status === 'WASPADA'),
      ...galodoWithDistance.filter((g) => g.status === 'WASPADA'),
      ...megathrustWithDistance.filter((m) => m.status === 'WASPADA'),
      ...activeBencanaWithDistance.filter((b) => b.status === 'WASPADA')
    ];

    if (warningThreats.length > 0) {
      const top = warningThreats[0];
      return {
        level: 'WASPADA',
        color: 'amber',
        title: `ZONA WASPADA: ${top.nama}`,
        desc: `Titik Anda berada dalam radius penyangga (${top.distanceKm.toFixed(1)} km dari ${top.nama}). Tetap siaga dan pantau arahan resmi dari BPBD Sumatera Barat.`,
      };
    }

    return {
      level: 'AMAN',
      color: 'emerald',
      title: 'LOKASI TERPANTAU BERADA DI ZONA AMAN',
      desc: 'Titik Anda berada di luar radius sempadan patahan aktif Sesar Semangko (> 5 km) dan aman dari jalur primer galodo lahar dingin Marapi.',
    };
  }, [faultsWithDistance, galodoWithDistance, megathrustWithDistance, activeBencanaWithDistance]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl max-h-[90vh] bg-[#0B131D] border border-[#233547] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="radar-modal-title"
      >
        {/* HEADER MODAL */}
        <header className="px-4 sm:px-6 py-4 border-b border-[#1E2E40] bg-[#0E1825] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${
              overallSafetyStatus.level === 'BAHAYA'
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : overallSafetyStatus.level === 'WASPADA'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
            }`}>
              {overallSafetyStatus.level === 'BAHAYA' ? (
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              ) : overallSafetyStatus.level === 'WASPADA' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 id="radar-modal-title" className="text-base sm:text-lg font-bold font-display text-white">
                Radar Jarak &amp; Matriks Bahaya Bencana
              </h2>
              <p className="text-xs text-slate-400">
                Pemetaan jarak spasial real-time dari posisi Anda ke seluruh potensi ancaman di Sumatera Barat
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* HERO STATUS KESELAMATAN LOKASI SAAT INI */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#101A26] border-b border-[#1E2E40]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-black uppercase tracking-wider ${
                  overallSafetyStatus.level === 'BAHAYA'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : overallSafetyStatus.level === 'WASPADA'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  STATUS: {overallSafetyStatus.level}
                </span>
                <span className="text-xs text-slate-300 font-semibold">
                  {overallSafetyStatus.title}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {overallSafetyStatus.desc}
              </p>
            </div>

            {/* KOORDINAT & TOMBOL GANTI TITIK */}
            <div className="flex items-center gap-2 shrink-0 bg-[#070D14] px-3 py-2 rounded-xl border border-[#1E2E40]">
              <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
              <div className="text-right">
                <div className="text-[10px] font-mono text-slate-400">
                  {isDefaultLocation ? 'Lokasi Default (Padang)' : 'Titik Acuan Anda'}
                </div>
                <div className="text-xs font-mono font-bold text-white">
                  {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPickLocationOnMap();
                }}
                className="ml-2 px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title="Tentukan titik baru di peta"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Pilih Titik</span>
              </button>
            </div>
          </div>
        </div>

        {/* TAB FILTER KATEGORI BAHAYA */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-[#1E2E40] bg-[#0B131D] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('semua')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'semua'
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Semua Matriks ({faultsWithDistance.length + galodoWithDistance.length + activeBencanaWithDistance.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sesar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'sesar'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>Sesar Semangko ({faultsWithDistance.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('galodo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'galodo'
                ? 'bg-rose-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Galodo &amp; Lahar ({galodoWithDistance.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tsunami')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'tsunami'
                ? 'bg-cyan-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Megathrust &amp; Tsunami ({megathrustWithDistance.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kejadian')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'kejadian'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Bencana Terkini ({activeBencanaWithDistance.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fasilitas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'fasilitas'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Shelter &amp; Posko Terdekat ({facilitiesWithDistance.length})</span>
          </button>
        </div>

        {/* BODY CONTENT (SCROLLABLE LIST) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin scrollbar-thumb-[#1E2E40] scrollbar-track-transparent">
          
          {/* SEKSI 1: SESAR SEMANGKO (PATAHAN DARAT AKTIF) */}
          {(activeTab === 'semua' || activeTab === 'sesar') && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mountain className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-300">
                    Jarak ke Segmen Patahan Sesar Semangko
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Radius Bahaya: &lt; 2.5 km</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {faultsWithDistance.map((f) => (
                  <div
                    key={f.id}
                    className={`p-3 rounded-xl border transition-all ${
                      f.status === 'BAHAYA'
                        ? 'bg-rose-950/40 border-rose-500/60 shadow-sm'
                        : f.status === 'WASPADA'
                        ? 'bg-amber-950/30 border-amber-500/40'
                        : 'bg-[#101A26] border-[#1E2E40] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{f.nama}</div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {f.keterangan}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-mono font-black text-amber-400">
                          {f.distanceKm.toFixed(1)} km
                        </div>
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase mt-1 ${
                          f.status === 'BAHAYA'
                            ? 'bg-rose-500/30 text-rose-300'
                            : f.status === 'WASPADA'
                            ? 'bg-amber-500/30 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {f.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEKSI 2: KORIDOR GALODO & LAHAR DINGIN */}
          {(activeTab === 'semua' || activeTab === 'galodo') && (
            <div className="space-y-2.5 pt-2 border-t border-[#1C2836]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-rose-300">
                    Jarak ke Aliran Lahar Dingin &amp; Galodo Marapi / Talang
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Radius Bahaya: &lt; 800 meter</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {galodoWithDistance.map((g) => (
                  <div
                    key={g.id}
                    className={`p-3 rounded-xl border transition-all ${
                      g.status === 'BAHAYA'
                        ? 'bg-rose-950/40 border-rose-500/60 shadow-sm'
                        : g.status === 'WASPADA'
                        ? 'bg-amber-950/30 border-amber-500/40'
                        : 'bg-[#101A26] border-[#1E2E40] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{g.nama}</div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {g.keterangan}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-mono font-black text-rose-400">
                          {g.distanceKm.toFixed(1)} km
                        </div>
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase mt-1 ${
                          g.status === 'BAHAYA'
                            ? 'bg-rose-500/30 text-rose-300'
                            : g.status === 'WASPADA'
                            ? 'bg-amber-500/30 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {g.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEKSI 2.5: MEGATHRUST MENTAWAI & RENDAMAN TSUNAMI */}
          {(activeTab === 'semua' || activeTab === 'tsunami') && (
            <div className="space-y-2.5 pt-2 border-t border-[#1C2836]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Waves className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-300">
                    Jarak ke Zona Megathrust Mentawai &amp; Bahaya Tsunami
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Sempadan Pantai: &lt; 1.5 km</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {megathrustWithDistance.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border transition-all ${
                      m.status === 'BAHAYA'
                        ? 'bg-rose-950/40 border-rose-500/60 shadow-sm'
                        : m.status === 'WASPADA'
                        ? 'bg-amber-950/30 border-amber-500/40'
                        : 'bg-[#101A26] border-[#1E2E40] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{m.nama}</div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {m.keterangan}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-mono font-black text-cyan-400">
                          {m.distanceKm.toFixed(1)} km
                        </div>
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase mt-1 ${
                          m.status === 'BAHAYA'
                            ? 'bg-rose-500/30 text-rose-300'
                            : m.status === 'WASPADA'
                            ? 'bg-amber-500/30 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {m.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEKSI 3: TITIK BENCANA RIIL DARI DATABASE & JALAN TERPUTUS */}
          {(activeTab === 'semua' || activeTab === 'kejadian') && (
            <div className="space-y-2.5 pt-2 border-t border-[#1C2836]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-purple-300">
                    Jarak ke Titik Kejadian Bencana Aktif &amp; Longsor Terdekat
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Sumber: PUSDALOPS BPBD</span>
              </div>

              {activeBencanaWithDistance.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#101A26] border border-[#1E2E40] text-center text-xs text-slate-400">
                  Tidak ada titik kejadian bencana aktif yang terdata di dekat lokasi Anda.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeBencanaWithDistance.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-xl bg-[#101A26] border border-[#1E2E40] hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {b.jenis}
                            </span>
                            <span className="text-xs font-bold text-white truncate">{b.wilayah}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 line-clamp-2">
                            {b.nama}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-mono font-black text-purple-400">
                            {b.distanceKm.toFixed(1)} km
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">dari Anda</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* JALAN TERPUTUS TERDEKAT */}
              {jalanTerputusWithDistance.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold block">
                    Ruas Jalan Terputus Terdekat:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {jalanTerputusWithDistance.map((j: any) => (
                      <div key={j.id} className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <Milestone className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="text-slate-200 truncate">{j.nama}</span>
                        </div>
                        <span className="font-mono font-bold text-rose-400 shrink-0">{j.distanceKm.toFixed(1)} km</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SEKSI 4: FASILITAS EVAKUASI TERDEKAT (AKSI SOLUTIF EVAKUASI LANGSUNG) */}
          {(activeTab === 'semua' || activeTab === 'fasilitas') && (
            <div className="space-y-2.5 pt-2 border-t border-[#1C2836]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-300">
                    Fasilitas Penyelamatan &amp; Evakuasi Terdekat
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Navigasi Langsung Tersedia</span>
              </div>

              {facilitiesWithDistance.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#101A26] border border-[#1E2E40] text-center text-xs text-slate-400">
                  Data fasilitas evakuasi sedang dimuat...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {facilitiesWithDistance.map((fac: any) => {
                    const isTes = fac.jenis === 'shelter_tes_tea' || fac.jenis === 'shelter_sementara';
                    return (
                      <div
                        key={fac.id}
                        className="p-3 rounded-xl bg-[#101A26] border border-[#1E2E40] hover:border-emerald-500/50 transition-all flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              isTes
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}>
                              {isTes ? 'Shelter TES Vertikal' : 'Posko Resmi'}
                            </span>
                            <span className="text-xs font-mono font-bold text-emerald-400">
                              {fac.distanceKm < 1 ? `${fac.distanceMeters} m` : `${fac.distanceKm.toFixed(2)} km`}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-white mt-1.5 truncate">
                            {fac.nama}
                          </div>
                          {fac.kapasitas > 0 && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Kapasitas: {fac.kapasitas.toLocaleString('id-ID')} jiwa
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onStartRouteTo({ lat: fac.lat, lng: fac.lng, nama: fac.nama });
                          }}
                            className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                          >
                            <Navigation className="w-3.5 h-3.5 text-white" />
                            <span>Arahkan Rute Evakuasi ke Sini</span>
                          </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SEKSI 5: PANDUAN KESELAMATAN ILMIAH MANDIRI */}
          <div className="p-3.5 rounded-xl bg-[#101A26] border border-sky-500/30 flex items-start gap-3">
            <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-white block">
                Prinsip Mitigasi Spasial BPBD Sumatera Barat:
              </span>
              <p>
                Jika Anda merasakan gempa bumi kuat berdurasi lebih dari 60 detik (karakteristik Megathrust), segera evakuasi ke shelter bertingkat atau menuju timur melintasi Jalur Bypass Padang tanpa menunggu sirene. Bila hujan lebat berlangsung &gt;2 jam di hulu lereng Marapi/Singgalang, hindari sempadan sungai dalam radius 500 meter.
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER MODAL */}
        <footer className="px-4 sm:px-6 py-3 border-t border-[#1E2E40] bg-[#0E1825] flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">
            Kompilasi Spasial GIS BPBD Sumbar &bull; WGS84 Geodesic
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Tutup Radar
          </button>
        </footer>
      </div>
    </div>
  );
};
