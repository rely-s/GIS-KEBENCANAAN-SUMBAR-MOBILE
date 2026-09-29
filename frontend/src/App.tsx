import { useState, useEffect, useMemo } from 'react';
import { MapCanvas, type GempaInfo } from './features/map/MapCanvas';
import { WilayahPanel, type WilayahDampakData } from './features/telusuri-bencana/WilayahPanel';
import { StatistikChart, type KecamatanStatItem } from './features/telusuri-bencana/StatistikChart';
import { type KotaKabupatenItem } from './features/filter/constants';
import { UnifiedDrawer, type UnifiedDrawerTab } from './features/navigation/UnifiedDrawer';
import { RouteInstructions, type EvakuasiRouteData } from './features/evakuasi/RouteInstructions';
import { EvakuasiModal, type EvakuasiStartParams } from './features/evakuasi/EvakuasiModal';
import { OperatorModal, type UserSession } from './features/operator/OperatorModal';
import { CitizenReportModal } from './features/lapor/CitizenReportModal';
import { OfflineBanner } from './features/pwa/OfflineBanner';
import type { LayerVisibilityState } from './features/map/types';
import { ActiveLayerChips } from './features/map/ActiveLayerChips';
import { FloatingSeismicCard } from './features/gempa/FloatingSeismicCard';
import { SitrepModal } from './features/sitrep/SitrepModal';
import { CuacaAlertModal } from './features/cuaca/CuacaAlertModal';
import { MultiHazardRadarModal } from './features/proximity/MultiHazardRadarModal';
import { useSSEEvents } from './hooks/useSSEEvents';
import { DetailPoskoSheet, type PoskoDetailData } from './features/map/components/DetailPoskoSheet';
import { DetailJalanSheet, type JalanTerputusDetailData } from './features/map/components/DetailJalanSheet';
import { DetailAncamanSheet, type AncamanDetailData } from './features/map/components/DetailAncamanSheet';
import { AccessibleShelterModal } from './features/accessibility/AccessibleShelterModal';
import { 
  Building2,
  Compass, 
  Server,
  Layers,
  Radio,
  Bell,
  Navigation,
  UserCheck,
  RefreshCw,
  FileText,
  CloudLightning,
  Crosshair,
  ChevronUp,
  ChevronRight,
  Search,
  BookOpen,
  AlertTriangle
} from 'lucide-react';

interface HealthStatus {
  status: string;
  database: string;
  version?: string;
}

