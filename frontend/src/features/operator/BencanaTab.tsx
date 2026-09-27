import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Crosshair, 
  FileSpreadsheet, 
  Edit3, 
  RefreshCw 
} from 'lucide-react';
import { WILAYAH_SUMBAR_LIST, type UserSession } from './constants';

interface BencanaTabProps {
  bencanaList: any[];
  currentUser: UserSession;
  loadBencana?: () => void;
  onRefresh?: () => void;
  onBencanaChanged?: () => void;
  onRequestPickLocation?: (target: 'posko' | 'bencana') => void;
  pickedCoords?: { lat: number; lng: number } | null;
  onClose?: () => void;
  onCloseParent?: () => void;
  setSuccessMsg: (msg: string | null) => void;
  setErrorMsg: (msg: string | null) => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export const BencanaTab: React.FC<BencanaTabProps> = ({
  bencanaList,
  currentUser,
  loadBencana,
  onRefresh,
  onBencanaChanged,
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
    else if (loadBencana) loadBencana();
  };

  const handleClose = () => {
    if (onClose) onClose();
    else if (onCloseParent) onCloseParent();
  };

  const [isAddingBencana, setIsAddingBencana] = useState(false);
  const [submittingBencana, setSubmittingBencana] = useState(false);

  // Form Input Kejadian Bencana
  const [jenisBencana, setJenisBencana] = useState('longsor');
  const [deskripsiBencana, setDeskripsiBencana] = useState('');
  const [bencanaLat, setBencanaLat] = useState(pickedCoords ? String(pickedCoords.lat) : '-0.9520');
  const [bencanaLon, setBencanaLon] = useState(pickedCoords ? String(pickedCoords.lng) : '100.4650');
  const [wilayahIdBencana, setWilayahIdBencana] = useState(1);
  const [statusVerifBencana, setStatusVerifBencana] = useState('terverifikasi');

  // Form Disagregasi Korban & Kerusakan (Jitupasna BNPB)
  const [korbanMeninggal, setKorbanMeninggal] = useState(0);
  const [korbanHilang, setKorbanHilang] = useState(0);
  const [korbanLuka, setKorbanLuka] = useState(0);
  const [jumlahPengungsi, setJumlahPengungsi] = useState(0);
  const [kerugianRupiah, setKerugianRupiah] = useState(0);
  const [rumahRusakBerat, setRumahRusakBerat] = useState(0);
  const [rumahRusakSedang, setRumahRusakSedang] = useState(0);
  const [rumahRusakRingan, setRumahRusakRingan] = useState(0);
  const [fasumRusak, setFasumRusak] = useState(0);
  const [faskesRusak, setFaskesRusak] = useState(0);
  const [sekolahRusak, setSekolahRusak] = useState(0);
  const [pendudukTerdampak, setPendudukTerdampak] = useState(0);

  // Modal Edit Dampak Bencana (Post-Disaster Assessment)
  const [editingDampakBencana, setEditingDampakBencana] = useState<any | null>(null);
  const [editMeninggal, setEditMeninggal] = useState(0);
  const [editHilang, setEditHilang] = useState(0);
  const [editLuka, setEditLuka] = useState(0);
  const [editPengungsi, setEditPengungsi] = useState(0);
  const [editKerugian, setEditKerugian] = useState(0);
  const [editRB, setEditRB] = useState(0);
  const [editRS, setEditRS] = useState(0);
  const [editRR, setEditRR] = useState(0);
  const [editFasum, setEditFasum] = useState(0);
  const [editFaskes, setEditFaskes] = useState(0);
  const [editSekolah, setEditSekolah] = useState(0);
  const [editTerdampak, setEditTerdampak] = useState(0);
  const [editCatatan, setEditCatatan] = useState('');
  const [submittingDampak, setSubmittingDampak] = useState(false);

  const handleSimpanBencana = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingBencana(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        jenis_bencana: jenisBencana,
        wilayah_id: Number(wilayahIdBencana),
        lat: parseFloat(bencanaLat),
        lon: parseFloat(bencanaLon),
        deskripsi: deskripsiBencana || `Laporan kejadian ${jenisBencana} di Sumatera Barat.`,
        sumber_data: (currentUser.role === 'admin' || currentUser.role === 'super_admin') ? 'pusdalops_bpbd' : 'operator_lapangan',
        status_verifikasi: (currentUser.role === 'admin' || currentUser.role === 'super_admin') ? statusVerifBencana : 'menunggu',
        dampak: {
          korban_meninggal: Number(korbanMeninggal),
          korban_hilang: Number(korbanHilang),
          korban_luka: Number(korbanLuka),
          jumlah_pengungsi: Number(jumlahPengungsi),
          kerugian_rp: Number(kerugianRupiah),
          rumah_rusak_berat: Number(rumahRusakBerat),
          rumah_rusak_sedang: Number(rumahRusakSedang),
          rumah_rusak_ringan: Number(rumahRusakRingan),
          fasilitas_umum_rusak: Number(fasumRusak),
          fasilitas_kesehatan_rusak: Number(faskesRusak),
          sekolah_rusak: Number(sekolahRusak),
          penduduk_terdampak: Number(pendudukTerdampak)
        }
      };

      const res = await authFetch('/api/bencana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail?.error?.message || 'Gagal melaporkan bencana.');

      setSuccessMsg(
        (currentUser.role === 'admin' || currentUser.role === 'super_admin')
          ? 'Kejadian bencana berhasil dirilis ke peta publik!'
          : 'Laporan tersimpan dan masuk antrean verifikasi Pusdalops!'
      );
      setIsAddingBencana(false);
      setDeskripsiBencana('');
      handleRefresh();
      if (onBencanaChanged) onBencanaChanged();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingBencana(false);
    }
  };

