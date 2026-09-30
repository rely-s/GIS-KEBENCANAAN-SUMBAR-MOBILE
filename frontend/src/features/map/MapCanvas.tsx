import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol } from 'pmtiles';
import type { LayerVisibilityState } from './types';
import {
  sesarSemangkoGeoJSON,
  megathrustMentawaiGeoJSON,
  zonaTsunamiPadangGeoJSON,
  tsunamiRunUpGeoJSON,
  sesarBufferGeoJSON
} from './data/geologiData';
import { registerCartoIcons } from './cartoIcons';
import { RightMapControlDock } from './RightMapControlDock';

// Registrasi Protokol PMTiles untuk MapLibre GL JS (05-peta-gis.md)
try {
  const protocol = new Protocol();
  maplibregl.addProtocol('pmtiles', protocol.tile);
} catch {
  // Protokol mungkin sudah terdaftar pada siklus HMR
}

export interface GempaInfo {
  id: number;
  magnitude: number;
  kedalaman_km: number;
  lon: number;
  lat: number;
  wilayah_teks: string;
  waktu_kejadian: string;
  potensi_tsunami: boolean;
  dirasakan: boolean;
  shakemap_url?: string;
  atribusi?: string;
}

export type BasemapStyle = 'satelit' | 'terang' | 'gelap';

interface MapCanvasProps {
  selectedWilayahId?: number | null;
  selectedBoundariesGeoJSON?: any | null;
  selectedKecamatanHighlightId?: number | string | null;
  choroplethUrl?: string;
  flyToCoords?: { lat: number; lng: number; zoom?: number; pitch?: number } | null;
  routeGeometry?: any | null;
  userCoords?: { lat: number; lng: number } | null;
  poskoCoords?: { lat: number; lng: number; nama?: string } | null;
  jalanVersion?: number;
  poskoVersion?: number;
  gempaData?: GempaInfo | null;
  styleVariant?: BasemapStyle;
  is3DTerrain?: boolean;
  onStyleChange?: (style: BasemapStyle) => void;
  onToggle3D?: () => void;
  modeHematDaya?: boolean;
  layerVisibility?: LayerVisibilityState;
  layerOpacities?: Record<string, number>;
  cuacaAlerts?: any[];
  isPickingLocation?: boolean;
  onPickLocation?: (coords: { lat: number; lng: number }) => void;
  onUserLocationDetected?: (coords: { lat: number; lng: number; accuracy: number }) => void;
  onCoordinatesChange?: (coords: { lat: number; lng: number; zoom: number }) => void;
  onSelectWilayah?: (wilayahId: number, properties?: any) => void;
  onPoskoClick?: (posko: any) => void;
  onJalanClick?: (jalan: any) => void;
  onAncamanClick?: (ancaman: any) => void;
}

// 5 Stasiun Pengamatan Cuaca, Iklim, & Geofisika Resmi BMKG di Provinsi Sumatera Barat (Data Faktual, Zero Hallucination)
export interface BMKGStation {
  id: string;
  nama: string;
  tipe: 'meteorologi' | 'geofisika' | 'klimatologi' | 'maritim' | 'gaw';
  kategori: string;
  kode_wmo: string;
  lokasi: string;
  lat: number;
  lng: number;
  tugas_utama: string;
  status: string;
}

export const STASIUN_BMKG_SUMBAR: BMKGStation[] = [
  {
    id: 'bmkg-met-bim',
    nama: 'Stasiun Meteorologi Kelas II Minangkabau',
    tipe: 'meteorologi',
    kategori: 'Meteorologi Penerbangan & Permukaan',
    kode_wmo: '96163 (WIPT)',
    lokasi: 'Bandara Internasional Minangkabau (BIM), Ketaping, Kab. Padang Pariaman',
    lat: -0.7877,
    lng: 100.2831,
    tugas_utama: 'Pengamatan cuaca penerbangan, operasional Radar Cuaca Doppler, radiosonde, dan peringatan dini cuaca ekstrem.',
    status: 'Siaga Operasional 24 Jam',
  },
  {
    id: 'bmkg-geo-padangpanjang',
    nama: 'Stasiun Geofisika Kelas I Padang Panjang',
    tipe: 'geofisika',
    kategori: 'Seismologi & Pusat Gempa Regional (PGR II)',
    kode_wmo: '96171 (PPN)',
    lokasi: 'Jl. St. Syahrir No. 243 Silaiang Bawah, Kota Padang Panjang',
    lat: -0.4673,
    lng: 100.3956,
    tugas_utama: 'Pusat Seismologi & Gempa Bumi Regional Sumbar, pemantauan sesar Semangko & megathrust, penerima diseminasi InaTEWS.',
    status: 'Siaga Operasional 24 Jam',
  },
  {
    id: 'bmkg-klim-sicincin',
    nama: 'Stasiun Klimatologi Kelas II Sumatera Barat',
    tipe: 'klimatologi',
    kategori: 'Agroklimatologi & Analisis Iklim',
    kode_wmo: '96167',
    lokasi: 'Jl. Raya Padang - Bukittinggi KM 42, Sicincin, Kab. Padang Pariaman',
    lat: -0.5622,
    lng: 100.2789,
    tugas_utama: 'Pemantauan iklim, evaluasi Hari Tanpa Hujan (HTH), peringatan kekeringan, dan analisis potensi hidrometeorologis basah dasarian.',
    status: 'Siaga Operasional 24 Jam',
  },
  {
    id: 'bmkg-maritim-telukbayur',
    nama: 'Stasiun Meteorologi Maritim Teluk Bayur',
    tipe: 'maritim',
    kategori: 'Meteorologi Kelautan & Pelayaran',
    kode_wmo: '96165',
    lokasi: 'Kawasan Pelabuhan Samudera Teluk Bayur, Kota Padang',
    lat: -0.9986,
    lng: 100.3802,
    tugas_utama: 'Pengamatan cuaca maritim perairan Samudera Hindia barat Mentawai, prakiraan tinggi gelombang laut, dan pasang surut rob.',
    status: 'Siaga Operasional 24 Jam',
  },
  {
    id: 'bmkg-gaw-kototabang',
    nama: 'Stasiun Pemantau Atmosfer Global (GAW) Bukit Kototabang',
    tipe: 'gaw',
    kategori: 'WMO Global Atmosphere Watch',
    kode_wmo: '96161 (BKT)',
    lokasi: 'Bukit Kototabang, Palembayan, Kab. Agam (Elevasi 864 m dpl)',
    lat: -0.2019,
    lng: 100.3180,
    tugas_utama: 'Stasiun atmosfer global jejaring WMO PBB untuk pengamatan gas rumah kaca (CO2, CH4, N2O), aerosol, dan kualitas udara internasional.',
    status: 'Siaga Riset Internasional 24 Jam',
  },
];