export function App() {
  // Koordinat Kursor & Telemetri Peta
  const [coords, setCoords] = useState({ lng: 100.4172, lat: -0.85, zoom: 8.4 });
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  
  // State Fase 4: Style Basemap Kustom (Default: Satelit Hibrida Rill Gambar 2) & Mode 3D
  const [styleVariant, setStyleVariant] = useState<'satelit' | 'terang' | 'gelap'>('satelit');
  const [is3DTerrain, setIs3DTerrain] = useState<boolean>(false);

  // State Filter Interaktif
  const [selectedJenis, setSelectedJenis] = useState('semua');
  const [selectedTahun, setSelectedTahun] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');

  // State Garis Batas Kabupaten/Kota & Kecamatan Terpilih
  const [selectedKotaBoundaries, setSelectedKotaBoundaries] = useState<any | null>(null);
  const [activeKotaInfo, setActiveKotaInfo] = useState<KotaKabupatenItem | null>(null);
  const [activeKecamatanInfo, setActiveKecamatanInfo] = useState<{ id: number | string; nama: string } | null>(null);

  // State Data Wilayah Terpilih (Drill-Down "Telusuri Bencana")
  const [selectedWilayahId, setSelectedWilayahId] = useState<number | null>(null);
  const [wilayahDampak, setWilayahDampak] = useState<WilayahDampakData | null>(null);
  const [loadingDampak, setLoadingDampak] = useState(false);
  const [flyToCoords, setFlyToCoords] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

  // State Daftar Kecamatan & Data Statistik Choropleth
  const [choroplethFeatures, setChoroplethFeatures] = useState<any[]>([]);
  // FIX: Dataset komprehensif 181 kecamatan se-Sumbar untuk fitur "Cari Cepat"
  const [allKecamatanFeatures, setAllKecamatanFeatures] = useState<any[]>([]);

  // ==========================================
  // STATE FASE 3: Evakuasi, BMKG, RBAC Operator
  // ==========================================
  const [routeData, setRouteData] = useState<EvakuasiRouteData | null>(null);
  const [loadingEvakuasi, setLoadingEvakuasi] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [poskoCoords, setPoskoCoords] = useState<{ lat: number; lng: number; nama?: string } | null>(null);
  const [jalanVersion, setJalanVersion] = useState(0);
  const [poskoVersion, setPoskoVersion] = useState(0);
  const [bencanaVersion, setBencanaVersion] = useState(0);

  // State Detail Interactive Bottom Sheets (Touchscreen-Friendly Lapangan)
  const [selectedPoskoSheet, setSelectedPoskoSheet] = useState<PoskoDetailData | null>(null);
  const [selectedJalanSheet, setSelectedJalanSheet] = useState<JalanTerputusDetailData | null>(null);
  const [selectedAncamanSheet, setSelectedAncamanSheet] = useState<AncamanDetailData | null>(null);

  // Real-Time SSE Notification Hub (Pilar 7)
  const [realtimeNotification, setRealtimeNotification] = useState<{
    id: string;
    title: string;
    message: string;
    type: 'gempa' | 'laporan' | 'bencana';
  } | null>(null);

  // Gempa Real-Time BMKG & Kalkulasi Jarak Geospasial ke Sumbar
  const [gempaData, setGempaData] = useState<GempaInfo | null>(null);

  // Sambungkan ke Real-Time EWS Event Stream BPBD Sumbar
  const { isConnected: isSSEConnected } = useSSEEvents({
    onGempaBaru: (gempa) => {
      fetch('/api/eksternal/gempa-terkini')
        .then((res) => (res.ok ? res.json() : null))
        .then((res) => {
          if (res && res.data) setGempaData(res.data);
        })
        .catch(() => {});

      setRealtimeNotification({
        id: `GEMPA-${Date.now()}`,
        title: `PERINGATAN DINI GEMPA M${gempa.magnitude || ''}`,
        message: `${gempa.wilayah || 'Wilayah Sumatera Barat'} (Kedalaman: ${gempa.kedalaman_km || 10} km)`,
        type: 'gempa'
      });
    },
    onLaporanBaru: (laporan) => {
      setRealtimeNotification({
        id: `LAPOR-${Date.now()}`,
        title: `Laporan Darurat Warga: ${(laporan.jenis_bencana || '').toUpperCase()}`,
        message: `${laporan.wilayah || 'Sumatera Barat'} - Masuk antrean verifikasi Pusdalops.`,
        type: 'laporan'
      });
    },
    onLaporanDiverifikasi: (bencana) => {
      setBencanaVersion((v) => v + 1);
      setRealtimeNotification({
        id: `VERIF-${Date.now()}`,
        title: `Bencana Terverifikasi: ${(bencana.jenis_bencana || '').toUpperCase()}`,
        message: `Status: ${bencana.status_verifikasi}. Peta publik diperbarui seketika.`,
        type: 'bencana'
      });
    },
    onBencanaBaru: () => {
      setBencanaVersion((v) => v + 1);
    }
  });

  // Support Handoff dari Aplikasi Mobile: ?view=mobile_lite&lat=...&lon=...&zoom=...
  const [isMobileLiteView, setIsMobileLiteView] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const latParam = params.get('lat');
      const lonParam = params.get('lon');
      const zoomParam = params.get('zoom');

      if (viewParam === 'mobile_lite') {
        setIsMobileLiteView(true);
      }
      if (latParam && lonParam) {
        const parsedLat = parseFloat(latParam);
        const parsedLon = parseFloat(lonParam);
        const parsedZoom = zoomParam ? parseFloat(zoomParam) : 15;
        if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
          setFlyToCoords({ lat: parsedLat, lng: parsedLon, zoom: parsedZoom });
        }
      }
    } catch (_) {}
  }, []);


  const distanceToSumbar = useMemo(() => {
    if (!gempaData?.lat || !gempaData?.lon) return 0;
    const R = 6371; // radius bumi dalam km
    const dLat = (gempaData.lat - (-0.85)) * (Math.PI / 180);
    const dLon = (gempaData.lon - 100.4172) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(-0.85 * (Math.PI / 180)) * Math.cos(gempaData.lat * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }, [gempaData]);

  // RBAC Petugas/Operator & Integrasi Spasial
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const savedUser = localStorage.getItem('gis_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);
  const [isCitizenReportOpen, setIsCitizenReportOpen] = useState(false);
  const [pickingTarget, setPickingTarget] = useState<'evakuasi' | 'posko' | 'bencana' | null>(null);
  const [pickedOperatorCoords, setPickedOperatorCoords] = useState<{ lat: number; lng: number } | null>(null);

  // ==========================================
  // STATE FASE 5: Mitigasi, SITREP, Cuaca, Panel Terpadu
  // ==========================================
  const [isUnifiedDrawerOpen, setIsUnifiedDrawerOpen] = useState(false);
  const [unifiedDrawerTab, setUnifiedDrawerTab] = useState<UnifiedDrawerTab>('wilayah');
  const [isSitrepModalOpen, setIsSitrepModalOpen] = useState(false);
  const [isAccessibleModalOpen, setIsAccessibleModalOpen] = useState(false);
  const [isCuacaModalOpen, setIsCuacaModalOpen] = useState(false);
  const [isRadarModalOpen, setIsRadarModalOpen] = useState(false);
  const [radarBencanaList, setRadarBencanaList] = useState<any[]>([]);
  const [radarPoskoList, setRadarPoskoList] = useState<any[]>([]);
  const [radarJalanList, setRadarJalanList] = useState<any[]>([]);
  const [isPickingLocationOnMap, setIsPickingLocationOnMap] = useState(false);
  const [isEvakuasiMenuOpen, setIsEvakuasiMenuOpen] = useState(false);
  const [isEvakuasiModalOpen, setIsEvakuasiModalOpen] = useState(false);
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibilityState>({
    choropleth: true,
    poskoEvakuasi: true,
    shelterTes: true,
    jalanTerputus: true,
    gempa: true,
    cuaca: true,
    sesarSemangko: true,
    sesarBuffer: false,
    megathrust: true,
    zonaTsunami: true,
    tsunamiRunup: false,
  });
  const [layerOpacities, setLayerOpacities] = useState<Record<string, number>>({
    choropleth: 0.65,
    zonaTsunami: 0.35,
    tsunamiRunup: 0.45,
    cuaca: 0.5,
    sesarBuffer: 0.3,
    megathrust: 0.25,
  });
  const [evakuasiModa, setEvakuasiModa] = useState<'mobil' | 'jalan_kaki'>('mobil');
  const [cuacaAlerts, setCuacaAlerts] = useState<any[]>([]);

  // Kalkulasi Kedekatan Spasial Geodesik (Spatial Proximity Engine Sesuai Evaluasi Riset)
  const currentProximityThreat = useMemo(() => {
    const targetLat = userCoords?.lat ?? -0.9471;
    const targetLng = userCoords?.lng ?? 100.3543;

    const threats = [
      { id: 'marapi_galodo', nama: 'Koridor Batang Anai (Lahar Dingin Marapi)', lat: -0.485, lng: 100.345, bufferKm: 0.3, type: 'galodo' },
      { id: 'sesar_sianok', nama: 'Segmen Sesar Sianok (Bukittinggi)', lat: -0.305, lng: 100.369, bufferKm: 2.5, type: 'sesar' },
      { id: 'sesar_sumani', nama: 'Segmen Sesar Sumani (Singkarak - Solok)', lat: -0.750, lng: 100.620, bufferKm: 2.0, type: 'sesar' },
      { id: 'sesar_suliti', nama: 'Segmen Sesar Suliti (Solok Selatan)', lat: -1.520, lng: 101.230, bufferKm: 2.0, type: 'sesar' },
      { id: 'megathrust', nama: 'Megathrust Mentawai (Segmen Siberut Mw 8.9)', lat: -1.250, lng: 99.500, bufferKm: 45.0, type: 'megathrust' }
    ];

    let minDistanceKm = Infinity;
    let nearest = threats[0];

    for (const t of threats) {
      const dLat = (t.lat - targetLat) * (Math.PI / 180);
      const dLon = (t.lng - targetLng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(targetLat * (Math.PI / 180)) * Math.cos(t.lat * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dKm = 6371 * c;
      if (dKm < minDistanceKm) {
        minDistanceKm = dKm;
        nearest = t;
      }
    }

    const distanceMeters = Math.round(minDistanceKm * 1000);
    let status: 'BAHAYA' | 'WASPADA' | 'AMAN' = 'AMAN';
    let message = 'Zona Aman Geologis';
    let directive = 'Lokasi terpantau aman dari sempadan patahan aktif & potensi bahaya geologis.';

    if (minDistanceKm <= nearest.bufferKm) {
      status = 'BAHAYA';
      message = `Zona Bahaya: ${nearest.nama}`;
      directive = nearest.type === 'megathrust'
        ? 'Evakuasi mandiri ke dataran tinggi (>15 mdpl) atau shelter TES terdekat!'
        : 'Segera jauhi tebing lereng curam & sempadan sungai!';
    } else if (minDistanceKm <= nearest.bufferKm * 2.5) {
      status = 'WASPADA';
      message = `Waspada: Mendekati ${nearest.nama} (${minDistanceKm.toFixed(1)} km)`;
      directive = 'Tetap siaga dan pantau stabilitas tanah lereng / debit air.';
    }

    return {
      status,
      nearestThreat: nearest.nama,
      distanceMeters,
      distanceKm: minDistanceKm.toFixed(1),
      message,
      directive,
    };
  }, [userCoords]);

  // State Ringkasan Fasilitas Dinamis (SITREP & Layer Control)
  const [facilityCounts, setFacilityCounts] = useState<{
    posko: number;
    tes: number;
    faskes: number;
    total: number;
  }>({
    posko: 18,
    tes: 7,
    faskes: 1,
    total: 26,
  });

  // 1. Cek Koneksi Backend API & Validasi Sesi HttpOnly Cookie (OWASP K1)
  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setHealth(data))
      .catch(() => setHealth({ status: 'offline', database: 'disconnected' }));

    // Verifikasi sesi HttpOnly cookie pengguna
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((user) => {
        if (user) {
          setCurrentUser(user);
          localStorage.setItem('gis_user', JSON.stringify(user));
        } else if (localStorage.getItem('gis_user')) {
          setCurrentUser(null);
          localStorage.removeItem('gis_user');
          localStorage.removeItem('gis_auth_token');
        }
      })
      .catch(() => {});
  }, []);

  // 1b. Fetch Data Fasilitas SITREP untuk Sinkronisasi Presisi Layer & Tab Evaluasi
  useEffect(() => {
    fetch('/api/sitrep/ringkasan')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const counts = data?.kpi || data?.fasilitas;
        if (counts) {
          setFacilityCounts({
            posko: counts.posko_pengungsi_count ?? counts.posko ?? 18,
            tes: counts.shelter_tes_count ?? counts.tes ?? 7,
            faskes: counts.faskes_count ?? counts.faskes ?? 1,
            total: counts.total_titik_evakuasi ?? counts.total ?? 26,
          });
        }
      })
      .catch((err) => console.debug('Gagal mengambil ringkasan fasilitas sitrep:', err));
  }, [poskoVersion]);

  // 2. Fetch Data Gempa BMKG Real-Time (Setiap 60 Detik)
  useEffect(() => {
    const fetchGempa = () => {
      fetch('/api/eksternal/gempa-terkini')
        .then((res) => (res.ok ? res.json() : null))
        .then((res) => {
          if (res && res.data) {
            setGempaData(res.data);
          }
        })
        .catch((err) => console.debug('Gagal mengambil data gempa BMKG:', err));
    };

    fetchGempa();
    const interval = setInterval(fetchGempa, 60000);
    return () => clearInterval(interval);
  }, []);

  // 2b. Fetch Peringatan Cuaca Ekstrem BMKG (Fase 5)
  useEffect(() => {
    const fetchCuaca = () => {
      fetch('/api/eksternal/cuaca-peringatan')
        .then((res) => (res.ok ? res.json() : null))
        .then((res) => {
          if (res && res.data) {
            setCuacaAlerts(res.data);
          }
        })
        .catch((err) => console.debug('Gagal mengambil cuaca BMKG:', err));
    };

    fetchCuaca();
    const interval = setInterval(fetchCuaca, 300000); // 5 Menit
    return () => clearInterval(interval);
  }, []);

  // 2c. Fetch Data Spasial Real-time untuk Matriks Radar Multi-Bencana
  useEffect(() => {
    fetch('/api/bencana?limit=50')
      .then((res) => (res.ok ? res.json() : null))
      .then((res) => {
        if (res && res.data) setRadarBencanaList(res.data);
      })
      .catch(() => {});
  }, [bencanaVersion]);

  useEffect(() => {
    fetch('/api/posko')
      .then((res) => (res.ok ? res.json() : null))
      .then((res) => {
        if (res && res.features) setRadarPoskoList(res.features);
      })
      .catch(() => {});
  }, [poskoVersion]);

  useEffect(() => {
    fetch('/api/jalan-terputus')
      .then((res) => (res.ok ? res.json() : null))
      .then((res) => {
        if (res && res.features) setRadarJalanList(res.features);
      })
      .catch(() => {});
  }, [jalanVersion]);

  // 3. Bangun URL Choropleth Berdasarkan Filter (Default: Kabupaten/Kota Resmi Sumbar)
  const choroplethUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.append('level', 'kabupaten');
    if (selectedJenis && selectedJenis !== 'semua') {
      params.append('jenis_bencana', selectedJenis);
    }
    if (selectedTahun && selectedTahun !== 'semua') {
      params.append('tahun', selectedTahun);
    }
    return `/api/wilayah/choropleth?${params.toString()}`;
  }, [selectedJenis, selectedTahun]);

  // 4. Muat Data Fitur Choropleth untuk ECharts & Pencarian (Otomatis Refresh saat data bencana termutasi)
  useEffect(() => {
    fetch(choroplethUrl)
      .then((res) => (res.ok ? res.json() : null))
      .then((geojson) => {
        if (geojson && geojson.features) {
          setChoroplethFeatures(geojson.features);
        }
      })
      .catch((err) => {
        console.error('Gagal mengambil data choropleth:', err);
      });
  }, [choroplethUrl, bencanaVersion]);

  // 4a. Refresh otomatis data rincian dampak wilayah aktif jika data bencana di-update
  useEffect(() => {
    if (selectedWilayahId && bencanaVersion > 0) {
      fetch(`/api/wilayah/${selectedWilayahId}/dampak`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: WilayahDampakData) => {
          if (data) setWilayahDampak(data);
        })
        .catch(() => {});
    }
  }, [bencanaVersion, selectedWilayahId]);

  // 4b. Muat komprehensif 181 kecamatan se-Sumbar dari static GeoJSON untuk fitur "Cari Cepat"
  // Dilakukan sekali saat startup agar pencarian kecamatan menemukan seluruh 181 kecamatan instan
  useEffect(() => {
    fetch('/data/sumbar_kecamatan.geojson')
      .then((res) => (res.ok ? res.json() : null))
      .then((geojson) => {
        if (geojson && geojson.features && geojson.features.length > 0) {
          setAllKecamatanFeatures(geojson.features);
          console.info(`[Cari Cepat] Loaded ${geojson.features.length} kecamatan dari static GeoJSON.`);
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat static sumbar_kecamatan.geojson:', err);
      });
  }, []);

  // Ekstrak Data Statistik untuk ECharts
  const chartData: KecamatanStatItem[] = useMemo(() => {
    return choroplethFeatures.map((f: any) => ({
      id: f.properties.id,
      nama: f.properties.nama,
      parent_nama: f.properties.parent_nama,
      total_kerugian: f.properties.total_kerugian || 0,
      total_meninggal: f.properties.total_meninggal || 0,
      total_luka: f.properties.total_luka || 0,
      jumlah_kejadian: f.properties.jumlah_kejadian || 0,
      tingkat_risiko: f.properties.tingkat_risiko || 'rendah',
    }));
  }, [choroplethFeatures]);

  // Ekstrak Daftar Kecamatan untuk Dropdown Pencarian
  // FIX: Gunakan allKecamatanFeatures (181 kecamatan) jika sudah dimuat, bukan hanya choropleth level kabupaten (19 entitas)
  const kecamatanList = useMemo(() => {
    const source = allKecamatanFeatures.length > 0 ? allKecamatanFeatures : choroplethFeatures;
    return source.map((f: any) => ({
      id: f.properties.id,
      nama: f.properties.nama,
      parent_nama: f.properties.parent_nama || f.properties.kabupaten,
      lat: f.properties.lat || f.properties.center_lat || f.properties.y,
      lon: f.properties.lon || f.properties.center_lon || f.properties.x,
    }));
  }, [choroplethFeatures, allKecamatanFeatures]);

  // 5. Handler Pemilihan Wilayah (Klik Peta / Klik Grafik / Hasil Pencarian)
  const handleSelectWilayah = (wilayahId: number, properties?: any) => {
    setSelectedWilayahId(wilayahId);
    setIsUnifiedDrawerOpen(false);
    setLoadingDampak(true);

    // Jika properties sudah mengandung koordinat, flyTo dengan zoom adaptif (level kabupaten ~9.5, kecamatan ~12.5)
    if (properties?.lat && properties?.lon) {
      const isSubdistrict = Boolean(properties.parent_nama || properties.kabupaten || properties.parent_id);
      const targetZoom = properties.zoom || (isSubdistrict ? 12.5 : 9.5);
      setFlyToCoords({ 
        lat: Number(properties.lat), 
        lng: Number(properties.lon), 
        zoom: targetZoom 
      });
      // Load batas kecamatan jika ada info kabupaten induk
      const parentNama = properties.parent_nama || properties.kabupaten || properties.nama;
      const parentId = properties.parent_id || properties.id;
      if (parentNama || parentId) {
        loadKotaBoundaries(parentNama || '', parentId);
      }
    }

    fetch(`/api/wilayah/${wilayahId}/dampak`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: WilayahDampakData | null) => {
        if (data && data.nama) {
          setWilayahDampak(data);
          // Jika koordinat center tersedia dari API dan belum ada koordinat properties sebelumnya
          if (data.center && data.center.lat && data.center.lng && (!properties?.lat || !properties?.lon)) {
            const isSubdistrict = Boolean(data.parent_nama && data.parent_nama !== 'Provinsi Sumatera Barat');
            setFlyToCoords({ lat: data.center.lat, lng: data.center.lng, zoom: isSubdistrict ? 12.5 : 9.6 });
          }
        } else {
          // Fallback data tangguh agar tidak memicu blank panel
          setWilayahDampak({
            wilayah_id: properties?.id || wilayahId,
            nama: properties?.nama || properties?.name || 'Kecamatan Terpilih',
            parent_nama: properties?.parent_nama || properties?.kabupaten || 'Sumatera Barat',
            total_kerugian: Number(properties?.total_kerugian || 0),
            total_meninggal: Number(properties?.total_meninggal || 0),
            total_luka: Number(properties?.total_luka || 0),
            total_terdampak: Number(properties?.total_terdampak || 0),
            jumlah_pengungsi: Number(properties?.jumlah_pengungsi || 0),
            jumlah_kejadian: Number(properties?.jumlah_kejadian || 0),
            rumah_rusak_berat: 0,
            rumah_rusak_sedang: 0,
            rumah_rusak_ringan: 0,
            fasilitas_umum_rusak: 0,
            fasilitas_kesehatan_rusak: 0,
            sekolah_rusak: 0,
            tingkat_risiko: properties?.tingkat_risiko || 'rendah',
            kejadian_terbaru: []
          });
        }
      })
      .catch(() => {
        setWilayahDampak({
          wilayah_id: properties?.id || wilayahId,
          nama: properties?.nama || properties?.name || 'Kecamatan Terpilih',
          parent_nama: properties?.parent_nama || properties?.kabupaten || 'Sumatera Barat',
          total_kerugian: Number(properties?.total_kerugian || 0),
          total_meninggal: Number(properties?.total_meninggal || 0),
          total_luka: Number(properties?.total_luka || 0),
          total_terdampak: Number(properties?.total_terdampak || 0),
          jumlah_pengungsi: 0,
          jumlah_kejadian: Number(properties?.jumlah_kejadian || 0),
          rumah_rusak_berat: 0,
          rumah_rusak_sedang: 0,
          rumah_rusak_ringan: 0,
          fasilitas_umum_rusak: 0,
          fasilitas_kesehatan_rusak: 0,
          sekolah_rusak: 0,
          tingkat_risiko: properties?.tingkat_risiko || 'rendah',
          kejadian_terbaru: []
        });
      })
      .finally(() => {
        setLoadingDampak(false);
      });
  };

  // Helper memuat garis batas kecamatan di dalam suatu kota/kabupaten terpilih
  const loadKotaBoundaries = async (kotaNama: string, kotaId?: number) => {
    try {
      // 1. Panggil API backend GeoJSON batas kecamatan
      const queryParam = kotaId ? `parent_id=${kotaId}` : `search=${encodeURIComponent(kotaNama)}`;
      const res = await fetch(`/api/wilayah/geojson?level=kecamatan&${queryParam}`);
      if (res.ok) {
        const geojson = await res.json();
        if (geojson && geojson.features && geojson.features.length > 0) {
          setSelectedKotaBoundaries(geojson);
          return;
        }
      }

      // 2. Fallback tangguh ke dataset statis 181 kecamatan Sumatera Barat
      const staticRes = await fetch('/data/sumbar_kecamatan.geojson');
      if (staticRes.ok) {
        const allKec = await staticRes.json();
        const cleanKota = kotaNama.toLowerCase().replace('kota ', '').replace('kabupaten ', '').trim();
        const filtered = (allKec.features || []).filter((f: any) => {
          const kab = String(f.properties?.kabupaten || f.properties?.adm2 || '').toLowerCase();
          return kab.includes(cleanKota) || cleanKota.includes(kab);
        });
        if (filtered.length > 0) {
          setSelectedKotaBoundaries({ type: 'FeatureCollection', features: filtered });
          return;
        }
      }
    } catch (err) {
      console.warn('Gagal memuat batas kecamatan:', err);
    }
  };

  // 5b. Handler Pemilihan Kota / Kabupaten (Direct flyTo & Munculkan Garis Batas Seluruh Kecamatannya)
  const handleSelectKota = (kota: KotaKabupatenItem) => {
    setActiveKotaInfo(kota);
    setActiveKecamatanInfo(null);
    setIsUnifiedDrawerOpen(false);

    // 1. Direct flyTo ke lokasi Kota/Kabupaten dengan zoom adaptif
    const isKabupaten = kota.nama.toLowerCase().includes('kab');
    setFlyToCoords({ lat: kota.lat, lng: kota.lon, zoom: isKabupaten ? 9.2 : 11.0 });

    // 2. Memuat batas seluruh kecamatan di dalam kabupaten/kota tersebut (Garis tempat lain di-hide)
    loadKotaBoundaries(kota.nama, kota.id);

    // 3. Tampilkan ringkasan data kota di WilayahPanel
    setSelectedWilayahId(kota.id);
    setLoadingDampak(true);
    fetch(`/api/wilayah/${kota.id}/dampak`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: WilayahDampakData) => {
        setWilayahDampak(data);
      })
      .catch(() => {
        setWilayahDampak({
          wilayah_id: kota.id,
          nama: kota.nama,
          parent_nama: 'Provinsi Sumatera Barat',
          total_kerugian: 0,
          total_meninggal: 0,
          total_luka: 0,
          total_terdampak: 0,
          jumlah_pengungsi: 0,
          jumlah_kejadian: 0,
          rumah_rusak_berat: 0,
          rumah_rusak_sedang: 0,
          rumah_rusak_ringan: 0,
          fasilitas_umum_rusak: 0,
          fasilitas_kesehatan_rusak: 0,
          sekolah_rusak: 0,
          tingkat_risiko: 'sedang',
          kejadian_terbaru: []
        });
      })
      .finally(() => setLoadingDampak(false));
  };

  // 5c. Handler Pemilihan Kecamatan Spesifik (Direct flyTo & Highlight Batas Kecamatan)
  const handleSelectKecamatan = (id: number, nama: string, properties?: any) => {
    setActiveKecamatanInfo({ id, nama });

    // FIX: Selalu arahkan kamera ke kecamatan dengan zoom presisi (12.5-13.5)
    const lat = properties?.lat || properties?.center_lat || properties?.y;
    const lon = properties?.lon || properties?.center_lon || properties?.x;
    if (lat && lon) {
      setFlyToCoords({ lat: Number(lat), lng: Number(lon), zoom: 13.0 });
    }

    // FIX: Load batas kecamatan dari kabupaten induk
    // Coba gunakan id_kota atau parent_id jika tersedia (lebih presisi daripada string nama)
    const parentId = properties?.parent_id;
    const parentNama = properties?.parent_nama || properties?.kabupaten;
    if (parentId || parentNama) {
      loadKotaBoundaries(parentNama || '', parentId);
    } else {
      // Fallback: cari di allKecamatanFeatures berdasarkan id kecamatan
      const found = allKecamatanFeatures.find((f: any) => String(f.properties.id) === String(id));
      if (found) {
        const kab = found.properties.parent_nama || found.properties.kabupaten;
        const kabId = found.properties.parent_id;
        if (kab || kabId) {
          loadKotaBoundaries(kab || '', kabId);
        }
      }
    }

    // Panggil lookup dampak kecamatan
    handleSelectWilayah(id, {
      ...properties,
      lat: lat || properties?.lat,
      lon: lon || properties?.lon,
    });
  };

  // Handler Reset Seluruh Filter Wilayah & Peta
  const handleResetAllFilters = () => {
    setSelectedJenis('semua');
    setSelectedTahun('semua');
    setSearchQuery('');
    setSelectedKotaBoundaries(null);
    setActiveKotaInfo(null);
    setActiveKecamatanInfo(null);
    setSelectedWilayahId(null);
    setWilayahDampak(null);
    setFlyToCoords({ lat: -0.85, lng: 100.4172, zoom: 8.4 });
  };

  // Handler Tutup Panel Wilayah
  const handleCloseWilayahPanel = () => {
    setSelectedWilayahId(null);
    setWilayahDampak(null);
    setActiveKecamatanInfo(null);
  };

  // ==========================================
  // FITUR UTAMA: EVAKUASI MULTI-ALUR (ALUR A TSUNAMI vs ALUR B NON-TSUNAMI)
  // ==========================================
  const hitungRute = (
    lat?: number, 
    lon?: number, 
    targetModa: 'mobil' | 'jalan_kaki' = evakuasiModa,
    kecamatanId?: number | string,
    targetJenisBencana?: string
  ) => {
    setLoadingEvakuasi(true);
    if (lat !== undefined && lon !== undefined) {
      setUserCoords({ lat, lng: lon });
    }
    if (targetModa) {
      setEvakuasiModa(targetModa);
    }

    const jenisToUse = targetJenisBencana || (selectedJenis === 'semua' ? 'gempa' : selectedJenis);

    const payload: any = {
      moda: targetModa,
      jenis_bencana: jenisToUse,
    };
    if (lat !== undefined && lon !== undefined) {
      payload.lat = lat;
      payload.lon = lon;
    }
    if (kecamatanId !== undefined) {
      payload.kecamatan_id = kecamatanId;
    }

    fetch('/api/routing/evakuasi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) throw new Error('Gagal menghitung rute evakuasi');
        return res.json();
      })
      .then((data: EvakuasiRouteData) => {
        setRouteData(data);
        if (data.posko) {
          setPoskoCoords({
            lat: data.posko.lat,
            lng: data.posko.lon,
            nama: data.posko.nama
          });
        }
        // Jika koordinat rute tersedia dan userCoords belum ada, set userCoords dari koordinat awal geometri
        if ((lat === undefined || lon === undefined) && data.geometry?.coordinates?.length > 0) {
          const firstCoord = data.geometry.coordinates[0];
          setUserCoords({ lat: firstCoord[1], lng: firstCoord[0] });
        }
        // Tutup panel drill-down dan modal evakuasi agar peta dan rute fokus
        setSelectedWilayahId(null);
        setWilayahDampak(null);
        setIsEvakuasiModalOpen(false);

        // Arahkan kamera peta ke lokasi posko/shelter tujuan
        if (data.posko) {
          setFlyToCoords({ lat: data.posko.lat, lng: data.posko.lon, zoom: 14 });
        }
      })
      .catch((err) => {
        alert(`Peringatan Navigasi Evakuasi: ${err.message || 'Server routing sedang sibuk.'}`);
      })
      .finally(() => {
        setLoadingEvakuasi(false);
      });
  };

  const handleStartEvakuasiFromModal = (params: EvakuasiStartParams) => {
    hitungRute(params.lat, params.lon, params.moda, params.kecamatan_id, params.jenis_bencana);
  };

  const handleEvakuasiSekarang = (targetModa: 'mobil' | 'jalan_kaki' = evakuasiModa) => {
    // Minta koordinat GPS pengguna via Geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          hitungRute(pos.coords.latitude, pos.coords.longitude, targetModa);
        },
        (err) => {
          console.warn('Izin GPS ditolak atau tidak tersedia, menggunakan koordinat pusat Padang Barat (Simulasi):', err.message);
          // Fallback realistis: Padang Barat (-0.9471, 100.3543)
          hitungRute(-0.9471, 100.3543, targetModa);
        },
        { timeout: 6000, enableHighAccuracy: true }
      );
    } else {
      hitungRute(-0.9471, 100.3543, targetModa);
    }
  };

  const handleLocationPicked = (c: { lat: number; lng: number }) => {
    setIsPickingLocationOnMap(false);
    if (pickingTarget === 'posko' || pickingTarget === 'bencana') {
      setPickedOperatorCoords(c);
      setIsOperatorModalOpen(true);
    } else {
      hitungRute(c.lat, c.lng, evakuasiModa);
    }
    setPickingTarget(null);
  };

  // Batalkan penentuan titik atau tutup menu jika menekan Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEvakuasiMenuOpen) {
          setIsEvakuasiMenuOpen(false);
        }
        if (isPickingLocationOnMap) {
          setIsPickingLocationOnMap(false);
          if (pickingTarget === 'posko' || pickingTarget === 'bencana') {
            setIsOperatorModalOpen(true);
          }
          setPickingTarget(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPickingLocationOnMap, pickingTarget, isEvakuasiMenuOpen]);

  const handleToggleModa = (moda: 'mobil' | 'jalan_kaki') => {
    setEvakuasiModa(moda);
    if (routeData && userCoords) {
      hitungRute(userCoords.lat, userCoords.lng, moda);
    }
  };

  const handleLoginSuccess = (user: UserSession, token: string) => {
    setCurrentUser(user);
    localStorage.setItem('gis_user', JSON.stringify(user));
    // Sesuai OWASP K1: Jangan simpan plaintext JWT token sensitif di localStorage jika tidak perlu.
    // Backend mengelola HttpOnly SameSite Cookie 'access_token' secara aman.
    if (token) localStorage.setItem('gis_auth_token', token);
  };

  const handleLogout = () => {
    fetch('/api/auth/logout', { 
      method: 'POST',
      credentials: 'include'
    }).catch(() => {});
    setCurrentUser(null);
    localStorage.removeItem('gis_user');
    localStorage.removeItem('gis_auth_token');
    setIsOperatorModalOpen(false);
  };

  // Handlers Interaktif Klik Objek Peta (Anti Dead-Click & Touchscreen Lapangan)
  const handlePoskoClick = (feature: any) => {
    const p = feature.properties || {};
    const geom = feature.geometry || {};
    const coords = geom.coordinates || [100.3543, -0.9471];
    setSelectedPoskoSheet({
      id: p.id || Math.random(),
      nama: p.nama || 'Posko Evakuasi',
      jenis: p.jenis || 'posko_utama',
      alamat: p.alamat || p.lokasi,
      kapasitas: p.kapasitas,
      terisi: p.terisi,
      status: p.status || 'aktif',
      kontak_pic: p.kontak_pic || p.pic,
      kontak_telepon: p.kontak_telepon || p.telepon,
      lat: coords[1],
      lon: coords[0],
      fasilitas: Array.isArray(p.fasilitas) ? p.fasilitas : [],
      jumlah_lansia: p.jumlah_lansia || 0,
      jumlah_balita: p.jumlah_balita || 0,
      jumlah_disabilitas: p.jumlah_disabilitas || 0,
      jumlah_ibu_hamil: p.jumlah_ibu_hamil || 0,
      ketersediaan_air_bersih: p.ketersediaan_air_bersih ?? true,
      ketersediaan_dapur_umum: p.ketersediaan_dapur_umum ?? false,
      ketersediaan_tenaga_medis: p.ketersediaan_tenaga_medis ?? false,
    });
    setSelectedJalanSheet(null);
    setSelectedAncamanSheet(null);
  };

  const handleJalanClick = (feature: any) => {
    const p = feature.properties || {};
    setSelectedJalanSheet({
      id: p.id || 0,
      alasan: p.alasan || 'Ruas Jalan Terputus',
      deskripsi: p.deskripsi,
      status: p.status || 'aktif',
      nama_ruas: p.nama_ruas,
      koridor_alternatif: p.koridor_alternatif,
      created_at: p.created_at,
    });
    setSelectedPoskoSheet(null);
    setSelectedAncamanSheet(null);
  };

  const handleAncamanClick = (info: any) => {
    setSelectedAncamanSheet({
      tipe: info.tipe || info.jenis || 'sesar',
      judul: info.judul || info.nama || 'Ancaman Geologis',
      subJudul: info.subJudul || info.deskripsi,
      badge: info.badge || (info.tipe || info.jenis || '').toUpperCase(),
      properties: info.properties || info.metadata || {},
    });
    setSelectedPoskoSheet(null);
    setSelectedJalanSheet(null);
  };

  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-[#0F1720] font-body text-slate-100 select-none">
      {/* PWA Indikator Status Offline */}
      <OfflineBanner />

      {/* Mobile Lite View Banner Handoff */}
      {isMobileLiteView && (
        <div className="absolute top-14 left-1/2 transform -translate-x-1/2 z-50 bg-slate-900/95 border border-orange-500/50 text-white px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-2 text-xs backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
          <span className="font-semibold text-orange-400">Mode Mobile Taktis:</span>
          <span>Fokus Titik Evakuasi Lapangan</span>
          <button 
            onClick={() => setIsMobileLiteView(false)} 
            className="ml-2 text-slate-400 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. HEADER UTAMA (Floating Ramping <= 52px di Atas Peta) */}
      <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-2 sm:p-2.5 flex items-center justify-between gap-2">
        {/* Identitas Kolaborasi Resmi: BNPB, Pemprov Sumbar, & LPPM UPI YPTK */}
        <div className="pointer-events-auto flex items-center gap-2.5 bg-[#0B131D]/95 backdrop-blur-2xl px-3 py-1.5 rounded-xl border border-[#2B3E52] shadow-2xl transition-all shrink-0">
          {/* Trio Logo Resmi Instansi */}
          <div className="flex items-center gap-1.5 pr-2.5 border-r border-[#243444] shrink-0">
            <div 
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-sm p-0.5 hover:scale-105 transition-transform" 
              title="Badan Nasional Penanggulangan Bencana (BNPB)"
            >
              <img src="/logos/bnpb.png" alt="Logo BNPB" className="w-full h-full object-contain" />
            </div>
            <div 
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-sm p-0.5 overflow-hidden hover:scale-105 transition-transform" 
              title="Pemerintah Provinsi Sumatera Barat (BPBD Sumbar)"
            >
              <img src="/logos/pemprov-sumbar.jpg" alt="Logo Pemprov Sumbar" className="w-full h-full object-contain rounded" />
            </div>
            <div 
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-sm p-0.5 hover:scale-105 transition-transform" 
              title="Universitas Putra Indonesia YPTK Padang (Riset LPPM)"
            >
              <img src="/logos/upi-yptk.png" alt="Logo UPI YPTK" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Teks Identitas */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-black tracking-tight text-white font-display uppercase truncate">
                GIS Kebencanaan <span className="text-slate-300 font-medium normal-case text-[11px] sm:text-xs">Sumatera Barat</span>
              </h1>
              <span 
                className={`px-1.5 py-0.5 text-[9px] font-mono font-medium rounded border shrink-0 hidden xs:flex items-center gap-1 ${
                  isSSEConnected
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                }`} 
                title={isSSEConnected ? 'Real-Time EWS Stream Terhubung (SSE Live)' : 'Menghubungkan ke EWS Stream...'}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSSEConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {isSSEConnected ? 'EWS LIVE' : 'CONNECTING'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans tracking-wide hidden sm:block truncate">
              BPBD Prov. Sumatera Barat • Kolaborasi Riset LPPM UPI YPTK
            </p>
          </div>
        </div>

        {/* Ticker Cuaca Ringkas */}
        {cuacaAlerts.length > 0 && (
          <div 
            onClick={() => setIsCuacaModalOpen(true)}
            className="pointer-events-auto hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0B131D]/90 backdrop-blur-md border border-amber-500/40 shadow-xl cursor-pointer hover:border-amber-400 text-xs shrink-0"
            title="Peringatan Cuaca Ekstrem BMKG"
          >
            <CloudLightning className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="font-bold text-amber-400">{cuacaAlerts[0].event || 'Cuaca Ekstrem'}</span>
            <span className="text-slate-300 text-[10px]">({cuacaAlerts.length} Wilayah)</span>
          </div>
        )}

        {/* Kontrol Kanan (Panel Terpadu: Wilayah, Layer, SITREP, Petugas RBAC, Legenda) */}
        <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
          {/* Tombol Pencarian & Filter Wilayah */}
          <button
            onClick={() => {
              setUnifiedDrawerTab('wilayah');
              setIsUnifiedDrawerOpen((curr) => (!curr || unifiedDrawerTab !== 'wilayah'));
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md border text-xs font-bold shadow-md transition-all ${
              isUnifiedDrawerOpen && unifiedDrawerTab === 'wilayah'
                ? 'bg-sky-600/30 border-sky-400 text-sky-300'
                : 'bg-[#0B131D]/90 border-[#2B3E52] text-slate-200 hover:text-white hover:bg-[#152230]'
            }`}
            title="Pusat Pencarian & Filter Wilayah Nagari"
          >
            <Search className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline font-mono">Wilayah</span>
          </button>

          {/* Tombol Katalog Layer Multibahaya InaRISK */}
          <button
            onClick={() => {
              setUnifiedDrawerTab('lapisan');
              setIsUnifiedDrawerOpen((curr) => (!curr || unifiedDrawerTab !== 'lapisan'));
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl backdrop-blur-md border text-xs font-bold shadow-md transition-all ${
              isUnifiedDrawerOpen && unifiedDrawerTab === 'lapisan'
                ? 'bg-sky-600/30 border-sky-400 text-sky-300'
                : 'bg-[#0B131D]/90 border-[#2B3E52] text-slate-200 hover:text-white hover:bg-[#152230]'
            }`}
            title="Katalog Lapisan Multibahaya InaRISK BNPB"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline font-mono">Katalog Layer</span>
          </button>

          {/* Tombol Aksesibilitas WCAG: Daftar Tabel Posko */}
          <button
            onClick={() => setIsAccessibleModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/90 backdrop-blur-md border border-emerald-500/50 text-emerald-200 text-xs font-bold shadow-md transition-all cursor-pointer"
            title="Daftar Posko Evakuasi Aksesibel (Mode Tabel & Screen Reader WCAG 2.1 AA)"
            aria-label="Buka Daftar Tabel Aksesibel Posko Evakuasi"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline font-mono">Daftar Posko</span>
          </button>

          {/* Tombol SITREP BNPB */}
          <button
            onClick={() => setIsSitrepModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900/90 backdrop-blur-md border border-rose-500/50 text-rose-200 text-xs font-bold shadow-md transition-all"
            title="Laporan Situasi Eksekutif (SITREP BNPB)"
          >
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden md:inline font-mono">SITREP</span>
          </button>

          {/* Tombol Lapor Cepat Warga (PWA Crowdsourcing) */}
          <button
            onClick={() => setIsCitizenReportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600/90 to-amber-600/90 hover:from-rose-500 hover:to-amber-500 text-white backdrop-blur-md border border-rose-400/60 text-xs font-bold shadow-md shadow-rose-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Lapor Cepat Kejadian Bencana Lapangan (Warga)"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
            <span className="font-mono whitespace-nowrap">Lapor Warga</span>
          </button>

          {/* Tombol Portal Komando / Petugas */}
          <button
            onClick={() => setIsOperatorModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-md transition-all ${
              currentUser?.role === 'pimpinan'
                ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                : currentUser?.role === 'admin' || currentUser?.role === 'super_admin'
                ? 'bg-blue-600/25 border-blue-400 text-blue-300'
                : currentUser?.role === 'operator' || currentUser?.role === 'pusdalops'
                ? 'bg-emerald-600/25 border-emerald-400 text-emerald-300'
                : 'bg-[#0B131D]/90 border-[#2B3E52] text-slate-200 hover:bg-[#152230] hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline font-mono whitespace-nowrap">
              {currentUser?.nama ? currentUser.nama.split(' ')[0] : 'Portal Petugas'}
            </span>
          </button>

          {/* Status Server */}
          <div 
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-[#0B131D]/90 border border-[#2B3E52] text-xs font-mono text-slate-300 shadow-md"
            title={`Status Server: ${health?.status || 'Memeriksa...'}`}
          >
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <span className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          </div>

          {/* Toggle Legenda & Panduan Risiko */}
          <button
            onClick={() => {
              setUnifiedDrawerTab('legenda');
              setIsUnifiedDrawerOpen((curr) => (!curr || unifiedDrawerTab !== 'legenda'));
            }}
            className={`p-1.5 rounded-xl border transition-all ${
              isUnifiedDrawerOpen && unifiedDrawerTab === 'legenda'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-[#0B131D]/90 border-[#2B3E52] text-slate-300 hover:text-white hover:bg-[#152230]'
            }`}
            title="Legenda & Simbol Peta"
          >
            <BookOpen className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 1b. FLOATING REAL-TIME EWS NOTIFICATION BANNER */}
      {realtimeNotification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-lg w-[92%] sm:w-auto animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={`p-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 ${
            realtimeNotification.type === 'gempa'
              ? 'bg-[#1C0F14]/95 border-rose-500/60 text-rose-100 shadow-rose-950/50'
              : realtimeNotification.type === 'laporan'
              ? 'bg-[#0B1524]/95 border-sky-500/60 text-sky-100 shadow-sky-950/50'
              : 'bg-[#0D1C16]/95 border-emerald-500/60 text-emerald-100 shadow-emerald-950/50'
          }`}>
            <div className={`p-2 rounded-xl shrink-0 ${
              realtimeNotification.type === 'gempa'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : realtimeNotification.type === 'laporan'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}>
              {realtimeNotification.type === 'gempa' ? (
                <Radio className="w-5 h-5 animate-pulse" />
              ) : (
                <Bell className="w-5 h-5 animate-bounce" />
              )}
            </div>
            <div className="min-w-0 pr-2">
              <div className="text-xs font-bold font-display uppercase tracking-wide flex items-center gap-1.5">
                <span>{realtimeNotification.title}</span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/40 text-slate-300">LIVE</span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                {realtimeNotification.message}
              </p>
            </div>
            <button
              onClick={() => setRealtimeNotification(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white shrink-0"
              title="Tutup pemberitahuan"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Banner Mode Penentuan Titik di Peta (Dinamis: Warga / Petugas) */}
      {isPickingLocationOnMap && (
        <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-500 text-slate-950 font-bold shadow-2xl border-2 border-amber-300 animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-auto">
          <Crosshair className="w-5 h-5 animate-spin shrink-0 text-slate-950" />
          <div className="text-xs sm:text-sm font-sans">
            {pickingTarget === 'posko' ? (
              <span><b>Mode Petugas:</b> Klik pada peta untuk menentukan koordinat lokasi Posko / Shelter TES</span>
            ) : pickingTarget === 'bencana' ? (
              <span><b>Mode Petugas:</b> Klik pada peta untuk menentukan episentrum koordinat kejadian bencana</span>
            ) : (
              <span><b>Mode Navigasi:</b> Klik sembarang posisi di peta untuk menentukan lokasi awal evakuasi</span>
            )}
          </div>
          <button
            onClick={() => {
              setIsPickingLocationOnMap(false);
              if (pickingTarget === 'posko' || pickingTarget === 'bencana') {
                setIsOperatorModalOpen(true);
              }
              setPickingTarget(null);
            }}
            className="ml-2 px-3 py-1 text-xs rounded-xl bg-slate-950 text-amber-300 hover:bg-slate-900 border border-amber-400 font-mono transition-colors"
          >
            Batal (Esc)
          </button>
        </div>
      )}

      {/* 2. KANVAS PETA UTAMA (MAPLIBRE GL JS) */}
      <main className="w-full h-full">
        <MapCanvas
          selectedWilayahId={selectedWilayahId}
          selectedBoundariesGeoJSON={selectedKotaBoundaries}
          selectedKecamatanHighlightId={activeKecamatanInfo?.id || selectedWilayahId}
          choroplethUrl={choroplethUrl}
          flyToCoords={flyToCoords}
          routeGeometry={routeData?.geometry}
          userCoords={userCoords}
          poskoCoords={poskoCoords}
          jalanVersion={jalanVersion}
          poskoVersion={poskoVersion}
          gempaData={gempaData}
          styleVariant={styleVariant}
          onStyleChange={(newStyle) => setStyleVariant(newStyle as 'satelit' | 'terang' | 'gelap')}
          is3DTerrain={is3DTerrain}
          onToggle3D={() => setIs3DTerrain((prev) => !prev)}
          layerVisibility={layerVisibility}
          layerOpacities={layerOpacities}
          cuacaAlerts={cuacaAlerts}
          isPickingLocation={isPickingLocationOnMap}
          onPickLocation={handleLocationPicked}
          onCoordinatesChange={(c) => setCoords(c)}
          onSelectWilayah={(id, props) => handleSelectWilayah(id, props)}
          onPoskoClick={handlePoskoClick}
          onJalanClick={handleJalanClick}
          onAncamanClick={handleAncamanClick}
        />
      </main>

      {/* 3. PANEL TERPADU: WILAYAH, LAPISAN & LEGENDA (Zero Clutter & Zero Modal Collisions) */}
      <UnifiedDrawer
        isOpen={isUnifiedDrawerOpen}
        onClose={() => setIsUnifiedDrawerOpen(false)}
        initialTab={unifiedDrawerTab}
        selectedJenis={selectedJenis}
        selectedTahun={selectedTahun}
        searchQuery={searchQuery}
        kecamatanList={kecamatanList}
        activeKotaNama={activeKotaInfo?.nama}
        activeKecamatanNama={activeKecamatanInfo?.nama}
        onJenisChange={setSelectedJenis}
        onTahunChange={setSelectedTahun}
        onSearchChange={setSearchQuery}
        onSelectKota={handleSelectKota}
        onSelectKecamatan={handleSelectKecamatan}
        onResetFilter={handleResetAllFilters}
        layerVisibility={layerVisibility}
        onToggleLayer={(key) =>
          setLayerVisibility((prev) => ({ ...prev, [key]: !prev[key] }))
        }
        onToggleAllLayers={(enableAll) => {
          setLayerVisibility({
            choropleth: enableAll,
            poskoEvakuasi: enableAll,
            shelterTes: enableAll,
            jalanTerputus: enableAll,
            gempa: enableAll,
            cuaca: enableAll,
            sesarSemangko: enableAll,
            sesarBuffer: enableAll,
            megathrust: enableAll,
            zonaTsunami: enableAll,
            tsunamiRunup: enableAll,
          });
        }}
        layerOpacities={layerOpacities}
        onOpacityChange={(key, val) =>
          setLayerOpacities((prev) => ({ ...prev, [key]: val }))
        }
        onFocusLayer={(key) => {
          if (key === 'gempa' && gempaData?.lat && gempaData?.lon) {
            setFlyToCoords({ lat: gempaData.lat, lng: gempaData.lon, zoom: 9 });
          }
        }}
        facilityCounts={facilityCounts}
      />

      {/* 4. PANEL DRILL-DOWN WILAYAH (Muncul Hanya Saat Ada Wilayah Dipilih) */}
      {selectedWilayahId !== null && (
        <WilayahPanel
          data={wilayahDampak}
          loading={loadingDampak}
          onClose={handleCloseWilayahPanel}
          onFocusRegion={() => {
            if (wilayahDampak?.center && typeof wilayahDampak.center.lat === 'number') {
              const isProv = selectedWilayahId === 1 || wilayahDampak.nama?.toLowerCase().includes('sumatera barat');
              setFlyToCoords({
                lat: wilayahDampak.center.lat,
                lng: wilayahDampak.center.lng,
                zoom: isProv ? 8.2 : 11.5
              });
            } else {
              const feat = choroplethFeatures.find((f: any) => f.properties?.id === selectedWilayahId);
              if (feat && feat.properties?.lat && feat.properties?.lon) {
                setFlyToCoords({ lat: feat.properties.lat, lng: feat.properties.lon, zoom: 11.5 });
              } else if (selectedWilayahId === 1 || wilayahDampak?.nama?.toLowerCase().includes('sumatera barat')) {
                setFlyToCoords({ lat: -0.85, lng: 100.4172, zoom: 8.2 });
              }
            }
          }}
          onStartEvakuasiRoute={(posko) => {
            // Tutup panel wilayah dan mulai hitung rute ke posko terpilih
            setSelectedWilayahId(null);
            setWilayahDampak(null);
            hitungRute(
              userCoords?.lat,
              userCoords?.lng,
              evakuasiModa,
              typeof activeKecamatanInfo?.id === 'number' ? activeKecamatanInfo.id : undefined
            );
            // Set posko tujuan langsung
            setPoskoCoords({ lat: posko.lat, lng: posko.lng, nama: posko.nama });
            setFlyToCoords({ lat: posko.lat, lng: posko.lng, zoom: 14 });
          }}
        />
      )}


      {/* 5. GRAFIK STATISTIK ECHARTS (Floating Drawer Bawah-Kanan) */}
      <StatistikChart
        data={chartData}
        selectedWilayahId={selectedWilayahId}
        onSelectKecamatan={(id) => handleSelectWilayah(id)}
      />

      {/* 6. PANEL PANDUAN EVAKUASI TURN-BY-TURN (Google Maps Style) */}
      {routeData && (
        <RouteInstructions
          routeData={routeData}
          currentModa={evakuasiModa}
          onToggleModa={handleToggleModa}
          onPickNewLocation={() => {
            setPickingTarget('evakuasi');
            setIsPickingLocationOnMap(true);
          }}
          onClose={() => {
            setRouteData(null);
            setUserCoords(null);
            setPoskoCoords(null);
          }}
        />
      )}

      {/* 7. MODAL OPERATOR & PUSDALOPS PB (PUSAT KOMANDO OPERASIONAL) */}
      <OperatorModal
        isOpen={isOperatorModalOpen}
        onClose={() => {
          setIsOperatorModalOpen(false);
          setPickingTarget(null);
        }}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        pickedCoords={pickedOperatorCoords}
        onPoskoChanged={() => {
          setPoskoVersion((v) => v + 1);
        }}
        onBencanaChanged={() => {
          setBencanaVersion((v) => v + 1);
        }}
        onJalanCreated={() => {
          setJalanVersion((v) => v + 1);
        }}
        onRequestPickLocation={(target) => {
          setPickingTarget(target);
          setIsPickingLocationOnMap(true);
          setIsOperatorModalOpen(false);
        }}
        onFocusMapLocation={(lat, lon, zoom) => {
          setIsOperatorModalOpen(false);
          setFlyToCoords({ lat, lng: lon, zoom: zoom || 14.5 });
        }}
      />

      {/* MODAL LAPOR BENCANA WARGA (PWA CROWDSOURCING & OFFLINE STORE-FORWARD) */}
      <CitizenReportModal
        isOpen={isCitizenReportOpen}
        onClose={() => setIsCitizenReportOpen(false)}
        onReportSuccess={() => {
          setBencanaVersion((v) => v + 1);
        }}
      />

      {/* 8. MODAL INFORMASI ARSITEKTUR & LEGENDA */}
      {showInfoPanel && (
        <aside className="absolute top-16 right-4 z-40 w-84 bg-[#1B2733]/95 backdrop-blur-xl border border-[#2D3F52] rounded-xl shadow-2xl p-4 flex flex-col gap-3 text-slate-200 animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between border-b border-[#2D3F52] pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-bold tracking-wider uppercase text-slate-200 font-display">
                Legenda & Arsitektur GIS
              </h2>
            </div>
            <button
              onClick={() => setShowInfoPanel(false)}
              className="text-slate-400 hover:text-white text-xs font-mono px-1.5 py-0.5 rounded hover:bg-[#243444]"
            >
              &times;
            </button>
          </div>

          <div className="text-xs space-y-3">
            {/* Klasifikasi Warna Choropleth */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Skala Risiko & Kerugian (Choropleth)
              </span>
              <div className="space-y-1 text-[11px] font-mono">
                <div className="flex items-center gap-2 p-1 rounded bg-[#0F1720]/50">
                  <span className="w-3.5 h-3.5 rounded bg-[#C0392B] shrink-0" />
                  <span className="text-slate-300">Tinggi (&gt; Rp 1,5 Miliar / Korban Jiwa)</span>
                </div>
                <div className="flex items-center gap-2 p-1 rounded bg-[#0F1720]/50">
                  <span className="w-3.5 h-3.5 rounded bg-[#D98E04] shrink-0" />
                  <span className="text-slate-300">Sedang (Rp 400 Jt – 1,5 Miliar)</span>
                </div>
                <div className="flex items-center gap-2 p-1 rounded bg-[#0F1720]/50">
                  <span className="w-3.5 h-3.5 rounded bg-[#1E7A46] shrink-0" />
                  <span className="text-slate-300">Rendah / Aman (&lt; Rp 400 Jt)</span>
                </div>
              </div>
            </div>

            {/* Simbol Lapisan Fasilitas & Bencana */}
            <div className="space-y-1.5 border-t border-[#2D3F52] pt-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Lapisan Peta & Fasilitas Keselamatan
              </span>
              <div className="space-y-1 text-[11px] font-mono">
                <div className="flex items-center gap-2 p-1 rounded bg-[#0F1720]/50">
                  <span className="w-3.5 h-3.5 rounded bg-[#EA580C] border border-white/80 shrink-0" />
                  <span className="text-slate-300">Posko Pengungsi ({facilityCounts.posko} Titik - 11 Kantor Camat)</span>
                </div>
                <div className="flex items-center gap-2 p-1 rounded bg-[#0F1720]/50">
                  <span className="w-3.5 h-3.5 rounded bg-[#0284C7] border border-white/80 shrink-0" />
                  <span className="text-slate-300">Shelter TES Vertikal Tsunami ({facilityCounts.tes} Gedung)</span>
                </div>
                <div className="flex items-center gap-2 p-1 rounded bg-[#0F1720]/50">
                  <span className="w-4 h-0.5 border-b-2 border-dashed border-rose-500 shrink-0" />
                  <span className="text-slate-300">Ruas Jalan Terputus (Blokade)</span>
                </div>
                <div className="flex items-center gap-2 p-1 rounded bg-[#0F1720]/50">
                  <span className="w-3 h-3 rounded-full bg-rose-600 border border-white shrink-0" />
                  <span className="text-slate-300">Episentrum Gempa BMKG Real-time</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* 9. MODAL SITREP BNPB (Fase 5) */}
      <SitrepModal
        isOpen={isSitrepModalOpen}
        onClose={() => setIsSitrepModalOpen(false)}
      />

      {/* Active Layer Chips & Opacity Sliders (Top-Left under Header) */}
      <ActiveLayerChips
        visibility={layerVisibility}
        onToggleLayer={(key) =>
          setLayerVisibility((prev) => ({ ...prev, [key]: !prev[key] }))
        }
        opacities={layerOpacities}
        onOpacityChange={(key, val) =>
          setLayerOpacities((prev) => ({ ...prev, [key]: val }))
        }
      />

      {/* 7. RADAR MULTI-BAHAYA & STATUS ZONA (Terstruktur di bottom-[62px] left-4, di atas Evakuasi & di bawah Top Kerugian) */}
      <div className="pointer-events-auto absolute bottom-[62px] left-4 z-20">
        <button
          type="button"
          onClick={() => setIsRadarModalOpen(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-xl border shadow-lg transition-all text-xs group cursor-pointer ${
            currentProximityThreat.status === 'BAHAYA'
              ? 'bg-rose-950/95 border-rose-500 text-rose-100 shadow-rose-950/50 hover:bg-rose-900 animate-pulse'
              : currentProximityThreat.status === 'WASPADA'
              ? 'bg-amber-950/95 border-amber-500 text-amber-100 shadow-amber-950/50 hover:bg-amber-900'
              : 'bg-[#0B131D]/95 border-[#243444] text-slate-200 hover:border-sky-500 hover:bg-[#111A24]'
          }`}
          title="Klik untuk membuka Radar Jarak Multi-Bencana (Sesar Semangko, Galodo, Longsor, Tsunami, Posko)"
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              currentProximityThreat.status === 'BAHAYA'
                ? 'bg-rose-500 animate-ping'
                : currentProximityThreat.status === 'WASPADA'
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
          />
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[11px] truncate max-w-[130px] sm:max-w-[190px]">
              {currentProximityThreat.message}
            </span>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                currentProximityThreat.status === 'BAHAYA'
                  ? 'bg-rose-500/30 text-rose-300'
                  : currentProximityThreat.status === 'WASPADA'
                  ? 'bg-amber-500/30 text-amber-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {currentProximityThreat.status}
            </span>
          </div>
          <span className="text-[10px] font-mono text-sky-400 group-hover:text-sky-300 flex items-center gap-0.5 border-l border-[#1E2E40] pl-2 ml-0.5">
            <span>Radar Jarak</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </button>
      </div>

      {/* MODAL RADAR JARAK & MATRIKS BAHAYA MULTI-BENCANA */}
      <MultiHazardRadarModal
        isOpen={isRadarModalOpen}
        onClose={() => setIsRadarModalOpen(false)}
        userCoords={userCoords}
        onPickLocationOnMap={() => {
          setPickingTarget('evakuasi');
          setIsPickingLocationOnMap(true);
        }}
        onStartRouteTo={(dest) => {
          setPoskoCoords({ lat: dest.lat, lng: dest.lng, nama: dest.nama });
          hitungRute(userCoords?.lat, userCoords?.lng, evakuasiModa);
          setFlyToCoords({ lat: dest.lat, lng: dest.lng, zoom: 14 });
        }}
        bencanaList={radarBencanaList}
        poskoList={radarPoskoList}
        jalanList={radarJalanList}
      />

      {/* Floating Real-Time Seismic Card (Bottom-Right Quadrant) */}
      <FloatingSeismicCard
        gempaData={gempaData}
        distanceToSumbar={distanceToSumbar}
        onFocus={(coords) => {
          setLayerVisibility((prev) => ({ ...prev, gempa: true }));
          setFlyToCoords({ lat: coords.lat, lng: coords.lon, zoom: coords.zoom || 8.5 });
        }}
      />

      {/* 11. MODAL DETAIL PERINGATAN CUACA BMKG & GALODO */}
      <CuacaAlertModal
        isOpen={isCuacaModalOpen}
        onClose={() => setIsCuacaModalOpen(false)}
        alerts={cuacaAlerts}
        onFlyToArea={(lat, lng) => setFlyToCoords({ lat, lng, zoom: 12.5 })}
      />

      {/* 12. MODAL PANDUAN EVAKUASI MULTI-ALUR (ALUR A TSUNAMI vs ALUR B NON-TSUNAMI) */}
      <EvakuasiModal
        isOpen={isEvakuasiModalOpen}
        onClose={() => setIsEvakuasiModalOpen(false)}
        onStartEvakuasi={handleStartEvakuasiFromModal}
        loading={loadingEvakuasi}
        defaultJenisBencana={selectedJenis}
        userCoords={userCoords}
        onPickLocationOnMap={() => {
          setIsEvakuasiModalOpen(false);
          setPickingTarget('evakuasi');
          setIsPickingLocationOnMap(true);
        }}
        onFlyToLocation={(loc) => setFlyToCoords(loc)}
        onSelectDestination={(loc) => {
          setFlyToCoords({ lat: loc.lat, lng: loc.lng, zoom: 15.5 });
        }}
      />

      {/* 12b. INTERACTIVE BOTTOM SHEETS (TOUCHSCREEN LAPANGAN) */}
      <DetailPoskoSheet
        posko={selectedPoskoSheet}
        onClose={() => setSelectedPoskoSheet(null)}
        onNavigateToPosko={(posko) => {
          setSelectedPoskoSheet(null);
          setPoskoCoords({ lat: posko.lat, lng: posko.lon, nama: posko.nama });
          setIsEvakuasiModalOpen(true);
        }}
      />

      <DetailJalanSheet
        jalan={selectedJalanSheet}
        onClose={() => setSelectedJalanSheet(null)}
        onPlanDetour={() => {
          setSelectedJalanSheet(null);
          setIsEvakuasiModalOpen(true);
        }}
      />

      <DetailAncamanSheet
        data={selectedAncamanSheet}
        onClose={() => setSelectedAncamanSheet(null)}
        onMulaiEvakuasi={() => {
          setSelectedAncamanSheet(null);
          setIsEvakuasiModalOpen(true);
        }}
      />

      {/* Modal Aksesibilitas Posko Evakuasi Semantik (WCAG 2.1 AA) */}
      <AccessibleShelterModal
        isOpen={isAccessibleModalOpen}
        onClose={() => setIsAccessibleModalOpen(false)}
        onSelectPosko={(posko) => {
          setFlyToCoords({ lat: posko.lat, lng: posko.lon, zoom: 16 });
        }}
      />



      {/* 13. BOTTOM BAR (Aksi Utama Evakuasi & Telemetri Realtime) */}
      <footer className="absolute bottom-3 left-4 right-4 z-20 pointer-events-none flex items-center justify-between gap-4">
        {/* Unified Emergency Evacuation Hub (Pusat Aksi Evakuasi Darurat) */}
        <div className="pointer-events-auto relative flex items-center bg-[#0B131D]/95 backdrop-blur-2xl p-1 sm:p-1.5 rounded-2xl border border-[#2F445A] shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
          {/* Kondisi 1: Sedang dalam Mode Penentuan Titik Asal di Peta */}
          {isPickingLocationOnMap ? (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/40 ring-2 ring-amber-300">
              <Crosshair className="w-4 h-4 animate-spin text-slate-950" />
              <div className="flex flex-col">
                <span className="text-xs font-display uppercase tracking-wider font-extrabold leading-tight">
                  Tentukan Titik di Peta
                </span>
                <span className="text-[10px] font-sans text-slate-900 leading-tight">
                  Klik lokasi awal Anda di peta
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPickingLocationOnMap(false);
                  setPickingTarget(null);
                }}
                className="ml-2 px-2.5 py-1 rounded-lg bg-slate-950 text-amber-300 hover:bg-slate-900 text-xs font-mono transition-colors border border-amber-400/50"
                title="Batalkan penentuan titik (Esc)"
              >
                ✕ Batal
              </button>
            </div>
          ) : routeData ? (
            /* Kondisi 2: Rute Navigasi Aktif */
            <div className="flex items-center gap-2 px-1">
              <button
                onClick={() => {
                  if (routeData.posko) {
                    setFlyToCoords({ lat: routeData.posko.lat, lng: routeData.posko.lon, zoom: 14 });
                  }
                }}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold tracking-wide bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                title="Fokuskan Peta ke Shelter Tujuan Rute"
              >
                <Navigation className="w-4 h-4 text-white animate-pulse" />
                <span className="text-xs font-display uppercase tracking-wider">
                  Rute Aktif (~{routeData.estimasi_menit} mnt)
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30 text-emerald-200 border border-emerald-400/30">
                  {routeData.jarak_km} km
                </span>
              </button>
              <button
                onClick={() => {
                  setRouteData(null);
                  setUserCoords(null);
                  setPoskoCoords(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all"
                title="Tutup / Batalkan Rute Navigasi"
              >
                <span className="text-xs font-mono font-bold">✕ Tutup</span>
              </button>
            </div>
          ) : (
            /* Kondisi 3: Keadaan Siaga (Idle) — Satu Tombol Evakuasi Terpadu dengan Menu Asal & Moda */
            <div className="relative flex items-center">
              {/* Flyout Menu Terpadu (Pilih GPS vs Titik di Peta & Moda) */}
              {isEvakuasiMenuOpen && (
                <div className="absolute bottom-full left-0 mb-3 w-76 p-3 rounded-2xl bg-[#0B131D]/98 backdrop-blur-2xl border border-[#2F445A] shadow-2xl space-y-2.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="px-1 py-0.5 border-b border-[#243444] pb-2 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white uppercase tracking-wider font-display flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-rose-500" />
                        Pusat Aksi Evakuasi
                      </div>
                      <div className="text-[10px] text-slate-400">Pilih metode penentuan lokasi asal</div>
                    </div>
                    <button
                      onClick={() => setIsEvakuasiMenuOpen(false)}
                      className="text-slate-400 hover:text-white text-xs p-1 rounded-lg hover:bg-white/10"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Opsi A: Buka Dialog Panduan & Filter Wilayah Cascading */}
                  <button
                    onClick={() => {
                      setIsEvakuasiMenuOpen(false);
                      setIsEvakuasiModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#131E2A] hover:bg-[#1C2C3E] border border-rose-500/30 hover:border-rose-500 text-slate-200 transition-all group text-left"
                  >
                    <div className="p-2 rounded-xl bg-rose-600/20 text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-colors shrink-0">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
                        Panduan & Filter Wilayah
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Pilih Kab/Kota, Kecamatan, atau Alur Bencana
                      </div>
                    </div>
                  </button>

                  {/* Opsi B: GPS Otomatis Cepat */}
                  <button
                    onClick={() => {
                      setIsEvakuasiMenuOpen(false);
                      handleEvakuasiSekarang(evakuasiModa);
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#131E2A] hover:bg-[#1C2C3E] border border-[#233547] hover:border-emerald-500/40 text-slate-200 transition-all group text-left"
                  >
                    <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                        Lokasi Saya (GPS Cepat)
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Deteksi otomatis koordinat perangkat Anda
                      </div>
                    </div>
                  </button>

                  {/* Opsi C: Tentukan di Peta (PILIH DI PETA TERINTEGRASI) */}
                  <button
                    onClick={() => {
                      setIsEvakuasiMenuOpen(false);
                      setPickingTarget('evakuasi');
                      setIsPickingLocationOnMap(true);
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#131E2A] hover:bg-[#1C2C3E] border border-[#233547] hover:border-amber-500/40 text-slate-200 transition-all group text-left"
                  >
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors shrink-0">
                      <Crosshair className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                        Tentukan Titik di Peta
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Klik bebas di peta untuk simulasi rute
                      </div>
                    </div>
                  </button>

                  {/* Pilihan Cepat Moda Evakuasi */}
                  <div className="pt-2 border-t border-[#243444] space-y-1.5">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold block px-1">
                      Moda Transportasi:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 bg-[#090E14] p-1 rounded-xl border border-[#243444]">
                      <button
                        onClick={() => handleToggleModa('mobil')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          evakuasiModa === 'mobil'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        🚗 Mobil
                      </button>
                      <button
                        onClick={() => handleToggleModa('jalan_kaki')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          evakuasiModa === 'jalan_kaki'
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        🏃 Kaki (TES)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tombol Utama: Eksekusi Cepat / Buka Panduan Evakuasi */}
              <button
                onClick={() => setIsEvakuasiModalOpen(true)}
                disabled={loadingEvakuasi}
                className="flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-l-xl font-bold tracking-wider transition-all duration-200 bg-gradient-to-r from-[#DC2626] via-[#E11D48] to-[#EF4444] hover:from-[#B91C1C] hover:to-[#DC2626] text-white shadow-lg shadow-rose-950/50 hover:shadow-rose-600/50 active:scale-98 border-r border-red-700/60"
                title="Buka Pusat Evakuasi Multi-Alur (Tsunami vs Non-Tsunami & Filter Wilayah)"
              >
                {loadingEvakuasi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-xs sm:text-sm font-display uppercase tracking-wider font-extrabold">
                      Mencari Rute...
                    </span>
                  </>
                ) : (
                  <>
                    <div className="relative flex items-center justify-center">
                      <span className="absolute w-3 h-3 rounded-full bg-amber-400 animate-ping opacity-60" />
                      <Compass className="relative w-4 h-4 text-amber-300" />
                    </div>
                    <span className="text-xs sm:text-sm font-display uppercase tracking-wider font-extrabold">
                      Evakuasi Sekarang
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/30 text-amber-200 border border-amber-300/30 font-semibold hidden xs:inline-block">
                      {evakuasiModa === 'mobil' ? '🚗 Mobil' : '🏃 TES'}
                    </span>
                  </>
                )}
              </button>

              {/* Tombol Pembuka Menu Opsi Evakuasi (Titik di Peta & Moda) */}
              <button
                onClick={() => setIsEvakuasiMenuOpen(!isEvakuasiMenuOpen)}
                className="px-2.5 sm:px-3 py-2.5 rounded-r-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white hover:text-amber-200 transition-colors shadow-lg shadow-rose-950/50 flex items-center justify-center"
                title="Opsi Titik Asal & Pilihan Moda Evakuasi"
              >
                <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${isEvakuasiMenuOpen ? 'rotate-180 text-amber-300' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Mini Legenda Risiko Choropleth */}
        <div className="pointer-events-auto hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#0F1720]/85 backdrop-blur-md border border-[#243444] text-[11px] font-mono shadow-lg">
          <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Risiko:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#C0392B]" />
            <span className="text-slate-300">&gt;1,5M</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#D98E04]" />
            <span className="text-slate-300">400Jt–1,5M</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#1E7A46]" />
            <span className="text-slate-300">&lt;400Jt</span>
          </div>
        </div>

        {/* Telemetri Koordinat Kursor Peta */}
        <div className="pointer-events-auto hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#0F1720]/80 backdrop-blur-md border border-[#243444] text-[11px] font-mono text-slate-400 shadow-lg">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>KURSOR:</span>
            <span className="text-slate-200">
              {coords.lat.toFixed(4)}°, {coords.lng.toFixed(4)}°
            </span>
          </div>
          <span className="text-slate-600">&bull;</span>
          <div>
            <span>ZOOM:</span> <span className="text-slate-200">{coords.zoom}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