  const handleOpenEditDampak = async (b: any) => {
    setEditingDampakBencana(b);
    try {
      const res = await fetch(`/api/bencana/${b.id}`);
      if (res.ok) {
        const fullDetail = await res.json();
        const d = fullDetail.dampak || {};
        setEditMeninggal(d.korban_meninggal || 0);
        setEditHilang(d.korban_hilang || 0);
        setEditLuka(d.korban_luka || 0);
        setEditPengungsi(d.jumlah_pengungsi || 0);
        setEditKerugian(d.kerugian_rp || 0);
        setEditRB(d.rumah_rusak_berat || 0);
        setEditRS(d.rumah_rusak_sedang || 0);
        setEditRR(d.rumah_rusak_ringan || 0);
        setEditFasum(d.fasilitas_umum_rusak || 0);
        setEditFaskes(d.fasilitas_kesehatan_rusak || 0);
        setEditSekolah(d.sekolah_rusak || 0);
        setEditTerdampak(d.penduduk_terdampak || 0);
        setEditCatatan(d.catatan || '');
      } else {
        const d = b.dampak || {};
        setEditMeninggal(d.korban_meninggal || 0);
        setEditHilang(0);
        setEditLuka(d.korban_luka || 0);
        setEditPengungsi(d.jumlah_pengungsi || 0);
        setEditKerugian(d.kerugian_rp || 0);
        setEditRB(d.rumah_rusak_berat || 0);
        setEditRS(0);
        setEditRR(0);
        setEditFasum(0);
        setEditFaskes(0);
        setEditSekolah(0);
        setEditTerdampak(0);
        setEditCatatan('');
      }
    } catch {
      const d = b.dampak || {};
      setEditMeninggal(d.korban_meninggal || 0);
      setEditHilang(0);
      setEditLuka(d.korban_luka || 0);
      setEditPengungsi(d.jumlah_pengungsi || 0);
      setEditKerugian(d.kerugian_rp || 0);
      setEditRB(d.rumah_rusak_berat || 0);
      setEditRS(0);
      setEditRR(0);
      setEditFasum(0);
      setEditFaskes(0);
      setEditSekolah(0);
      setEditTerdampak(0);
      setEditCatatan('');
    }
  };

