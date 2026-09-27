import React from 'react';
import { Check, AlertTriangle } from 'lucide-react';

interface ExecutiveDashboardTabProps {
  statistikData: any | null;
  setSuccessMsg: (msg: string | null) => void;
}

export const ExecutiveDashboardTab: React.FC<ExecutiveDashboardTabProps> = ({
  statistikData,
  setSuccessMsg,
}) => {
  const handleCopyKawat = () => {
    const ringkasan = `🚨 *LAPORAN SITUASI PUSDALOPS BPBD PROV. SUMATERA BARAT*\n` +
      `Status: ${statistikData?.status_siaga || 'TANGGAP DARURAT'}\n` +
      `• Total Kejadian: ${statistikData?.ringkasan?.total_kejadian || 0}\n` +
      `• Korban Meninggal: ${statistikData?.ringkasan?.total_meninggal || 0} Jiwa\n` +
      `• Korban Luka: ${statistikData?.ringkasan?.total_luka || 0} Jiwa\n` +
      `• Pengungsi: ${(statistikData?.ringkasan?.total_pengungsi || 0).toLocaleString()} Jiwa\n` +
      `• Rumah Rusak: ${statistikData?.ringkasan?.total_rumah_rusak || 0} Unit\n` +
      `• Posko Beroperasi: ${statistikData?.ringkasan?.posko_aktif || 0} Aktif (${statistikData?.ringkasan?.posko_penuh || 0} Penuh)\n` +
      `• Ruas Jalan Terputus: ${statistikData?.ringkasan?.jalan_terputus_aktif || 0} Titik\n\n` +
      `_Laporan diekspor resmi via GIS Dashboard Kebencanaan BPBD Prov. Sumbar._`;
    navigator.clipboard.writeText(ringkasan);
    setSuccessMsg('Kawat ringkasan situasi berhasil disalin ke clipboard! Siap dipaste ke grup koordinasi Forkopimda.');
  };

  return (
    <div className="space-y-4">
      {/* Status Banner Siaga Darurat */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/60 via-[#182330] to-[#121A24] border border-rose-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="font-bold text-xs text-rose-300 font-mono tracking-wider uppercase">
              {statistikData?.status_siaga || 'SIAGA 1 (TANGGAP DARURAT)'}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white font-display">
            Ringkasan Situasi Komando Eksekutif Bencana Prov. Sumbar
          </h3>
          <p className="text-[11px] text-slate-400">
            Agregasi terintegrasi data lapangan Pusdalops BPBD, BMKG TEWS, dan PVMBG.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCopyKawat}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Salin Kawat WhatsApp Forkopimda</span>
          </button>

          <button
            type="button"
            onClick={() => window.open('/api/laporan/sitrep', '_blank')}
            className="px-3 py-1.5 rounded-lg bg-[#233547] hover:bg-[#2D445B] text-slate-200 hover:text-white font-semibold text-xs border border-[#344D66] transition-all shrink-0"
          >
            Ekspor Dokumen SITREP (PDF)
          </button>
        </div>
      </div>

      {/* 4 Kartu KPI Makro */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#141E28] border border-[#243444]">
          <span className="text-[10px] font-mono uppercase text-slate-400">Total Kejadian</span>
          <div className="text-xl font-bold text-white font-display mt-0.5">
            {statistikData?.ringkasan?.total_kejadian || 0}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Kejadian Terverifikasi</span>
        </div>

        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
          <span className="text-[10px] font-mono uppercase text-rose-400">Korban Jiwa</span>
          <div className="text-xl font-bold text-rose-300 font-display mt-0.5">
            {statistikData?.ringkasan?.total_meninggal || 0} Jiwa
          </div>
          <span className="text-[10px] text-rose-400/80 font-mono">{statistikData?.ringkasan?.total_luka || 0} Luka-luka</span>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
          <span className="text-[10px] font-mono uppercase text-emerald-400">Total Pengungsi</span>
          <div className="text-xl font-bold text-emerald-300 font-display mt-0.5">
            {(statistikData?.ringkasan?.total_pengungsi || 0).toLocaleString()} Jiwa
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono">Terlayani di {statistikData?.ringkasan?.posko_aktif || 0} Posko</span>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30">
          <span className="text-[10px] font-mono uppercase text-amber-400">Estimasi Kerugian</span>
          <div className="text-xl font-bold text-amber-300 font-display mt-0.5">
            Rp {((statistikData?.ringkasan?.total_kerugian || 0) / 1_000_000_000).toFixed(2)} M
          </div>
          <span className="text-[10px] text-amber-400/80 font-mono">{statistikData?.ringkasan?.total_rumah_rusak || 0} Rumah Rusak</span>
        </div>
      </div>

      {/* Prioritas Wilayah & Logistik */}
      {statistikData?.prioritas_wilayah && statistikData.prioritas_wilayah.length > 0 && (
        <div className="p-4 rounded-xl bg-[#141E28] border border-[#243444] space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>3 Wilayah Prioritas Intervensi Darurat & Distribusi Logistik</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {statistikData.prioritas_wilayah.map((w: any, idx: number) => (
              <div key={idx} className="p-3 rounded-lg bg-[#0F1720] border border-[#2D3F52] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">{w.nama}</span>
                  <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    #{idx + 1} Terparah
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Kerugian: <strong>Rp {(w.total_kerugian / 1_000_000_000).toFixed(2)} M</strong>
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  Korban Jiwa: {w.total_meninggal} • Kejadian: {w.jumlah_kejadian}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
