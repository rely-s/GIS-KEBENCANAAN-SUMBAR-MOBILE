import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  Compass, 
  Crosshair, 
  Mountain, 
  Layers, 
  Globe, 
  Moon, 
  Check, 
  Tag 
} from 'lucide-react';
import type { BasemapStyle } from './MapCanvas';

export type ExtendedBasemapStyle = 'satelit' | 'terang' | 'gelap' | 'topografi';

interface BasemapOption {
  id: ExtendedBasemapStyle;
  name: string;
  subname: string;
  icon: React.ReactNode;
  previewClass: string;
}

const BASEMAP_OPTIONS: BasemapOption[] = [
  {
    id: 'satelit',
    name: 'Citra Satelit',
    subname: 'Esri World Imagery Realistis',
    icon: <Globe className="w-4 h-4 text-emerald-400" />,
    previewClass: 'bg-emerald-950 border-emerald-500/50',
  },
  {
    id: 'terang',
    name: 'Topografi & Kontur',
    subname: 'Relief Elevasi & Kontur Alami',
    icon: <Mountain className="w-4 h-4 text-amber-400" />,
    previewClass: 'bg-amber-950 border-amber-500/50',
  },
  {
    id: 'gelap',
    name: 'Gelap Operasional',
    subname: 'CartoDB Dark Matter (Pusdalops)',
    icon: <Moon className="w-4 h-4 text-sky-400" />,
    previewClass: 'bg-slate-900 border-sky-500/50',
  },
];

interface RightMapControlDockProps {
  currentStyle: BasemapStyle;
  onStyleChange: (style: BasemapStyle) => void;
  showLabels?: boolean;
  onToggleLabels?: (show: boolean) => void;
  is3DTerrain?: boolean;
  onToggle3D?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetNorth?: () => void;
  onLocateMe?: () => void;
  bearing?: number;
  className?: string;
}

