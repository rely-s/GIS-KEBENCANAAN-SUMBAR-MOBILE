import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Layers, 
  BookOpen, 
  MapPin, 
  X, 
  ChevronDown, 
  ChevronRight, 
  RotateCcw, 
  Waves, 
  Mountain, 
  AlertTriangle, 
  Flame, 
  Wind, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ShieldAlert, 
  Building2, 
  Milestone, 
  Activity,
  CloudLightning,
  SlidersHorizontal
} from 'lucide-react';
import type { LayerVisibilityState } from '../map/types';
import { type KotaKabupatenItem, DAFTAR_KOTA_KABUPATEN_SUMBAR } from '../filter/constants';

export type UnifiedDrawerTab = 'wilayah' | 'lapisan' | 'legenda';

interface UnifiedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: UnifiedDrawerTab;
  
  // Wilayah & Filter Props
  selectedJenis: string;
  selectedTahun: string;
  searchQuery: string;
  kecamatanList: { id: number; nama: string; parent_nama?: string; lat?: number; lon?: number }[];
  activeKotaNama?: string | null;
  activeKecamatanNama?: string | null;
  onJenisChange: (jenis: string) => void;
  onTahunChange: (tahun: string) => void;
  onSearchChange: (query: string) => void;
  onSelectKota: (kota: KotaKabupatenItem) => void;
  onSelectKecamatan: (id: number, nama: string, properties?: any) => void;
  onResetFilter: () => void;

  // Lapisan Props
  layerVisibility: LayerVisibilityState;
  onToggleLayer: (key: keyof LayerVisibilityState) => void;
  onToggleAllLayers?: (enableAll: boolean) => void;
  layerOpacities?: Record<string, number>;
  onOpacityChange?: (layerKey: string, opacity: number) => void;
  onFocusLayer?: (layerKey: string) => void;
  facilityCounts?: {
    posko: number;
    tes: number;
    faskes: number;
    total: number;
  };
}

