import React from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  X, 
  Compass, 
  CornerUpRight,
  Info
} from 'lucide-react';

export interface JalanTerputusDetailData {
  id: number;
  alasan: string;
  deskripsi?: string;
  status: string;
  nama_ruas?: string;
  koridor_alternatif?: string;
  created_at?: string;
}

interface DetailJalanSheetProps {
  jalan: JalanTerputusDetailData | null;
  onClose: () => void;
  onPlanDetour?: () => void;
}

export const DetailJalanSheet: React.FC<DetailJalanSheetProps> = ({
  jalan,
  onClose,
  onPlanDetour
}) => {
  if (!jalan) return null;

  // Analisis otomatis koridor pengalihan resmi
  const alasanLower = (jalan.alasan || '').toLowerCase() + ' ' + (jalan.deskripsi || '').toLowerCase();
  let koridorSaran = 'Gunakan jalur alternatif jalan kolektor terdekat yang telah disurvei BPBD.';
  
  if (alasanLower.includes('anai') || alasanLower.includes('silaiang')) {
    koridorSaran = 'Koridor Resmi BPBD: Akses Padang - Bukittinggi dialihkan via Sicincin - Malalak - Koto Tuo.';
  } else if (alasanLower.includes('sitinjau') || alasanLower.includes('panorama')) {
    koridorSaran = 'Koridor Resmi BPBD: Akses Padang - Solok dialihkan via Padang Panjang - Singkarak - Solok.';
  } else if (alasanLower.includes('kelok 9') || alasanLower.includes('pangkalan')) {
    koridorSaran = 'Koridor Resmi BPBD: Lintas Sumbar - Riau dialihkan via Sijunjung - Kiliran Jao - Teluk Kuantan.';
  } else if (alasanLower.includes('tarusan') || alasanLower.includes('painan')) {
    koridorSaran = 'Koridor Resmi BPBD: Lintas Pesisir Selatan dialihkan via Surian - Bayang - Alahan Panjang.';
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 sm:absolute sm:inset-x-auto sm:left-4 sm:bottom-20 w-full sm:max-w-md bg-[#0B131D]/98 border-t sm:border border-[#382329] sm:rounded-2xl shadow-2xl backdrop-blur-xl text-slate-100 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[75vh] animate-in slide-in-from-bottom duration-300">
      
      {/* Header Panel */}
      <div className="p-4 bg-gradient-to-r from-[#2A0E14] via-[#1A1218] to-[#0E1622] border-b border-[#382329] flex items-start justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2.5 rounded-xl border shrink-0 bg-rose-500/20 border-rose-500/40 text-rose-400">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded font-extrabold bg-rose-950 text-rose-300 border border-rose-600/50">
                BLOKADE JALAN TERPUTUS
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                STATUS: {(jalan.status || 'AKTIF').toUpperCase()}
              </span>
            </div>

            <h3 className="text-base font-bold text-white font-display mt-1.5 truncate">
              {jalan.alasan}
            </h3>

            <div className="flex items-center gap-1.5 text-xs text-rose-300/80 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate">Ruas Jalan Strategis Sumatera Barat</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 ml-2"
          title="Tutup Sheet"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Konten Scrollable */}
      <div className="p-4 overflow-y-auto space-y-3.5 text-xs scrollbar-thin scrollbar-thumb-slate-700">
        
        {/* Deskripsi Kronologi / Dampak */}
        <div className="p-3 bg-[#171216] rounded-xl border border-[#382329] space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300 block font-semibold flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-rose-400" />
            Laporan Kaji Cepat Kerusakan:
          </span>
          <p className="text-xs text-slate-200 leading-relaxed">
            {jalan.deskripsi || 'Ruas jalan mengalami kerusakan struktur jalan, amblas, atau tertimbun material longsoran sehingga tidak dapat dilintasi kendaraan.'}
          </p>
        </div>

        {/* Koridor Detour Resmi BPBD */}
        <div className="p-3 bg-[#131C28] rounded-xl border border-[#233547] space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 block font-semibold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            Rekomendasi Jalur Pengalihan Resmi (Detour):
          </span>
          <p className="text-xs text-slate-200 leading-relaxed font-medium bg-[#0B131D] p-2.5 rounded-lg border border-slate-700/50">
            {koridorSaran}
          </p>
          <span className="text-[10px] text-slate-400 italic block">
            * Seluruh rute evakuasi di sistem GIS otomatis menghindari ruas jalan ini dan dialihkan ke jalan alternatif yang aman.
          </span>
        </div>
      </div>

      {/* Footer Aksi */}
      <div className="p-3.5 bg-[#0D1622] border-t border-[#243444] flex items-center gap-2">
        {onPlanDetour && (
          <button
            onClick={() => {
              onClose();
              onPlanDetour();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
          >
            <CornerUpRight className="w-4 h-4" />
            <span>Kalkulasi Navigasi Detour</span>
          </button>
        )}

        <button
          onClick={onClose}
          className="py-2.5 px-4 rounded-xl bg-[#1B2836] hover:bg-[#233547] text-slate-300 font-semibold text-xs transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};