  const handleSimpanUpdateDampak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDampakBencana) return;
    setSubmittingDampak(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        korban_meninggal: Number(editMeninggal),
        korban_hilang: Number(editHilang),
        korban_luka: Number(editLuka),
        jumlah_pengungsi: Number(editPengungsi),
        kerugian_rp: Number(editKerugian),
        rumah_rusak_berat: Number(editRB),
        rumah_rusak_sedang: Number(editRS),
        rumah_rusak_ringan: Number(editRR),
        fasilitas_umum_rusak: Number(editFasum),
        fasilitas_kesehatan_rusak: Number(editFaskes),
        sekolah_rusak: Number(editSekolah),
        penduduk_terdampak: Number(editTerdampak),
        catatan: editCatatan || 'Pemutakhiran kaji cepat pasca-bencana Jitupasna BPBD.'
      };

      const res = await authFetch(`/api/bencana/${editingDampakBencana.id}/dampak`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Gagal memperbarui data dampak');

      setSuccessMsg(`Data dampak bencana ID #${editingDampakBencana.id} berhasil dimutakhirkan!`);
      setEditingDampakBencana(null);
      handleRefresh();
      if (onBencanaChanged) onBencanaChanged();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingDampak(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#141E28] p-3 rounded-xl border border-[#243444]">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Pusat Data Kejadian & Rekapitulasi Kerusakan</h3>
          <p className="text-[11px] text-slate-400">Data terverifikasi langsung teragregasi ke peta choropleth dan laporan SITREP BNPB.</p>
        </div>

        <button
          onClick={() => setIsAddingBencana(!isAddingBencana)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAddingBencana ? 'Tutup Form' : 'Lapor Kejadian Baru'}</span>
        </button>
      </div>

      {/* FORM BENCANA BARU */}
      {isAddingBencana && (
        <form onSubmit={handleSimpanBencana} className="p-4 rounded-xl bg-[#141E28] border-2 border-rose-500/40 space-y-3 animate-in fade-in duration-200">
          <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Formulir Pelaporan Kejadian Bencana Lapangan
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Jenis Bencana *</label>
              <select
                value={jenisBencana}
                onChange={(e) => setJenisBencana(e.target.value)}
                className="w-full bg-[#0F1720] border border-[#2D3F52] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="longsor">Tanah Longsor</option>
                <option value="banjir">Banjir Luapan / Genangan</option>
                <option value="galodo">Banjir Lahar Hujan (Galodo)</option>
                <option value="gempa">Gempa Bumi Sesar/Darat</option>
                <option value="tsunami">Tsunami</option>
                <option value="erupsi">Erupsi Gunung Api</option>
                <option value="angin_puting_beliung">Angin Puting Beliung</option>
                <option value="kebakaran">Kebakaran Hutan / Pemukiman</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Wilayah Terdampak (19 Kab/Kota Sumbar)</label>
              <select
                value={wilayahIdBencana}
                onChange={(e) => setWilayahIdBencana(Number(e.target.value))}
                className="w-full bg-[#0F1720] border border-[#2D3F52] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                {WILAYAH_SUMBAR_LIST.map((w) => (
                  <option key={w.id} value={w.id}>{w.nama}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Status Rilis Data</label>
              <select
                value={statusVerifBencana}
                onChange={(e) => setStatusVerifBencana(e.target.value)}
                disabled={currentUser.role === 'operator'}
                className="w-full bg-[#0F1720] border border-[#2D3F52] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none disabled:opacity-60"
              >
                <option value="menunggu">Menunggu Verifikasi Supervisor</option>
                <option value="terverifikasi">Langsung Rilis ke Peta Publik</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={bencanaLat}
                onChange={(e) => setBencanaLat(e.target.value)}
                className="w-full bg-[#0F1720] border border-[#2D3F52] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={bencanaLon}
                onChange={(e) => setBencanaLon(e.target.value)}
                className="w-full bg-[#0F1720] border border-[#2D3F52] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  if (onRequestPickLocation) onRequestPickLocation('bencana');
                }}
                className="w-full py-1.5 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Tentukan di Peta</span>
              </button>
            </div>
          </div>

          {/* Rincian Dampak & Korban Lengkap (Standar Jitupasna BNPB) */}
          <div className="p-3.5 rounded-xl bg-[#0F1720] border border-[#2D3F52] space-y-3">
            <span className="text-[11px] font-mono uppercase text-amber-300 font-bold block flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>Disagregasi Korban Jiwa & Kerusakan Infrastruktur (Jitupasna BNPB)</span>
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block">Korban Meninggal</label>
                <input
                  type="number"
                  min={0}
                  value={korbanMeninggal}
                  onChange={(e) => setKorbanMeninggal(Number(e.target.value))}
                  className="w-full bg-[#141E28] border border-[#2D3F52] rounded px-2 py-1 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block">Korban Hilang</label>
                <input
                  type="number"
                  min={0}
                  value={korbanHilang}
                  onChange={(e) => setKorbanHilang(Number(e.target.value))}
                  className="w-full bg-[#141E28] border border-[#2D3F52] rounded px-2 py-1 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block">Korban Luka-luka</label>
                <input
                  type="number"
                  min={0}
                  value={korbanLuka}
                  onChange={(e) => setKorbanLuka(Number(e.target.value))}
                  className="w-full bg-[#141E28] border border-[#2D3F52] rounded px-2 py-1 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block">Jumlah Pengungsi</label>
                <input
                  type="number"
                  min={0}
                  value={jumlahPengungsi}
                  onChange={(e) => setJumlahPengungsi(Number(e.target.value))}
                  className="w-full bg-[#141E28] border border-[#2D3F52] rounded px-2 py-1 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-[#1C2836]">
              <div>
                <label className="text-[10px] text-rose-300 block">Rumah Rusak Berat (RB)</label>
                <input
                  type="number"
                  min={0}
                  value={rumahRusakBerat}
                  onChange={(e) => setRumahRusakBerat(Number(e.target.value))}
                  className="w-full bg-[#141E28] border border-rose-500/30 rounded px-2 py-1 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-amber-300 block">Rumah Rusak Sedang (RS)</label>
                <input
                  type="number"
                  min={0}
                  value={rumahRusakSedang}
                  onChange={(e) => setRumahRusakSedang(Number(e.target.value))}
                  className="w-full bg-[#141E28] border border-amber-500/30 rounded px-2 py-1 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-yellow-300 block">Rumah Rusak Ringan (RR)</label>
                <input
                  type="number"
                  min={0}
                  value={rumahRusakRingan}
                  onChange={(e) => setRumahRusakRingan(Number(e.target.value))}
                  className="w-full bg-[#141E28] border border-yellow-500/30 rounded px-2 py-1 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-[#1C2836]">
              <div>
                <label className="text-[10px] text-slate-400 block">Fasum Rusak (Jalan/Jembatan)</label>
                <input
                  type="number"
                  min={0}
                  value={fasumRusak}
                  onChange={(e) => setFasumRusak(Number(e.target.value))}
                  className="w-full bg-[#141E28] border border-[#2D3F52] rounded px-2 py-1 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block">Fasilitas Kesehatan</label>
                <input
                  type="number"
                  min={0}
                  value={faskesRusak}
                  onChange={(e) => setFaskesRusak(Number(e.target.value))}
                  className="w-full bg-[#141E28] border border-[#2D3F52] rounded px-2 py-1 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block">Sekolah Rusak</label>
                <input
                  type="number"
                  min={0}
                  value={sekolahRusak}
                  onChange={(e) => setSekolahRusak(Number(e.target.value))}
                  className="w-full bg-[#141E28] border border-[#2D3F52] rounded px-2 py-1 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block">Penduduk Terdampak (Jiwa)</label>
                <input
                  type="number"
                  min={0}
                  value={pendudukTerdampak}
                  onChange={(e) => setPendudukTerdampak(Number(e.target.value))}
                  className="w-full bg-[#141E28] border border-[#2D3F52] rounded px-2 py-1 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-emerald-400 block mb-0.5">Estimasi Kerugian Finansial (Rp)</label>
              <input
                type="number"
                min={0}
                step={1000000}
                value={kerugianRupiah}
                onChange={(e) => setKerugianRupiah(Number(e.target.value))}
                placeholder="100000000"
                className="w-full bg-[#141E28] border border-emerald-500/30 rounded px-2.5 py-1 text-white font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#243444]">
            <button
              type="button"
              onClick={() => setIsAddingBencana(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submittingBencana}
              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5"
            >
              {submittingBencana && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Simpan Laporan Kejadian</span>
            </button>
          </div>
        </form>
      )}

      {/* DAFTAR KEJADIAN BENCANA TABEL */}
      <div className="bg-[#141E28] rounded-xl border border-[#243444] overflow-hidden">
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0F1720] text-slate-400 text-[11px] uppercase tracking-wider font-mono sticky top-0 border-b border-[#243444]">
              <tr>
                <th className="py-2.5 px-3">Jenis & Wilayah</th>
                <th className="py-2.5 px-3">Waktu Kejadian</th>
                <th className="py-2.5 px-3">Rekapitulasi Korban & Kerusakan</th>
                <th className="py-2.5 px-3">Status Rilis</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243444]">
              {bencanaList.map((b) => {
                const isVerified = b.status_verifikasi === 'terverifikasi';
                const d = b.dampak || {};
                return (
                  <tr key={b.id} className="hover:bg-[#1B2733]/50 transition-colors">
                    <td className="py-2 px-3">
                      <div className="font-bold text-white uppercase text-[11px]">{b.jenis_bencana}</div>
                      <div className="text-[10px] text-slate-400">{b.wilayah?.nama || 'Sumatera Barat'}</div>
                    </td>
                    <td className="py-2 px-3 text-[11px] font-mono text-slate-300">
                      {b.tanggal_kejadian ? new Date(b.tanggal_kejadian).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2 font-mono text-[10px]">
                        <span className="text-rose-400 font-bold" title="Meninggal">{d.korban_meninggal || 0} MD</span>
                        <span className="text-amber-400" title="Luka-luka">{d.korban_luka || 0} LR</span>
                        <span className="text-cyan-400" title="Pengungsi">{d.jumlah_pengungsi || 0} Jiwa</span>
                        {d.kerugian_rp > 0 && (
                          <span className="text-emerald-400 font-bold" title="Kerugian">
                            Rp {(d.kerugian_rp / 1_000_000).toFixed(0)} Jt
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isVerified
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {b.status_verifikasi}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => handleOpenEditDampak(b)}
                        className="px-2.5 py-1 rounded bg-[#0F1720] hover:bg-[#243444] border border-[#2D3F52] text-[10px] text-amber-300 font-semibold flex items-center gap-1 ml-auto"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Dampak</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EDIT / PEMUTAKHIRAN DAMPAK BENCANA JITUPASNA */}
      {editingDampakBencana && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleSimpanUpdateDampak} className="w-full max-w-xl bg-[#0F1722] border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 text-xs text-slate-100 shadow-2xl space-y-3.5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#243444] pb-2.5">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="font-bold text-white text-sm">Pemutakhiran Kaji Cepat Kerusakan (Jitupasna BNPB)</h4>
                  <span className="text-[10px] text-amber-300/80 font-mono">Bencana: {editingDampakBencana.jenis_bencana?.toUpperCase()} • ID #{editingDampakBencana.id}</span>
                </div>
              </div>
              <button type="button" onClick={() => setEditingDampakBencana(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Grid Form Edit Dampak */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-rose-300 block mb-0.5">Korban Meninggal</label>
                <input type="number" min={0} value={editMeninggal} onChange={(e) => setEditMeninggal(Number(e.target.value))} className="w-full bg-[#141E28] border border-[#2D3F52] rounded px-2.5 py-1.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Korban Hilang</label>
                <input type="number" min={0} value={editHilang} onChange={(e) => setEditHilang(Number(e.target.value))} className="w-full bg-[#141E28] border border-[#2D3F52] rounded px-2.5 py-1.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-[10px] text-amber-300 block mb-0.5">Korban Luka</label>
                <input type="number" min={0} value={editLuka} onChange={(e) => setEditLuka(Number(e.target.value))} className="w-full bg-[#141E28] border border-[#2D3F52] rounded px-2.5 py-1.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-[10px] text-cyan-300 block mb-0.5">Jumlah Pengungsi</label>
                <input type="number" min={0} value={editPengungsi} onChange={(e) => setEditPengungsi(Number(e.target.value))} className="w-full bg-[#141E28] border border-[#2D3F52] rounded px-2.5 py-1.5 text-white font-mono" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-800">
              <div>
                <label className="text-[10px] text-rose-300 block mb-0.5">Rumah Rusak Berat</label>
                <input type="number" min={0} value={editRB} onChange={(e) => setEditRB(Number(e.target.value))} className="w-full bg-[#141E28] border border-rose-500/40 rounded px-2.5 py-1.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-[10px] text-amber-300 block mb-0.5">Rumah Rusak Sedang</label>
                <input type="number" min={0} value={editRS} onChange={(e) => setEditRS(Number(e.target.value))} className="w-full bg-[#141E28] border border-amber-500/40 rounded px-2.5 py-1.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-[10px] text-yellow-300 block mb-0.5">Rumah Rusak Ringan</label>
                <input type="number" min={0} value={editRR} onChange={(e) => setEditRR(Number(e.target.value))} className="w-full bg-[#141E28] border border-yellow-500/40 rounded px-2.5 py-1.5 text-white font-mono" />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-emerald-400 block mb-0.5 font-bold">Estimasi Kerugian Finansial (Rp)</label>
              <input type="number" min={0} step={1000000} value={editKerugian} onChange={(e) => setEditKerugian(Number(e.target.value))} className="w-full bg-[#141E28] border border-emerald-500/40 rounded px-3 py-1.5 text-white font-mono text-xs" />
            </div>

            <div>
              <label className="text-[10px] text-slate-300 block mb-0.5">Catatan Pemutakhiran Lapangan</label>
              <input type="text" value={editCatatan} onChange={(e) => setEditCatatan(e.target.value)} placeholder="Kaji cepat TRC BPBD pasca-tanggap darurat..." className="w-full bg-[#141E28] border border-[#2D3F52] rounded px-3 py-1.5 text-white text-xs" />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#243444]">
              <button type="button" onClick={() => setEditingDampakBencana(null)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white">Batal</button>
              <button type="submit" disabled={submittingDampak} className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow">
                {submittingDampak && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Simpan Pemutakhiran Jitupasna</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
