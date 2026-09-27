import React from 'react';
import { 
  Waves, 
  Activity, 
  CloudLightning, 
  X, 
  Compass, 
  Clock 
} from 'lucide-react';

export interface AncamanDetailData {
  tipe: 'megathrust' | 'sesar' | 'cuaca' | 'tsunami_zone';
  judul: string;
  subJudul?: string;
  badge?: string;
  properties: Record<string, any>;
}

interface DetailAncamanSheetProps {
  data: AncamanDetailData | null;
  onClose: () => void;
  onMulaiEvakuasi?: () => void;
}

export const DetailAncamanSheet: React.FC<DetailAncamanSheetProps> = ({
  data,
  onClose,
  onMulaiEvakuasi
}) => {
  if (!data) return null;

  const isMegathrust = data.tipe === 'megathrust';
  const isSesar = data.tipe === 'sesar';
  const isCuaca = data.tipe === 'cuaca';
  const p = data.properties || {};

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 sm:absolute sm:inset-x-auto sm:left-4 sm:bottom-20 w-full sm:max-w-md bg-[#0B131D]/98 border-t sm:border border-[#2D3A4B] sm:rounded-2xl shadow-2xl backdrop-blur-xl text-slate-100 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[75vh] animate-in slide-in-from-bottom duration-300">
      
      {/* Header Panel */}
      <div className={`p-4 border-b border-slate-700/50 flex items-start justify-between ${
        isMegathrust 
          ? 'bg-gradient-to-r from-[#2B0E17] to-[#121822]' 
          : isSesar 
          ? 'bg-gradient-to-r from-[#291708] to-[#121822]' 
          : 'bg-gradient-to-r from-[#1B2735] to-[#121822]'
      }`}>
        <div className="flex items-start gap-3 min-w-0">
          <div className={`p-2.5 rounded-xl border shrink-0 ${
            isMegathrust 
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' 
              : isSesar 
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' 
              : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
          }`}>
            {isMegathrust ? <Waves className="w-5 h-5 animate-pulse" /> : isSesar ? <Activity className="w-5 h-5" /> : <CloudLightning className="w-5 h-5" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded font-extrabold border ${
                isMegathrust 
                  ? 'bg-rose-950 text-rose-300 border-rose-600/50' 
                  : isSesar 
                  ? 'bg-amber-950 text-amber-300 border-amber-600/50' 
                  : 'bg-cyan-950 text-cyan-300 border-cyan-600/50'
              }`}>
                {data.badge || (isMegathrust ? 'ZONA SUBDUKSI SEISMIK' : isSesar ? 'SESAR AKTIF DARAT' : 'PERINGATAN BMKG')}
              </span>
            </div>

            <h3 className="text-base font-bold text-white font-display mt-1.5 truncate">
              {data.judul}
            </h3>

            <p className="text-xs text-slate-300 mt-0.5 truncate">
              {data.subJudul || 'Wilayah Pantauan Geospasial Provinsi Sumatera Barat'}
            </p>
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

      {/* Konten Rincian */}
      <div className="p-4 overflow-y-auto space-y-3.5 text-xs scrollbar-thin scrollbar-thumb-slate-700">
        
        {/* Rincian Khusus Megathrust */}
        {isMegathrust && (
          <>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 bg-[#17121B] rounded-xl border border-rose-900/40">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Potensi Maksimum</span>
                <span className="text-sm font-bold text-rose-300 font-mono mt-0.5 block">Mw 8.9</span>
                <span className="text-[9px] text-slate-400">Seismic Gap Aktif</span>
              </div>
              <div className="p-2.5 bg-[#17121B] rounded-xl border border-rose-900/40">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Tinggi Gelombang</span>
                <span className="text-sm font-bold text-amber-300 font-mono mt-0.5 block">6 – 12 Meter</span>
                <span className="text-[9px] text-slate-400">Di Garis Pantai</span>
              </div>
            </div>

            {/* Golden Time Grid */}
            <div className="p-3 bg-[#111A26] rounded-xl border border-[#233547] space-y-2">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Golden Time Evakuasi Mandiri:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-[#172332] rounded-lg border border-slate-700/60">
                  <div className="text-[10px] font-bold text-cyan-300">🏝️ Kep. Mentawai</div>
                  <div className="text-sm font-bold text-white font-mono my-0.5">5 – 10 Menit</div>
                  <div className="text-[10px] text-slate-400">Segera ke perbukitan pulau (&gt;15 mdpl).</div>
                </div>
                <div className="p-2 bg-[#172332] rounded-lg border border-slate-700/60">
                  <div className="text-[10px] font-bold text-slate-300">🏙️ Daratan Pesisir</div>
                  <div className="text-sm font-bold text-white font-mono my-0.5">20 – 30 Menit</div>
                  <div className="text-[10px] text-slate-400">Lantai 3+ TES atau timur Bypass.</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Rincian Khusus Sesar Semangko */}
        {isSesar && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 bg-[#1A1510] rounded-xl border border-amber-900/40">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Slip Rate</span>
                <span className="text-sm font-bold text-amber-300 font-mono mt-0.5 block">{p.slip_rate || '11 - 27 mm/tahun'}</span>
              </div>
              <div className="p-2.5 bg-[#1A1510] rounded-xl border border-amber-900/40">
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Tipe Patahan</span>
                <span className="text-sm font-bold text-orange-300 font-mono mt-0.5 block">Dextral Strike-Slip</span>
              </div>
            </div>

            <div className="p-3 bg-[#111A26] rounded-xl border border-[#233547] text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-amber-300 block mb-1">Pedoman Keselamatan Gempa Sesar:</span>
              <span>Saat guncangan berhenti, segera berkumpul di ruang terbuka (lapangan/alun-alun). Hindari shelter bertingkat tinggi dan jauhi lereng tebing rawan longsor (Ngarai Sianok, Sitinjau).</span>
            </div>
          </div>
        )}

        {/* Rincian Khusus Peringatan Cuaca */}
        {isCuaca && (
          <div className="p-3 bg-[#111A26] rounded-xl border border-[#233547] space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span>Status Bahaya:</span>
              <strong className="text-amber-400 font-mono">{p.tingkat_bahaya || 'WASPADA'}</strong>
            </div>
            {p.curah_hujan && (
              <div className="flex items-center justify-between text-slate-300">
                <span>Curah Hujan:</span>
                <strong className="text-cyan-300 font-mono">{p.curah_hujan}</strong>
              </div>
            )}
            <p className="text-slate-300 pt-1 border-t border-slate-700/60 leading-relaxed">
              {p.ancaman || p.kondisi || 'Waspadai potensi banjir lahar hujan di hulu sungai Gunung Marapi dan risiko longsoran lereng terjal.'}
            </p>
          </div>
        )}
      </div>

      {/* Footer Aksi */}
      <div className="p-3.5 bg-[#0D1622] border-t border-[#243444] flex items-center gap-2">
        {onMulaiEvakuasi && (
          <button
            onClick={() => {
              onClose();
              onMulaiEvakuasi();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
          >
            <Compass className="w-4 h-4" />
            <span>Mulai Navigasi Evakuasi</span>
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
