import React, { useState, useEffect } from 'react';
import { 
  CloudLightning, 
  MapPin, 
  Clock, 
  ShieldAlert, 
  X,
  Compass,
  Info
} from 'lucide-react';

export interface CuacaAlertItem {
  id: number;
  identifier: string;
  event: string;
  headline: string;
  description: string;
  severity: string;
  urgency: string;
  certainty: string;
  effective: string;
  expires: string;
  area_desc: string;
  atribusi?: string;
}

interface CuacaAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts?: CuacaAlertItem[];
  alertData?: CuacaAlertItem | null;
  onFlyToArea?: (lat: number, lng: number) => void;
}

// Titik koordinat strategis simpul cuaca BMKG 19 Kabupaten/Kota se-Sumatera Barat
const WILAYAH_COORDS: Record<string, { lat: number; lng: number }> = {
  // 7 Kota
  'padang': { lat: -0.947, lng: 100.354 },
  'bukittinggi': { lat: -0.3051, lng: 100.3692 },
  'solok': { lat: -0.798, lng: 100.655 },
  'padang panjang': { lat: -0.4633, lng: 100.4001 },
  'payakumbuh': { lat: -0.2246, lng: 100.6309 },
  'sawahlunto': { lat: -0.6806, lng: 100.7767 },
  'pariaman': { lat: -0.6264, lng: 100.1209 },

  // 12 Kabupaten
  'agam': { lat: -0.375, lng: 100.410 },
  'tanah datar': { lat: -0.470, lng: 100.380 },
  'padang pariaman': { lat: -0.640, lng: 100.280 },
  'pesisir': { lat: -1.350, lng: 100.570 },
  'pesisir selatan': { lat: -1.350, lng: 100.570 },
  'pasaman barat': { lat: 0.180, lng: 99.820 },
  'pasaman': { lat: 0.147, lng: 100.170 },
  'lima puluh kota': { lat: -0.142, lng: 100.666 },
  'solok selatan': { lat: -1.480, lng: 101.120 },
  'sijunjung': { lat: -0.691, lng: 101.001 },
  'dharmasraya': { lat: -0.986, lng: 101.371 },
  'mentawai': { lat: -2.024, lng: 99.594 },
};

