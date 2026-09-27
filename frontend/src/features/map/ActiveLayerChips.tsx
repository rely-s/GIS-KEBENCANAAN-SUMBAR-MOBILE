import React, { useState } from 'react';
import { X, Sliders } from 'lucide-react';
import type { LayerVisibilityState } from './types';

interface ActiveLayerChipsProps {
  visibility: LayerVisibilityState;
  onToggleLayer: (layerKey: keyof LayerVisibilityState) => void;
  opacities?: Record<string, number>;
  onOpacityChange?: (layerKey: string, opacity: number) => void;
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
  { key: 'sesarSemangko', label: 'Sesar Semangko', color: 'bg-amber-600/20 text-amber-300 border-amber-600/40' },
  { key: 'megathrust', label: 'Megathrust Mentawai', color: 'bg-rose-600/20 text-rose-300 border-rose-600/40' },
  { key: 'zonaTsunami', label: 'Inundasi Tsunami', color: 'bg-sky-600/20 text-sky-300 border-sky-600/40' },
  { key: 'cuaca', label: 'Cuaca & Galodo', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
];

export const ActiveLayerChips: React.FC<ActiveLayerChipsProps> = ({
  visibility,
  onToggleLayer,
  opacities: externalOpacities,
  onOpacityChange,
}) => {
  const [activeSliderKey, setActiveSliderKey] = useState<string | null>(null);
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

  if (activeChips.length === 0) return null;

  const handleSliderChange = (key: string, value: number) => {
    setLocalOpacities((prev) => ({ ...prev, [key]: value }));
    if (onOpacityChange) {
      onOpacityChange(key, value);
    }
  };

  return (
    <div className="absolute top-16 left-4 z-20 pointer-events-auto flex flex-wrap items-center gap-1.5 max-w-[calc(100vw-32px)] sm:max-w-2xl select-none">
      {activeChips.slice(0, 5).map((chip) => {
        const hasOpacityControl = chip.key in opacities;
        return (
          <div
            key={chip.key}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl backdrop-blur-xl border text-[11px] font-bold font-mono shadow-md transition-all ${chip.color}`}
          >
            <span>{chip.label}</span>

            {/* Slider Opasitas Instan */}
            {hasOpacityControl && (
              <button
                type="button"
                onClick={() => setActiveSliderKey(activeSliderKey === chip.key ? null : chip.key)}
                className="p-0.5 rounded hover:bg-white/20 transition-all opacity-80 hover:opacity-100"
                title="Atur transparansi layer"
              >
                <Sliders className="w-3 h-3" />
              </button>
            )}

            {/* Tombol Hapus Cepat */}
            <button
              type="button"
              onClick={() => onToggleLayer(chip.key)}
              className="p-0.5 rounded-full hover:bg-white/25 transition-all text-slate-300 hover:text-white"
              title={`Sembunyikan ${chip.label}`}
            >
              <X className="w-3 h-3" />
            </button>

            {/* Floating Opacity Popover */}
            {activeSliderKey === chip.key && (
              <div className="absolute top-8 left-0 p-2 rounded-xl bg-[#0B131D]/95 backdrop-blur-md border border-[#2B3E52] shadow-xl flex items-center gap-2 z-30">
                <span className="text-[10px] text-slate-300 font-mono">Opasitas:</span>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={opacities[chip.key] ?? 0.6}
                  onChange={(e) => handleSliderChange(chip.key, parseFloat(e.target.value))}
                  className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
                <span className="text-[10px] font-mono text-sky-400">
                  {Math.round((opacities[chip.key] ?? 0.6) * 100)}%
                </span>
              </div>
            )}
          </div>
        );
      })}

      {activeChips.length > 5 && (
        <span className="px-2 py-0.5 rounded-lg bg-[#0F1722]/80 backdrop-blur-md border border-[#2B3E52] text-slate-400 text-[10px] font-mono">
          +{activeChips.length - 5} lainnya
        </span>
      )}
    </div>
  );
};
