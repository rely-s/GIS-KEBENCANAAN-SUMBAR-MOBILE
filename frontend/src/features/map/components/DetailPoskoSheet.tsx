import React from 'react';
import { 
  Building2, 
  MapPin, 
  PhoneCall, 
  Users, 
  Droplet, 
  Utensils, 
  HeartPulse, 
  X, 
  Navigation, 
  ShieldCheck, 
  Waves 
} from 'lucide-react';

export interface PoskoDetailData {
  id: number;
  nama: string;
  jenis?: string;
  alamat?: string;
  kapasitas?: number;
  terisi?: number;
  status?: string;
  kontak_pic?: string;
  kontak_telepon?: string;
  lat: number;
  lon: number;
  fasilitas?: string[];
  jumlah_lansia?: number;
  jumlah_balita?: number;
  jumlah_disabilitas?: number;
  jumlah_ibu_hamil?: number;
  ketersediaan_air_bersih?: boolean;
  ketersediaan_dapur_umum?: boolean;
  ketersediaan_tenaga_medis?: boolean;
}

interface DetailPoskoSheetProps {
  posko: PoskoDetailData | null;
  onClose: () => void;
  onNavigateToPosko: (posko: PoskoDetailData) => void;
}

export const DetailPoskoSheet: React.FC<DetailPoskoSheetProps> = ({
  posko,
  onClose,
  onNavigateToPosko
}) => {
  if (!posko) return null;

  const isTES = posko.jenis === 'shelter_tes_tea';
  const kapasitas = posko.kapasitas || 300;
  const terisi = posko.terisi || Math.round(kapasitas * 0.35);
  const sisaKapasitas = Math.max(0, kapasitas - terisi);
  const persentase = Math.min(100, Math.round((terisi / kapasitas) * 100));

  const totalKelompokRentan = (posko.jumlah_lansia || 0) + (posko.jumlah_balita || 0) + (posko.jumlah_disabilitas || 0) + (posko.jumlah_ibu_hamil || 0);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 sm:absolute sm:inset-x-auto sm:left-4 sm:bottom-20 w-full sm:max-w-md bg-[#0B131D]/98 border-t sm:border border-[#26384A] sm:rounded-2xl shadow-2xl backdrop-blur-xl text-slate-100 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[75vh] animate-in slide-in-from-bottom duration-300">
      
      {/* Drag Bar & Header */}
      <div className="p-4 bg-gradient-to-r from-[#172332] to-[#0E1622] border-b border-[#243444] flex items-start justify-between relative">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`p-2.5 rounded-xl border shrink-0 ${
            isTES 
              ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' 
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
          }`}>
            {isTES ? <Waves className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded font-extrabold border ${
                isTES 
                  ? 'bg-blue-950 text-blue-300 border-blue-600/50' 
                  : 'bg-emerald-950 text-emerald-300 border-emerald-600/50'
              }`}>
                {isTES ? 'SHELTER VERTIKAL TES' : 'POSKO RESMI EVAKUASI'}
              </span>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                STATUS: {(posko.status || 'AKTIF').toUpperCase()}
              </span>
            </div>

            <h3 className="text-base font-bold text-white font-display mt-1.5 truncate">
              {posko.nama}
            </h3>

            <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{posko.alamat || 'Sumatera Barat'}</span>
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
        
        {/* Metrik Kapasitas Real-Time */}
        <div className="p-3 bg-[#131E2A] rounded-xl border border-[#243444] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono uppercase text-[10px] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              Okupansi & Daya Tampung
            </span>
            <span className="font-bold text-white font-mono">
              {terisi.toLocaleString()} / {kapasitas.toLocaleString()} Jiwa ({persentase}%)
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                persentase >= 90 ? 'bg-rose-500' : persentase >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${persentase}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 text-slate-300">
            <span>Sisa Kapasitas Tersedia:</span>
            <strong className="text-emerald-400 font-mono">{sisaKapasitas.toLocaleString()} Jiwa</strong>
          </div>
        </div>

        {/* Pilah Kelompok Rentan Standar BNPB (Jika Tersedia) */}
        <div className="p-3 bg-[#121B26] rounded-xl border border-[#233547] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              Pilah Perlindungan Kelompok Rentan (BNPB):
            </span>
            <span className="text-[10px] font-mono text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30">
              {totalKelompokRentan} Terdata
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center">
            <div className="p-2 bg-[#182535] rounded-lg border border-[#2B3E52]/40">
              <div className="text-[9px] text-slate-400 font-mono">Lansia</div>
              <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">
                {posko.jumlah_lansia ?? 0}
              </div>
            </div>

            <div className="p-2 bg-[#182535] rounded-lg border border-[#2B3E52]/40">
              <div className="text-[9px] text-slate-400 font-mono">Balita</div>
              <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">
                {posko.jumlah_balita ?? 0}
              </div>
            </div>

            <div className="p-2 bg-[#182535] rounded-lg border border-[#2B3E52]/40">
              <div className="text-[9px] text-slate-400 font-mono">Disabilitas</div>
              <div className="text-sm font-bold text-rose-300 font-mono mt-0.5">
                {posko.jumlah_disabilitas ?? 0}
              </div>
            </div>

            <div className="p-2 bg-[#182535] rounded-lg border border-[#2B3E52]/40">
              <div className="text-[9px] text-slate-400 font-mono">Ibu Hamil</div>
              <div className="text-sm font-bold text-purple-300 font-mono mt-0.5">
                {posko.jumlah_ibu_hamil ?? 0}
              </div>
            </div>
          </div>
        </div>

        {/* Kesiapan Fasilitas Vital */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
            Fasilitas Vital Operasional:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <div className={`p-2 rounded-lg border flex items-center gap-2 ${
              posko.ketersediaan_air_bersih ?? true 
                ? 'bg-blue-950/40 border-blue-600/40 text-blue-200' 
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              <Droplet className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="text-[11px] font-medium">Air Bersih</span>
            </div>

            <div className={`p-2 rounded-lg border flex items-center gap-2 ${
              posko.ketersediaan_dapur_umum ?? true 
                ? 'bg-amber-950/40 border-amber-600/40 text-amber-200' 
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              <Utensils className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] font-medium">Dapur Umum</span>
            </div>

            <div className={`p-2 rounded-lg border flex items-center gap-2 ${
              posko.ketersediaan_tenaga_medis ?? true 
                ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-200' 
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              <HeartPulse className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-medium">Tim Medis</span>
            </div>
          </div>
        </div>

        {/* Kontak PIC & Panggilan Telepon 1-Klik */}
        {(posko.kontak_pic || posko.kontak_telepon) && (
          <div className="p-3 bg-gradient-to-r from-blue-950/40 to-[#121E2C] rounded-xl border border-blue-500/30 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[9px] font-mono text-blue-300 uppercase block font-semibold">Petugas Lapangan (PIC):</span>
              <span className="font-bold text-white text-xs truncate block">{posko.kontak_pic || 'Satgas Posko BPBD'}</span>
              <span className="font-mono text-[11px] text-cyan-300">{posko.kontak_telepon || 'Call Center 112'}</span>
            </div>

            {posko.kontak_telepon && (
              <a
                href={`tel:${posko.kontak_telepon}`}
                className="py-2 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 shrink-0"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Panggil</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Tombol Aksi Navigasi Cepat */}
      <div className="p-3.5 bg-[#0D1622] border-t border-[#243444] flex items-center gap-2">
        <button
          onClick={() => onNavigateToPosko(posko)}
          className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all active:scale-[0.98]"
        >
          <Navigation className="w-4 h-4" />
          <span>Navigasi Rute ke Posko Ini</span>
        </button>

        <button
          onClick={onClose}
          className="py-3 px-3.5 rounded-xl bg-[#1B2836] hover:bg-[#233547] text-slate-300 font-semibold text-xs transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};
