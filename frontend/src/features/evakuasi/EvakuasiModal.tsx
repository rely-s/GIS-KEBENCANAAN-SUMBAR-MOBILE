import React, { useState, useEffect } from 'react';
import { 
  Waves, 
  AlertTriangle, 
  Navigation, 
  Crosshair, 
  X, 
  ShieldCheck, 
  Radio, 
  RefreshCw,
  MapPin,
  Bot,
  Activity,
  Flame,
  CloudRain,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { DisasterChatbot } from '../bot/DisasterChatbot';

export type MultiHazardType = 'tsunami' | 'galodo' | 'sesar' | 'erupsi';

export interface EvakuasiStartParams {
  jenis_bencana: MultiHazardType | string;
  kecamatan_id?: number | string;
  kecamatan_nama?: string;
  lat?: number;
  lon?: number;
  moda: 'mobil' | 'jalan_kaki';
}

interface EvakuasiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartEvakuasi: (params: EvakuasiStartParams) => void;
  loading: boolean;
  defaultJenisBencana?: string;
  userCoords?: { lat: number; lng: number } | null;
  onPickLocationOnMap?: () => void;
  onFlyToLocation?: (coords: { lat: number; lng: number; zoom?: number }) => void;
  onSelectDestination?: (loc: { lat: number; lng: number; nama: string }) => void;
}

interface HazardProtocolMeta {
  id: MultiHazardType;
  label: string;
  subLabel: string;
  protokolCode: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  ringColor: string;
  pedoman: string;
  larangan: string;
}

const HAZARD_PROTOCOLS: HazardProtocolMeta[] = [
  {
    id: 'tsunami',
    label: 'Tsunami Megathrust',
    subLabel: 'Pesisir Barat & Kep. Mentawai',
    protokolCode: 'PROTOKOL 1 — TSUNAMI',
    icon: Waves,
    accentColor: 'text-rose-400',
    borderColor: 'border-rose-500/80',
    bgColor: 'bg-rose-950/40',
    ringColor: 'ring-rose-500/40',
    pedoman: 'Prioritas Shelter Vertikal TES (Lantai 3+) atau dataran timur Garis Bypass (> 15 mdpl).',
    larangan: 'Jangan bertahan di pantai atau gedung non-seismik 1 lantai.'
  },
  {
    id: 'galodo',
    label: 'Banjir Lahar / Galodo',
    subLabel: 'Gunung Marapi & Koridor Aliran',
    protokolCode: 'PROTOKOL 2 — GALODO',
    icon: CloudRain,
    accentColor: 'text-amber-400',
    borderColor: 'border-amber-500/80',
    bgColor: 'bg-amber-950/40',
    ringColor: 'ring-amber-500/40',
    pedoman: 'Bergerak tegak lurus lembah sungai menuju punggung bukit terdekat.',
    larangan: 'DILARANG menyeberangi jembatan atau berada di dekat sempadan sungai lahar!'
  },
  {
    id: 'sesar',
    label: 'Gempa Sesar Darat',
    subLabel: 'Sesar Semangko / Sianok / Sumani',
    protokolCode: 'PROTOKOL 3 — SESAR',
    icon: Activity,
    accentColor: 'text-orange-400',
    borderColor: 'border-orange-500/80',
    bgColor: 'bg-orange-950/40',
    ringColor: 'ring-orange-500/40',
    pedoman: 'Evakuasi menuju ruang terbuka (lapangan/alun-alun/stadion terbuka).',
    larangan: 'Hindari shelter bertingkat tinggi dan jauhi tebing curam (Ngarai Sianok).'
  },
  {
    id: 'erupsi',
    label: 'Erupsi Gunung Api',
    subLabel: 'Gunung Marapi / PVMBG Radius 4.5 km',
    protokolCode: 'PROTOKOL 4 — ERUPSI',
    icon: Flame,
    accentColor: 'text-red-400',
    borderColor: 'border-red-500/80',
    bgColor: 'bg-red-950/40',
    ringColor: 'ring-red-500/40',
    pedoman: 'Jauhi radius 4.5 km dari kaldera kawah aktif. Kenakan masker penutup abu.',
    larangan: 'Jangan beraktivitas di lembah sungai hulu lahar saat hujan di puncak.'
  }
];

