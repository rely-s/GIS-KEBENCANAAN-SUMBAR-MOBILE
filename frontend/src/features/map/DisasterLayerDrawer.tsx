import React, { useState } from 'react';
import { 
  Layers, 
  X, 
  AlertTriangle, 
  Waves, 
  CloudLightning, 
  CheckCircle2,
  Building2, 
  Activity, 
  ShieldAlert, 
  Milestone, 
  Compass, 
  Eye, 
  EyeOff, 
  BookOpen, 
  Info,
  ShieldCheck
} from 'lucide-react';
import type { LayerVisibilityState } from './types';

export interface DisasterLayerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  visibility: LayerVisibilityState;
  onToggleLayer: (key: keyof LayerVisibilityState) => void;
  onToggleAll?: (enableAll: boolean) => void;
  opacities?: Record<string, number>;
  onOpacityChange?: (layerKey: string, opacity: number) => void;
  onFocusLayer?: (layerKey: string) => void;
  facilityCounts?: {
    posko: number;
    tes: number;
    faskes: number;
    total: number;
  };
}

interface OperationalLayerItem {
  key: keyof LayerVisibilityState;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  badge: string;
  badgeBg: string;
  hasOpacity?: boolean;
}

interface OperationalCluster {
  title: string;
  badge: string;
  badgeBg: string;
  items: OperationalLayerItem[];
}