export const CuacaAlertModal: React.FC<CuacaAlertModalProps> = ({
  isOpen,
  onClose,
  alerts = [],
  alertData = null,
  onFlyToArea
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Gabungkan alerts prop atau fallback ke alertData tunggal
  const alertList: CuacaAlertItem[] = alerts.length > 0 
    ? alerts 
    : alertData 
    ? [alertData] 
    : [];

  if (alertList.length === 0) return null;

  const currentAlert = alertList[selectedIndex] || alertList[0];

  const getCoordinates = (areaDesc: string) => {
    const descLower = areaDesc.toLowerCase();
    for (const [key, coords] of Object.entries(WILAYAH_COORDS)) {
      if (descLower.includes(key)) {
        return coords;
      }
    }
    return { lat: -0.85, lng: 100.41 };
  };

  const handleFlyToCurrent = () => {
    const coords = getCoordinates(currentAlert.area_desc);
    if (onFlyToArea) {
      onFlyToArea(coords.lat, coords.lng);
    }
    onClose();
  };

  const hasSevereThreat = alertList.some(a => a.severity.toLowerCase() === 'severe');
  const hasModerateThreat = alertList.some(a => a.severity.toLowerCase() === 'moderate');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-[#111A24] border border-[#2B3E52] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className={`flex items-center justify-between px-5 py-4 sm:px-6 bg-gradient-to-r ${
          hasSevereThreat 
            ? 'from-rose-950/90 via-[#162330] to-[#111A24] border-b border-rose-500/40'
            : hasModerateThreat
            ? 'from-amber-950/80 via-[#162330] to-[#111A24] border-b border-amber-500/30'
            : 'from-slate-900 via-[#141F2B] to-[#111A24] border-b border-slate-700/50'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 border ${
              hasSevereThreat
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-rose-950/50'
                : hasModerateThreat
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}>
              <CloudLightning className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  BMKG RESMI
                </span>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                  hasSevereThreat 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : hasModerateThreat
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {hasSevereThreat ? 'Peringatan Cuaca Ekstrem' : hasModerateThreat ? 'Waspada Cuaca' : 'Kondisi Umum: Kondusif'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display mt-0.5">
                {hasSevereThreat 
                  ? 'Peringatan Dini Cuaca Ekstrem Sumatera Barat' 
                  : 'Prakiraan Cuaca Resmi BMKG Sumatera Barat'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1E2E3E] transition-all shrink-0"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Pilihan Wilayah Terpantau */}
        {alertList.length > 1 && (
          <div className="px-5 py-2.5 sm:px-6 bg-[#0A1017] border-b border-[#223344]">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
              Pilih Wilayah Pantauan ({alertList.length} Lokasi BMKG):
            </span>
            <div className="flex flex-wrap items-center gap-1.5 py-0.5">
              {alertList.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const shortName = item.area_desc.split('(')[0].trim();
                const isSevere = item.severity.toLowerCase() === 'severe';
                const isModerate = item.severity.toLowerCase() === 'moderate';
                return (
                  <button
                    key={item.identifier || idx}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? isSevere
                          ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/30'
                          : isModerate
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                          : 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30'
                        : 'bg-[#141F2B] border border-[#2B3E52] text-slate-300 hover:text-white hover:bg-[#1C2C3D]'
                    }`}
                  >
                    <MapPin className={`w-3 h-3 ${isSelected ? (isModerate ? 'text-slate-950' : 'text-white') : 'text-slate-400'}`} />
                    <span>{shortName}</span>
                    {isSevere && (
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping ml-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Konten Detail Peringatan untuk Wilayah Terpilih */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-sm scrollbar-thin scrollbar-thumb-slate-700 flex-1">
          
          {/* Banner Wilayah Terpilih & Ancaman */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            currentAlert.severity.toLowerCase() === 'severe'
              ? 'bg-rose-950/40 border-rose-500/50'
              : currentAlert.severity.toLowerCase() === 'moderate'
              ? 'bg-amber-950/30 border-amber-500/40'
              : 'bg-[#14202C] border-[#2D3F52]'
          }`}>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  {currentAlert.area_desc}
                </span>
                <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded font-bold uppercase border ${
                  currentAlert.severity.toLowerCase() === 'severe'
                    ? 'bg-rose-500/25 text-rose-200 border-rose-500/50'
                    : currentAlert.severity.toLowerCase() === 'moderate'
                    ? 'bg-amber-500/25 text-amber-200 border-amber-500/50'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  Status: {currentAlert.severity.toLowerCase() === 'severe' ? 'Bahaya' : currentAlert.severity.toLowerCase() === 'moderate' ? 'Waspada' : 'Normal / Aman'}
                </span>
              </div>
              <h3 className={`text-base font-bold font-display ${
                currentAlert.severity.toLowerCase() === 'severe'
                  ? 'text-rose-300'
                  : currentAlert.severity.toLowerCase() === 'moderate'
                  ? 'text-amber-300'
                  : 'text-white'
              }`}>
                {currentAlert.event}
              </h3>
            </div>

            <button
              onClick={handleFlyToCurrent}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all shrink-0 active:scale-95"
              title="Arahkan kamera peta ke wilayah ini"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Arahkan Peta</span>
            </button>
          </div>

          {/* Glosarium Galodo: HANYA tampil jika ADA ancaman cuaca lebat/lahar dingin nyata */}
          {(currentAlert.severity.toLowerCase() === 'severe' || 
            currentAlert.event.toLowerCase().includes('lahar') || 
            currentAlert.event.toLowerCase().includes('galodo')) && (
            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-100 space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                <Info className="w-4 h-4 shrink-0" />
                <span>Kewaspadaan Khusus Aliran Lahar Hujan / Galodo</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-200">
                Wilayah lereng perbukitan dan hulu sungai berisiko mengalami <strong>Galodo</strong> (banjir bandang bermuatan lumpur dan batuan) jika curah hujan tinggi berlangsung lebih dari 1 jam. Warga di sempadan sungai diminta menjauh ke tempat tinggi.
              </p>
            </div>
          )}

          {/* Ringkasan Cuaca Resmi BMKG */}
          <div className="space-y-1">
            <span className="text-slate-400 font-semibold text-xs">
              Laporan Stasiun Meteorologi BMKG:
            </span>
            <div className="p-3 rounded-xl bg-[#0B121A] border border-[#2B3E52] text-white text-xs sm:text-sm leading-relaxed">
              {currentAlert.headline}
            </div>
          </div>

          {/* Deskripsi & Analisis */}
          <div className="space-y-1">
            <span className="text-slate-400 font-semibold text-xs">
              Kondisi Lapangan & Kesiapsiagaan:
            </span>
            <div className="p-3 rounded-xl bg-[#0B121A] border border-[#2B3E52] text-slate-300 text-xs sm:text-sm leading-relaxed">
              {currentAlert.description}
            </div>
          </div>

          {/* Petunjuk Kesiapsiagaan Ringkas */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-300 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-200 text-xs">
              <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Panduan Kesiapsiagaan BPBD Sumatera Barat</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 leading-relaxed">
              <li>Pantau rilis resmi cuaca dan gempa berkala di portal GIS ini.</li>
              <li>Hindari berteduh di bawah pohon rapuh atau lereng rawan longsor saat angin kencang.</li>
              <li>Gunakan fitur pemantau jalur evakuasi untuk melihat rute aman jika terjadi genangan.</li>
            </ul>
          </div>

          {/* Footer Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] font-mono text-slate-400 border-t border-[#223344] pt-2 gap-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sinkronisasi Sensor: {currentAlert.effective ? new Date(currentAlert.effective).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Live Real-Time via BMKG'}</span>
            </div>
            <div>
              Sumber: {currentAlert.atribusi || 'Stasiun Meteorologi Minangkabau (BIM) BMKG'}
            </div>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="px-5 py-3 bg-[#0B121A] border-t border-[#2B3E52] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#1E2E3E] border border-[#2B3E52] transition-colors text-xs font-semibold"
          >
            Tutup
          </button>
          <button
            onClick={handleFlyToCurrent}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Compass className="w-4 h-4 text-slate-950" />
            <span>Fokus Peta ({currentAlert.area_desc.split('(')[0].trim()})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
