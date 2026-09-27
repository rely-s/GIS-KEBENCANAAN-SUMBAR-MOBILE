import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  RefreshCw, 
  Crosshair, 
  Trash2 
} from 'lucide-react';
import { type UserSession } from './constants';

interface PoskoManagementTabProps {
  poskoList: any[];
  currentUser: UserSession;
  loadPosko?: () => void;
  onRefresh?: () => void;
  onPoskoChanged?: () => void;
  onRequestPickLocation?: (target: 'posko' | 'bencana') => void;
  pickedCoords?: { lat: number; lng: number } | null;
  onClose?: () => void;
  onCloseParent?: () => void;
  setSuccessMsg: (msg: string | null) => void;
  setErrorMsg: (msg: string | null) => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const PoskoManagementTab: React.FC<PoskoManagementTabProps> = ({
  poskoList,
  currentUser,
  loadPosko,
  onRefresh,
  onPoskoChanged,
  onRequestPickLocation,
  pickedCoords,
  onClose,
  onCloseParent,
  setSuccessMsg,
  setErrorMsg,
  authFetch
}) => {
  const handleRefresh = () => {
    if (onRefresh) onRefresh();
    else if (loadPosko) loadPosko();
  };

  const handleClose = () => {
    if (onClose) onClose();
    else if (onCloseParent) onCloseParent();
  };

  const [poskoSearch, setPoskoSearch] = useState('');
  const [poskoFilterJenis, setPoskoFilterJenis] = useState('semua');
  const [isAddingPosko, setIsAddingPosko] = useState(false);
  const [submittingPosko, setSubmittingPosko] = useState(false);

  // Form Tambah Posko
  const [namaPosko, setNamaPosko] = useState('');
  const [jenisPosko, setJenisPosko] = useState('posko_utama');
  const [poskoLat, setPoskoLat] = useState(pickedCoords ? String(pickedCoords.lat) : '-0.9471');
  const [poskoLon, setPoskoLon] = useState(pickedCoords ? String(pickedCoords.lng) : '100.3543');
  const [kapasitasPosko, setKapasitasPosko] = useState(250);
  const [picPosko, setPicPosko] = useState('');
  const [telpPosko, setTelpPosko] = useState('');
  
  // Skema Kemanusiaan BNPB
  const [poskoLansia, setPoskoLansia] = useState(0);
  const [poskoBalita, setPoskoBalita] = useState(0);
  const [poskoDisabilitas, setPoskoDisabilitas] = useState(0);
  const [poskoAirBersih, setPoskoAirBersih] = useState('YA');
  const [poskoDapurUmum, setPoskoDapurUmum] = useState('TIDAK');
  const [poskoTenagaMedis, setPoskoTenagaMedis] = useState('TIDAK');

  const handleSimpanPosko = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPosko(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        nama: namaPosko,
        jenis: jenisPosko,
        lat: parseFloat(poskoLat),
        lon: parseFloat(poskoLon),
        kapasitas: Number(kapasitasPosko),
        kontak_pic: picPosko || 'Pusdalops BPBD',
        kontak_telepon: telpPosko || '112',
        fasilitas: ['air_bersih', 'dapur_umum'],
        status: 'aktif',
        jumlah_lansia: Number(poskoLansia),
        jumlah_balita: Number(poskoBalita),
        jumlah_disabilitas: Number(poskoDisabilitas),
        ketersediaan_air_bersih: poskoAirBersih === 'YA',
        ketersediaan_dapur_umum: poskoDapurUmum === 'YA',
        ketersediaan_tenaga_medis: poskoTenagaMedis === 'YA'
      };

      const res = await authFetch('/api/posko', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail?.error?.message || 'Gagal menyimpan posko');

      setSuccessMsg(`Posko "${namaPosko}" berhasil ditambahkan ke database!`);
      setIsAddingPosko(false);
      setNamaPosko('');
      handleRefresh();
      if (onPoskoChanged) onPoskoChanged();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingPosko(false);
    }
  };

  const handleToggleStatusPosko = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'aktif' ? 'penuh' : currentStatus === 'penuh' ? 'nonaktif' : 'aktif';
    try {
      const res = await authFetch(`/api/posko/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error('Gagal memperbarui status posko');
      setSuccessMsg(`Status posko berhasil diubah menjadi: ${nextStatus.toUpperCase()}`);
      handleRefresh();
      if (onPoskoChanged) onPoskoChanged();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeletePosko = async (id: number, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus posko: "${nama}"?`)) return;
    try {
      const res = await authFetch(`/api/posko/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Gagal menghapus posko');
      setSuccessMsg(`Posko "${nama}" berhasil dihapus.`);
      handleRefresh();
      if (onPoskoChanged) onPoskoChanged();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#141E28] p-3 rounded-xl border border-[#243444]">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={poskoSearch}
            onChange={(e) => setPoskoSearch(e.target.value)}
            placeholder="Cari posko atau shelter..."
            className="w-full bg-[#0F1720] border border-[#2D3F52] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={poskoFilterJenis}
            onChange={(e) => setPoskoFilterJenis(e.target.value)}
            className="bg-[#0F1720] border border-[#2D3F52] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="semua">Semua Kategori</option>
            <option value="posko_utama">Posko Utama</option>
            <option value="shelter_tes_tea">Shelter TES/TEA Tsunami</option>
            <option value="fasilitas_kesehatan">Faskes Darurat</option>
            <option value="titik_kumpul">Titik Kumpul</option>
          </select>

          <button
            onClick={() => setIsAddingPosko(!isAddingPosko)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddingPosko ? 'Batal' : 'Tambah Posko'}</span>
          </button>
        </div>
      </div>

      {/* FORM TAMBAH POSKO BARU */}
      {isAddingPosko && (
        <form onSubmit={handleSimpanPosko} className="p-4 rounded-xl bg-[#141E28] border-2 border-emerald-500/40 space-y-3 animate-in fade-in duration-200">
          <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Pendaftaran Titik Posko / Shelter Baru (Standar BNPB)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nama Fasilitas/Posko *</label>
              <input
                type="text"
                required
                value={namaPosko}
                onChange={(e) => setNamaPosko(e.target.value)}
                placeholder="Contoh: Shelter TES Pasia Nan Tigo"
                className="w-full bg-[#0F1720] border border-[#2D3F52] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Kategori Fasilitas</label>
              <select
                value={jenisPosko}
                onChange={(e) => setJenisPosko(e.target.value)}
                className="w-full bg-[#0F1720] border border-[#2D3F52] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="posko_utama">Posko Utama / Pengungsian</option>
                <option value="shelter_tes_tea">Shelter Vertikal TES/TEA Tsunami</option>
                <option value="fasilitas_kesehatan">Fasilitas Kesehatan Lapangan</option>
                <option value="titik_kumpul">Titik Kumpul Evakuasi Awal</option>
              </select>
            </div>
          </div>

          {/* Baris Koordinat & Tombol Titik Peta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Latitude (Lintang)</label>
              <input
                type="number"
                step="any"
                required
                value={poskoLat}
                onChange={(e) => setPoskoLat(e.target.value)}
                className="w-full bg-[#0F1720] border border-[#2D3F52] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Longitude (Bujur)</label>
              <input
                type="number"
                step="any"
                required
                value={poskoLon}
                onChange={(e) => setPoskoLon(e.target.value)}
                className="w-full bg-[#0F1720] border border-[#2D3F52] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  if (onRequestPickLocation) onRequestPickLocation('posko');
                }}
                className="w-full py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Tentukan di Peta</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Daya Tampung (Kapasitas Jiwa)</label>
              <input
                type="number"
                required
                min={10}
                value={kapasitasPosko}
                onChange={(e) => setKapasitasPosko(Number(e.target.value))}
                className="w-full bg-[#0F1720] border border-[#2D3F52] rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nama PIC Lapangan</label>
              <input
                type="text"
                value={picPosko}
                onChange={(e) => setPicPosko(e.target.value)}
                placeholder="Ahmad Fauzi (TRC BPBD)"
                className="w-full bg-[#0F1720] border border-[#2D3F52] rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Telepon PIC</label>
              <input
                type="text"
                value={telpPosko}
                onChange={(e) => setTelpPosko(e.target.value)}
                placeholder="081234567890"
                className="w-full bg-[#0F1720] border border-[#2D3F52] rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          {/* Standar BNPB: Pilah Kelompok Rentan & Fasilitas Vital */}
          <div className="bg-[#0F1720]/80 p-3 rounded-lg border border-[#243444] space-y-2.5">
            <div className="text-[11px] font-bold text-amber-300 font-mono flex items-center justify-between">
              <span>📋 STANDAR BNPB: PILAH KELOMPOK RENTAN & FASILITAS</span>
              <span className="text-[10px] text-slate-400">Pusdalops Human Intervention</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 mb-0.5">👴 Lansia (Jiwa)</label>
                <input
                  type="number"
                  min={0}
                  value={poskoLansia}
                  onChange={(e) => setPoskoLansia(Number(e.target.value))}
                  className="w-full bg-[#141E28] border border-[#2D3F52] rounded px-2.5 py-1 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 mb-0.5">👶 Balita (Jiwa)</label>
                <input
                  type="number"
                  min={0}
                  value={poskoBalita}
                  onChange={(e) => setPoskoBalita(Number(e.target.value))}
                  className="w-full bg-[#141E28] border border-[#2D3F52] rounded px-2.5 py-1 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 mb-0.5">♿ Disabilitas (Jiwa)</label>
                <input
                  type="number"
                  min={0}
                  value={poskoDisabilitas}
                  onChange={(e) => setPoskoDisabilitas(Number(e.target.value))}
                  className="w-full bg-[#141E28] border border-[#2D3F52] rounded px-2.5 py-1 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 mb-0.5">🚰 Air Bersih</label>
                <select
                  value={poskoAirBersih}
                  onChange={(e) => setPoskoAirBersih(e.target.value)}
                  className="w-full bg-[#141E28] border border-[#2D3F52] rounded px-2.5 py-1 text-xs text-white"
                >
                  <option value="YA">Tersedia (YA)</option>
                  <option value="TIDAK">Kritis / Tidak Tersedia</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 mb-0.5">🍲 Dapur Umum</label>
                <select
                  value={poskoDapurUmum}
                  onChange={(e) => setPoskoDapurUmum(e.target.value)}
                  className="w-full bg-[#141E28] border border-[#2D3F52] rounded px-2.5 py-1 text-xs text-white"
                >
                  <option value="YA">Aktif (YA)</option>
                  <option value="TIDAK">Belum Ada (TIDAK)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 mb-0.5">🩺 Tenaga Medis</label>
                <select
                  value={poskoTenagaMedis}
                  onChange={(e) => setPoskoTenagaMedis(e.target.value)}
                  className="w-full bg-[#141E28] border border-[#2D3F52] rounded px-2.5 py-1 text-xs text-white"
                >
                  <option value="YA">Siaga (YA)</option>
                  <option value="TIDAK">Tidak Ada (TIDAK)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#243444]">
            <button
              type="button"
              onClick={() => setIsAddingPosko(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submittingPosko}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
            >
              {submittingPosko && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Simpan Posko ke Database</span>
            </button>
          </div>
        </form>
      )}

      {/* DAFTAR POSKO TABLE */}
      <div className="bg-[#141E28] rounded-xl border border-[#243444] overflow-hidden">
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0F1720] text-slate-400 text-[11px] uppercase tracking-wider font-mono sticky top-0 border-b border-[#243444]">
              <tr>
                <th className="py-2.5 px-3">Nama & Jenis</th>
                <th className="py-2.5 px-3">Kapasitas & Pilah Rentan</th>
                <th className="py-2.5 px-3">Fasilitas Standar BNPB</th>
                <th className="py-2.5 px-3">Kontak PIC</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243444]">
              {poskoList
                .filter((f) => {
                  const p = f.properties;
                  if (poskoFilterJenis !== 'semua' && p.jenis !== poskoFilterJenis) return false;
                  if (poskoSearch && !p.nama?.toLowerCase().includes(poskoSearch.toLowerCase())) return false;
                  return true;
                })
                .map((f) => {
                  const p = f.properties;
                  const isPenuh = p.status === 'penuh';
                  return (
                    <tr key={p.id} className="hover:bg-[#1B2733]/50 transition-colors">
                      <td className="py-2 px-3">
                        <div className="font-bold text-white">{p.nama}</div>
                        <div className="text-[10px] text-slate-400 font-mono capitalize">
                          {p.jenis?.replace(/_/g, ' ') || 'Posko'}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-mono text-emerald-300 font-bold">
                          {p.kapasitas ? `${p.kapasitas.toLocaleString()} Jiwa` : '-'}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[9.5px] font-mono text-slate-300">
                          <span title="Lansia" className="bg-amber-500/15 text-amber-300 px-1 rounded">👴 {p.jumlah_pengungsi_lansia || p.jumlah_lansia || 0}</span>
                          <span title="Balita" className="bg-cyan-500/15 text-cyan-300 px-1 rounded">👶 {p.jumlah_pengungsi_balita || p.jumlah_balita || 0}</span>
                          <span title="Disabilitas" className="bg-purple-500/15 text-purple-300 px-1 rounded">♿ {p.jumlah_pengungsi_disabilitas || p.jumlah_disabilitas || 0}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap gap-1 text-[9.5px] font-mono">
                          <span className={`px-1 rounded ${p.ketersediaan_air_bersih === 'YA' || p.ketersediaan_air_bersih === true ? 'bg-cyan-500/20 text-cyan-300' : 'bg-rose-500/20 text-rose-300'}`}>
                            🚰 Air: {p.ketersediaan_air_bersih ? 'YA' : 'TIDAK'}
                          </span>
                          <span className={`px-1 rounded ${p.ketersediaan_dapur_umum === 'YA' || p.ketersediaan_dapur_umum === true ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
                            🍲 Dapur: {p.ketersediaan_dapur_umum ? 'YA' : 'TIDAK'}
                          </span>
                          <span className={`px-1 rounded ${p.ketersediaan_tenaga_medis === 'YA' || p.ketersediaan_tenaga_medis === true ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-700 text-slate-400'}`}>
                            🩺 Medis: {p.ketersediaan_tenaga_medis ? 'YA' : 'TIDAK'}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        <div>{p.kontak_pic || '-'}</div>
                        {p.kontak_telepon && <div className="text-[10px] text-slate-400 font-mono">{p.kontak_telepon}</div>}
                      </td>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => handleToggleStatusPosko(p.id, p.status)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold transition-all ${
                            p.status === 'aktif'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : isPenuh
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          }`}
                        >
                          {p.status || 'aktif'}
                        </button>
                      </td>
                      <td className="py-2 px-3 text-right">
                        {(currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
                          <button
                            onClick={() => handleDeletePosko(p.id, p.nama)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Hapus Posko"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