export const DisasterLayerDrawer: React.FC<DisasterLayerDrawerProps> = ({
  isOpen,
  onClose,
  visibility,
  onToggleLayer,
  onToggleAll,
  opacities: _opacities = {},
  onOpacityChange: _onOpacityChange,
  onFocusLayer,
  facilityCounts = { posko: 18, tes: 7, faskes: 1, total: 26 },
}) => {
  const [activeTab, setActiveTab] = useState<'operasional' | 'inarisk'>('operasional');

  if (!isOpen) return null;

  const clusters: OperationalCluster[] = [
    {
      title: '1. Ancaman Real-Time (Live Alert)',
      badge: 'Prioritas 1',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      items: [
        {
          key: 'gempa',
          label: 'Episentrum Gempa BMKG',
          sublabel: 'Pusat gempa real-time sensor TEWS & shakemap',
          icon: <Activity className="w-4 h-4 text-rose-400" />,
          badge: 'Live BMKG',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        },
        {
          key: 'jalanTerputus',
          label: 'Ruas Jalan Terputus',
          sublabel: 'Titik blokade longsor & banjir aktif (Sitinjau, Anai)',
          icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
          badge: 'Blokade Aktif',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        },
        {
          key: 'cuaca',
          label: 'Stasiun Resmi BMKG Sumatera Barat',
          sublabel: '5 stasiun pengamatan meteorologi, geofisika, klimatologi, maritim & GAW',
          icon: <CloudLightning className="w-4 h-4 text-sky-400" />,
          badge: 'Faktual BMKG',
          badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          hasOpacity: true,
        },
      ],
    },
    {
      title: '2. Fasilitas & Aset Keselamatan',
      badge: 'Mitigasi',
      badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      items: [
        {
          key: 'poskoEvakuasi',
          label: 'Posko Pengungsi (Kantor Camat & Faskes)',
          sublabel: `${facilityCounts.posko} titik evakuasi & faskes rujukan darurat`,
          icon: <Building2 className="w-4 h-4 text-emerald-400" />,
          badge: `${facilityCounts.posko} Posko`,
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        },
        {
          key: 'shelterTes',
          label: 'Shelter TES Vertikal Tsunami',
          sublabel: `${facilityCounts.tes} gedung evakuasi vertikal bertingkat Padang`,
          icon: <Building2 className="w-4 h-4 text-sky-400" />,
          badge: `${facilityCounts.tes} Gedung`,
          badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        },

        {
          key: 'zonaTsunami',
          label: 'Zonasi Tsunami & Garis Bypass',
          sublabel: 'Zona rendaman merah & batas garis evakuasi Bypass',
          icon: <Waves className="w-4 h-4 text-sky-400" />,
          badge: 'Batas Bypass',
          badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          hasOpacity: true,
        },
        {
          key: 'tsunamiRunup',
          label: 'Skenario Run-Up Tsunami',
          sublabel: 'Pemodelan ketinggian rendaman KRB III (>3m) & KRB II',
          icon: <Waves className="w-4 h-4 text-blue-400" />,
          badge: 'KRB Pesisir',
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          hasOpacity: true,
        },
      ],
    },
    {
      title: '3. Struktur Geologi & Tektonik',
      badge: 'Hazard Statis',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      items: [
        {
          key: 'sesarSemangko',
          label: 'Patahan Sesar Semangko',
          sublabel: 'Sesar geser aktif darat (Segmen Sianok, Sumani, Suliti)',
          icon: <Activity className="w-4 h-4 text-amber-400" />,
          badge: 'Darat M7.2',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        },
        {
          key: 'sesarBuffer',
          label: 'Sempadan Aktif Sesar 100m',
          sublabel: 'Zona penyangga larangan bangunan vital di atas patahan',
          icon: <Milestone className="w-4 h-4 text-amber-300" />,
          badge: 'Setback 100m',
          badgeBg: 'bg-amber-600/20 text-amber-300 border-amber-600/40',
          hasOpacity: true,
        },
        {
          key: 'megathrust',
          label: 'Zona Megathrust Mentawai',
          sublabel: 'Palung subduksi lempeng laut & seismic gap M8.9',
          icon: <ShieldAlert className="w-4 h-4 text-rose-500" />,
          badge: 'Laut M8.9',
          badgeBg: 'bg-rose-600/30 text-rose-300 border-rose-500/40',
          hasOpacity: true,
        },
      ],
    },
    {
      title: '4. Konteks Wilayah & Dampak',
      badge: 'Statistik',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      items: [
        {
          key: 'choropleth',
          label: 'Zona Risiko Kabupaten / Kota',
          sublabel: 'Peta choropleth risiko agregat & kerugian 19 kab/kota',
          icon: <Layers className="w-4 h-4 text-emerald-400" />,
          badge: '19 Wilayah',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          hasOpacity: true,
        },
      ],
    },
  ];

  const inariskHazards = [
    { name: 'Gempabumi', active: true, desc: 'Patahan Sesar Semangko & Megathrust Mentawai' },
    { name: 'Tsunami', active: true, desc: 'Zonasi Inundasi Pantai Padang & Run-Up KRB' },
    { name: 'Tanah Longsor', active: true, desc: 'Ruas Bukit Barisan & Sitinjau Lauik' },
    { name: 'Banjir Bandang (Galodo)', active: true, desc: 'Alur Lembah Anai & Lereng Marapi' },
    { name: 'Cuaca Ekstrim', active: true, desc: 'Nowcast BMKG Stasiun Minangkabau' },
    { name: 'Letusan Gunung Api', active: true, desc: 'KRB Marapi, Singgalang, Tandikat & Talang' },
    { name: 'Banjir Genangan', active: true, desc: 'Bantaran Batang Arau & Pesisir Barat' },
    { name: 'Gelombang Ekstrim & Abrasi', active: true, desc: 'Pesisir Pantai Padang & Mentawai' },
    { name: 'Kebakaran Hutan & Lahan', active: false, desc: 'Data Hotspot SiPongi KLHK (Statistik Kabupaten)' },
    { name: 'Kekeringan', active: false, desc: 'Indeks Curah Hujan Bulanan (Statistik Wilayah)' },
    { name: 'Likuefaksi', active: false, desc: 'Kajian Geologi Endapan Pasir Halus Padang' },
    { name: 'Multi Bahaya', active: true, desc: 'Agregasi Indeks Kerentanan Multibahaya 19 Kab/Kota' },
  ];

  return (
    <aside className="absolute top-16 right-4 z-40 w-96 sm:w-[440px] max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-5rem)] bg-[#0B131D]/98 backdrop-blur-2xl border border-[#2B3E52] rounded-2xl shadow-2xl shadow-black/80 flex flex-col pointer-events-auto select-none animate-in fade-in slide-in-from-right-4 duration-200 overflow-hidden">
      {/* Drawer Header */}
      <div className="p-4 border-b border-[#243444] bg-[#0E1722]/90 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">
              Lapisan Peta Operasional
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">
              Pusdalops BPBD Prov. Sumbar & Standar InaRISK
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl bg-[#141E2B] hover:bg-[#1E2B3C] text-slate-400 hover:text-white border border-[#243444] transition-all"
          title="Tutup Menu Layer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Switcher: Operasional vs InaRISK */}
      <div className="flex items-center border-b border-[#1E2E40] bg-[#080E16]">
        <button
          type="button"
          onClick={() => setActiveTab('operasional')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold font-display uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'operasional'
              ? 'border-sky-400 text-sky-300 bg-sky-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Lapisan Peta ({clusters.reduce((acc, c) => acc + c.items.length, 0)})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inarisk')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold font-display uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'inarisk'
              ? 'border-amber-400 text-amber-300 bg-amber-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Katalog InaRISK BNPB</span>
        </button>
      </div>

      {/* Kontrol Cepat Semua Layer (Nyalakan / Matikan Semua) */}
      {activeTab === 'operasional' && onToggleAll && (
        <div className="px-4 py-2 border-b border-[#1E2E40] bg-[#0E1722]/60 flex items-center justify-between text-xs font-mono">
          <span className="text-[11px] text-slate-400">Kontrol Masal:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onToggleAll(true)}
              className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95"
              title="Aktifkan semua lapisan peta"
            >
              <Eye className="w-3 h-3" />
              <span>Nyalakan Semua</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleAll(false)}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95"
              title="Matikan semua lapisan peta"
            >
              <EyeOff className="w-3 h-3" />
              <span>Matikan Semua</span>
            </button>
          </div>
        </div>
      )}

      {/* Konten Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
        {activeTab === 'operasional' ? (
          /* TAB 1: LAPISAN PETA OPERASIONAL BERJENJANG (GAMBAR 1 RESMI) */
          clusters.map((cluster, cIdx) => (
            <div key={cIdx} className="space-y-1.5">
              {/* Header Klaster */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold font-display uppercase tracking-wider text-slate-300">
                  {cluster.title}
                </span>
                <span className={`text-[9px] font-mono px-2 py-0.2 rounded border ${cluster.badgeBg}`}>
                  {cluster.badge}
                </span>
              </div>

              {/* Daftar Layer Dalam Klaster - Bersih, Intuitif & To-The-Point */}
              <div className="space-y-1.5">
                {cluster.items.map((item) => {
                  const isActive = Boolean(visibility[item.key]);

                  return (
                    <div
                      key={item.key}
                      onClick={() => onToggleLayer(item.key)}
                      className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-[#121E2C] border-sky-500/40 shadow-sm'
                          : 'bg-[#0B121A]/70 border-[#1B2937] opacity-65 hover:opacity-100 hover:border-slate-700'
                      }`}
                    >
                      {/* Ikon & Teks Label */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                          isActive ? 'bg-[#091017] border border-sky-500/30 text-sky-400' : 'bg-[#141E28] text-slate-400'
                        }`}>
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-100 truncate">
                            {item.label}
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans truncate mt-0.5">
                            {item.sublabel}
                          </div>
                        </div>
                      </div>

                      {/* Tombol Aksi Kanan: Fokus Gempa (jika ada) + Sakelar Switch Bersih */}
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {item.key === 'gempa' && onFocusLayer && isActive && (
                          <button
                            type="button"
                            onClick={() => onFocusLayer('gempa')}
                            className="px-2 py-0.5 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-[10px] font-mono flex items-center gap-1 transition-colors"
                            title="Fokuskan kamera ke episentrum gempa"
                          >
                            <Compass className="w-3 h-3 text-rose-400" />
                            <span>Fokus</span>
                          </button>
                        )}

                        {/* Switch On/Off Sederhana & Ergonomis */}
                        <button
                          type="button"
                          onClick={() => onToggleLayer(item.key)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isActive ? 'bg-sky-500' : 'bg-slate-700'
                          }`}
                          role="switch"
                          aria-checked={isActive}
                          title={isActive ? 'Sembunyikan lapisan' : 'Tampilkan lapisan'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          /* TAB 2: KATALOG RISIKO INARISK BNPB (STANDAR PERKA NO. 2/2012) */
          <div className="space-y-4">
            {/* Box Metodologi InaRISK */}
            <div className="p-3.5 rounded-2xl bg-[#14202E] border border-amber-500/40 text-amber-100 space-y-2">
              <div className="flex items-center gap-2 font-bold font-display text-amber-300 text-xs uppercase tracking-wider">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Prinsip Kajian Risiko Bencana InaRISK</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#091017] border border-[#223344] font-mono text-[11px] text-center text-amber-300 font-bold">
                Risiko (R) = Bahaya (H) × [ Kerentanan (V) / Kapasitas (C) ]
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Sistem GIS Kebencanaan Sumatera Barat ini mengintegrasikan parameter <strong>Bahaya (Hazard)</strong> spasial dari Sesar Semangko, Megathrust, Inundasi Tsunami Padang, dan Banjir Bandang dengan <strong>Kerentanan Fisik & Ekonomi</strong> tingkat kecamatan (Choropleth 19 Kab/Kota).
              </p>
            </div>

            {/* Status 12 Klaster Bencana Nasional BNPB */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold font-display uppercase tracking-wider text-slate-200">
                  Daftar 12 Bahaya Standar BNPB
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  Perka 2/2012
                </span>
              </div>

              <div className="space-y-1.5">
                {inariskHazards.map((hz, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#0F1722] border border-[#1E2E40] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                        <span>{hz.name}</span>
                        {hz.active ? (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            Spasial Aktif
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            Agregat Statistik
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {hz.desc}
                      </div>
                    </div>
                    {hz.active && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Keterangan Transparansi Data */}
            <div className="p-3 rounded-xl bg-[#0F1722] border border-[#1E2E40] text-[10px] text-slate-400 font-mono space-y-1">
              <div>• Data Gempa: Sensor Live BMKG TEWS</div>
              <div>• Data Cuaca: Common Alerting Protocol (CAP) BMKG</div>
              <div>• Data Geologi & Sesar: Pusgen ESDM / Riset LPPM</div>
              <div>• Data Tsunami & Shelter: BPBD Provinsi Sumatera Barat</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Drawer */}
      <div className="p-3 border-t border-[#243444] bg-[#070D14] flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>GIS Kebencanaan Prov. Sumbar</span>
        <span className="text-emerald-400 flex items-center gap-1 font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>PostGIS Live</span>
        </span>
      </div>
    </aside>
  );
};
