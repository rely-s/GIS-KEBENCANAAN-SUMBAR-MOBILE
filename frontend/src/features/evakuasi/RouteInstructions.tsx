import React from 'react';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  X, 
  CornerUpRight, 
  CornerUpLeft, 
  ArrowUp, 
  RotateCcw,
  CheckCircle2,
  PhoneCall,
  Crosshair,
  Waves,
  TrendingUp,
  Mountain,
  Activity,
  Flame,
  CloudRain,
  ShieldAlert,
  Compass
} from 'lucide-react';

export interface RouteInstructionItem {
  teks: string;
  jarak_m: number;
  nama_jalan?: string;
}

export interface ProfilElevasiData {
  elevasi_asal_mdpl: number;
  elevasi_tujuan_mdpl: number;
  elevasi_efektif_mdpl: number;
  gain_elevasi_m: number;
  is_shelter_vertikal: boolean;
  aman_tsunami: boolean;
  catatan_elevasi: string;
}

export interface DetourInfoData {
  aktif: boolean;
  nama_koridor: string;
  catatan: string;
}

export interface EvakuasiRouteData {
  alur?: string; // 'PROTOKOL_TSUNAMI' | 'PROTOKOL_GALODO' | 'PROTOKOL_GEMPA_SESAR' | 'PROTOKOL_ERUPSI' | 'ALUR_A' | 'ALUR_B'
  jenis_bencana?: string;
  posko: {
    id: number;
    nama: string;
    alamat?: string;
    jenis?: string;
    kapasitas?: number;
    fasilitas?: string[];
    kontak_pic?: string;
    kontak_telepon?: string;
    lat: number;
    lon: number;
  };
  jarak_km: number;
  estimasi_menit: number;
  geometry: any;
  instruksi: RouteInstructionItem[];
  menghindari_blokade: boolean;
  detour_info?: DetourInfoData | null;
  profil_elevasi?: ProfilElevasiData | null;
  hazard_warnings?: string[];
  is_fallback?: boolean;
  fallback_info?: {
    tipe: string;
    pesan: string;
    kecamatan_asal: string;
    kabupaten_asal?: string;
    kontak_darurat?: {
      instansi: string;
      call_center: string;
      hotline_bpbd?: string;
      telepon_kantor?: string;
    };
  } | null;
  zonasi_info?: {
    status_lokasi_asal?: {
      zona: string;
      nama_zona: string;
      tingkat_bahaya: string;
      kedalaman_rendaman?: string;
      deskripsi?: string;
    };
    zona_label?: string;
    tingkat_bahaya?: string;
    rekomendasi?: string;
  } | null;
  kecamatan_id?: number | null;
}

interface RouteInstructionsProps {
  routeData: EvakuasiRouteData;
  onClose: () => void;
  currentModa?: 'mobil' | 'jalan_kaki';
  onToggleModa?: (moda: 'mobil' | 'jalan_kaki') => void;
  onPickNewLocation?: () => void;
}