export const EvakuasiModal: React.FC<EvakuasiModalProps> = ({
  isOpen,
  onClose,
  onStartEvakuasi,
  loading,
  defaultJenisBencana = 'tsunami',
  userCoords,
  onPickLocationOnMap,
  onFlyToLocation,
  onSelectDestination
}) => {
  const [activeTab, setActiveTab] = useState<'rute' | 'asisten'>('rute');
  
  // 4 Protokol Multi-Hazard Spesifik BNPB
  const resolveInitialHazard = (): MultiHazardType => {
    const lower = defaultJenisBencana.toLowerCase();
    if (lower.includes('galodo') || lower.includes('lahar') || lower.includes('bandang')) return 'galodo';
    if (lower.includes('sesar') || lower.includes('gempa') || lower.includes('semangko')) return 'sesar';
    if (lower.includes('erupsi') || lower.includes('vulkanik')) return 'erupsi';
    return 'tsunami';
  };

  const [selectedHazard, setSelectedHazard] = useState<MultiHazardType>(resolveInitialHazard);
  const [bencanaAktifInfo, setBencanaAktifInfo] = useState<any>(null);

  // 2. Lokasi Pengguna
  const [useGps, setUseGps] = useState<boolean>(false);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [detectedWilayahNama, setDetectedWilayahNama] = useState<string | null>(null);
  const [activeCoords, setActiveCoords] = useState<{ lat: number; lon: number } | null>(
    userCoords ? { lat: userCoords.lat, lon: userCoords.lng } : null
  );

  // 3. Moda Transportasi
  const [selectedModa, setSelectedModa] = useState<'mobil' | 'jalan_kaki'>('mobil');

  // Sinkronisasi koordinat kursor peta jika berubah di props
  useEffect(() => {
    if (userCoords) {
      setActiveCoords({ lat: userCoords.lat, lon: userCoords.lng });
    }
  }, [userCoords]);

  // Periksa sensor bencana aktif BMKG saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      fetch('/api/routing/bencana-aktif')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setBencanaAktifInfo(data);
            if (data.status_siaga === 'BAHAYA_TSUNAMI') {
              setSelectedHazard('tsunami');
            } else if (data.status_siaga === 'SIAGA_GALODO') {
              setSelectedHazard('galodo');
            } else if (data.status_siaga === 'WASPADA_GEMPA_SESAR') {
              setSelectedHazard('sesar');
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Handler Deteksi GPS Otomatis
  const handleUseGps = () => {
    if (!navigator.geolocation) {
      alert('Peramban tidak mendukung Geolocation API');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setActiveCoords({ lat, lon });
        setUseGps(true);

        try {
          const res = await fetch(`/api/wilayah/lookup?lat=${lat}&lon=${lon}`);
          if (res.ok) {
            const lookup = await res.json();
            if (lookup && lookup.nama) {
              setDetectedWilayahNama(`Kecamatan ${lookup.nama}${lookup.parent_nama ? `, ${lookup.parent_nama}` : ''}`);
            }
          }
        } catch (e) {
          console.debug('Lookup error:', e);
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        alert(`Gagal mendeteksi lokasi GPS: ${err.message}. Sistem akan menggunakan titik koordinat peta.`);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Submit Mulai Evakuasi
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartEvakuasi({
      jenis_bencana: selectedHazard,
      lat: activeCoords?.lat,
      lon: activeCoords?.lon,
      moda: selectedModa,
      kecamatan_nama: detectedWilayahNama || undefined
    });
  };

  const activeMeta = HAZARD_PROTOCOLS.find((h) => h.id === selectedHazard) || HAZARD_PROTOCOLS[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#0B131D]/98 border border-[#273B4F] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[94vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="evakuasi-modal-title"
      >
        {/* Header Dialog */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#172331] via-[#0E1722] to-[#0B131D] border-b border-[#233547] flex items-start justify-between relative">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl border shrink-0 ${activeMeta.bgColor} ${activeMeta.borderColor} ${activeMeta.accentColor}`}>
              <activeMeta.icon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-black/40 text-slate-300 border border-slate-700 font-bold">
                  SISTEM NAVIGASI EVAKUASI RESMI
                </span>
                <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded font-extrabold border ${activeMeta.bgColor} ${activeMeta.borderColor} ${activeMeta.accentColor}`}>
                  {activeMeta.protokolCode}
                </span>
              </div>
              <h2 id="evakuasi-modal-title" className="text-base sm:text-lg font-bold text-white font-display mt-1">
                Pusat Perintah & Navigasi Sadar Bencana
              </h2>
              <p className="text-xs text-slate-400">
                Pusdalops BPBD Provinsi Sumatera Barat & Satgas Tanggap Darurat
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation: Rute vs Asisten AI */}
        <div className="flex items-center border-b border-[#1E2E3E] bg-[#0E1722] px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('rute')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'rute'
                ? 'border-rose-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Rute & Titik Kumpul</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('asisten')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer relative ${
              activeTab === 'asisten'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Asisten Siaga Evakuasi (AI)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          </button>
        </div>

        {/* Tab 1: Alur Rute Standar */}
        {activeTab === 'rute' ? (
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-700">
          
          {/* BANNER STATUS BENCANA AKTIF BMKG (Jika Ada) */}
          {bencanaAktifInfo && bencanaAktifInfo.status_siaga !== 'NORMAL_SIAGA' && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-600/40 flex items-start gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-bold text-rose-200 block text-xs">
                  {bencanaAktifInfo.keterangan}
                </span>
                <span className="text-[11px] text-rose-300/80">
                  Sistem otomatis merekomendasikan protokol keselamatan: {bencanaAktifInfo.alur_rekomendasi}.
                </span>
              </div>
            </div>
          )}

          {/* 1. SELEKSI 4 PROTOKOL BENCANA SPESIFIK */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block font-mono">
              Pilih Protokol Bahaya Bencana:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {HAZARD_PROTOCOLS.map((proto) => {
                const isSelected = selectedHazard === proto.id;
                const Icon = proto.icon;
                return (
                  <button
                    key={proto.id}
                    type="button"
                    onClick={() => setSelectedHazard(proto.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? `${proto.bgColor} ${proto.borderColor} text-white shadow-lg ring-1 ${proto.ringColor}`
                        : 'bg-[#121D28] border-[#223548] text-slate-300 hover:bg-[#182635] hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isSelected ? proto.accentColor : 'text-slate-400'}`} />
                          <span className="font-bold text-xs">{proto.label}</span>
                        </div>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold ${
                          isSelected ? `${proto.bgColor} ${proto.accentColor} ${proto.borderColor}` : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {proto.id.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2">{proto.subLabel}</p>
                    </div>

                    <div className="border-t border-slate-700/50 pt-1.5 text-[10px]">
                      <span className="text-slate-200 block font-medium">&bull; {proto.pedoman}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Kotak Pedoman Khusus Protokol Terpilih */}
            <div className={`p-3 rounded-xl border text-xs leading-relaxed ${activeMeta.bgColor} ${activeMeta.borderColor}`}>
              <div className="flex items-center gap-2 font-bold mb-1 text-white">
                <ShieldAlert className={`w-4 h-4 ${activeMeta.accentColor}`} />
                <span>PANDUAN OPERASIONAL: {activeMeta.protokolCode}</span>
              </div>
              <p className="text-slate-300 text-[11px]">{activeMeta.pedoman}</p>
              <div className="mt-1.5 text-[11px] font-bold text-rose-300 bg-black/30 p-1.5 rounded border border-rose-500/30">
                ⚠️ PERINGATAN KESELAMATAN: {activeMeta.larangan}
              </div>
            </div>
          </div>

          {/* 2. TITIK AWAL EVAKUASI (CEPAT & SEDERHANA) */}
          <div className="p-3.5 rounded-xl bg-[#0F1722] border border-[#233547] space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#1E2E3E] pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-display flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Titik Awal Pengguna
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                1-Klik Penentuan Lokasi
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleUseGps}
                disabled={gpsLoading}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  useGps 
                    ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500 shadow-sm' 
                    : 'bg-[#152331] text-slate-300 border-[#2A3E53] hover:bg-[#1B2C3E] hover:text-white'
                }`}
              >
                {gpsLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                ) : (
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                )}
                <span>{gpsLoading ? 'Mendeteksi...' : 'Gunakan GPS Otomatis'}</span>
              </button>

              {onPickLocationOnMap && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPickLocationOnMap();
                  }}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#152331] text-amber-300 border border-[#2A3E53] hover:bg-[#1B2C3E] transition-colors text-xs font-semibold"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Pilih Titik di Peta</span>
                </button>
              )}
            </div>

            {/* Status Indikator Lokasi */}
            <div className="p-2.5 rounded-lg bg-[#141F2B] border border-[#233547] text-[11px] text-slate-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                {detectedWilayahNama ? (
                  <span>Lokasi terdeteksi: <strong className="text-white">{detectedWilayahNama}</strong></span>
                ) : activeCoords ? (
                  <span>Titik koordinat aktif: <strong className="font-mono text-white">{activeCoords.lat.toFixed(4)}, {activeCoords.lon.toFixed(4)}</strong></span>
                ) : (
                  <span>Lokasi default simulasi: <strong className="text-white">Pesisir Padang Barat</strong> (Tekan tombol GPS atau Peta untuk mengubah)</span>
                )}
              </div>
            </div>
          </div>

          {/* 3. PILIHAN MODA TRANSPORTASI */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block font-mono">
              Moda Perjalanan Evakuasi:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedModa('mobil')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all ${
                  selectedModa === 'mobil'
                    ? 'bg-blue-600/30 text-blue-300 border-blue-500 shadow-sm'
                    : 'bg-[#121D28] text-slate-400 border-[#223548] hover:bg-[#182635] hover:text-slate-200'
                }`}
              >
                <span>🚗 Kendaraan Bermotor</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedModa('jalan_kaki')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all ${
                  selectedModa === 'jalan_kaki'
                    ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500 shadow-sm'
                    : 'bg-[#121D28] text-slate-400 border-[#223548] hover:bg-[#182635] hover:text-slate-200'
                }`}
              >
                <span>🏃 Jalan Kaki / Berlari</span>
              </button>
            </div>
          </div>

          {/* TOMBOL AKSI SUBMIT UTAMA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-white shadow-xl flex items-center justify-center gap-2 text-sm transition-all transform active:scale-[0.99] ${
                selectedHazard === 'tsunami'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-rose-950/50'
                  : selectedHazard === 'galodo'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 shadow-amber-950/50'
                  : selectedHazard === 'sesar'
                  ? 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 shadow-orange-950/50'
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-red-950/50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menganalisis Rute & Topografi...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 animate-pulse" />
                  <span>Kalkulasi Rute Evakuasi ({activeMeta.label})</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
        ) : (
          /* Tab 2: Disaster Chatbot AI */
          <div className="p-3 sm:p-4 flex-1 overflow-hidden flex flex-col min-h-[420px]">
            <DisasterChatbot 
              userCoords={activeCoords ? { lat: activeCoords.lat, lng: activeCoords.lon } : undefined}
              onFlyToLocation={onFlyToLocation}
              onSelectDestination={(loc: { lat: number; lng: number; nama: string }) => {
                if (onSelectDestination) {
                  onSelectDestination(loc);
                }
                onStartEvakuasi({
                  jenis_bencana: selectedHazard,
                  lat: activeCoords?.lat,
                  lon: activeCoords?.lon,
                  moda: selectedModa,
                  kecamatan_nama: detectedWilayahNama || undefined
                });
              }}
              isEmbedded={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};
