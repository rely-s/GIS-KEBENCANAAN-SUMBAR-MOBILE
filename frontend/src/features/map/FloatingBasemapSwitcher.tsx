import React, { useState, useRef, useEffect } from 'react';
import { Layers, Globe, Mountain, Moon, Check, Tag } from 'lucide-react';
import type { BasemapStyle } from './MapCanvas';

export type ExtendedBasemapStyle = 'satelit' | 'terang' | 'gelap' | 'topografi';

interface BasemapOption {
  id: ExtendedBasemapStyle;
  name: string;
  subname: string;
  icon: React.ReactNode;
  previewClass: string;
}

interface FloatingBasemapSwitcherProps {
  currentStyle: BasemapStyle;
  onStyleChange: (style: BasemapStyle) => void;
  showLabels?: boolean;
  onToggleLabels?: (show: boolean) => void;
  className?: string;
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

export const FloatingBasemapSwitcher: React.FC<FloatingBasemapSwitcherProps> = ({
  currentStyle,
  onStyleChange,
  showLabels = true,
  onToggleLabels,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Klik di luar menutup popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const activeOption = BASEMAP_OPTIONS.find((opt) => opt.id === currentStyle) || BASEMAP_OPTIONS[0];

  return (
    <div ref={containerRef} className={className || "absolute bottom-[336px] left-4 sm:bottom-16 sm:left-[26rem] z-20 pointer-events-auto select-none transition-all duration-300"}>
      {/* Popover Tray yang Terbuka ke Kanan Atas */}
      {isOpen && (
        <div className="absolute bottom-16 left-0 mb-2 w-72 sm:w-80 p-3 rounded-2xl bg-[#0B131D]/95 backdrop-blur-2xl border border-[#2B3E52] shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-3 z-30">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#1E2E40]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-display">
                Pilih Peta Dasar (Basemap)
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30">
              Preservasi Layer Aktif
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
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
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

          {/* Sakelar Overlay Label Satelit (Hybrid) */}
          {currentStyle === 'satelit' && onToggleLabels && (
            <div className="mt-3 pt-2.5 border-t border-[#1E2E40] flex items-center justify-between text-xs px-1">
              <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Label Jalan & Batas Wilayah</span>
              </div>
              <button
                type="button"
                onClick={() => onToggleLabels(!showLabels)}
                className={`px-2.5 py-1 rounded-lg font-bold font-mono text-[10px] transition-all border ${
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

      {/* Tombol Thumbnail Utama (56x56px) dengan Indikator Visual */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0B131D]/95 hover:bg-[#121E2C] backdrop-blur-2xl border-2 border-[#2B3E52] hover:border-sky-400/80 shadow-2xl transition-all transform hover:scale-105 active:scale-95"
        title="Ganti Peta Dasar (Satelit, Topografi, Gelap)"
        aria-label="Pilih Gaya Peta Dasar"
        aria-expanded={isOpen}
      >
        <div className="flex flex-col items-center justify-center">
          {activeOption.icon}
          <span className="text-[9px] font-bold font-mono text-slate-200 mt-1 uppercase tracking-tight">
            {activeOption.id === 'satelit' ? 'Satelit' : activeOption.id === 'terang' ? 'Topo' : 'Gelap'}
          </span>
        </div>
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-sky-500 border-2 border-[#0B131D] group-hover:animate-ping" />
      </button>
    </div>
  );
};