export const RouteInstructions: React.FC<RouteInstructionsProps> = ({ 
  routeData, 
  onClose,
  currentModa = 'mobil',
  onToggleModa,
  onPickNewLocation
}) => {
  const getStepIcon = (teks: string) => {
    const lower = teks.toLowerCase();
    if (lower.includes('kanan')) {
      return <CornerUpRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
    } else if (lower.includes('kiri')) {
      return <CornerUpLeft className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
    } else if (lower.includes('putar balik')) {
      return <RotateCcw className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
    } else if (lower.includes('tiba')) {
      return <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />;
    } else if (lower.includes('peringatan') || lower.includes('bahaya') || lower.includes('dialihkan')) {
      return <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />;
    }
    return <ArrowUp className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />;
  };

  const alur = routeData.alur || '';
  const jb = (routeData.jenis_bencana || '').toLowerCase();
  
  const isTsunami = alur === 'PROTOKOL_TSUNAMI' || alur === 'ALUR_A' || jb.includes('tsunami');
  const isGalodo = alur === 'PROTOKOL_GALODO' || jb.includes('galodo') || jb.includes('lahar');
  const isSesar = alur === 'PROTOKOL_GEMPA_SESAR' || jb.includes('sesar') || jb.includes('gempa');
  const isErupsi = alur === 'PROTOKOL_ERUPSI' || jb.includes('erupsi') || jb.includes('marapi');

  // Header Theme Calibrated
  const getHeaderTheme = () => {
    if (isTsunami) {
      return {
        bg: 'bg-gradient-to-r from-[#2A0E17] via-[#161B26] to-[#0B131D]',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        badgeText: 'PROTOKOL TSUNAMI — TES / TIMUR BYPASS',
        icon: Waves,
        iconColor: 'text-rose-400 border-rose-500/40 bg-rose-500/20'
      };
    }
    if (isGalodo) {
      return {
        bg: 'bg-gradient-to-r from-[#291A0A] via-[#161B26] to-[#0B131D]',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        badgeText: 'PROTOKOL GALODO — PUNGGUNG BUKIT AMAN',
        icon: CloudRain,
        iconColor: 'text-amber-400 border-amber-500/40 bg-amber-500/20'
      };
    }
    if (isSesar) {
      return {
        bg: 'bg-gradient-to-r from-[#2B1705] via-[#161B26] to-[#0B131D]',
        badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        badgeText: 'PROTOKOL SESAR — RUANG TERBUKA AMAN',
        icon: Activity,
        iconColor: 'text-orange-400 border-orange-500/40 bg-orange-500/20'
      };
    }
    if (isErupsi) {
      return {
        bg: 'bg-gradient-to-r from-[#2E0B0B] via-[#161B26] to-[#0B131D]',
        badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
        badgeText: 'PROTOKOL ERUPSI — LUAR RADIUS 4.5 KM',
        icon: Flame,
        iconColor: 'text-red-400 border-red-500/40 bg-red-500/20'
      };
    }
    return {
      bg: 'bg-gradient-to-r from-[#1B2733] to-[#0F1720]',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      badgeText: 'EVAKUASI TANGGAP DARURAT',
      icon: Navigation,
      iconColor: 'text-blue-400 border-blue-500/30 bg-blue-500/20'
    };
  };

  const headerTheme = getHeaderTheme();
  const HeaderIcon = headerTheme.icon;

  return (
    <div className="absolute bottom-16 left-4 z-30 w-full max-w-sm sm:max-w-md bg-[#0B131D]/95 backdrop-blur-md border border-[#243444] rounded-2xl shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[82vh] animate-in fade-in slide-in-from-bottom-6 duration-300">
      
      {/* Header Panel Navigasi */}
      <div className={`p-4 border-b border-[#243444] flex items-start justify-between ${headerTheme.bg}`}>
        <div className="flex items-start gap-3 min-w-0">
          <div className={`p-2.5 rounded-xl border shrink-0 ${headerTheme.iconColor}`}>
            <HeaderIcon className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded font-extrabold flex items-center gap-1 border ${headerTheme.badgeBg}`}>
                <HeaderIcon className="w-3 h-3" />
                {headerTheme.badgeText}
              </span>

              {routeData.menghindari_blokade ? (
                <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  <AlertTriangle className="w-3 h-3" />
                  DETOUR BPBD
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  JALUR BEBAS
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-white font-display mt-1.5 truncate">
              {routeData.posko.nama}
            </h3>

            {/* Alamat Posko */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-0.5">
              <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">{routeData.posko.alamat || 'Sumatera Barat'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors shrink-0 ml-2"
          title="Tutup Navigasi"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* BANNER DETOUR KORIDOR RESMI BPBD (JIKA JALAN TERPUTUS DIALIHKAN) */}
      {routeData.detour_info && routeData.detour_info.aktif && (
        <div className="p-3 bg-amber-950/40 border-b border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5 animate-in fade-in">
          <Compass className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-spin-slow" />
          <div className="space-y-0.5">
            <span className="font-bold text-[11px] uppercase tracking-wider block text-amber-300">
              {routeData.detour_info.nama_koridor}
            </span>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              {routeData.detour_info.catatan}
            </p>
          </div>
        </div>
      )}

      {/* BANNER PERINGATAN BAHAYA KHUSUS (HAZARD WARNINGS) */}
      {routeData.hazard_warnings && routeData.hazard_warnings.length > 0 && (
        <div className="p-2.5 bg-rose-950/40 border-b border-rose-500/40 text-xs text-rose-200 flex flex-col gap-1">
          {routeData.hazard_warnings.map((warn, wIdx) => (
            <div key={wIdx} className="flex items-start gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-snug">{warn}</span>
            </div>
          ))}
        </div>
      )}

      {/* BANNER FALLBACK DATA KOSONG KECAMATAN */}
      {routeData.is_fallback && routeData.fallback_info && (
        <div className="p-3 bg-amber-950/40 border-b border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-[11px] uppercase tracking-wider block text-amber-300">
              Pengalihan ke Posko Alternatif Terdekat:
            </span>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              {routeData.fallback_info.pesan}
            </p>
          </div>
        </div>
      )}

      {/* PROFIL ELEVASI TOPOGRAFI 3D (VALIDASI ELEVASI TSUNAMI & KONTUR BENCANA) */}
      {routeData.profil_elevasi && (
        <div className="p-3 bg-[#0F1924] border-b border-[#243444]/60 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-bold">
              <Mountain className="w-3.5 h-3.5 text-cyan-400" />
              Analisis Profil Elevasi Jalur Evakuasi:
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
              routeData.profil_elevasi.aman_tsunami
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40'
                : 'bg-amber-950/60 text-amber-300 border-amber-600/40'
            }`}>
              {routeData.profil_elevasi.aman_tsunami ? '✓ AMAN TSUNAMI (≥ 15 mdpl)' : '⚠️ ELEVASI RENDAH'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center mb-1.5">
            <div className="p-1.5 bg-[#172330] rounded-lg border border-[#2B3C4E]/40">
              <div className="text-[9px] text-slate-400 font-mono">Titik Asal</div>
              <div className="text-xs font-bold text-white font-mono mt-0.5">
                {routeData.profil_elevasi.elevasi_asal_mdpl} mdpl
              </div>
            </div>

            <div className="p-1.5 bg-[#172330] rounded-lg border border-[#2B3C4E]/40">
              <div className="text-[9px] text-slate-400 font-mono">Tujuan Posko</div>
              <div className="text-xs font-bold text-cyan-300 font-mono mt-0.5">
                {routeData.profil_elevasi.elevasi_efektif_mdpl} mdpl
                {routeData.profil_elevasi.is_shelter_vertikal && (
                  <span className="block text-[8px] text-emerald-400">(Lt. 3+ TES)</span>
                )}
              </div>
            </div>

            <div className="p-1.5 bg-[#172330] rounded-lg border border-[#2B3C4E]/40">
              <div className="text-[9px] text-slate-400 font-mono">Kenaikan (Gain)</div>
              <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5 flex items-center justify-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                +{routeData.profil_elevasi.gain_elevasi_m} m
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 italic leading-snug">
            {routeData.profil_elevasi.catatan_elevasi}
          </p>
        </div>
      )}

      {/* Ringkasan Jarak & Waktu Tempuh */}
      <div className="grid grid-cols-2 gap-2 p-3 bg-[#131E2A] border-b border-[#243444]/60 text-center">
        <div className="flex items-center justify-center gap-2 py-1 bg-[#1B2733]/70 rounded-lg border border-[#2B3C4E]/50">
          <Clock className="w-4 h-4 text-cyan-400" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Estimasi Waktu</div>
            <div className="text-sm font-bold text-white font-display">
              ~{routeData.estimasi_menit} Menit
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 py-1 bg-[#1B2733]/70 rounded-lg border border-[#2B3C4E]/50">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Total Jarak</div>
            <div className="text-sm font-bold text-white font-display">
              {routeData.jarak_km} km
            </div>
          </div>
        </div>
      </div>

      {/* Switcher Moda Evakuasi & Ganti Titik di Peta */}
      <div className="flex items-center justify-between gap-2 p-2 bg-[#0C141C] border-b border-[#243444]/60">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">Moda:</span>
          {onToggleModa && (
            <>
              <button
                onClick={() => onToggleModa('mobil')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  currentModa === 'mobil'
                    ? 'bg-blue-600 text-white shadow-md border border-blue-400/40'
                    : 'bg-[#162330] text-slate-400 hover:text-white border border-[#243444]'
                }`}
              >
                🚗 Kendaraan
              </button>
              <button
                onClick={() => onToggleModa('jalan_kaki')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  currentModa === 'jalan_kaki'
                    ? 'bg-emerald-600 text-white shadow-md border border-emerald-400/40'
                    : 'bg-[#162330] text-slate-400 hover:text-white border border-[#243444]'
                }`}
              >
                🏃 Jalan Kaki / Lari
              </button>
            </>
          )}
        </div>

        {onPickNewLocation && (
          <button
            onClick={onPickNewLocation}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all"
            title="Klik di peta untuk menghitung rute dari titik lain"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Ganti Titik</span>
          </button>
        )}
      </div>

      {/* PIC / Kontak Posko */}
      {(routeData.posko.kontak_telepon || routeData.posko.kontak_pic) && (
        <div className="px-4 py-2 bg-blue-950/30 border-b border-blue-900/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-blue-200 min-w-0">
            <PhoneCall className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">PIC: {routeData.posko.kontak_pic || 'Posko Satgas BPBD'}</span>
          </div>
          {routeData.posko.kontak_telepon && (
            <a
              href={`tel:${routeData.posko.kontak_telepon}`}
              className="font-mono text-cyan-300 hover:underline font-bold shrink-0 ml-2"
            >
              {routeData.posko.kontak_telepon}
            </a>
          )}
        </div>
      )}

      {/* Langkah-langkah Turn-by-Turn Navigasi */}
      <div className="p-3 overflow-y-auto space-y-2 flex-1 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider px-1">
          Instruksi Manuver ({routeData.instruksi.length} Langkah):
        </div>
        {routeData.instruksi.map((step, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 p-2.5 rounded-xl border transition-colors ${
              step.teks.includes('PERINGATAN BAHAYA')
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                : 'bg-[#1B2733]/50 hover:bg-[#1B2733] border-[#243444]/40 text-slate-200'
            }`}
          >
            <div className="p-1 rounded-md bg-[#0F1720] border border-[#2B3C4E] shrink-0">
              {getStepIcon(step.teks)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs leading-snug font-medium">
                {step.teks}
              </p>
              {step.jarak_m > 0 && (
                <span className="inline-block mt-1 text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                  {step.jarak_m >= 1000 ? `${(step.jarak_m / 1000).toFixed(1)} km` : `${step.jarak_m} m`}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Aksi */}
      <div className="p-3 bg-[#0F1720] border-t border-[#243444] flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-mono">
          Engine: {routeData.detour_info?.aktif ? 'OSRM Detour BPBD' : 'OSRM Spatial Network'}
        </span>
        <button
          onClick={onClose}
          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
        >
          Selesai Navigasi
        </button>
      </div>
    </div>
  );
};
