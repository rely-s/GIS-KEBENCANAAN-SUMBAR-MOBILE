import React, { useState } from 'react';
import { Sliders, RefreshCw, Trash2, Navigation } from 'lucide-react';
import { type UserSession } from './constants';

interface BlokadeJalanTabProps {
  currentUser: UserSession;
  jalanList: any[];
  loadJalan: () => void;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
  setErrorMsg: (msg: string | null) => void;
  setSuccessMsg: (msg: string | null) => void;
  onJalanCreated?: () => void;
}

export const BlokadeJalanTab: React.FC<BlokadeJalanTabProps> = ({
  currentUser,
  jalanList,
  loadJalan,
  authFetch,
  setErrorMsg,
  setSuccessMsg,
  onJalanCreated,
}) => {
  const [alasanJalan, setAlasanJalan] = useState('longsor');
  const [deskripsiJalan, setDeskripsiJalan] = useState('');
  const [presetLokasiJalan, setPresetLokasiJalan] = useState('sitinjau');
  const [submittingJalan, setSubmittingJalan] = useState(false);

  const handleSimpanJalan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingJalan(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    let coords: number[][] = [];
    if (presetLokasiJalan === 'sitinjau') {
      coords = [[100.4650, -0.9520], [100.4720, -0.9560], [100.4780, -0.9590]];
    } else if (presetLokasiJalan === 'anai') {
      coords = [[100.3420, -0.4850], [100.3450, -0.4880], [100.3500, -0.4920]];
    } else if (presetLokasiJalan === 'malalak') {
      coords = [[100.2520, -0.3250], [100.2580, -0.3320]];
    } else {
      coords = [[100.3550, -0.9450], [100.3580, -0.9400]];
    }

    try {
      const res = await authFetch('/api/jalan-terputus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geometry: { coordinates: coords },
          alasan: alasanJalan,
          deskripsi: deskripsiJalan || `Ruas jalan terputus akibat ${alasanJalan}.`
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail?.error?.message || 'Gagal mencatat jalan.');

      setSuccessMsg('Ruas jalan terputus berhasil ditambahkan! Rute evakuasi otomatis dialihkan via koridor detour resmi BPBD.');
      setDeskripsiJalan('');
      loadJalan();
      if (onJalanCreated) onJalanCreated();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingJalan(false);
    }
  };

  const handleUpdateStatusJalan = async (id: number, statusTarget: 'aktif' | 'sebagian' | 'pulih') => {
    try {
      const res = await authFetch(`/api/jalan-terputus/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusTarget })
      });
      if (!res.ok) throw new Error('Gagal update status jalan');
      setSuccessMsg(`Status penanganan ruas jalan berhasil diubah menjadi: ${statusTarget.toUpperCase()}`);
      loadJalan();
      if (onJalanCreated) onJalanCreated();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteJalan = async (id: number) => {
    if (!confirm('Hapus pencatatan ruas jalan terputus ini?')) return;
    try {
      const res = await authFetch(`/api/jalan-terputus/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Gagal menghapus jalan');
      setSuccessMsg('Ruas jalan berhasil dihapus.');
      loadJalan();
      if (onJalanCreated) onJalanCreated();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* FORM TAMBAH JALAN */}
      <form onSubmit={handleSimpanJalan} className="p-4 rounded-xl bg-[#141E28] border border-[#243444] space-y-3">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-rose-400" />
          Penandaan Ruas Jalan Terputus (Blokade Dinamis & Detour BPBD)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Penyebab Blokade</label>
            <select
              value={alasanJalan}
              onChange={(e) => setAlasanJalan(e.target.value)}
              className="w-full bg-[#0F1720] border border-[#2D3F52] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="longsor">Tanah Longsor / Tebing Runtuh</option>
              <option value="banjir">Banjir Bandang / Galodo Marapi</option>
              <option value="jembatan_putus">Jembatan Putus / Roboh</option>
              <option value="kerusakan_jalan">Jalan Amblas / Patahan Sesar</option>
              <option value="lainnya">Pohon Tumbang / Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Segmen Arteri Strategis</label>
            <select
              value={presetLokasiJalan}
              onChange={(e) => setPresetLokasiJalan(e.target.value)}
              className="w-full bg-[#0F1720] border border-[#2D3F52] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="sitinjau">Sitinjau Lauik (Padang - Solok KM 18)</option>
              <option value="anai">Lembah Anai (Padang Panjang - Sicincin)</option>
              <option value="malalak">Jalur Alternatif Malalak (Agam - Pariaman)</option>
              <option value="khatib">Jl. Khatib Sulaiman Padang (Genangan Banjir)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">Catatan Lapangan & Rekomendasi Pengalihan</label>
          <input
            type="text"
            value={deskripsiJalan}
            onChange={(e) => setDeskripsiJalan(e.target.value)}
            placeholder="Misal: Koridor Lembah Anai terputus total akibat galodo, dialihkan melalui Malalak-Sicincin..."
            className="w-full bg-[#0F1720] border border-[#2D3F52] rounded-lg px-3 py-1.5 text-xs text-white"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submittingJalan}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-lg transition-all"
          >
            {submittingJalan && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <Navigation className="w-3.5 h-3.5" />
            <span>Tandai Jalan Terputus (Alihkan Rute)</span>
          </button>
        </div>
      </form>

      {/* DAFTAR BLOKADE AKTIF */}
      <div className="bg-[#141E28] rounded-xl border border-[#243444] overflow-hidden">
        <div className="p-3 border-b border-[#243444] flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">Ruas Jalan Sedang Terhambat</span>
          <span className="text-[11px] font-mono text-rose-400 font-bold">{jalanList.length} Titik Blokade</span>
        </div>

        <div className="max-h-60 overflow-y-auto divide-y divide-[#243444]">
          {jalanList.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Tidak ada ruas jalan terputus aktif saat ini. Seluruh koridor transportasi Sumbar dapat dilalui.
            </div>
          ) : (
            jalanList.map((j) => {
              const p = j.properties;
              return (
                <div key={p.id} className="p-3 hover:bg-[#1B2733]/40 flex items-center justify-between gap-3 text-xs transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-400 uppercase font-mono">{p.alasan}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase font-mono ${
                        p.status === 'aktif' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-slate-300">{p.deskripsi}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleUpdateStatusJalan(p.id, 'sebagian')}
                      className="px-2 py-1 rounded bg-[#0F1720] hover:bg-[#243444] border border-[#2D3F52] text-[10px] font-mono transition-colors text-slate-300 hover:text-white"
                      title="Buka-Tutup 1 Arah"
                    >
                      Buka Sebagian
                    </button>
                    <button
                      onClick={() => handleUpdateStatusJalan(p.id, 'pulih')}
                      className="px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono transition-colors"
                      title="Buka Total"
                    >
                      Pulihkan
                    </button>
                    {(currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
                      <button
                        onClick={() => handleDeleteJalan(p.id)}
                        className="p-1 text-rose-400 hover:text-white rounded hover:bg-rose-900/40 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
