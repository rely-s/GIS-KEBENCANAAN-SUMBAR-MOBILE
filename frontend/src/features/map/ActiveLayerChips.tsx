import React, { useState, useRef, useEffect } from 'react';
import { X, Sliders } from 'lucide-react';
import type { LayerVisibilityState } from './types';

interface ActiveLayerChipsProps {
  visibility: LayerVisibilityState;
  onToggleLayer: (layerKey: keyof LayerVisibilityState) => void;
  opacities?: Record<string, number>;
  onOpacityChange?: (layerKey: string, opacity: number) => void;
  onResetAll?: () => void;
}

interface ChipDefinition {
  key: keyof LayerVisibilityState;
  label: string;
  color: string;
}

const LAYER_CHIP_MAP: ChipDefinition[] = [
  { key: 'choropleth', label: 'Choropleth Risiko', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { key: 'poskoEvakuasi', label: 'Posko Pengungsi', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  { key: 'shelterTes', label: 'Shelter TES Tsunami', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  { key: 'jalanTerputus', label: 'Jalan Terputus', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  { key: 'gempa', label: 'Episentrum Gempa', color: 'bg-red-600/20 text-red-300 border-red-500/40' },
  { key: 'sesarSemangko', label: 'Sesar Semangko', color: 'bg-amber-600/20 text-amber-300 border-amber-600/40' },
  { key: 'sesarBuffer', label: 'Sempadan Aktif Sesar', color: 'bg-amber-500/20 text-amber-200 border-amber-500/40' },
  { key: 'megathrust', label: 'Megathrust Mentawai', color: 'bg-rose-600/20 text-rose-300 border-rose-600/40' },
  { key: 'zonaTsunami', label: 'Inundasi Tsunami & Bypass', color: 'bg-cyan-600/20 text-cyan-300 border-cyan-600/40' },
  { key: 'tsunamiRunup', label: 'Skenario Run-Up Tsunami', color: 'bg-blue-600/20 text-blue-300 border-blue-600/40' },
  { key: 'cuaca', label: 'Stasiun BMKG & Cuaca', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
];

export const ActiveLayerChips: React.FC<ActiveLayerChipsProps> = ({
  visibility,
  onToggleLayer,
  opacities: externalOpacities,
  onOpacityChange,
  onResetAll,
}) => {
  const [activeSliderKey, setActiveSliderKey] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const [localOpacities, setLocalOpacities] = useState<Record<string, number>>({
    choropleth: 0.65,
    zonaTsunami: 0.35,
    tsunamiRunup: 0.45,
    cuaca: 0.5,
    sesarBuffer: 0.3,
    megathrust: 0.25,
  });

  const opacities = externalOpacities || localOpacities;
  const activeChips = LAYER_CHIP_MAP.filter((chip) => Boolean(visibility[chip.key]));

  // Auto-close slider popover saat klik di luar
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActiveSliderKey(null);
      }
    };
    if (activeSliderKey) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [activeSliderKey]);

  if (activeChips.length === 0) return null;

  const handleSliderChange = (key: string, value: number) => {
    setLocalOpacities((prev) => ({ ...prev, [key]: value }));
    if (onOpacityChange) {
      onOpacityChange(key, value);
    }
  };

  const handleClearAll = () => {
    if (onResetAll) {
      onResetAll();
    } else {
      activeChips.forEach((chip) => onToggleLayer(chip.key));
    }
  };

  return (
    /* Wadah Melayang Transparan Murni: Tanpa boks hitam masif, ringan, alami & zero-clipping */
    <div className="absolute top-16 left-4 z-20 pointer-events-auto flex flex-wrap items-center gap-1.5 max-w-[calc(100vw-32px)] sm:max-w-3xl select-none py-1 transition-all duration-200">
      {activeChips.map((chip) => {
        const hasOpacityControl = chip.key in opacities;
        const isSliderOpen = activeSliderKey === chip.key;

        return (
          <div
            key={chip.key}
            className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl backdrop-blur-xl border text-[11px] font-bold font-mono shadow-md transition-all ${chip.color}`}
          >
            <span>{chip.label}</span>

            {/* Slider Opasitas Instan */}
            {hasOpacityControl && (
              <button
                type="button"
                onClick={() => setActiveSliderKey(isSliderOpen ? null : chip.key)}
                className={`p-0.5 rounded hover:bg-white/20 transition-all ${
                  isSliderOpen ? 'bg-white/30 opacity-100' : 'opacity-80 hover:opacity-100'
                }`}
                title="Atur transparansi layer"
              >
                <Sliders className="w-3 h-3" />
              </button>
            )}

            {/* Tombol Hapus / Tutup Layer Cepat */}
            <button
              type="button"
              onClick={() => onToggleLayer(chip.key)}
              className="p-0.5 rounded-full hover:bg-white/25 transition-all text-slate-300 hover:text-white cursor-pointer"
              title={`Sembunyikan ${chip.label}`}
              aria-label={`Tutup ${chip.label}`}
            >
              <X className="w-3 h-3" />
            </button>

            {/* Floating Opacity Popover (Ter-anchor langsung di bawah chip) */}
            {isSliderOpen && (
              <div
                ref={popoverRef}
                className="absolute top-full mt-1.5 left-0 p-2.5 rounded-xl bg-[#0B131D]/95 backdrop-blur-md border border-[#2B3E52] shadow-2xl flex items-center gap-2 z-50 animate-in fade-in zoom-in-95 duration-150 min-w-[190px]"
              >
                <span className="text-[10px] text-slate-300 font-mono whitespace-nowrap">Opasitas:</span>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={opacities[chip.key] ?? 0.6}
                  onChange={(e) => handleSliderChange(chip.key, parseFloat(e.target.value))}
                  className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
                <span className="text-[10px] font-mono font-bold text-sky-400 min-w-[28px] text-right">
                  {Math.round((opacities[chip.key] ?? 0.6) * 100)}%
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* Tombol Minimalis Reset Semua (Hanya tampil jika ada 2 layer atau lebih yang aktif) */}
      {activeChips.length >= 2 && (
        <button
          type="button"
          onClick={handleClearAll}
          className="flex items-center gap-1 px-2 py-1 rounded-xl backdrop-blur-xl bg-slate-900/50 hover:bg-rose-950/70 border border-slate-700/50 hover:border-rose-500/50 text-[10px] font-mono text-slate-400 hover:text-rose-200 transition-all cursor-pointer shadow-sm"
          title="Sembunyikan semua layer aktif"
        >
          <X className="w-3 h-3" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};