export const UnifiedDrawer: React.FC<UnifiedDrawerProps> = ({
  isOpen,
  onClose,
  initialTab = 'wilayah',
  selectedJenis,
  selectedTahun,
  searchQuery,
  kecamatanList,
  activeKotaNama,
  activeKecamatanNama,
  onJenisChange,
  onTahunChange,
  onSearchChange,
  onSelectKota,
  onSelectKecamatan,
  onResetFilter,
  layerVisibility,
  onToggleLayer,
  onToggleAllLayers,
  layerOpacities: _layerOpacities = {},
  onOpacityChange: _onOpacityChange,
  onFocusLayer,
  facilityCounts = { posko: 18, tes: 7, faskes: 1, total: 26 },
}) => {
  const [activeTab, setActiveTab] = useState<UnifiedDrawerTab>(initialTab);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Sync initial tab when changed externally
  React.useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Filter Kota & Kecamatan Matched
  const matchedKota = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return DAFTAR_KOTA_KABUPATEN_SUMBAR.filter((k) => 
      k.nama.toLowerCase().includes(q) || k.kode.includes(q)
    );
  }, [searchQuery]);

  const matchedKecamatan = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return kecamatanList.filter((kc) =>
      kc.nama.toLowerCase().includes(q) || (kc.parent_nama && kc.parent_nama.toLowerCase().includes(q))
    );
  }, [searchQuery, kecamatanList]);

  const jenisBencanaOptions = [
    { value: 'semua', label: 'Semua Bencana', icon: Layers },
    { value: 'banjir', label: 'Banjir Bandang & Galodo', icon: Waves },
    { value: 'longsor', label: 'Tanah Longsor', icon: Mountain },
    { value: 'gempa', label: 'Gempa Tektonik', icon: AlertTriangle },
    { value: 'erupsi', label: 'Erupsi & Lahar Marapi', icon: Flame },
    { value: 'angin_puting_beliung', label: 'Puting Beliung', icon: Wind },
  ];

  const tahunOptions = [
    { value: 'semua', label: 'Semua Periode' },
    { value: '2026', label: 'Tahun 2026' },
    { value: '2025', label: 'Tahun 2025' },
    { value: '2024', label: 'Tahun 2024' },
    { value: '2023', label: 'Tahun 2023' },
  ];

  if (!isOpen) return null;

  return (
    <aside 
      className="absolute top-16 left-4 z-30 w-80 sm:w-96 max-h-[calc(100vh-8.5rem)] flex flex-col bg-[#0B131D]/95 backdrop-blur-2xl border border-[#233547] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden text-slate-100 font-sans transition-all duration-300 animate-in fade-in slide-in-from-left-4"
      aria-label="Panel Terpadu Komando Spasial"
    >
      {/* 1. HEADER & TAB NAVIGATION */}
      <header className="p-3 border-b border-[#1E2E40] bg-[#101A26]">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#192736]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider font-display">
              Pusat Kendali Spasial Sumbar
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup Panel (Esc)"
            aria-label="Tutup Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TAB BUTTONS (3 TAB COMPACT) */}
        <div className="grid grid-cols-3 gap-1 bg-[#070D14] p-1 rounded-xl border border-[#1E2E40]">
          <button
            type="button"
            onClick={() => setActiveTab('wilayah')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'wilayah'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="truncate">Wilayah</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lapisan')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'lapisan'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="truncate">Lapisan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('legenda')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'legenda'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="truncate">Legenda</span>
          </button>
        </div>
      </header>

      {/* 2. BODY CONTENT (SCROLLABLE) */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-thin scrollbar-thumb-[#1E2E40] scrollbar-track-transparent">
        
        {/* ========================================================================= */}
        {/* TAB 1: WILAYAH & PENCARIAN (CASCADING FILTER)                             */}
        {/* ========================================================================= */}
        {activeTab === 'wilayah' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            {/* INPUT PENCARIAN KILAT */}
            <div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Cari Kab/Kota, Kecamatan, atau Nagari..."
                  className="w-full bg-[#111A24] border border-[#233547] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* HASIL PENCARIAN (JIKA QUERY DIISI) */}
            {searchQuery.trim() ? (
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block px-1">
                  Hasil Pencarian ({matchedKota.length + matchedKecamatan.length})
                </span>

                {matchedKota.length === 0 && matchedKecamatan.length === 0 ? (
                  /* 6 UI States: Empty State */
                  <div className="p-4 rounded-xl bg-[#101A26] border border-[#1E2E40] text-center space-y-2">
                    <MapPin className="w-6 h-6 text-slate-500 mx-auto" />
                    <p className="text-xs text-slate-300">
                      Tidak ditemukan wilayah untuk kata kunci &ldquo;{searchQuery}&rdquo;.
                    </p>
                    <button
                      type="button"
                      onClick={() => onSearchChange('')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-500/20 text-sky-300 text-xs font-semibold hover:bg-sky-500/30 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Bersihkan Pencarian</span>
                    </button>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                    {/* Hasil Kab/Kota */}
                    {matchedKota.map((k) => (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => {
                          onSelectKota(k);
                          onSearchChange('');
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl bg-[#121B27] hover:bg-[#1A2636] border border-[#1E2E40] text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                            {k.nama}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300">
                          {k.nama.startsWith('Kota') ? 'Kota' : 'Kab'}
                        </span>
                      </button>
                    ))}

                    {/* Hasil Kecamatan */}
                    {matchedKecamatan.slice(0, 20).map((kc) => (
                      <button
                        key={kc.id}
                        type="button"
                        onClick={() => {
                          onSelectKecamatan(kc.id, kc.nama, kc);
                          onSearchChange('');
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl bg-[#121B27] hover:bg-[#1A2636] border border-[#1E2E40] text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                              Kec. {kc.nama}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              {kc.parent_nama || 'Prov. Sumatera Barat'}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* FILTER TEMATIK & KAB/KOTA DEFAULT */
              <div className="space-y-3">
                {/* STATUS PILIHAN AKTIF */}
                {(activeKotaNama || activeKecamatanNama) && (
                  <div className="p-2.5 rounded-xl bg-[#101A26] border border-sky-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="min-w-0 text-xs">
                        <span className="text-slate-400">Fokus: </span>
                        <b className="text-white">
                          {activeKecamatanNama ? `Kec. ${activeKecamatanNama}` : activeKotaNama}
                        </b>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onResetFilter}
                      className="text-[10px] font-mono text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
                      title="Reset Wilayah"
                    >
                      Batal
                    </button>
                  </div>
                )}

                {/* DROPDOWN KOTA / KABUPATEN (19 KAB/KOTA SUMBAR) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                    <span>Pilih Kabupaten / Kota</span>
                    <span className="text-[10px] font-mono text-slate-400">19 Daerah</span>
                  </label>
                  <select
                    value={activeKotaNama || ''}
                    onChange={(e) => {
                      const found = DAFTAR_KOTA_KABUPATEN_SUMBAR.find((k) => k.nama === e.target.value);
                      if (found) onSelectKota(found);
                      else onResetFilter();
                    }}
                    className="w-full bg-[#111A24] border border-[#233547] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="">Semua Wilayah Sumatera Barat</option>
                    {DAFTAR_KOTA_KABUPATEN_SUMBAR.map((k) => (
                      <option key={k.id} value={k.nama}>
                        {k.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SAKELAR FILTER LANJUTAN (JENIS BENCANA & TAHUN) */}
                <div className="pt-2 border-t border-[#1E2E40]">
                  <button
                    type="button"
                    onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white py-1 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                      Filter Bahaya & Periode
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFilterExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {isFilterExpanded && (
                    <div className="space-y-3 pt-2.5 animate-in fade-in duration-100">
                      {/* Jenis Bencana */}
                      <div>
                        <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">
                          Jenis Bahaya Bencana
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {jenisBencanaOptions.map((opt) => {
                            const isSel = selectedJenis === opt.value;
                            const Icon = opt.icon;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => onJenisChange(opt.value)}
                                className={`flex items-center gap-1.5 p-2 rounded-xl border text-left text-xs transition-all ${
                                  isSel
                                    ? 'bg-sky-500/20 border-sky-400/50 text-white font-bold'
                                    : 'bg-[#101A26] border-[#1E2E40] text-slate-300 hover:text-white hover:bg-[#152332]'
                                }`}
                              >
                                <Icon className={`w-3.5 h-3.5 shrink-0 ${isSel ? 'text-sky-400' : 'text-slate-400'}`} />
                                <span className="truncate text-[11px]">{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Periode Tahun */}
                      <div>
                        <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                          Periode Tahun
                        </label>
                        <select
                          value={selectedTahun}
                          onChange={(e) => onTahunChange(e.target.value)}
                          className="w-full bg-[#111A24] border border-[#233547] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                        >
                          {tahunOptions.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={onResetFilter}
                        className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Kembalikan Default</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LAPISAN TEMATIK & INARISK                                          */}
        {/* ========================================================================= */}
        {activeTab === 'lapisan' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* MASTER CONTROLS */}
            {onToggleAllLayers && (
              <div className="flex items-center justify-between pb-2 border-b border-[#1E2E40]">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                  Kendali Visibilitas Semua
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onToggleAllLayers(true)}
                    className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors"
                  >
                    Aktif Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleAllLayers(false)}
                    className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-colors"
                  >
                    Sembunyikan
                  </button>
                </div>
              </div>
            )}

            {/* KONTROL UTAMA: AKTIFKAN / SEMBUNYIKAN SEMUA */}
            {onToggleAllLayers && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#111A24] border border-[#1E2E40]">
                <span className="text-xs font-semibold text-slate-300">Semua Lapisan:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onToggleAllLayers(true)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/50 transition-colors"
                  >
                    Tampilkan Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleAllLayers(false)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:text-white transition-colors"
                  >
                    Sembunyikan
                  </button>
                </div>
              </div>
            )}

            {/* KATEGORI 1: KEJADIAN & PERINGATAN TERKINI */}
            <div className="space-y-2">
              <div className="px-1 text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                1. Kejadian &amp; Peringatan Terkini
              </div>

              {/* Gempa BMKG */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#101A26] border border-[#1E2E40] hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">Episentrum Gempa BMKG</div>
                    <div className="text-[11px] text-slate-400 truncate">Pusat gempa real-time sensor BMKG TEWS</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {onFocusLayer && (
                    <button
                      type="button"
                      onClick={() => onFocusLayer('gempa')}
                      className="px-2 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-semibold hover:bg-sky-500/30"
                      title="Arahkan peta ke gempa terkini"
                    >
                      Fokus
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onToggleLayer('gempa')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      layerVisibility.gempa
                        ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                        : 'bg-[#141E28] text-slate-400 border-[#243444] hover:text-white'
                    }`}
                  >
                    {layerVisibility.gempa ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{layerVisibility.gempa ? 'Aktif' : 'Mati'}</span>
                  </button>
                </div>
              </div>

              {/* Peringatan Cuaca BMKG */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#101A26] border border-[#1E2E40] hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                    <CloudLightning className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">Peringatan Cuaca BMKG</div>
                    <div className="text-[11px] text-slate-400 truncate">Prakiraan &amp; pantauan cuaca resmi</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleLayer('cuaca')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                    layerVisibility.cuaca
                      ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                      : 'bg-[#141E28] text-slate-400 border-[#243444] hover:text-white'
                  }`}
                >
                  {layerVisibility.cuaca ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{layerVisibility.cuaca ? 'Aktif' : 'Mati'}</span>
                </button>
              </div>

              {/* Ruas Jalan Terputus */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#101A26] border border-[#1E2E40] hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                    <Milestone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">Ruas Jalan Terputus</div>
                    <div className="text-[11px] text-slate-400 truncate">Titik blokade longsor &amp; banjir aktif</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleLayer('jalanTerputus')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                    layerVisibility.jalanTerputus
                      ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                      : 'bg-[#141E28] text-slate-400 border-[#243444] hover:text-white'
                  }`}
                >
                  {layerVisibility.jalanTerputus ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{layerVisibility.jalanTerputus ? 'Aktif' : 'Mati'}</span>
                </button>
              </div>
            </div>

            {/* KATEGORI 2: FASILITAS & PENYELAMATAN */}
            <div className="space-y-2 pt-2 border-t border-[#1C2836]">
              <div className="px-1 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                2. Fasilitas &amp; Penyelamatan
              </div>

              {/* Posko Pengungsi */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#101A26] border border-[#1E2E40] hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">Posko Pengungsi ({facilityCounts.posko})</div>
                    <div className="text-[11px] text-slate-400 truncate">Kantor camat, fasum &amp; posko terdata</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleLayer('poskoEvakuasi')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                    layerVisibility.poskoEvakuasi
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-[#141E28] text-slate-400 border-[#243444] hover:text-white'
                  }`}
                >
                  {layerVisibility.poskoEvakuasi ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{layerVisibility.poskoEvakuasi ? 'Aktif' : 'Mati'}</span>
                </button>
              </div>

              {/* Shelter Evakuasi Vertikal (TES) */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#101A26] border border-[#1E2E40] hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">Shelter Vertikal TES ({facilityCounts.tes})</div>
                    <div className="text-[11px] text-slate-400 truncate">Gedung evakuasi tsunami tepi pantai</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleLayer('shelterTes')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                    layerVisibility.shelterTes
                      ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                      : 'bg-[#141E28] text-slate-400 border-[#243444] hover:text-white'
                  }`}
                >
                  {layerVisibility.shelterTes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{layerVisibility.shelterTes ? 'Aktif' : 'Mati'}</span>
                </button>
              </div>
            </div>

            {/* KATEGORI 3: PETA ZONASI BAHAYA & STRUKTUR GEOLOGI */}
            <div className="space-y-2 pt-2 border-t border-[#1C2836]">
              <div className="px-1 text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                3. Peta Zonasi Bahaya &amp; Risiko
              </div>

              {/* Peta Risiko Wilayah (Choropleth) */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#101A26] border border-[#1E2E40] hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">Tingkat Risiko Wilayah</div>
                    <div className="text-[11px] text-slate-400 truncate">Peta tematik risiko 19 Kabupaten/Kota</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleLayer('choropleth')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                    layerVisibility.choropleth
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-[#141E28] text-slate-400 border-[#243444] hover:text-white'
                  }`}
                >
                  {layerVisibility.choropleth ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{layerVisibility.choropleth ? 'Aktif' : 'Mati'}</span>
                </button>
              </div>

              {/* Patahan Sesar Semangko */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#101A26] border border-[#1E2E40] hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                    <Mountain className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">Patahan Sesar Semangko</div>
                    <div className="text-[11px] text-slate-400 truncate">Segmen patahan darat Sianok, Sumani, Suliti</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleLayer('sesarSemangko')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                    layerVisibility.sesarSemangko
                      ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                      : 'bg-[#141E28] text-slate-400 border-[#243444] hover:text-white'
                  }`}
                >
                  {layerVisibility.sesarSemangko ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{layerVisibility.sesarSemangko ? 'Aktif' : 'Mati'}</span>
                </button>
              </div>

              {/* Sempadan Zona Sesar */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#101A26] border border-[#1E2E40] hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
                    <Milestone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">Sempadan Jalur Sesar</div>
                    <div className="text-[11px] text-slate-400 truncate">Zona penyangga aman patahan darat</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleLayer('sesarBuffer')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                    layerVisibility.sesarBuffer
                      ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                      : 'bg-[#141E28] text-slate-400 border-[#243444] hover:text-white'
                  }`}
                >
                  {layerVisibility.sesarBuffer ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{layerVisibility.sesarBuffer ? 'Aktif' : 'Mati'}</span>
                </button>
              </div>

              {/* Megathrust Mentawai */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#101A26] border border-[#1E2E40] hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">Megathrust Mentawai</div>
                    <div className="text-[11px] text-slate-400 truncate">Zona subduksi laut &amp; palung Sunda</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleLayer('megathrust')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                    layerVisibility.megathrust
                      ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                      : 'bg-[#141E28] text-slate-400 border-[#243444] hover:text-white'
                  }`}
                >
                  {layerVisibility.megathrust ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{layerVisibility.megathrust ? 'Aktif' : 'Mati'}</span>
                </button>
              </div>

              {/* Zona Rendaman Tsunami & Jalur Evakuasi Bypass */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#101A26] border border-[#1E2E40] hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 shrink-0">
                    <Waves className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">Zona Bahaya Tsunami</div>
                    <div className="text-[11px] text-slate-400 truncate">Batas rendaman &amp; garis aman Bypass</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleLayer('zonaTsunami')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                    layerVisibility.zonaTsunami
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                      : 'bg-[#141E28] text-slate-400 border-[#243444] hover:text-white'
                  }`}
                >
                  {layerVisibility.zonaTsunami ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{layerVisibility.zonaTsunami ? 'Aktif' : 'Mati'}</span>
                </button>
              </div>

              {/* Skenario Run-Up Tsunami */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#101A26] border border-[#1E2E40] hover:border-slate-600 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                    <Waves className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">Skenario Run-Up Tsunami</div>
                    <div className="text-[11px] text-slate-400 truncate">Pemodelan genangan KRB III, II, I</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleLayer('tsunamiRunup')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                    layerVisibility.tsunamiRunup
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-[#141E28] text-slate-400 border-[#243444] hover:text-white'
                  }`}
                >
                  {layerVisibility.tsunamiRunup ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{layerVisibility.tsunamiRunup ? 'Aktif' : 'Mati'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: LEGENDA OPERASIONAL & RISIKO                                       */}
        {/* ========================================================================= */}
        {activeTab === 'legenda' && (
          <div className="space-y-4 animate-in fade-in duration-150 text-xs">
            {/* KLASIFIKASI KERUGIAN CHOROPLETH */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block px-1">
                Klasifikasi Risiko Kerugian Wilayah
              </span>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#101A26] border border-[#1E2E40]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded bg-[#C0392B] shrink-0" />
                    <span className="text-slate-200 font-medium">Tinggi</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">&gt; Rp 1,5 Miliar / Korban Jiwa</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#101A26] border border-[#1E2E40]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded bg-[#D98E04] shrink-0" />
                    <span className="text-slate-200 font-medium">Sedang</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Rp 400 Juta – 1,5 Miliar</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#101A26] border border-[#1E2E40]">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded bg-[#1E7A46] shrink-0" />
                    <span className="text-slate-200 font-medium">Rendah / Terkendali</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">&lt; Rp 400 Juta</span>
                </div>
              </div>
            </div>

            {/* SIMBOLISASI OPERASIONAL PUSDALOPS */}
            <div className="space-y-2 pt-2 border-t border-[#1E2E40]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block px-1">
                Simbol Taktis Peta Kebencanaan
              </span>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#101A26] border border-[#1E2E40]">
                  <span className="w-3.5 h-3.5 rounded bg-[#EA580C] border border-white/80 shrink-0" />
                  <span className="text-slate-300">Posko Pengungsi Utama (Kantor Camat)</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#101A26] border border-[#1E2E40]">
                  <span className="w-3.5 h-3.5 rounded bg-[#0284C7] border border-white/80 shrink-0" />
                  <span className="text-slate-300">Shelter Evakuasi Vertikal (TES Pantai)</span>
                </div>

                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#101A26] border border-[#1E2E40]">
                  <span className="w-4 h-0.5 border-b-2 border-dashed border-rose-500 shrink-0" />
                  <span className="text-slate-300">Jalan Terputus Total (Blokade Aktif)</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#101A26] border border-[#1E2E40]">
                  <span className="w-4 h-1 rounded bg-amber-500 shrink-0" />
                  <span className="text-slate-300">Patahan Sesar Darat Semangko</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#101A26] border border-[#1E2E40]">
                  <span className="w-3 h-3 rounded-full bg-rose-600 border border-white shrink-0" />
                  <span className="text-slate-300">Episentrum Gempa BMKG Real-time</span>
                </div>
              </div>
            </div>

            {/* PEDOMAN EVAKUASI ILMIAH */}
            <div className="p-3 rounded-xl bg-[#101A26] border border-rose-500/30 space-y-1.5">
              <div className="font-bold text-rose-300 flex items-center gap-1.5 font-display text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Prinsip Keselamatan Mandiri</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
                Apabila gempa bumi berayun lebih dari 1 menit (potensi megathrust), warga Mentawai segera evakuasi ke perbukitan (&gt;15 mdpl). Warga pesisir Padang menuju gedung TES atau melintasi garis Bypass ke arah Timur.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