export const RightMapControlDock: React.FC<RightMapControlDockProps> = ({
  currentStyle,
  onStyleChange,
  showLabels = true,
  onToggleLabels,
  is3DTerrain = false,
  onToggle3D,
  onZoomIn,
  onZoomOut,
  onResetNorth,
  onLocateMe,
  bearing = 0,
  className = '',
}) => {
  const [isBasemapOpen, setIsBasemapOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Klik di luar menutup popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsBasemapOpen(false);
      }
    };
    if (isBasemapOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isBasemapOpen]);

  const activeOption = BASEMAP_OPTIONS.find((opt) => opt.id === currentStyle) || BASEMAP_OPTIONS[0];

  return (
    <nav 
      aria-label="Kontrol Navigasi Peta"
      className={`absolute top-20 right-4 z-20 flex flex-col items-center gap-2 pointer-events-auto select-none ${className}`}
    >
      {/* 1. KONTROL ZOOM (In & Out Terpadu) */}
      <div className="flex flex-col rounded-xl bg-[#0B131D]/90 hover:bg-[#0E1825] backdrop-blur-xl border border-[#243444] shadow-xl overflow-hidden divide-y divide-[#1E2E40] transition-colors">
        <button
          type="button"
          onClick={onZoomIn}
          className="p-2.5 text-slate-300 hover:text-white hover:bg-white/10 active:bg-white/20 transition-all flex items-center justify-center cursor-pointer"
          title="Perbesar Peta (Zoom In)"
          aria-label="Perbesar Peta"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          className="p-2.5 text-slate-300 hover:text-white hover:bg-white/10 active:bg-white/20 transition-all flex items-center justify-center cursor-pointer"
          title="Perkecil Peta (Zoom Out)"
          aria-label="Perkecil Peta"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* 2. KOMPAS & RESET BEARING TO NORTH */}
      <button
        type="button"
        onClick={onResetNorth}
        className="p-2.5 rounded-xl bg-[#0B131D]/90 hover:bg-[#0E1825] backdrop-blur-xl border border-[#243444] text-slate-300 hover:text-amber-400 shadow-xl transition-all active:scale-95 group cursor-pointer"
        title="Orientasi Kompas: Klik untuk Reset Arah ke Utara (0°)"
        aria-label="Reset Orientasi Peta ke Utara"
      >
        <Compass 
          className="w-4 h-4 transition-transform duration-200" 
          style={{ transform: `rotate(${-bearing}deg)` }}
        />
      </button>

      {/* 3. SENSOR GEOLOCATION (Lokasi Pengguna) */}
      <button
        type="button"
        onClick={onLocateMe}
        className="p-2.5 rounded-xl bg-[#0B131D]/90 hover:bg-[#0E1825] backdrop-blur-xl border border-[#243444] text-slate-300 hover:text-emerald-400 shadow-xl transition-all active:scale-95 cursor-pointer"
        title="Posisikan Kamera ke Lokasi GPS Anda"
        aria-label="Deteksi Lokasi Saya"
      >
        <Crosshair className="w-4 h-4" />
      </button>

      {/* 4. SAKELAR 3D TOPOGRAFI */}
      {onToggle3D && (
        <button
          type="button"
          onClick={onToggle3D}
          className={`p-2.5 rounded-xl backdrop-blur-xl border shadow-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer ${
            is3DTerrain
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/20'
              : 'bg-[#0B131D]/90 hover:bg-[#0E1825] text-slate-300 hover:text-white border-[#243444]'
          }`}
          title={is3DTerrain ? 'Nonaktifkan Sudut Pandang 3D' : 'Aktifkan Sudut Pandang 3D Elevasi Bukit Barisan'}
          aria-label="Beralih Mode Sudut Pandang 3D"
        >
          <Mountain className="w-4 h-4" />
        </button>
      )}

      {/* 5. PEMILIH PETA DASAR (BASEMAP SWITCHER) DENGAN POPOVER MEMBUKA KE KIRI */}
      <div ref={popoverRef} className="relative">
        <button
          type="button"
          onClick={() => setIsBasemapOpen((prev) => !prev)}
          className={`p-2.5 rounded-xl backdrop-blur-xl border shadow-xl transition-all active:scale-95 flex items-center justify-center group cursor-pointer ${
            isBasemapOpen
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/60 ring-2 ring-sky-500/30'
              : 'bg-[#0B131D]/90 hover:bg-[#0E1825] text-slate-300 hover:text-sky-400 border-[#243444]'
          }`}
          title="Pilih Gaya Peta Dasar (Satelit, Topografi, Gelap Pusdalops)"
          aria-label="Pilih Peta Dasar"
          aria-expanded={isBasemapOpen}
        >
          {activeOption.icon}
        </button>

        {/* POPOVER HORIZONTAL MEMBUKA KE ARAH KIRI (TIDAK MENUTUPI PETA KANAN) */}
        {isBasemapOpen && (
          <div className="absolute right-full top-0 mr-3 w-72 sm:w-80 p-3 rounded-2xl bg-[#0B131D]/98 backdrop-blur-2xl border border-[#2B3E52] shadow-2xl shadow-black/90 animate-in fade-in slide-in-from-right-3 duration-150 z-50">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#1E2E40]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-display">
                  Pilih Peta Dasar (Basemap)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
                Preservasi Layer
              </span>
            </div>

            <div className="space-y-1.5">
              {BASEMAP_OPTIONS.map((option) => {
                const isActive = option.id === currentStyle;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onStyleChange(option.id as BasemapStyle);
                      setIsBasemapOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? `${option.previewClass} ring-2 ring-sky-400/50 shadow-lg`
                        : 'bg-[#121B27]/80 hover:bg-[#1A2636] border-[#1E2E40] text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#0B131D] border border-white/10 shrink-0">
                        {option.icon}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                          {option.name}
                          {isActive && <Check className="w-3.5 h-3.5 text-sky-400" />}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {option.subname}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* SAKELAR OVERLAY LABEL SATELIT */}
            {currentStyle === 'satelit' && onToggleLabels && (
              <div className="mt-3 pt-2.5 border-t border-[#1E2E40] flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Label Jalan & Wilayah</span>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleLabels(!showLabels)}
                  className={`px-2.5 py-1 rounded-lg font-bold font-mono text-[10px] transition-all border cursor-pointer ${
                    showLabels
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-[#121B27] text-slate-400 border-[#1E2E40]'
                  }`}
                >
                  {showLabels ? 'AKTIF' : 'NONAKTIF'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
