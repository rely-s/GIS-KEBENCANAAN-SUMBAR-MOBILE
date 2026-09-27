import React, { useState } from 'react';
import { Crosshair, Waves, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import type { GempaInfo } from '../map/MapCanvas';

interface FloatingSeismicCardProps {
  gempaData: GempaInfo | null;
  onFocus: (coords: { lat: number; lon: number; zoom?: number }) => void;
  distanceToSumbar?: number;
}

function formatWaktuKejadian(waktu?: string | null): string {
  if (!waktu) return '';
  try {
    const d = new Date(waktu);
    if (isNaN(d.getTime())) return waktu;
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    }) + ' WIB';
  } catch {
    return waktu;
  }
}

export const FloatingSeismicCard: React.FC<FloatingSeismicCardProps> = ({
  gempaData,
  onFocus,
  distanceToSumbar = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!gempaData) return null;

  const isHighMagnitude = gempaData.magnitude >= 5.0;
  const isTsunamiRisk = Boolean(gempaData.potensi_tsunami);

  // Mode Micro-Chip (Ketika diminimize pengguna agar peta bersih)
  if (isMinimized) {
    return (
      <div className="absolute bottom-12 sm:bottom-14 right-3 z-20 pointer-events-auto select-none">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-xl shadow-lg transition-all text-xs font-semibold ${
            isTsunamiRisk
              ? 'bg-rose-950/90 border-rose-500 text-rose-200 animate-pulse'
              : isHighMagnitude
              ? 'bg-amber-950/90 border-amber-500/70 text-amber-200'
              : 'bg-[#0B131D]/90 border-[#2B3E52] text-slate-200 hover:border-slate-500'
          }`}
          title="Klik untuk membuka detail telemetri gempa BMKG"
        >
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isTsunamiRisk ? 'bg-rose-500' : 'bg-emerald-400'
            }`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              isTsunamiRisk ? 'bg-rose-600' : 'bg-emerald-500'
            }`} />
          </span>
          <span className="font-mono font-bold text-sky-400">M {gempaData.magnitude.toFixed(1)}</span>
          <span className="text-[11px] truncate max-w-[120px]">{gempaData.wilayah_teks}</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`absolute bottom-12 sm:bottom-14 right-3 z-20 transition-all duration-200 pointer-events-auto select-none ${
        isExpanded ? 'w-72 sm:w-80' : 'w-64 sm:w-72'
      }`}
    >
      <div
        className={`rounded-xl border backdrop-blur-xl shadow-xl transition-all overflow-hidden ${
          isTsunamiRisk
            ? 'bg-[#18080C]/95 border-rose-500 shadow-rose-950/50 ring-1 ring-rose-500/40 animate-pulse'
            : isHighMagnitude
            ? 'bg-[#0F1722]/95 border-amber-500/50 shadow-black/70'
            : 'bg-[#0B131D]/95 border-[#243444] shadow-black/70'
        }`}
      >
        {/* Header Baris Kompak & Ringkas */}
        <div className="p-2 sm:p-2.5 flex items-center justify-between gap-2">
          {/* Badge Magnitudo & Indikator Sensor */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`flex flex-col items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg font-display font-black shadow border shrink-0 ${
                isTsunamiRisk
                  ? 'bg-rose-600 border-rose-400 text-white animate-bounce'
                  : isHighMagnitude
                  ? 'bg-gradient-to-br from-amber-500 to-rose-600 border-amber-300 text-white'
                  : 'bg-gradient-to-br from-blue-600 to-cyan-700 border-blue-400 text-white'
              }`}
            >
              <span className="text-[9px] leading-none opacity-85 font-mono">M</span>
              <span className="text-xs sm:text-sm leading-none">{gempaData.magnitude.toFixed(1)}</span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isTsunamiRisk ? 'bg-rose-500' : 'bg-emerald-400'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                    isTsunamiRisk ? 'bg-rose-600' : 'bg-emerald-500'
                  }`} />
                </span>
                <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-slate-400">
                  BMKG TEWS
                </span>
              </div>
              <p
                className="text-[11px] font-bold text-slate-100 truncate max-w-[130px] sm:max-w-[150px]"
                title={gempaData.wilayah_teks}
              >
                {gempaData.wilayah_teks}
              </p>
              <div className="flex items-center gap-1.5 text-[9.5px] text-slate-400 font-mono">
                <span>Kedalaman: <strong className="text-slate-200">{gempaData.kedalaman_km}km</strong></span>
                {distanceToSumbar > 350 && (
                  <span className="text-amber-400 font-semibold truncate">
                    • {distanceToSumbar.toLocaleString()}km
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tombol Taktis: Fokus, Expand, Minimize */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onFocus({ lat: gempaData.lat, lon: gempaData.lon, zoom: 8.5 })}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold font-sans transition-all border ${
                isTsunamiRisk
                  ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400'
                  : 'bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-slate-950 border-sky-500/30'
              }`}
              title="Fokuskan kamera ke pusat gempa"
            >
              <Crosshair className="w-3 h-3" />
              <span>Fokus</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="p-1 rounded-lg bg-[#141E28] hover:bg-[#1E2B38] text-slate-300 hover:text-white border border-[#243444] transition-all"
              title={isExpanded ? 'Tutup rincian' : 'Buka rincian'}
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded-lg bg-[#141E28] hover:bg-[#1E2B38] text-slate-400 hover:text-white border border-[#243444] transition-all"
              title="Kecilkan widget (minimize)"
            >
              <span className="text-xs leading-none px-0.5 font-mono">_</span>
            </button>
          </div>
        </div>

        {/* Status Tsunami Strip Tipis */}
        <div
          className={`px-2.5 py-1 text-[9.5px] font-bold flex items-center justify-between gap-1.5 border-t ${
            isTsunamiRisk
              ? 'bg-rose-950/80 text-rose-300 border-rose-500/30'
              : 'bg-emerald-950/30 text-emerald-300 border-emerald-500/20'
          }`}
        >
          <div className="flex items-center gap-1 shrink-0">
            <Waves className="w-3 h-3" />
            <span>{isTsunamiRisk ? 'POTENSI TSUNAMI' : 'Tidak Berpotensi Tsunami'}</span>
          </div>
          <span className="text-[9px] font-mono text-slate-400 shrink-0">
            {formatWaktuKejadian(gempaData.waktu_kejadian)}
          </span>
        </div>


        {/* Panel Detail yang Dapat Diperluas */}
        {isExpanded && (
          <div className="p-3.5 pt-2.5 border-t border-[#243444] bg-[#091019]/90 space-y-2.5 animate-in fade-in slide-in-from-bottom-2 text-xs">
            <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
              <div className="p-2 rounded-lg bg-[#121B27] border border-[#1E2E40]">
                <span className="text-[10px] text-slate-400 block">Lintang / Bujur</span>
                <span className="font-bold text-slate-100">{gempaData.lat.toFixed(2)}°, {gempaData.lon.toFixed(2)}°</span>
              </div>
              <div className="p-2 rounded-lg bg-[#121B27] border border-[#1E2E40]">
                <span className="text-[10px] text-slate-400 block">Status Guncangan</span>
                <span className={`font-bold ${gempaData.dirasakan ? 'text-amber-400' : 'text-slate-300'}`}>
                  {gempaData.dirasakan ? 'Dirasakan Masyarakat' : 'Guncangan Terukur'}
                </span>
              </div>
            </div>

            {gempaData.shakemap_url && (
              <a
                href={gempaData.shakemap_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all"
              >
                <span>Lihat Shakemap Resmi BMKG</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
