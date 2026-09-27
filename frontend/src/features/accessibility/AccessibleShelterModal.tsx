import React, { useState, useEffect, useMemo } from 'react';
import { Building2, X, Search, Phone, MapPin, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

interface PoskoFeature {
  id: number;
  properties: {
    id: number;
    nama: string;
    jenis: string;
    status: string;
    kapasitas: number;
    fasilitas?: string[];
    kontak_pic?: string;
    kontak_telepon?: string;
    wilayah_nama?: string;
  };
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
}

interface AccessibleShelterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPosko?: (posko: { lat: number; lon: number; nama: string }) => void;
}

export const AccessibleShelterModal: React.FC<AccessibleShelterModalProps> = ({
  isOpen,
  onClose,
  onSelectPosko
}) => {
  const [poskoList, setPoskoList] = useState<PoskoFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('semua');
  const [filterStatus, setFilterStatus] = useState('semua');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/posko')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.features) {
            setPoskoList(data.features);
          }
        })
        .catch((err) => console.error('Gagal mengambil daftar posko aksesibel:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const filteredPosko = useMemo(() => {
    return poskoList.filter((item) => {
      const p = item.properties;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.nama.toLowerCase().includes(q) ||
        (p.wilayah_nama && p.wilayah_nama.toLowerCase().includes(q)) ||
        (p.kontak_pic && p.kontak_pic.toLowerCase().includes(q));

      const matchJenis = filterJenis === 'semua' || p.jenis === filterJenis;
      const matchStatus = filterStatus === 'semua' || p.status === filterStatus;

      return matchSearch && matchJenis && matchStatus;
    });
  }, [poskoList, search, filterJenis, filterStatus]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessible-shelter-title"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] bg-[#0F1720] border border-[#243444] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ramah Screen Reader & Standar WCAG */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#243444] bg-[#162330]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md">
              <Building2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="accessible-shelter-title" className="text-base sm:text-lg font-bold text-white font-display">
                  Daftar Posko & Tempat Evakuasi Sementara (TES)
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  WCAG 2.1 AA ACCESSIBLE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Penyajian alternatif berbasis tabel semantik dengan dukungan navigasi keyboard & pembaca layar (*screen reader*).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#0F1720] border border-[#243444] text-slate-400 hover:text-white hover:bg-[#1B2733] transition-colors focus:ring-2 focus:ring-emerald-400"
            aria-label="Tutup Dialog Daftar Posko (Escape)"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Toolbar Filter & Pencarian */}
        <div className="p-4 border-b border-[#243444] bg-[#121D28] flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama posko, PIC, atau kabupaten/kota..."
              className="w-full bg-[#0F1720] border border-[#243444] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              aria-label="Kotak pencarian posko"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="text-xs bg-[#0F1720] border border-[#243444] text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
              aria-label="Filter berdasarkan jenis fasilitas evakuasi"
            >
              <option value="semua">Semua Fasilitas</option>
              <option value="posko_utama">Posko Utama</option>
              <option value="shelter_tes_tea">Shelter TES Vertikal</option>
              <option value="titik_kumpul">Titik Kumpul Lapangan</option>
              <option value="sirine_tsunami">Menara Sirine Tsunami</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs bg-[#0F1720] border border-[#243444] text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
              aria-label="Filter berdasarkan status posko"
            >
              <option value="semua">Semua Status</option>
              <option value="aktif">Aktif Siaga</option>
              <option value="penuh">Kapasitas Penuh</option>
              <option value="nonaktif">Non-Aktif</option>
            </select>
          </div>
        </div>

        {/* Tabel Data Semantik */}
        <div className="flex-1 overflow-auto p-4 scrollbar-thin scrollbar-thumb-[#243444] scrollbar-track-transparent">
          {loading ? (
            <div className="py-16 text-center text-slate-400 font-mono text-xs">
              Memuat basis data posko & fasilitas evakuasi PostGIS...
            </div>
          ) : filteredPosko.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-200">Tidak ada posko yang cocok dengan filter.</p>
              <p className="text-xs text-slate-400">Coba gunakan kata kunci pencarian yang lebih umum.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <caption className="sr-only">
                Daftar Posko Tanggap Darurat dan Shelter Evakuasi di Wilayah Sumatera Barat
              </caption>
              <thead>
                <tr className="border-b border-[#243444] text-slate-400 font-mono uppercase text-[11px] bg-[#162330]">
                  <th scope="col" className="p-3">#</th>
                  <th scope="col" className="p-3">Nama Posko / Fasilitas</th>
                  <th scope="col" className="p-3">Kategori</th>
                  <th scope="col" className="p-3">Status</th>
                  <th scope="col" className="p-3 text-right">Kapasitas</th>
                  <th scope="col" className="p-3">Kontak Lapangan</th>
                  <th scope="col" className="p-3 text-center">Navigasi Peta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1B2733]">
                {filteredPosko.map((item, idx) => {
                  const p = item.properties;
                  const [lon, lat] = item.geometry.coordinates;
                  const isAktif = p.status === 'aktif';
                  const isPenuh = p.status === 'penuh';

                  return (
                    <tr key={item.id || idx} className="hover:bg-[#162330]/70 transition-colors">
                      <td className="p-3 text-slate-500 font-mono font-bold">{idx + 1}</td>
                      <td className="p-3 font-semibold text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{p.nama}</span>
                        </div>
                        {p.wilayah_nama && (
                          <div className="text-[11px] text-slate-400 font-normal">{p.wilayah_nama}</div>
                        )}
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {p.jenis.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            isAktif
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : isPenuh
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {isAktif ? (
                            <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                          ) : (
                            <AlertCircle className="w-3 h-3" aria-hidden="true" />
                          )}
                          <span className="capitalize">{p.status}</span>
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-200">
                        {p.kapasitas ? `${p.kapasitas.toLocaleString()} Jiwa` : '-'}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-300">
                        {p.kontak_telepon ? (
                          <a 
                            href={`tel:${p.kontak_telepon}`}
                            className="inline-flex items-center gap-1 text-sky-400 hover:underline"
                            title={`Hubungi ${p.kontak_pic || 'PIC Posko'}`}
                          >
                            <Phone className="w-3 h-3" aria-hidden="true" />
                            <span>{p.kontak_telepon}</span>
                          </a>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                        {p.kontak_pic && (
                          <div className="text-[10px] text-slate-400 font-sans">{p.kontak_pic}</div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectPosko) {
                              onSelectPosko({ lat, lon, nama: p.nama });
                              onClose();
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600/20 text-sky-300 hover:bg-sky-600/40 border border-sky-500/40 font-semibold text-[11px] transition-all cursor-pointer focus:ring-2 focus:ring-sky-400"
                          title={`Fokuskan kamera peta ke ${p.nama}`}
                          aria-label={`Arahkan peta ke posko ${p.nama}`}
                        >
                          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Fokus</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Ringkasan */}
        <div className="p-3.5 border-t border-[#243444] bg-[#121D28] flex items-center justify-between text-xs text-slate-400 font-mono">
          <div>
            Menampilkan <span className="font-bold text-white">{filteredPosko.length}</span> dari{' '}
            <span className="font-bold text-white">{poskoList.length}</span> total posko terdata di Sumatera Barat.
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Shield className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Terverifikasi Pusdalops BPBD</span>
          </div>
        </div>
      </div>
    </div>
  );
};