export const MapCanvas: React.FC<MapCanvasProps> = ({
  selectedWilayahId,
  selectedBoundariesGeoJSON,
  selectedKecamatanHighlightId,
  flyToCoords,
  routeGeometry,
  userCoords,
  poskoCoords,
  jalanVersion = 0,
  poskoVersion = 0,
  gempaData,
  styleVariant = 'satelit',
  is3DTerrain = false,
  onStyleChange,
  onToggle3D,
  modeHematDaya,
  layerVisibility,
  layerOpacities,
  cuacaAlerts: _cuacaAlerts = [],
  isPickingLocation = false,
  onPickLocation,
  onUserLocationDetected,
  onCoordinatesChange,
  onSelectWilayah,
  onPoskoClick,
  onJalanClick,
  onAncamanClick,
}) => {
  // 3D Terrain mati secara default untuk performa ringan & dingin
  const active3D = is3DTerrain ?? (modeHematDaya !== undefined ? !modeHematDaya : false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [mapBearing, setMapBearing] = useState(0);

  // GeoJSON 5 Stasiun Resmi BMKG Sumatera Barat (Data Faktual, Zero Hallucination)
  const stasiunBmkgGeoJSON = useMemo(() => {
    const features = STASIUN_BMKG_SUMBAR.map((st) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [st.lng, st.lat],
      },
      properties: {
        id: st.id,
        nama: st.nama,
        kategori: st.kategori,
        kode_wmo: st.kode_wmo,
        lokasi: st.lokasi,
        tugas_utama: st.tugas_utama,
        status: st.status,
        tipe: st.tipe,
      },
    }));

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, []);

  // Sync ref untuk interaksi klik peta dinamis & isolasi siklus render reaktif
  const isPickingLocationRef = useRef(isPickingLocation);
  const onPickLocationRef = useRef(onPickLocation);
  const onSelectWilayahRef = useRef(onSelectWilayah);
  const onPoskoClickRef = useRef(onPoskoClick);
  const onJalanClickRef = useRef(onJalanClick);
  const onAncamanClickRef = useRef(onAncamanClick);
  const selectedWilayahIdRef = useRef(selectedWilayahId);
  const styleVariantRef = useRef(styleVariant);
  const currentStyleVariantRef = useRef<BasemapStyle>(styleVariant);
  const layerVisibilityRef = useRef(layerVisibility);
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);

  useEffect(() => {
    isPickingLocationRef.current = isPickingLocation;
    onPickLocationRef.current = onPickLocation;
    onSelectWilayahRef.current = onSelectWilayah;
    onPoskoClickRef.current = onPoskoClick;
    onJalanClickRef.current = onJalanClick;
    onAncamanClickRef.current = onAncamanClick;
    selectedWilayahIdRef.current = selectedWilayahId;
    styleVariantRef.current = styleVariant;
    layerVisibilityRef.current = layerVisibility;
  }, [isPickingLocation, onPickLocation, onSelectWilayah, onPoskoClick, onJalanClick, onAncamanClick, selectedWilayahId, styleVariant, layerVisibility]);


  // Markers
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const poskoMarkerRef = useRef<maplibregl.Marker | null>(null);
  const gempaMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Helper fungsi terisolasi untuk sinkronisasi visibilitas seluruh layer dari LayerControlPanel
  const applyLayerVisibility = useCallback((mapInstance: maplibregl.Map, v?: LayerVisibilityState) => {
    if (!mapInstance) return;
    const currentVis = v || {
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
    };

    const setLayerVis = (id: string, isVisible: boolean) => {
      try {
        if (mapInstance.getLayer(id)) {
          mapInstance.setLayoutProperty(id, 'visibility', isVisible ? 'visible' : 'none');
        }
      } catch (err) {
        console.debug(`Error setting visibility on ${id}:`, err);
      }
    };

    // 1. Wilayah Choropleth & Highlight Seleksi
    setLayerVis('choropleth-kecamatan-fill', currentVis.choropleth);
    setLayerVis('choropleth-kecamatan-line', currentVis.choropleth);
    setLayerVis('choropleth-kecamatan-highlight', currentVis.choropleth && !!selectedWilayahIdRef.current);

    // 2. Fasilitas & Mitigasi (Posko Pengungsi, Faskes, Shelter TES)
    setLayerVis('posko-evakuasi-symbol', currentVis.poskoEvakuasi ?? true);
    setLayerVis('posko-evakuasi-circle', currentVis.poskoEvakuasi ?? true);
    setLayerVis('posko-evakuasi-label', currentVis.poskoEvakuasi ?? true);
    setLayerVis('shelter-tes-symbol', currentVis.shelterTes);
    setLayerVis('shelter-tes-circle', currentVis.shelterTes);
    setLayerVis('shelter-tes-halo', currentVis.shelterTes);
    setLayerVis('jalan-terputus-line', currentVis.jalanTerputus);
    setLayerVis('jalan-terputus-line-casing', currentVis.jalanTerputus);

    // 3. Stasiun Resmi BMKG Sumatera Barat
    setLayerVis('stasiun-bmkg-halo', currentVis.cuaca);
    setLayerVis('stasiun-bmkg-circle', currentVis.cuaca);

    // 4. Struktur Geologi & Tsunami
    setLayerVis('sesar-semangko-casing', currentVis.sesarSemangko ?? true);
    setLayerVis('sesar-semangko-core', currentVis.sesarSemangko ?? true);
    setLayerVis('sesar-buffer-fill', currentVis.sesarBuffer ?? false);
    setLayerVis('sesar-buffer-line', currentVis.sesarBuffer ?? false);
    setLayerVis('megathrust-zone-fill', currentVis.megathrust ?? true);
    setLayerVis('megathrust-trench-line', currentVis.megathrust ?? true);
    setLayerVis('tsunami-zona-merah-fill', currentVis.zonaTsunami ?? true);
    setLayerVis('tsunami-zona-merah-line', currentVis.zonaTsunami ?? true);
    setLayerVis('tsunami-bypass-casing', currentVis.zonaTsunami ?? true);
    setLayerVis('tsunami-bypass-line', currentVis.zonaTsunami ?? true);
    setLayerVis('tsunami-runup-fill', currentVis.tsunamiRunup ?? false);
    setLayerVis('tsunami-runup-line', currentVis.tsunamiRunup ?? false);

    // 5. Episentrum Gempa BMKG
    if (gempaMarkerRef.current) {
      gempaMarkerRef.current.getElement().style.display = currentVis.gempa ? 'flex' : 'none';
    }

    // Tutup popup tooltip jika layer terkait dinonaktifkan
    if (hoverPopupRef.current && !currentVis.choropleth) {
      hoverPopupRef.current.remove();
    }
  }, []);

  // Helper untuk menambahkan seluruh layer spasial kustom kebencanaan
  const setupCustomLayers = useCallback((mapInstance: maplibregl.Map, variant?: BasemapStyle) => {
    const currentVariant = variant || styleVariantRef.current;

    // 1. Source & Layer Vector Tile Choropleth (Fase 4 - ST_AsMVT Native Makro Kabupaten)
    if (!mapInstance.getSource('choropleth-kecamatan')) {
      mapInstance.addSource('choropleth-kecamatan', {
        type: 'vector',
        tiles: ['/api/tiles/choropleth/{z}/{x}/{y}.mvt?level=kabupaten&v=3'],
        minzoom: 5,
        maxzoom: 14,
      });
    }

    if (!mapInstance.getLayer('choropleth-kecamatan-fill')) {
      mapInstance.addLayer({
        id: 'choropleth-kecamatan-fill',
        type: 'fill',
        source: 'choropleth-kecamatan',
        'source-layer': 'choropleth_kecamatan',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'total_kerugian'],
            0,
            '#10B981', // Aman: Hijau
            400000000,
            '#F59E0B', // Waspada: Kuning Oranye
            1500000000,
            '#EF4444', // Bahaya: Merah Semantik
          ],
          'fill-opacity': currentVariant === 'satelit' ? 0.45 : 0.65,
        },
      });
    }

    if (!mapInstance.getLayer('choropleth-kecamatan-line')) {
      mapInstance.addLayer({
        id: 'choropleth-kecamatan-line',
        type: 'line',
        source: 'choropleth-kecamatan',
        'source-layer': 'choropleth_kecamatan',
        paint: {
          'line-color': currentVariant === 'satelit' ? '#FFFFFF' : currentVariant === 'terang' ? '#1E3A5F' : '#38BDF8',
          'line-width': currentVariant === 'satelit' ? 1.8 : 1.5,
          'line-opacity': currentVariant === 'satelit' ? 0.95 : 0.85,
        },
      });
    }

    if (!mapInstance.getLayer('choropleth-kecamatan-highlight')) {
      mapInstance.addLayer({
        id: 'choropleth-kecamatan-highlight',
        type: 'line',
        source: 'choropleth-kecamatan',
        'source-layer': 'choropleth_kecamatan',
        paint: {
          'line-color': '#F4B400',
          'line-width': 3.5,
          'line-opacity': 1,
        },
        filter: ['==', ['get', 'id'], selectedWilayahIdRef.current || -1],
      });
    }

    // 1b. Source & Layers Garis Batas Wilayah Kabupaten/Kota & Seluruh Kecamatan (Pewarnaan Tematik per Risiko)
    if (!mapInstance.getSource('selected-boundaries-src')) {
      mapInstance.addSource('selected-boundaries-src', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }

    if (!mapInstance.getLayer('selected-boundaries-fill')) {
      mapInstance.addLayer({
        id: 'selected-boundaries-fill',
        type: 'fill',
        source: 'selected-boundaries-src',
        paint: {
          'fill-color': [
            'case',
            ['>=', ['coalesce', ['get', 'total_kerugian'], 0], 1500000000],
            '#EF4444', // Risiko Tinggi: Merah
            ['>=', ['coalesce', ['get', 'total_kerugian'], 0], 400000000],
            '#F59E0B', // Risiko Sedang: Kuning Oranye
            '#10B981'  // Risiko Rendah: Hijau
          ],
          'fill-opacity': currentVariant === 'satelit' ? 0.48 : 0.60,
        },
      });
    }

    if (!mapInstance.getLayer('selected-boundaries-line')) {
      mapInstance.addLayer({
        id: 'selected-boundaries-line',
        type: 'line',
        source: 'selected-boundaries-src',
        paint: {
          'line-color': '#FFFFFF',
          'line-width': currentVariant === 'satelit' ? 2.5 : 2.0,
          'line-opacity': 0.95,
        },
      });
    }

    if (!mapInstance.getLayer('selected-boundaries-subdistrict-highlight')) {
      mapInstance.addLayer({
        id: 'selected-boundaries-subdistrict-highlight',
        type: 'line',
        source: 'selected-boundaries-src',
        paint: {
          'line-color': '#F59E0B',
          'line-width': 4.5,
          'line-opacity': 1,
        },
        filter: ['==', ['get', 'id'], -1],
      });
    }

    if (!mapInstance.getLayer('selected-boundaries-labels')) {
      mapInstance.addLayer({
        id: 'selected-boundaries-labels',
        type: 'symbol',
        source: 'selected-boundaries-src',
        layout: {
          'text-field': ['get', 'nama'],
          'text-size': 11,
          'text-anchor': 'center',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#FFFFFF',
          'text-halo-color': '#0B131D',
          'text-halo-width': 2,
        },
      });
    }

    // 2. Source & Layer Jalan Terputus (Peringatan Garis Merah Putus-putus)
    if (!mapInstance.getSource('jalan-terputus-src')) {
      mapInstance.addSource('jalan-terputus-src', {
        type: 'geojson',
        data: '/api/jalan-terputus',
      });
    }

    if (!mapInstance.getLayer('jalan-terputus-line-casing')) {
      mapInstance.addLayer({
        id: 'jalan-terputus-line-casing',
        type: 'line',
        source: 'jalan-terputus-src',
        paint: {
          'line-color': '#7F1D1D',
          'line-width': 6.0,
          'line-opacity': 0.8,
        },
      });
    }

    if (!mapInstance.getLayer('jalan-terputus-line')) {
      mapInstance.addLayer({
        id: 'jalan-terputus-line',
        type: 'line',
        source: 'jalan-terputus-src',
        paint: {
          'line-color': '#EF4444',
          'line-width': 3.5,
          'line-dasharray': [2, 2],
        },
      });
    }

    // 3. Source & Layer Posko Pengungsi Resmi (Kantor Camat & Faskes - UN OCHA / BNPB Standar)
    if (!mapInstance.getSource('posko-evakuasi-src')) {
      mapInstance.addSource('posko-evakuasi-src', {
        type: 'geojson',
        data: '/api/posko',
      });
    }

    if (!mapInstance.getLayer('posko-evakuasi-symbol')) {
      mapInstance.addLayer({
        id: 'posko-evakuasi-symbol',
        type: 'symbol',
        source: 'posko-evakuasi-src',
        filter: ['!=', ['get', 'jenis'], 'shelter_tes_tea'],
        layout: {
          'icon-image': [
            'match',
            ['get', 'jenis'],
            'fasilitas_kesehatan',
            'carto-faskes-pengungsi',
            'carto-posko-pengungsi'
          ],
          'icon-size': 0.72,
          'icon-allow-overlap': true,
          'text-field': ['get', 'nama'],
          'text-size': 11,
          'text-offset': [0, 1.45],
          'text-anchor': 'top',
          'text-max-width': 12,
        },
        minzoom: 10,
        paint: {
          'text-color': '#F8FAFC',
          'text-halo-color': '#0B131D',
          'text-halo-width': 2.2,
        },
      });
    }

    if (!mapInstance.getLayer('posko-evakuasi-circle')) {
      mapInstance.addLayer({
        id: 'posko-evakuasi-circle',
        type: 'circle',
        source: 'posko-evakuasi-src',
        filter: ['!=', ['get', 'jenis'], 'shelter_tes_tea'],
        maxzoom: 10,
        paint: {
          'circle-radius': 6,
          'circle-color': [
            'match',
            ['get', 'jenis'],
            'fasilitas_kesehatan', '#059669',
            '#EA580C'
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
        },
      });
    }

    // 4. Source & Layer Shelter TES/TEA Tsunami (UNESCO-IOC & ISO 20712-1)
    if (!mapInstance.getSource('shelter-tes-src')) {
      mapInstance.addSource('shelter-tes-src', {
        type: 'geojson',
        data: '/api/posko?jenis=shelter_tes_tea',
      });
    }

    if (!mapInstance.getLayer('shelter-tes-symbol')) {
      mapInstance.addLayer({
        id: 'shelter-tes-symbol',
        type: 'symbol',
        source: 'shelter-tes-src',
        layout: {
          'icon-image': 'carto-shelter-tes',
          'icon-size': 0.8,
          'icon-allow-overlap': true,
          'text-field': ['get', 'nama'],
          'text-size': 11,
          'text-offset': [0, 1.45],
          'text-anchor': 'top',
          'text-max-width': 12,
        },
        minzoom: 10,
        paint: {
          'text-color': '#BAE6FD',
          'text-halo-color': '#0B131D',
          'text-halo-width': 2.2,
        },
      });
    }

    if (!mapInstance.getLayer('shelter-tes-circle')) {
      mapInstance.addLayer({
        id: 'shelter-tes-circle',
        type: 'circle',
        source: 'shelter-tes-src',
        maxzoom: 10,
        paint: {
          'circle-radius': 7,
          'circle-color': '#0284C7',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FFFFFF',
        },
      });
    }


    // 4. Source & Layer Rute Evakuasi
    if (!mapInstance.getSource('route-evakuasi-src')) {
      mapInstance.addSource('route-evakuasi-src', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });
    }

    if (!mapInstance.getLayer('route-evakuasi-casing')) {
      mapInstance.addLayer({
        id: 'route-evakuasi-casing',
        type: 'line',
        source: 'route-evakuasi-src',
        paint: {
          'line-color': '#0F1720',
          'line-width': 8.0,
          'line-opacity': 0.9,
        },
      });
    }

    if (!mapInstance.getLayer('route-evakuasi-core')) {
      mapInstance.addLayer({
        id: 'route-evakuasi-core',
        type: 'line',
        source: 'route-evakuasi-src',
        paint: {
          'line-color': '#00F0FF', // Cyan Neon Kontras Tinggi
          'line-width': 4.5,
          'line-opacity': 1.0,
        },
      });
    }

    // 5. Patahan Aktif Sesar Semangko (The Great Sumatran Fault)
    if (!mapInstance.getSource('sesar-semangko-src')) {
      mapInstance.addSource('sesar-semangko-src', {
        type: 'geojson',
        data: sesarSemangkoGeoJSON,
      });
    }

    if (!mapInstance.getLayer('sesar-semangko-casing')) {
      mapInstance.addLayer({
        id: 'sesar-semangko-casing',
        type: 'line',
        source: 'sesar-semangko-src',
        paint: {
          'line-color': '#78350F',
          'line-width': 5.5,
          'line-opacity': 0.85,
        },
      });
    }

    if (!mapInstance.getLayer('sesar-semangko-core')) {
      mapInstance.addLayer({
        id: 'sesar-semangko-core',
        type: 'line',
        source: 'sesar-semangko-src',
        paint: {
          'line-color': '#F59E0B',
          'line-width': 2.8,
          'line-dasharray': [4, 2],
        },
      });
    }

    // 6. Zona Subduksi Megathrust Mentawai (Palung & Kuncian Seismik)
    if (!mapInstance.getSource('megathrust-src')) {
      mapInstance.addSource('megathrust-src', {
        type: 'geojson',
        data: megathrustMentawaiGeoJSON,
      });
    }

    if (!mapInstance.getLayer('megathrust-zone-fill')) {
      mapInstance.addLayer({
        id: 'megathrust-zone-fill',
        type: 'fill',
        source: 'megathrust-src',
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'fill-color': '#E11D48',
          'fill-opacity': 0.15,
        },
      });
    }

    if (!mapInstance.getLayer('megathrust-trench-line')) {
      mapInstance.addLayer({
        id: 'megathrust-trench-line',
        type: 'line',
        source: 'megathrust-src',
        filter: ['==', '$type', 'LineString'],
        paint: {
          'line-color': '#E11D48',
          'line-width': 4.0,
          'line-dasharray': [5, 2.5],
        },
      });
    }

    // 7. Zonasi Bahaya Rendaman & Garis Evakuasi Aman Bypass Tsunami
    if (!mapInstance.getSource('tsunami-zona-src')) {
      mapInstance.addSource('tsunami-zona-src', {
        type: 'geojson',
        data: zonaTsunamiPadangGeoJSON,
      });
    }

    if (!mapInstance.getLayer('tsunami-zona-merah-fill')) {
      mapInstance.addLayer({
        id: 'tsunami-zona-merah-fill',
        type: 'fill',
        source: 'tsunami-zona-src',
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'fill-color': '#EF4444',
          'fill-opacity': 0.14,
        },
      });
    }

    if (!mapInstance.getLayer('tsunami-zona-merah-line')) {
      mapInstance.addLayer({
        id: 'tsunami-zona-merah-line',
        type: 'line',
        source: 'tsunami-zona-src',
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'line-color': '#EF4444',
          'line-width': 1.8,
          'line-dasharray': [4, 2],
        },
      });
    }

    if (!mapInstance.getLayer('tsunami-bypass-casing')) {
      mapInstance.addLayer({
        id: 'tsunami-bypass-casing',
        type: 'line',
        source: 'tsunami-zona-src',
        filter: ['==', '$type', 'LineString'],
        paint: {
          'line-color': '#064E3B',
          'line-width': 6.0,
          'line-opacity': 0.75,
        },
      });
    }

    if (!mapInstance.getLayer('tsunami-bypass-line')) {
      mapInstance.addLayer({
        id: 'tsunami-bypass-line',
        type: 'line',
        source: 'tsunami-zona-src',
        filter: ['==', '$type', 'LineString'],
        paint: {
          'line-color': '#10B981',
          'line-width': 3.5,
        },
      });
    }

    // 8. Stasiun Pemantauan Resmi BMKG Sumatera Barat (Data Faktual, Zero Hallucination)
    if (!mapInstance.getSource('stasiun-bmkg-src')) {
      mapInstance.addSource('stasiun-bmkg-src', {
        type: 'geojson',
        data: stasiunBmkgGeoJSON as any,
      });
    }

    if (!mapInstance.getLayer('stasiun-bmkg-halo')) {
      mapInstance.addLayer({
        id: 'stasiun-bmkg-halo',
        type: 'circle',
        source: 'stasiun-bmkg-src',
        filter: ['==', '$type', 'Point'],
        paint: {
          'circle-radius': 13,
          'circle-color': '#0284C7',
          'circle-opacity': 0.28,
        },
      });
    }

    if (!mapInstance.getLayer('stasiun-bmkg-circle')) {
      mapInstance.addLayer({
        id: 'stasiun-bmkg-circle',
        type: 'circle',
        source: 'stasiun-bmkg-src',
        filter: ['==', '$type', 'Point'],
        paint: {
          'circle-radius': 7.5,
          'circle-color': '#0284C7',
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#FFFFFF',
        },
      });
    }

    // 9. Skenario Run-Up Tsunami (Inundasi Bertingkat 6m, 8m, 12m)
    if (!mapInstance.getSource('tsunami-runup-src')) {
      mapInstance.addSource('tsunami-runup-src', {
        type: 'geojson',
        data: tsunamiRunUpGeoJSON,
      });
    }

    if (!mapInstance.getLayer('tsunami-runup-fill')) {
      mapInstance.addLayer({
        id: 'tsunami-runup-fill',
        type: 'fill',
        source: 'tsunami-runup-src',
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'fill-color': ['get', 'warna'],
          'fill-opacity': ['get', 'opacity'],
        },
      });
    }

    if (!mapInstance.getLayer('tsunami-runup-line')) {
      mapInstance.addLayer({
        id: 'tsunami-runup-line',
        type: 'line',
        source: 'tsunami-runup-src',
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'line-color': ['get', 'warna_stroke'],
          'line-width': 2.0,
          'line-opacity': 0.85,
        },
      });
    }

    // 10. Buffer Sempadan Aktif Sesar Semangko 100m (Setback Patahan)
    if (!mapInstance.getSource('sesar-buffer-src')) {
      mapInstance.addSource('sesar-buffer-src', {
        type: 'geojson',
        data: sesarBufferGeoJSON,
      });
    }

    if (!mapInstance.getLayer('sesar-buffer-fill')) {
      mapInstance.addLayer({
        id: 'sesar-buffer-fill',
        type: 'fill',
        source: 'sesar-buffer-src',
        paint: {
          'fill-color': '#B45309',
          'fill-opacity': 0.18,
        },
      });
    }

    if (!mapInstance.getLayer('sesar-buffer-line')) {
      mapInstance.addLayer({
        id: 'sesar-buffer-line',
        type: 'line',
        source: 'sesar-buffer-src',
        paint: {
          'line-color': '#F59E0B',
          'line-width': 1.2,
          'line-dasharray': [2, 2],
          'line-opacity': 0.65,
        },
      });
    }

    // 8. 3D Terrain (Topografi Elevasi Sumbar) jika mode 3D diaktifkan pengguna
    try {
      if (mapInstance.getSource('terrain-dem')) {
        mapInstance.setTerrain({ source: 'terrain-dem', exaggeration: 1.5 });
      }
    } catch (e) {
      console.debug('Terrain status:', e);
    }
  }, []);

  // Inisialisasi Peta MapLibre GL JS
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const sumbarMaxBounds: [number, number, number, number] = [96.5, -4.2, 103.0, 2.0];

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: `/styles/${styleVariant}.json`,
      center: [100.38, -0.92],
      zoom: 8.8,
      minZoom: 6.0,
      maxZoom: 19,
      maxBounds: sumbarMaxBounds,
      pitch: active3D ? 35 : 0,
      fadeDuration: 0,
      maxTileCacheSize: 80,
    });

    mapInstance.on('rotate', () => {
      setMapBearing(mapInstance.getBearing());
    });

    mapInstance.addControl(
      new maplibregl.ScaleControl({
        maxWidth: 120,
        unit: 'metric',
      }),
      'bottom-left'
    );

    const hoverPopup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 14,
      maxWidth: 'none',
      className: 'gis-hover-popup',
    });
    hoverPopupRef.current = hoverPopup;

    mapInstance.on('load', async () => {
      setMapLoaded(true);
      await registerCartoIcons(mapInstance);

      setupCustomLayers(mapInstance, styleVariantRef.current);
      applyLayerVisibility(mapInstance, layerVisibilityRef.current);

      // Helper Tooltip Posko Pengungsi & Faskes (Standar UN OCHA & BNPB)
      const handlePoskoHover = (e: any) => {
        mapInstance.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features.length > 0) {
          const p = e.features[0].properties;
          const isFaskes = p.jenis === 'fasilitas_kesehatan';
          const headerBadge = isFaskes
            ? '<span style="font-weight: 800; color: #10B981; font-size: 10.5px; letter-spacing: 0.02em;">🏥 POSKO MEDIS &amp; FASKES PENGUNGSI</span>'
            : '<span style="font-weight: 800; color: #FB923C; font-size: 10.5px; letter-spacing: 0.02em;">⛺ POSKO PENGUNGSI RESMI (UN OCHA/BNPB)</span>';
          const subBadge = isFaskes
            ? '<span style="font-size: 9px; font-weight: 700; background: rgba(16,185,129,0.2); color: #6EE7B7; padding: 1.5px 6px; border-radius: 4px; border: 1px solid rgba(16,185,129,0.4);">ISO 7001 MEDIS</span>'
            : '<span style="font-size: 9px; font-weight: 700; background: rgba(234,88,12,0.2); color: #FDBA74; padding: 1.5px 6px; border-radius: 4px; border: 1px solid rgba(234,88,12,0.4);">SHELTER EVAKUASI</span>';

          hoverPopup
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: 'Inter', -apple-system, sans-serif; width: 250px; box-sizing: border-box; color: #F8FAFC;">
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 5px; margin-bottom: 6px;">
                  ${headerBadge}
                  ${subBadge}
                </div>
                <div style="font-weight: 800; color: #FFF; font-size: 13px; margin-bottom: 5px; line-height: 1.3;">${p.nama}</div>
                <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; margin-bottom: 4px;">
                  <span style="color: #94A3B8;">Daya Tampung:</span>
                  <strong style="color: ${isFaskes ? '#34D399' : '#FB923C'}; font-weight: 800;">${p.kapasitas || '500'} Jiwa</strong>
                </div>
                <div style="color: #94A3B8; font-size: 10px; line-height: 1.35; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 4px;">
                  Logistik: Tenda Pengungsi, Dapur Umum, Air Bersih, MCK, Genset BPBD
                </div>
              </div>
            `)
            .addTo(mapInstance);
        }
      };

      const handlePoskoLeave = () => {
        mapInstance.getCanvas().style.cursor = '';
        hoverPopup.remove();
      };

      mapInstance.on('mousemove', 'posko-evakuasi-symbol', handlePoskoHover);
      mapInstance.on('mouseleave', 'posko-evakuasi-symbol', handlePoskoLeave);
      mapInstance.on('mousemove', 'posko-evakuasi-circle', handlePoskoHover);
      mapInstance.on('mouseleave', 'posko-evakuasi-circle', handlePoskoLeave);

      // Helper Tooltip & Popup Shelter TES/TEA Tsunami (UNESCO-IOC)
      const handleShelterHover = (e: any) => {
        mapInstance.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features.length > 0) {
          const p = e.features[0].properties;
          hoverPopup
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: 'Inter', -apple-system, sans-serif; width: 260px; box-sizing: border-box; color: #F8FAFC;">
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(56,189,248,0.3); padding-bottom: 5px; margin-bottom: 6px;">
                  <span style="font-weight: 800; color: #38BDF8; font-size: 10px; letter-spacing: 0.02em;">🏢 SHELTER VERTIKAL TES TSUNAMI</span>
                  <span style="font-size: 9px; font-weight: 700; background: rgba(56,189,248,0.2); color: #BAE6FD; padding: 1.5px 6px; border-radius: 4px; border: 1px solid rgba(56,189,248,0.4);">UNESCO-IOC</span>
                </div>
                <div style="font-weight: 800; color: #FFF; font-size: 13px; margin-bottom: 5px; line-height: 1.3;">${p.nama}</div>
                <div style="color: #E2E8F0; font-size: 11px; margin-bottom: 4px;">
                  Daya Tampung Vertikal: <strong style="color:#38BDF8; font-weight: 800;">${p.kapasitas || '-'}</strong> Jiwa
                </div>
                <div style="color: #94A3B8; font-size: 10px; line-height: 1.35; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 4px;">
                  Gedung Evakuasi Vertikal Bebas Rendaman KRB III-I Tsunami Padang
                </div>
              </div>
            `)
            .addTo(mapInstance);
        }
      };

      const handleShelterLeave = () => {
        mapInstance.getCanvas().style.cursor = '';
        hoverPopup.remove();
      };

      mapInstance.on('mousemove', 'shelter-tes-symbol', handleShelterHover);
      mapInstance.on('mouseleave', 'shelter-tes-symbol', handleShelterLeave);
      mapInstance.on('mousemove', 'shelter-tes-circle', handleShelterHover);
      mapInstance.on('mouseleave', 'shelter-tes-circle', handleShelterLeave);



      // Tooltip Jalan Terputus
      mapInstance.on('mousemove', 'jalan-terputus-line', (e) => {
        mapInstance.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties;
          hoverPopup
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: 'Inter', -apple-system, sans-serif; width: 240px; box-sizing: border-box; color: #F8FAFC;">
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(239,68,68,0.3); padding-bottom: 4px; margin-bottom: 6px;">
                  <span style="font-weight: 800; color: #EF4444; font-size: 10.5px; letter-spacing: 0.02em;">⚠️ RUAS JALAN TERPUTUS</span>
                </div>
                <div style="font-weight: 800; color: #F59E0B; font-size: 12px; text-transform: uppercase; margin-bottom: 4px;">${props.alasan}</div>
                <div style="color: #CBD5E1; font-size: 10px; line-height: 1.35;">${props.deskripsi || ''}</div>
              </div>
            `)
            .addTo(mapInstance);
        }
      });

      mapInstance.on('mouseleave', 'jalan-terputus-line', () => {
        mapInstance.getCanvas().style.cursor = '';
        hoverPopup.remove();
      });

      // Tooltip Vector Tile Choropleth
      mapInstance.on('mousemove', 'choropleth-kecamatan-fill', (e) => {
        mapInstance.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties;
          const nominal = Number(props.total_kerugian || 0);
          let rpText = 'Bebas Kerugian Tercatat';
          let color = '#2ECC71';
          if (nominal >= 1_500_000_000) {
            rpText = `Kerugian: Rp ${(nominal / 1_000_000_000).toFixed(2)} Miliar`;
            color = '#E74C3C';
          } else if (nominal >= 400_000_000) {
            rpText = `Kerugian: Rp ${(nominal / 1_000_000_000).toFixed(2)} Miliar`;
            color = '#F39C12';
          } else if (nominal > 0) {
            rpText = `Kerugian: Rp ${(nominal / 1_000_000).toFixed(0)} Juta`;
            color = '#F39C12';
          }

          hoverPopup
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: 'Inter', -apple-system, sans-serif; width: 230px; box-sizing: border-box; color: #F8FAFC;">
                <div style="font-weight: 800; color: #FFFFFF; font-size: 13px; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">
                  ${props.nama}
                </div>
                <div style="color: #94A3B8; font-size: 10px; margin-bottom: 4px;">
                  Tingkat Risiko: <strong style="text-transform: uppercase; color: ${color};">${props.tingkat_risiko || 'rendah'}</strong>
                </div>
                <div style="font-weight: 700; font-size: 11.5px; color: ${color}; font-family: monospace;">
                  ${rpText}
                </div>
                ${props.total_meninggal > 0 ? `<div style="color: #EF4444; font-size: 10px; font-weight: bold; margin-top: 4px;">&bull; Korban Jiwa: ${props.total_meninggal} Jiwa</div>` : ''}
              </div>
            `)
            .addTo(mapInstance);
        }
      });

      mapInstance.on('mouseleave', 'choropleth-kecamatan-fill', () => {
        mapInstance.getCanvas().style.cursor = '';
        hoverPopup.remove();
      });

      // Tooltip Patahan Sesar Semangko
      mapInstance.on('mousemove', 'sesar-semangko-core', (e) => {
        mapInstance.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features.length > 0) {
          const p = e.features[0].properties;
          hoverPopup
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: 'Inter', -apple-system, sans-serif; width: 290px; box-sizing: border-box; color: #F8FAFC;">
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(245,158,11,0.3); padding-bottom: 4px; margin-bottom: 6px;">
                  <span style="font-weight: 800; color: #F59E0B; font-size: 10.5px; letter-spacing: 0.02em;">
                    ⚡ PATAHAN AKTIF SESAR SEMANGKO
                  </span>
                  <span style="font-size: 9px; font-weight: 700; background: rgba(245,158,11,0.2); color: #FCD34D; padding: 1.5px 6px; border-radius: 4px; border: 1px solid rgba(245,158,11,0.4); white-space: nowrap;">
                    DARAT
                  </span>
                </div>
                <div style="font-weight: 800; color: #FFF; font-size: 13px; margin-bottom: 4px;">${p.nama}</div>
                <div style="display: flex; align-items: center; gap: 6px; font-size: 10px; margin-bottom: 4px;">
                  <span style="background: rgba(245,158,11,0.15); color: #FBBF24; padding: 1.5px 6px; border-radius: 4px; font-weight: 700;">
                    Potensi: ${p.potensi_mag}
                  </span>
                  <span style="color: #94A3B8;">${p.kedalaman}</span>
                </div>
                <div style="color: #94A3B8; font-size: 10px; margin-bottom: 4px;">
                  Slip Rate: <b style="color: #E2E8F0;">${p.slip_rate}</b> &bull; Lintasan: <span style="color: #E2E8F0;">${p.wilayah_lintasan}</span>
                </div>
                ${p.karakteristik ? `
                  <div style="color: #CBD5E1; font-size: 9.5px; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 4px; line-height: 1.35;">
                    ${p.karakteristik}
                  </div>
                ` : ''}
              </div>
            `)
            .addTo(mapInstance);
        }
      });

      mapInstance.on('mouseleave', 'sesar-semangko-core', () => {
        mapInstance.getCanvas().style.cursor = '';
        hoverPopup.remove();
      });

      // Helper Generator HTML Tooltip Megathrust Mentawai (Zero-Overflow & Calibrated Typography)
      const renderMegathrustTooltipHTML = (p: any, isTrench: boolean) => `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; width: 350px; max-width: 360px; box-sizing: border-box; color: #F8FAFC;">
          <!-- Header Badge -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; border-bottom: 1px solid rgba(244,63,94,0.3); padding-bottom: 6px; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 800; color: #FB7185; font-size: 11px; letter-spacing: 0.03em; text-transform: uppercase;">
              <span style="font-size: 13px;">🌊</span> MEGATHRUST MENTAWAI
            </div>
            <span style="font-size: 9.5px; font-weight: 800; background: rgba(225,29,72,0.25); color: #FDA4AF; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(225,29,72,0.5); white-space: nowrap; letter-spacing: 0.02em;">
              ${isTrench ? 'SUNDA TRENCH' : 'LOCKED PATCH'}
            </span>
          </div>

          <!-- Title & Magnitude -->
          <div style="font-weight: 800; color: #FFFFFF; font-size: 13px; line-height: 1.35; margin-bottom: 5px;">
            ${p.nama || (isTrench ? 'Garis Palung Megathrust Mentawai (Sunda Trench)' : 'Zona Kuncian Seismik Megathrust Mentawai')}
          </div>
          <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 10px; margin-bottom: 6px;">
            <span style="background: rgba(244,63,94,0.2); color: #FDA4AF; border: 1px solid rgba(244,63,94,0.4); border-radius: 4px; padding: 1.5px 6px; font-weight: 700;">
              ⚡ Potensi Maksimum M 8.9 (Mw)
            </span>
            <span style="background: rgba(245,158,11,0.2); color: #FCD34D; border: 1px solid rgba(245,158,11,0.4); border-radius: 4px; padding: 1.5px 6px; font-weight: 700;">
              Seismic Gap Aktif
            </span>
          </div>
          <div style="font-size: 10.5px; color: #CBD5E1; margin-bottom: 8px;">
            Tinggi Gelombang: <strong style="color: #FBBF24; font-weight: 800;">6 – 12 Meter</strong> di Bibir Pantai
          </div>

          <!-- Golden Time Grid Terpilah -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
            <div style="background: rgba(15,23,42,0.85); border: 1px solid rgba(56,189,248,0.35); border-radius: 8px; padding: 6px 8px; box-sizing: border-box;">
              <div style="font-size: 9px; font-weight: 700; color: #38BDF8; text-transform: uppercase; letter-spacing: 0.02em;">🏝️ Kep. Mentawai</div>
              <div style="font-size: 12px; font-weight: 800; color: #FFFFFF; margin: 2px 0 1px;">5 – 10 Menit</div>
              <div style="font-size: 9px; color: #94A3B8; line-height: 1.25;">Tiba sangat cepat (near-field)</div>
            </div>
            <div style="background: rgba(15,23,42,0.85); border: 1px solid rgba(148,163,184,0.35); border-radius: 8px; padding: 6px 8px; box-sizing: border-box;">
              <div style="font-size: 9px; font-weight: 700; color: #CBD5E1; text-transform: uppercase; letter-spacing: 0.02em;">🏙️ Daratan Pesisir</div>
              <div style="font-size: 12px; font-weight: 800; color: #FFFFFF; margin: 2px 0 1px;">20 – 30 Menit</div>
              <div style="font-size: 9px; color: #94A3B8; line-height: 1.25;">Padang, Pariaman, Pessel</div>
            </div>
          </div>

          <!-- Panduan Evakuasi Terpadu Berdasarkan Lokasi Pengguna -->
          <div style="border-radius: 8px; background: rgba(225,29,72,0.14); border: 1px solid rgba(225,29,72,0.4); padding: 7px 9px; font-size: 10px; line-height: 1.4; box-sizing: border-box;">
            <div style="font-weight: 800; color: #FECDD3; margin-bottom: 5px; display: flex; align-items: center; gap: 5px;">
              <span>⚠️</span> <span>PANDUAN PENYELAMATAN (JIKA GEMPA &gt; 1 MENIT):</span>
            </div>
            <div style="color: #F1F5F9; margin-bottom: 5px;">
              <strong style="color: #38BDF8;">🏝️ Pedoman Warga Mentawai:</strong><br/>
              Evakuasi mandiri ke <strong style="color: #FDE047;">perbukitan / dataran tinggi alami di pedalaman pulau (&gt; 15 mdpl)</strong> segera setelah gempa berhenti. Jangan menunggu bunyi sirine.
            </div>
            <div style="color: #F1F5F9;">
              <strong style="color: #CBD5E1;">🏙️ Daratan Pesisir (Padang, Pariaman, Pessel):</strong><br/>
              Naik ke <strong style="color: #FDE047;">Lantai 3+ Gedung Shelter TES</strong> terdekat, atau evakuasi horizontal ke arah Timur melewati <strong style="color: #FDE047;">Jalur Bypass Padang</strong>.
            </div>
          </div>
        </div>
      `;

      // Tooltip Megathrust Mentawai (Garis Palung & Zona Kuncian Seismik)
      mapInstance.on('mousemove', 'megathrust-trench-line', (e) => {
        mapInstance.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features.length > 0) {
          const p = e.features[0].properties;
          hoverPopup
            .setLngLat(e.lngLat)
            .setHTML(renderMegathrustTooltipHTML(p, true))
            .addTo(mapInstance);
        }
      });

      mapInstance.on('mouseleave', 'megathrust-trench-line', () => {
        mapInstance.getCanvas().style.cursor = '';
        hoverPopup.remove();
      });

      mapInstance.on('mousemove', 'megathrust-zone-fill', (e) => {
        mapInstance.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features.length > 0) {
          const p = e.features[0].properties;
          hoverPopup
            .setLngLat(e.lngLat)
            .setHTML(renderMegathrustTooltipHTML(p, false))
            .addTo(mapInstance);
        }
      });

      mapInstance.on('mouseleave', 'megathrust-zone-fill', () => {
        mapInstance.getCanvas().style.cursor = '';
        hoverPopup.remove();
      });

      // Tooltip Garis Bypass & Zona Tsunami Padang
      mapInstance.on('mousemove', 'tsunami-bypass-line', (e) => {
        mapInstance.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features.length > 0) {
          const p = e.features[0].properties;
          hoverPopup
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: 'Inter', -apple-system, sans-serif; width: 270px; box-sizing: border-box; color: #F8FAFC;">
                <div style="display: flex; align-items: center; gap: 5px; border-bottom: 1px solid rgba(16,185,129,0.3); padding-bottom: 4px; margin-bottom: 6px;">
                  <span style="font-weight: 800; color: #10B981; font-size: 10.5px;">🛡️ BATAS EVAKUASI AMAN TSUNAMI</span>
                </div>
                <div style="font-weight: 800; color: #FFF; font-size: 12.5px; margin-bottom: 4px;">${p.nama}</div>
                <div style="color: #CBD5E1; font-size: 10px; line-height: 1.4;">
                  ${p.karakteristik || 'Wilayah di sebelah Timur garis Bypass Padang berada pada elevasi > 15m dpl dan aman dari tsunami.'}
                </div>
              </div>
            `)
            .addTo(mapInstance);
        }
      });

      mapInstance.on('mouseleave', 'tsunami-bypass-line', () => {
        mapInstance.getCanvas().style.cursor = '';
        hoverPopup.remove();
      });

      // Tooltip Peringatan Cuaca Ekstrem & Banjir Lahar Hujan (Galodo)
      mapInstance.on('mousemove', 'cuaca-zone-fill', (e) => {
        mapInstance.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features.length > 0) {
          const p = e.features[0].properties;
          hoverPopup
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: 'Inter', -apple-system, sans-serif; width: 290px; box-sizing: border-box; color: #F8FAFC;">
                <div style="display: flex; align-items: center; gap: 5px; border-bottom: 1px solid rgba(245,158,11,0.3); padding-bottom: 4px; margin-bottom: 6px;">
                  <span style="font-weight: 800; color: ${p.warna || '#F59E0B'}; font-size: 10.5px;">⛈️ PERINGATAN DINI CUACA BMKG</span>
                </div>
                <div style="font-weight: 800; color: #FFF; font-size: 12.5px; margin-bottom: 4px;">${p.nama}</div>
                <div style="color: #FEF08A; font-size: 10.5px; font-weight: 700; margin-bottom: 3px;">
                  Status: ${p.tingkat_bahaya} &bull; ${p.curah_hujan || ''}
                </div>
                <div style="color: #94A3B8; font-size: 10px; margin-bottom: 3px;">
                  Wilayah: ${p.wilayah_terdampak || ''}
                </div>
                <div style="color: #CBD5E1; font-size: 9.5px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 4px; line-height: 1.35;">
                  ⚠️ ${p.ancaman || ''}
                </div>
              </div>
            `)
            .addTo(mapInstance);
        }
      });

      mapInstance.on('mouseleave', 'cuaca-zone-fill', () => {
        mapInstance.getCanvas().style.cursor = '';
        hoverPopup.remove();
      });

      // Tooltip Stasiun Pengamatan Resmi BMKG Sumatera Barat
      mapInstance.on('mousemove', 'stasiun-bmkg-circle', (e) => {
        mapInstance.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features.length > 0) {
          const p = e.features[0].properties;

          hoverPopup
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: 'Inter', -apple-system, sans-serif; width: 290px; box-sizing: border-box; color: #F8FAFC;">
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(56,189,248,0.4); padding-bottom: 5px; margin-bottom: 6px;">
                  <span style="font-weight: 800; color: #38BDF8; font-size: 10px; letter-spacing: 0.5px;">🏢 STASIUN RESMI BMKG SUMBAR</span>
                  <span style="font-size: 9px; font-weight: 700; color: #34D399; background: rgba(16,185,129,0.15); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(52,211,153,0.3);">
                    FAKTUAL
                  </span>
                </div>
                <div style="font-weight: 800; color: #FFF; font-size: 12.5px; margin-bottom: 3px;">${p.nama}</div>
                <div style="color: #93C5FD; font-size: 10.5px; font-weight: 600; margin-bottom: 5px;">
                  <span>📡 Klasifikasi:</span> <span>${p.kategori}</span>
                </div>
                <div style="background: rgba(15,23,32,0.8); border: 1px solid rgba(51,65,85,0.7); border-radius: 6px; padding: 6px 8px; font-size: 10px; line-height: 1.4; color: #CBD5E1; margin-bottom: 5px;">
                  <div>📍 <strong>Lokasi:</strong> ${p.lokasi}</div>
                  <div>🏷️ <strong>Kode WMO/ICAO:</strong> <span style="font-family: monospace; color: #38BDF8;">${p.kode_wmo}</span></div>
                  <div>🎯 <strong>Fungsi:</strong> ${p.tugas_utama}</div>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 9px; color: #94A3B8;">
                  <span>Status: <strong style="color: #34D399;">${p.status}</strong></span>
                  <span style="color: #64748B;">Lembaga Resmi BMKG</span>
                </div>
              </div>
            `)
            .addTo(mapInstance);
        }
      });

      mapInstance.on('mouseleave', 'stasiun-bmkg-circle', () => {
        mapInstance.getCanvas().style.cursor = '';
        hoverPopup.remove();
      });

      // Tooltip Skenario Run-Up Tsunami (Inundasi Bertingkat KRB Tsunami)
      mapInstance.on('mousemove', 'tsunami-runup-fill', (e) => {
        mapInstance.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features.length > 0) {
          const p = e.features[0].properties;
          const badgeBg = p.warna || '#EF4444';
          hoverPopup
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: 'Inter', -apple-system, sans-serif; width: 310px; box-sizing: border-box; color: #F8FAFC;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
                  <span style="font-weight: 800; color: #FFF; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.5px; background: ${badgeBg}; padding: 2px 7px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
                    ${p.tingkat_bahaya || 'ZONASI TSUNAMI'}
                  </span>
                  <span style="font-size: 9.5px; color: #94A3B8; font-weight: 600;">${p.krb_label || 'KRB BPBD'}</span>
                </div>
                <div style="font-weight: 800; color: #FFF; font-size: 13px; line-height: 1.3;">${p.skenario}</div>
                <div style="color: #E2E8F0; font-size: 10.5px; margin-top: 6px; background: rgba(255,255,255,0.06); padding: 5px 8px; border-radius: 6px; border-left: 3px solid ${badgeBg};">
                  Kedalaman Rendaman: <strong style="color:${badgeBg}; font-size: 11.5px;">${p.kedalaman_rendaman}</strong>
                </div>
                <div style="color: #CBD5E1; font-size: 10px; margin-top: 5px; line-height: 1.35;">
                  📍 <strong>Kawasan:</strong> ${p.zona}
                </div>
                <div style="color: #94A3B8; font-size: 9.5px; margin-top: 4px; font-style: italic;">
                  ⚡ ${p.dampak_fisik}
                </div>
                <div style="color: #38BDF8; font-size: 9.5px; margin-top: 5px; font-weight: 600; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 4px;">
                  🛡️ ${p.protokol_evakuasi}
                </div>
              </div>
            `)
            .addTo(mapInstance);
        }
      });

      mapInstance.on('mouseleave', 'tsunami-runup-fill', () => {
        mapInstance.getCanvas().style.cursor = '';
        hoverPopup.remove();
      });

      // Tooltip Buffer Sempadan Aktif Sesar
      mapInstance.on('mousemove', 'sesar-buffer-fill', (e) => {
        mapInstance.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features.length > 0) {
          const p = e.features[0].properties;
          hoverPopup
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: 'Inter', -apple-system, sans-serif; width: 260px; box-sizing: border-box; color: #F8FAFC;">
                <div style="display: flex; align-items: center; gap: 5px; border-bottom: 1px solid rgba(245,158,11,0.3); padding-bottom: 4px; margin-bottom: 6px;">
                  <span style="font-weight: 800; color: #F59E0B; font-size: 10.5px;">📐 SEMPADAN AKTIF SESAR (100M)</span>
                </div>
                <div style="font-weight: 800; color: #FFF; font-size: 12px; margin-bottom: 3px;">${p.nama}</div>
                <div style="color: #CBD5E1; font-size: 9.5px; line-height: 1.35;">
                  ${p.ketetapan}
                </div>
              </div>
            `)
            .addTo(mapInstance);
        }
      });

      mapInstance.on('mouseleave', 'sesar-buffer-fill', () => {
        mapInstance.getCanvas().style.cursor = '';
        hoverPopup.remove();
      });

      // Klik Poligon Vector Tile Wilayah
      mapInstance.on('click', 'choropleth-kecamatan-fill', (e) => {
        // Jika mode penentuan titik awal evakuasi aktif, jangan drill-down wilayah
        if (isPickingLocationRef.current) {
          return;
        }
        // Jika layer choropleth sedang dimatikan (ikon mata tertutup), jangan aktifkan drill-down wilayah
        if (layerVisibilityRef.current && !layerVisibilityRef.current.choropleth) {
          return;
        }
        // FIX: Tutup tooltip & stop propagasi agar tidak memicu spatial lookup ganda
        hoverPopup.remove();
        e.originalEvent.stopPropagation();
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const wilayahId = feature.properties?.id;
          if (wilayahId && onSelectWilayahRef.current) {
            onSelectWilayahRef.current(wilayahId, feature.properties);
          }
        }
      });

      // Handler Klik pada Poligon Garis Batas Kecamatan yang sedang aktif
      mapInstance.on('click', 'selected-boundaries-fill', (e) => {
        if (isPickingLocationRef.current) return;
        // FIX: Tutup tooltip hover agar tidak menggantung setelah klik
        hoverPopup.remove();
        // FIX: Hentikan event bubbling ke global click handler agar tidak memicu spatial lookup ganda
        e.originalEvent.stopPropagation();
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const wid = feature.properties?.id;
          if (wid && onSelectWilayahRef.current) {
            const props = {
              ...feature.properties,
              lat: feature.properties?.lat || feature.properties?.center_lat || feature.properties?.y || e.lngLat.lat,
              lon: feature.properties?.lon || feature.properties?.center_lon || feature.properties?.x || e.lngLat.lng,
              parent_nama: feature.properties?.kabupaten || feature.properties?.parent_nama || 'Sumatera Barat'
            };
            onSelectWilayahRef.current(wid, props);
          }
        }
      });

      // =======================================================================
      // PENYELESAIAN DEAD-CLICK & INTERAKSI SENTUH LAYAR LAPANGAN (FASE 4)
      // =======================================================================

      // 1. Klik Layer Posko & Shelter TES
      const poskoLayerIds = [
        'posko-evakuasi-symbol', 'posko-evakuasi-circle',
        'shelter-tes-symbol', 'shelter-tes-circle'
      ];

      poskoLayerIds.forEach((layerId) => {
        if (mapInstance.getLayer(layerId)) {
          mapInstance.on('click', layerId, (e) => {
            if (isPickingLocationRef.current) return;
            hoverPopup.remove();
            e.originalEvent.stopPropagation();
            if (e.features && e.features.length > 0 && onPoskoClickRef.current) {
              const props = e.features[0].properties || {};
              const coords = (e.features[0].geometry as any)?.coordinates;
              const lat = coords ? coords[1] : e.lngLat.lat;
              const lon = coords ? coords[0] : e.lngLat.lng;
              let fasilitasParsed: string[] = [];
              try {
                if (typeof props.fasilitas === 'string') {
                  fasilitasParsed = JSON.parse(props.fasilitas);
                } else if (Array.isArray(props.fasilitas)) {
                  fasilitasParsed = props.fasilitas;
                }
              } catch (_) { }

              onPoskoClickRef.current({
                ...props,
                lat,
                lon,
                fasilitas: fasilitasParsed
              });
            }
          });
          mapInstance.on('mouseenter', layerId, () => {
            if (!isPickingLocationRef.current) mapInstance.getCanvas().style.cursor = 'pointer';
          });
          mapInstance.on('mouseleave', layerId, () => {
            if (!isPickingLocationRef.current) mapInstance.getCanvas().style.cursor = '';
          });
        }
      });

      // 2. Klik Layer Jalan Terputus (Blokade)
      if (mapInstance.getLayer('jalan-terputus-line')) {
        mapInstance.on('click', 'jalan-terputus-line', (e) => {
          if (isPickingLocationRef.current) return;
          hoverPopup.remove();
          e.originalEvent.stopPropagation();
          if (e.features && e.features.length > 0 && onJalanClickRef.current) {
            const props = e.features[0].properties || {};
            onJalanClickRef.current({
              id: props.id,
              alasan: props.alasan || 'Ruas Jalan Terputus',
              deskripsi: props.deskripsi,
              status: props.status || 'aktif'
            });
          }
        });
        mapInstance.on('mouseenter', 'jalan-terputus-line', () => {
          if (!isPickingLocationRef.current) mapInstance.getCanvas().style.cursor = 'pointer';
        });
        mapInstance.on('mouseleave', 'jalan-terputus-line', () => {
          if (!isPickingLocationRef.current) mapInstance.getCanvas().style.cursor = '';
        });
      }

      // 3. Klik Layer Sesar Semangko (Patahan Aktif Darat)
      const sesarLayers = ['sesar-semangko-core', 'sesar-semangko-casing'];
      sesarLayers.forEach((layerId) => {
        if (mapInstance.getLayer(layerId)) {
          mapInstance.on('click', layerId, (e) => {
            if (isPickingLocationRef.current) return;
            hoverPopup.remove();
            e.originalEvent.stopPropagation();
            if (e.features && e.features.length > 0 && onAncamanClickRef.current) {
              const p = e.features[0].properties || {};
              onAncamanClickRef.current({
                tipe: 'sesar',
                judul: p.nama || 'Patahan Aktif Sesar Semangko',
                subJudul: `Potensi: ${p.potensi_mag || 'M 7.0 - 7.6'} • Slip Rate: ${p.slip_rate || '11-27 mm/th'}`,
                badge: 'SESAR AKTIF DARAT',
                properties: p
              });
            }
          });
        }
      });

      // 4. Klik Layer Megathrust Mentawai (Zona Subduksi)
      const megathrustLayers = ['megathrust-trench-line', 'megathrust-zone-fill'];
      megathrustLayers.forEach((layerId) => {
        if (mapInstance.getLayer(layerId)) {
          mapInstance.on('click', layerId, (e) => {
            if (isPickingLocationRef.current) return;
            hoverPopup.remove();
            e.originalEvent.stopPropagation();
            if (e.features && e.features.length > 0 && onAncamanClickRef.current) {
              const p = e.features[0].properties || {};
              onAncamanClickRef.current({
                tipe: 'megathrust',
                judul: p.nama || 'Zona Kuncian Megathrust Mentawai',
                subJudul: 'Potensi Maksimum M 8.9 (Mw) • Sunda Trench & Locked Patch',
                badge: 'ZONA SUBDUKSI SEISMIK',
                properties: p
              });
            }
          });
        }
      });

      // 5. Klik Layer Peringatan Cuaca & Pos Pantau Lahar
      const cuacaLayers = ['cuaca-zone-fill', 'cuaca-point-circle'];
      cuacaLayers.forEach((layerId) => {
        if (mapInstance.getLayer(layerId)) {
          mapInstance.on('click', layerId, (e) => {
            if (isPickingLocationRef.current) return;
            hoverPopup.remove();
            e.originalEvent.stopPropagation();
            if (e.features && e.features.length > 0 && onAncamanClickRef.current) {
              const p = e.features[0].properties || {};
              onAncamanClickRef.current({
                tipe: 'cuaca',
                judul: p.nama || 'Peringatan Cuaca Ekstrem BMKG',
                subJudul: `Status: ${p.tingkat_bahaya || 'Siaga'} • Wilayah: ${p.wilayah_terdampak || 'Sumbar'}`,
                badge: 'PERINGATAN BMKG',
                properties: p
              });
            }
          });
        }
      });

      // 6. Klik Layer Sempadan Patahan Aktif Sesar (Buffer 100m)
      if (mapInstance.getLayer('sesar-buffer-fill')) {
        mapInstance.on('click', 'sesar-buffer-fill', (e) => {
          if (isPickingLocationRef.current) return;
          hoverPopup.remove();
          e.originalEvent.stopPropagation();
          if (e.features && e.features.length > 0 && onAncamanClickRef.current) {
            const p = e.features[0].properties || {};
            onAncamanClickRef.current({
              tipe: 'sesar',
              judul: p.nama || 'Zona Sempadan Patahan Aktif (Buffer 100m)',
              subJudul: 'Setback Larangan Bangunan Vital & Pemukiman Padat di Jalur Sesar',
              badge: 'SEMPADAN AKTIF SESAR',
              properties: {
                ...p,
                buffer: '100 Meter',
                tipe_patahan: 'Dextral Strike-Slip',
              }
            });
          }
        });
      }

      // 7. Klik Layer Zona Bahaya Tsunami (Rendaman, Run-Up KRB, Garis Bypass)
      const tsunamiLayers = ['tsunami-zona-merah-fill', 'tsunami-runup-fill', 'tsunami-bypass-line'];
      tsunamiLayers.forEach((layerId) => {
        if (mapInstance.getLayer(layerId)) {
          mapInstance.on('click', layerId, (e) => {
            if (isPickingLocationRef.current) return;
            hoverPopup.remove();
            e.originalEvent.stopPropagation();
            if (e.features && e.features.length > 0 && onAncamanClickRef.current) {
              const p = e.features[0].properties || {};
              onAncamanClickRef.current({
                tipe: 'tsunami_zone',
                judul: p.skenario || p.nama || (layerId === 'tsunami-bypass-line' ? 'Garis Aman Evakuasi Bypass Padang' : 'Zonasi Inundasi Tsunami'),
                subJudul: p.zona || (layerId === 'tsunami-bypass-line' ? 'Batas Minimum Evakuasi Menuju Wilayah Ketinggian Aman' : 'Kawasan Rawan Bencana (KRB) Tsunami Pesisir'),
                badge: layerId === 'tsunami-bypass-line' ? 'BATAS EVAKUASI AMAN' : (p.tingkat_bahaya || 'KRB III TSUNAMI'),
                properties: p
              });
            }
          });
        }
      });

      // Tooltip Hover pada Garis Batas Perkecamatan
      mapInstance.on('mousemove', 'selected-boundaries-fill', (e) => {
        if (isPickingLocationRef.current) return;
        mapInstance.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties;
          const namaKecamatan = props.name || props.nama || 'Kecamatan';
          const namaKabupaten = props.kabupaten || props.parent_nama || 'Sumatera Barat';
          const nominal = Number(props.total_kerugian || 0);
          let rpText = 'Wilayah Pantauan Kebencanaan';
          let color = '#38BDF8';
          if (nominal >= 1_500_000_000 || props.total_meninggal > 0) {
            rpText = nominal > 0 ? `Estimasi Kerugian: Rp ${(nominal / 1_000_000_000).toFixed(2)} M` : 'Zona Rawan Bencana';
            color = '#EF4444';
          } else if (nominal >= 400_000_000) {
            rpText = `Estimasi Kerugian: Rp ${(nominal / 1_000_000_000).toFixed(2)} M`;
            color = '#F59E0B';
          }

          hoverPopup
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family: 'Inter', -apple-system, sans-serif; width: 220px; box-sizing: border-box; color: #F8FAFC; padding: 2px;">
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(56,189,248,0.3); padding-bottom: 4px; margin-bottom: 5px;">
                  <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #38BDF8; letter-spacing: 0.5px;">${namaKabupaten}</span>
                  <span style="font-size: 9px; font-family: monospace; background: rgba(56,189,248,0.2); color: #BAE6FD; padding: 1px 5px; border-radius: 4px; border: 1px solid rgba(56,189,248,0.4);">Kecamatan</span>
                </div>
                <div style="font-weight: 800; color: #FFFFFF; font-size: 13.5px; margin-bottom: 4px; line-height: 1.25;">
                  Kecamatan ${namaKecamatan}
                </div>
                <div style="font-size: 10.5px; color: ${color}; font-weight: 700; margin-bottom: 4px;">
                  &bull; ${rpText}
                </div>
                <div style="font-size: 9.5px; color: #94A3B8; font-family: monospace; display: flex; align-items: center; gap: 4px;">
                  <span>🔍</span> Klik untuk detail & fasilitas evakuasi
                </div>
              </div>
            `)
            .addTo(mapInstance);
        }
      });

      mapInstance.on('mouseenter', 'selected-boundaries-fill', () => {
        if (!isPickingLocationRef.current) {
          mapInstance.getCanvas().style.cursor = 'pointer';
        }
      });

      mapInstance.on('mouseleave', 'selected-boundaries-fill', () => {
        if (!isPickingLocationRef.current) {
          mapInstance.getCanvas().style.cursor = '';
          hoverPopup.remove();
        }
      });

      // Global Map Click Handler
      mapInstance.on('click', (e) => {
        // 1. Prioritas Utama: Penentuan Titik Awal Evakuasi Pengguna di Peta
        if (isPickingLocationRef.current) {
          if (onPickLocationRef.current) {
            onPickLocationRef.current({
              lat: parseFloat(e.lngLat.lat.toFixed(5)),
              lng: parseFloat(e.lngLat.lng.toFixed(5)),
            });
          }
          return;
        }

        // Jika layer choropleth sedang dimatikan oleh pengguna, abaikan pencarian wilayah otomatis
        if (layerVisibilityRef.current && !layerVisibilityRef.current.choropleth) {
          return;
        }

        // 2. Spatial Lookup jika klik area peta di luar poligon
        // Amankan: Hanya query layer yang benar-benar ada di map untuk mencegah fatal error MapLibre:
        // "The layer '...' does not exist in the map's style and cannot be queried for features."
        const validCandidateLayers = [
          'choropleth-kecamatan-fill',
          'selected-boundaries-fill',  // FIX: Sertakan layer kecamatan aktif agar klik tidak memicu lookup ganda
          'posko-evakuasi-symbol',
          'posko-evakuasi-circle',
          'shelter-tes-symbol',
          'shelter-tes-circle',
          'jalan-terputus-line',
          'sesar-semangko-core',
          'megathrust-trench-line',
          'tsunami-bypass-line',
          'cuaca-zone-fill',
          'cuaca-point-circle'
        ].filter((id) => {
          try {
            return !!mapInstance.getLayer(id);
          } catch {
            return false;
          }
        });

        let features: any[] = [];
        try {
          if (validCandidateLayers.length > 0) {
            features = mapInstance.queryRenderedFeatures(e.point, {
              layers: validCandidateLayers,
            });
          }
        } catch (err) {
          console.debug('Error in queryRenderedFeatures:', err);
        }

        if (features.length === 0 && onSelectWilayahRef.current) {
          fetch(`/api/wilayah/lookup?lat=${e.lngLat.lat}&lon=${e.lngLat.lng}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data && data.id && onSelectWilayahRef.current) {
                // Pastikan choropleth masih aktif saat respons backend diterima
                if (layerVisibilityRef.current?.choropleth) {
                  onSelectWilayahRef.current(data.id, data);
                }
              }
            })
            .catch(() => { });
        }
      });
    });

    mapInstance.on('mousemove', (e: maplibregl.MapMouseEvent) => {
      if (isPickingLocationRef.current) {
        setMousePos({ x: e.point.x, y: e.point.y });
      }
      if (onCoordinatesChange) {
        onCoordinatesChange({
          lng: parseFloat(e.lngLat.lng.toFixed(5)),
          lat: parseFloat(e.lngLat.lat.toFixed(5)),
          zoom: parseFloat(mapInstance.getZoom().toFixed(2)),
        });
      }
    });

    mapInstance.on('mouseout', () => {
      setMousePos(null);
    });

    map.current = mapInstance;

    return () => {
      hoverPopup.remove();
      mapInstance.remove();
      map.current = null;
      setMapLoaded(false);
    };
  }, []);


  // Handler Pergantian Style Terang / Gelap Kustom (05-peta-gis.md)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    // Mencegah reload style jika styleVariant tidak benar-benar berubah
    if (currentStyleVariantRef.current === styleVariant) return;
    currentStyleVariantRef.current = styleVariant;

    const targetStyle = `/styles/${styleVariant}.json`;
    map.current.setStyle(targetStyle);

    // Pasang kembali seluruh layer kustom begitu style baru selesai dimuat
    map.current.once('style.load', async () => {
      if (map.current) {
        await registerCartoIcons(map.current);
        setupCustomLayers(map.current, styleVariant);
        applyLayerVisibility(map.current, layerVisibilityRef.current);
        if (map.current.getLayer('choropleth-kecamatan-highlight')) {
          map.current.setFilter('choropleth-kecamatan-highlight', [
            '==',
            ['get', 'id'],
            selectedWilayahIdRef.current || -1,
          ]);
        }
      }
    });
  }, [styleVariant, mapLoaded, setupCustomLayers, applyLayerVisibility]);

  // Handler Mode 3D Terrain (Topografi 3D vs 2D Dingin & Ringan)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    if (active3D) {
      try {
        if (map.current.getSource('terrain-dem')) {
          map.current.setTerrain({ source: 'terrain-dem', exaggeration: 1.5 });
          map.current.easeTo({ pitch: 38, duration: 600 });
        }
      } catch (e) {
        console.debug('Terrain activation error:', e);
      }
    } else {
      map.current.setTerrain(null);
      map.current.easeTo({ pitch: 0, bearing: 0, duration: 600 });
    }
  }, [active3D, mapLoaded]);

  // Update Highlight Wilayah Terpilih pada Vector Tile
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    if (map.current.getLayer('choropleth-kecamatan-highlight')) {
      map.current.setFilter('choropleth-kecamatan-highlight', [
        '==',
        ['get', 'id'],
        selectedWilayahId || -1,
      ]);
      const isChoroplethVisible = layerVisibility?.choropleth ?? true;
      map.current.setLayoutProperty(
        'choropleth-kecamatan-highlight',
        'visibility',
        isChoroplethVisible && selectedWilayahId ? 'visible' : 'none'
      );
    }
  }, [selectedWilayahId, mapLoaded, layerVisibility?.choropleth]);

  // Update Source Data Poligon Garis Batas Wilayah Kabupaten/Kota & Seluruh Kecamatan (Isolasi Fokus)
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const source = map.current.getSource('selected-boundaries-src') as maplibregl.GeoJSONSource;
    const isChoroplethVisible = layerVisibility?.choropleth ?? true;

    if (source) {
      if (selectedBoundariesGeoJSON && selectedBoundariesGeoJSON.features && selectedBoundariesGeoJSON.features.length > 0) {
        source.setData(selectedBoundariesGeoJSON);

        // 1. Tampilkan poligon & garis pembatas kecamatan di dalam wilayah yang dicari
        if (map.current.getLayer('selected-boundaries-fill')) {
          map.current.setLayoutProperty('selected-boundaries-fill', 'visibility', 'visible');
        }
        if (map.current.getLayer('selected-boundaries-line')) {
          map.current.setLayoutProperty('selected-boundaries-line', 'visibility', 'visible');
        }
        if (map.current.getLayer('selected-boundaries-labels')) {
          map.current.setLayoutProperty('selected-boundaries-labels', 'visibility', 'visible');
        }

        // 2. ISOLASI FOKUS TOTAL: Nonaktifkan sepenuhnya batas & fill kabupaten lain agar user fokus
        if (map.current.getLayer('choropleth-kecamatan-line')) {
          map.current.setLayoutProperty('choropleth-kecamatan-line', 'visibility', 'none');
        }
        if (map.current.getLayer('choropleth-kecamatan-fill')) {
          map.current.setLayoutProperty('choropleth-kecamatan-fill', 'visibility', 'none');
        }

        // 3. SMART FITBOUNDS: Kalkulasi Bounding Box dari seluruh poligon batas wilayah terpilih
        // Menjamin 100% wilayah kabupaten/kota muat sempurna di layar tanpa over-zoom atau terpotong
        try {
          const bounds = new maplibregl.LngLatBounds();
          let coordCount = 0;
          const collectCoords = (coords: any) => {
            if (Array.isArray(coords) && coords.length >= 2 && typeof coords[0] === 'number') {
              bounds.extend([coords[0], coords[1]]);
              coordCount++;
            } else if (Array.isArray(coords)) {
              coords.forEach(collectCoords);
            }
          };

          selectedBoundariesGeoJSON.features.forEach((feature: any) => {
            if (feature.geometry && feature.geometry.coordinates) {
              collectCoords(feature.geometry.coordinates);
            }
          });

          if (coordCount > 0 && !bounds.isEmpty()) {
            map.current.fitBounds(bounds, {
              padding: { top: 75, bottom: 85, left: 340, right: 75 },
              duration: 1100,
              maxZoom: 11.2,
            });
          }
        } catch (fitErr) {
          console.debug('Smart FitBounds calculation error:', fitErr);
        }
      } else {
        source.setData({ type: 'FeatureCollection', features: [] });
        if (map.current.getLayer('selected-boundaries-fill')) {
          map.current.setLayoutProperty('selected-boundaries-fill', 'visibility', 'none');
        }
        if (map.current.getLayer('selected-boundaries-line')) {
          map.current.setLayoutProperty('selected-boundaries-line', 'visibility', 'none');
        }
        if (map.current.getLayer('selected-boundaries-labels')) {
          map.current.setLayoutProperty('selected-boundaries-labels', 'visibility', 'none');
        }

        // Kembalikan batas-batas makro 19 Kabupaten/Kota saat filter direset
        if (map.current.getLayer('choropleth-kecamatan-line')) {
          map.current.setLayoutProperty(
            'choropleth-kecamatan-line',
            'visibility',
            isChoroplethVisible ? 'visible' : 'none'
          );
        }
        if (map.current.getLayer('choropleth-kecamatan-fill')) {
          map.current.setLayoutProperty(
            'choropleth-kecamatan-fill',
            'visibility',
            isChoroplethVisible ? 'visible' : 'none'
          );
          map.current.setPaintProperty('choropleth-kecamatan-fill', 'fill-opacity', styleVariant === 'satelit' ? 0.45 : 0.65);
        }
      }
    }
  }, [selectedBoundariesGeoJSON, mapLoaded, layerVisibility?.choropleth, styleVariant]);

  // Update Highlight Kecamatan Spesifik pada Poligon Batas Wilayah
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    if (map.current.getLayer('selected-boundaries-subdistrict-highlight')) {
      if (selectedKecamatanHighlightId) {
        const targetId = Number(selectedKecamatanHighlightId);
        map.current.setFilter('selected-boundaries-subdistrict-highlight', [
          'any',
          ['==', ['get', 'id'], isNaN(targetId) ? -1 : targetId],
          ['==', ['to-string', ['get', 'id']], String(selectedKecamatanHighlightId)],
          ['==', ['get', 'nama'], String(selectedKecamatanHighlightId)]
        ]);
        map.current.setLayoutProperty('selected-boundaries-subdistrict-highlight', 'visibility', 'visible');
      } else {
        map.current.setLayoutProperty('selected-boundaries-subdistrict-highlight', 'visibility', 'none');
      }
    }
  }, [selectedKecamatanHighlightId, mapLoaded]);

  // Update Jalan Terputus saat versi bertambah
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const source = map.current.getSource('jalan-terputus-src') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(`/api/jalan-terputus?t=${Date.now()}`);
    }
  }, [jalanVersion, mapLoaded]);

  // Update Posko & Shelter TES saat versi posko bertambah
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const pSrc = map.current.getSource('posko-evakuasi-src') as maplibregl.GeoJSONSource;
    if (pSrc) {
      pSrc.setData(`/api/posko?t=${Date.now()}`);
    }
    const sSrc = map.current.getSource('shelter-tes-src') as maplibregl.GeoJSONSource;
    if (sSrc) {
      sSrc.setData(`/api/posko?jenis=shelter_tes_tea&t=${Date.now()}`);
    }
  }, [poskoVersion, mapLoaded]);

  // Update Layer Visibility Dinamis dari LayerControlPanel
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    applyLayerVisibility(map.current, layerVisibility);
  }, [layerVisibility, mapLoaded, applyLayerVisibility]);

  // Update Opasitas Lapisan Spasial Dinamis
  useEffect(() => {
    if (!map.current || !mapLoaded || !layerOpacities) return;
    const m = map.current;
    try {
      if (layerOpacities.choropleth !== undefined && m.getLayer('choropleth-kecamatan-fill')) {
        m.setPaintProperty('choropleth-kecamatan-fill', 'fill-opacity', layerOpacities.choropleth);
      }
      if (layerOpacities.zonaTsunami !== undefined && m.getLayer('tsunami-zona-merah-fill')) {
        m.setPaintProperty('tsunami-zona-merah-fill', 'fill-opacity', layerOpacities.zonaTsunami);
      }
      if (layerOpacities.tsunamiRunup !== undefined && m.getLayer('tsunami-runup-fill')) {
        m.setPaintProperty('tsunami-runup-fill', 'fill-opacity', layerOpacities.tsunamiRunup);
      }
      if (layerOpacities.cuaca !== undefined && m.getLayer('cuaca-zone-fill')) {
        m.setPaintProperty('cuaca-zone-fill', 'fill-opacity', layerOpacities.cuaca);
      }
      if (layerOpacities.sesarBuffer !== undefined && m.getLayer('sesar-buffer-fill')) {
        m.setPaintProperty('sesar-buffer-fill', 'fill-opacity', layerOpacities.sesarBuffer);
      }
      if (layerOpacities.megathrust !== undefined && m.getLayer('megathrust-zone-fill')) {
        m.setPaintProperty('megathrust-zone-fill', 'fill-opacity', layerOpacities.megathrust);
      }
    } catch (err) {
      console.debug('Gagal menerapkan opasitas layer:', err);
    }
  }, [layerOpacities, mapLoaded]);

  // Efek Kursor saat Mode Penentuan Titik Evakuasi di Peta Aktif
  useEffect(() => {
    if (!map.current) return;
    const canvas = map.current.getCanvas();
    if (isPickingLocation) {
      canvas.style.cursor = 'crosshair';
    } else {
      canvas.style.cursor = '';
    }
  }, [isPickingLocation]);

  // Update Rute Evakuasi
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const source = map.current.getSource('route-evakuasi-src') as maplibregl.GeoJSONSource;
    if (source) {
      if (routeGeometry) {
        source.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: routeGeometry,
              properties: {},
            },
          ],
        });

        if (routeGeometry.coordinates && routeGeometry.coordinates.length > 0) {
          const bounds = new maplibregl.LngLatBounds();
          routeGeometry.coordinates.forEach((coord: number[]) => {
            bounds.extend([coord[0], coord[1]]);
          });
          map.current.fitBounds(bounds, {
            padding: { top: 70, bottom: 90, left: 340, right: 70 },
            duration: 1000,
          });
        }
      } else {
        source.setData({
          type: 'FeatureCollection',
          features: [],
        });
      }
    }
  }, [routeGeometry, mapLoaded]);

  // Marker Lokasi Pengguna
  useEffect(() => {
    if (!map.current) return;
    if (userCoords) {
      if (!userMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'gis-user-location-marker';
        el.innerHTML = `
          <div style="position: relative; width: 24px; height: 24px;">
            <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(0, 240, 255, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; border-radius: 50%; background: #00F0FF; border: 2.5px solid #FFFFFF; box-shadow: 0 0 10px rgba(0,240,255,0.8);"></div>
          </div>
        `;
        userMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([userCoords.lng, userCoords.lat])
          .addTo(map.current);
      } else {
        userMarkerRef.current.setLngLat([userCoords.lng, userCoords.lat]);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userCoords]);

  // Marker Posko Tujuan
  useEffect(() => {
    if (!map.current) return;
    if (poskoCoords) {
      if (!poskoMarkerRef.current) {
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="background: #10B981; color: white; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.5); white-space: nowrap; border: 1px solid #34D399; margin-bottom: 2px;">
              🏁 ${poskoCoords.nama || 'Posko Tujuan'}
            </div>
            <div style="width: 14px; height: 14px; background: #10B981; border: 2.5px solid white; border-radius: 50%; box-shadow: 0 0 8px rgba(16,185,129,0.8);"></div>
          </div>
        `;
        poskoMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([poskoCoords.lng, poskoCoords.lat])
          .addTo(map.current);
      } else {
        poskoMarkerRef.current.setLngLat([poskoCoords.lng, poskoCoords.lat]);
      }
    } else if (poskoMarkerRef.current) {
      poskoMarkerRef.current.remove();
      poskoMarkerRef.current = null;
    }
  }, [poskoCoords]);

  // Marker Gempa & Potensi Tsunami BMKG (High-Fidelity Waves Visualizer)
  useEffect(() => {
    if (!map.current) return;
    if (gempaData && gempaData.lon && gempaData.lat) {
      if (!gempaMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'gis-gempa-epicenter-marker group';
        el.title = `Pusat Gempa M ${gempaData.magnitude} - ${gempaData.wilayah_teks}`;

        const isTsunami = !!gempaData.potensi_tsunami;

        el.innerHTML = `
          <div style="position: relative; width: 64px; height: 64px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
            <!-- 3 Cincin Gelombang Tsunami Ripple -->
            <div class="animate-tsunami-ring-1" style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: ${isTsunami ? 'rgba(239, 68, 68, 0.45)' : 'rgba(244, 63, 94, 0.35)'}; border: 1.5px solid rgba(239, 68, 68, 0.7);"></div>
            <div class="animate-tsunami-ring-2" style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: ${isTsunami ? 'rgba(220, 38, 38, 0.35)' : 'rgba(244, 63, 94, 0.25)'}; border: 1px dashed rgba(239, 68, 68, 0.5);"></div>
            <div class="animate-tsunami-ring-3" style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: ${isTsunami ? 'rgba(185, 28, 28, 0.25)' : 'rgba(244, 63, 94, 0.15)'}; border: 1px solid rgba(239, 68, 68, 0.3);"></div>
            
            <!-- Inti Episentrum Merah Menyala -->
            <div class="marker-tsunami-epicenter" style="position: absolute; width: ${isTsunami ? '38px' : '32px'}; height: ${isTsunami ? '38px' : '32px'}; border-radius: 50%; background: ${isTsunami ? '#DC2626' : '#EF4444'}; border: 3px solid #FFFFFF; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 11px; z-index: 10;">
              <span>M${gempaData.magnitude}</span>
            </div>

            <!-- Label Teks Melayang Status Bahaya -->
            <div style="position: absolute; bottom: -28px; white-space: nowrap; background: rgba(15, 23, 32, 0.95); border: 1.5px solid ${isTsunami ? '#EF4444' : '#F43F5E'}; color: ${isTsunami ? '#FCA5A5' : '#FECDD3'}; font-weight: 800; font-size: 10px; padding: 2px 8px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.6); pointer-events: none; letter-spacing: 0.03em;">
              ${isTsunami ? '⚠️ POTENSI TSUNAMI' : 'PUSAT GEMPA RIIL'}
            </div>
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 25, className: 'gis-hover-popup', maxWidth: 'none' }).setHTML(`
          <div style="font-family: 'Inter', -apple-system, sans-serif; width: 280px; box-sizing: border-box; color: #F8FAFC; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 5px; border-bottom: 1.5px solid rgba(239,68,68,0.4); padding-bottom: 6px; margin-bottom: 8px;">
              <span style="font-weight: 900; color: #EF4444; font-size: 12px; letter-spacing: 0.04em;">⚠️ BMKG TEWS LIVE SENSOR</span>
              ${isTsunami
            ? `<span style="background: #DC2626; color: #FFFFFF; font-size: 9px; font-weight: 900; padding: 2px 6px; border-radius: 4px; animation: pulse 1s infinite;">TSUNAMI</span>`
            : ''
          }
            </div>
            <div style="font-weight: 900; font-size: 15px; color: #FFFFFF; margin-bottom: 4px;">
              Magnitudo ${gempaData.magnitude} M
            </div>
            <div style="font-size: 12.5px; font-weight: 600; color: #E2E8F0; margin-bottom: 6px; line-height: 1.4;">
              ${gempaData.wilayah_teks}
            </div>
            <div style="background: rgba(15, 23, 32, 0.6); padding: 6px 8px; border-radius: 6px; font-size: 11px; color: #94A3B8; line-height: 1.5; margin-bottom: 6px;">
              Kedalaman: <b style="color: #F8FAFC;">${gempaData.kedalaman_km} km</b><br/>
              Waktu Gempa: <span style="color: #F8FAFC;">${gempaData.waktu_kejadian}</span><br/>
              Koordinat: <span style="color: #38BDF8; font-family: monospace;">${gempaData.lat.toFixed(3)}°, ${gempaData.lon.toFixed(3)}°</span>
            </div>
            ${isTsunami
            ? `<div style="background: rgba(220,38,38,0.3); color: #FCA5A5; border: 1.5px solid #EF4444; font-size: 10.5px; font-weight: 800; padding: 6px 8px; border-radius: 6px; text-align: center; letter-spacing: 0.04em;">
                    PERINGATAN DINI: BERPOTENSI TSUNAMI!
                   </div>`
            : `<div style="background: rgba(16,185,129,0.15); color: #6EE7B7; border: 1px solid rgba(16,185,129,0.3); font-size: 10.5px; font-weight: 700; padding: 4px 6px; border-radius: 6px; text-align: center;">
                    Tidak Berpotensi Tsunami
                   </div>`
          }
          </div>
        `);

        gempaMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([gempaData.lon, gempaData.lat])
          .setPopup(popup)
          .addTo(map.current);
      } else {
        gempaMarkerRef.current.setLngLat([gempaData.lon, gempaData.lat]);
      }
    } else if (gempaMarkerRef.current) {
      gempaMarkerRef.current.remove();
      gempaMarkerRef.current = null;
    }
  }, [gempaData]);

  // FlyTo Koordinat Terpilih (Animasi Halus, Terarah & Presisi Kartografis)
  useEffect(() => {
    if (!map.current || !flyToCoords) return;
    const targetPitch = flyToCoords.pitch !== undefined
      ? flyToCoords.pitch
      : active3D
        ? 35
        : 0;

    map.current.flyTo({
      center: [flyToCoords.lng, flyToCoords.lat],
      zoom: flyToCoords.zoom || 10.5,
      pitch: targetPitch,
      essential: true,
      duration: 1100,
      curve: 1.25,
    });
  }, [flyToCoords, active3D]);

  // Sinkronisasi Data Stasiun Faktual BMKG ke MapLibre Source
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const src = map.current.getSource('stasiun-bmkg-src') as maplibregl.GeoJSONSource;
    if (src) {
      src.setData(stasiunBmkgGeoJSON as any);
    }
  }, [stasiunBmkgGeoJSON, mapLoaded]);

  return (
    <div className="relative w-full h-full bg-[#0F1720]">
      <div
        ref={mapContainer}
        className="w-full h-full outline-none focus:ring-1 focus:ring-emerald-500/50"
        id="maplibre-container"
        role="region"
        aria-label="Peta Interaktif Geospasial Kebencanaan Sumatera Barat"
        tabIndex={0}
        onKeyDown={(e) => {
          if (!map.current) return;
          const panStep = 80;
          switch (e.key) {
            case 'ArrowUp':
              e.preventDefault();
              map.current.panBy([0, -panStep]);
              break;
            case 'ArrowDown':
              e.preventDefault();
              map.current.panBy([0, panStep]);
              break;
            case 'ArrowLeft':
              e.preventDefault();
              map.current.panBy([-panStep, 0]);
              break;
            case 'ArrowRight':
              e.preventDefault();
              map.current.panBy([panStep, 0]);
              break;
            case '+':
            case '=':
              e.preventDefault();
              map.current.zoomIn();
              break;
            case '-':
            case '_':
              e.preventDefault();
              map.current.zoomOut();
              break;
            case 'r':
            case 'R':
              e.preventDefault();
              map.current.resetNorthPitch({ duration: 600 });
              break;
          }
        }}
      />

      {/* Kolom Kontrol Navigasi Sisi Kanan Ergonomis (Standar ISO/OGC & Triad Lens) */}
      {onStyleChange && (
        <RightMapControlDock
          currentStyle={styleVariant}
          onStyleChange={onStyleChange}
          is3DTerrain={is3DTerrain}
          onToggle3D={onToggle3D}
          onZoomIn={() => map.current?.zoomIn()}
          onZoomOut={() => map.current?.zoomOut()}
          onResetNorth={() => map.current?.resetNorthPitch({ duration: 800 })}
          onLocateMe={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const rawLat = pos.coords.latitude;
                  const rawLon = pos.coords.longitude;
                  const accuracy = Math.round(pos.coords.accuracy);

                  // Deteksi tertukar otomatis
                  let finalLat = rawLat;
                  let finalLon = rawLon;
                  if (rawLat > 80 && rawLon < 20) {
                    finalLat = rawLon;
                    finalLon = rawLat;
                  }

                  if (onUserLocationDetected) {
                    onUserLocationDetected({ lat: finalLat, lng: finalLon, accuracy });
                  }

                  map.current?.flyTo({
                    center: [finalLon, finalLat],
                    zoom: 14.5,
                    essential: true,
                  });
                },
                (err) => console.warn('Geolocation sensor warning:', err.message),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
              );
            }
          }}
          bearing={mapBearing}
        />
      )}

      {/* Floating Follower Tooltip saat Mode Penentuan Titik Aktif */}
      {isPickingLocation && mousePos && (
        <div
          className="pointer-events-none absolute z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-2xl border-2 border-amber-200 transform -translate-x-1/2 -translate-y-12 animate-in fade-in duration-75 select-none"
          style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
        >
          <span className="inline-block w-2 h-2 rounded-full bg-slate-950 animate-ping" />
          <span>Klik titik ini sebagai asal evakuasi</span>
        </div>
      )}
    </div>
  );
};
