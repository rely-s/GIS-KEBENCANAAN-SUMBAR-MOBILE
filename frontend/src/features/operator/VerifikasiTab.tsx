import React from 'react';
import { ShieldCheck, RefreshCw, CheckCircle2, Check, Info } from 'lucide-react';
import { type UserSession } from './constants';

interface VerifikasiTabProps {
  currentUser: UserSession;
  queueItems: any[];
  loadingQueue: boolean;
  loadQueue: () => void;
  loadBencana: () => void;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
  setErrorMsg: (msg: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
  onBencanaChanged?: () => void;
}

export const VerifikasiTab: React.FC<VerifikasiTabProps> = ({
  currentUser,
  queueItems,
  loadingQueue,
  loadQueue,
  loadBencana,
  authFetch,
  setErrorMsg,
  setSuccessMsg,
  onBencanaChanged,
}) => {
  const handleVerifikasiLaporan = async (id: number, statusVerif: 'terverifikasi' | 'ditolak') => {
    try {
      const res = await authFetch(`/api/bencana/${id}/verifikasi`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status_verifikasi: statusVerif,
          catatan: statusVerif === 'terverifikasi' 
            ? 'Diverifikasi langsung oleh Tim Pusdalops BPBD Prov. Sumbar' 
            : 'Ditolak: Informasi tidak valid atau tidak terkonfirmasi di lapangan'
        })
      });

      if (!res.ok) throw new Error('Gagal memproses verifikasi laporan.');
      setSuccessMsg(`Laporan ID #${id} berhasil di-${statusVerif === 'terverifikasi' ? 'SETUJUI (Tayang resmi di Peta Publik & SITREP)' : 'TOLAK'}.`);
      loadQueue();
      loadBencana();
      if (onBencanaChanged) onBencanaChanged();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* PANDUAN EDUKASI SOP QUALITY CONTROL DATA PUSDALOPS */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-[#132130] to-[#101A24] border border-blue-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                SOP Quality Control: Fungsi Antrean Verifikasi
              </h4>
              <p className="text-[11px] text-slate-300">
                Penyaringan dan validasi silang berjenjang sebelum laporan dirilis ke publik & SITREP BNPB.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/15 text-blue-300 border border-blue-500/30">
            Two-Eye QC Workflow
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
          <div className="p-2.5 rounded-lg bg-[#0E1722]/80 border border-[#233547]">
            <span className="text-[10px] font-mono font-bold text-amber-400 block mb-1">
              1. INPUT OPERATOR & WARGA
            </span>
            <p className="text-[11px] text-slate-300 leading-snug">
              Mencatat bencana, korban, dan koordinat. Status awal: <b className="text-amber-300">Menunggu</b> agar tidak langsung tayang tanpa verifikasi.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0E1722]/80 border border-[#233547]">
            <span className="text-[10px] font-mono font-bold text-blue-400 block mb-1">
              2. TRIAGE SUPERVISOR
            </span>
            <p className="text-[11px] text-slate-300 leading-snug">
              Supervisor Pusdalops memeriksa keabsahan foto/titik di antrean ini untuk menyaring laporan palsu atau duplikasi.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0E1722]/80 border border-[#233547]">
            <span className="text-[10px] font-mono font-bold text-emerald-400 block mb-1">
              3. RILIS RESMI
            </span>
            <p className="text-[11px] text-slate-300 leading-snug">
              Setelah diverifikasi, data otomatis tayang di <b className="text-emerald-300">Peta Publik</b> dan terakumulasi di dokumen <b className="text-emerald-300">SITREP BNPB</b>.
            </p>
          </div>
        </div>

        {currentUser.role === 'operator' && (
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              <strong>Peran Akun Operator:</strong> Halaman ini menampilkan laporan lapangan yang sedang mengantre ditinjau. Anda dapat memeriksa apakah laporan yang Anda input sudah diproses atau disetujui oleh Supervisor Pusdalops.
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between bg-[#141E28] p-3.5 rounded-xl border border-[#243444]">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Kotak Masuk Verifikasi Lapangan</h3>
          <p className="text-[11px] text-slate-400">Pemeriksaan dan validasi silang sebelum laporan diterbitkan ke publik.</p>
        </div>

        <button
          onClick={loadQueue}
          disabled={loadingQueue}
          className="px-2.5 py-1.5 rounded-lg bg-[#0F1720] hover:bg-[#1B2733] border border-[#243444] text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingQueue ? 'animate-spin' : ''}`} />
          <span>Segarkan</span>
        </button>
      </div>

      {queueItems.length === 0 ? (
        <div className="p-10 text-center rounded-xl bg-[#141E28] border border-[#243444] space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h4 className="text-sm font-bold text-white">Seluruh Laporan Telah Terverifikasi</h4>
          <p className="text-xs text-slate-400">Tidak ada antrean laporan lapangan berstatus 'menunggu' saat ini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queueItems.map((q) => (
            <div key={q.id} className="p-4 rounded-xl bg-[#141E28] border-2 border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold uppercase text-[10px] font-mono">
                    {q.jenis}
                  </span>
                  {q.sumber_data === 'laporan_warga' ? (
                    <span className="px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 font-bold uppercase text-[9.5px] font-mono">
                      📱 PWA Warga (Crowdsource)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9.5px] font-mono">
                      🛡️ Petugas Lapangan
                    </span>
                  )}
                  <span className="font-bold text-white text-xs">{q.wilayah}</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Pelapor: <strong className="text-slate-200">{q.pelapor}</strong>
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold uppercase border border-amber-500/40">
                  Menunggu Verifikasi
                </span>
              </div>

              <p className="text-xs text-slate-200 bg-[#0F1720] p-2.5 rounded-lg border border-[#243444]">
                {q.deskripsi}
              </p>

              {q.foto_url && (
                <div className="rounded-lg overflow-hidden border border-[#243444] bg-[#0A0F14] max-w-sm">
                  <div className="text-[10px] text-slate-400 px-2.5 py-1 bg-[#141E28] font-mono flex items-center justify-between">
                    <span>📸 Bukti Visual Lapangan (Warga)</span>
                    <a
                      href={q.foto_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 underline"
                    >
                      Buka Foto Penuh ↗
                    </a>
                  </div>
                  <img
                    src={q.foto_url}
                    alt="Bukti Foto Lapangan"
                    className="w-full max-h-48 object-cover cursor-pointer hover:opacity-95 transition"
                    onClick={() => window.open(q.foto_url, '_blank')}
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] font-mono text-slate-400">
                  Koordinat: {q.lat ? `${q.lat.toFixed(4)}, ${q.lon.toFixed(4)}` : 'Tidak tercatat'}
                </span>

                {currentUser.role === 'operator' ? (
                  <span className="px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-[10.5px] font-mono text-amber-300">
                    ⏳ Menunggu Telaah Supervisor Pusdalops
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVerifikasiLaporan(q.id, 'ditolak')}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold transition-colors"
                    >
                      Tolak Laporan
                    </button>
                    <button
                      onClick={() => handleVerifikasiLaporan(q.id, 'terverifikasi')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Verifikasi & Rilis ke Peta</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
