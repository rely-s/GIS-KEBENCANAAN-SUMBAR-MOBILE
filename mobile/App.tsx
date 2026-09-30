import React, { useState, useEffect, useMemo } from 'react';
import {
  StatusBar,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import {
  Home,
  Plus,
  Radio,
  FileText,
  Activity,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  PhoneCall,
} from 'lucide-react-native';

import * as WebBrowser from 'expo-web-browser';
import { colors } from './src/theme/colors';
import { Header } from './src/components/Header';
import { HeroStatus } from './src/components/HeroStatus';
import { DistanceGrid, type FacilityRouteTarget } from './src/components/DistanceGrid';
import { WebMapHandoff } from './src/components/WebMapHandoff';
import { ReportModal } from './src/components/ReportModal';
import { SosModal } from './src/components/SosModal';
import { Toast } from './src/components/Toast';

import { fetchProximityCheck, fetchShelters, calculateLocalHaversineKm } from './src/api/client';
import { ProximityCheckResponse, PoskoResponse, LaporanRecord } from './src/types';

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

function MainApp() {
  const insets = useSafeAreaInsets();
  // Navigation State
  const [activeTab, setActiveTab] = useState<'beranda' | 'feed' | 'riwayat'>('beranda');

  // Location State
  const [userLat, setUserLat] = useState(-0.9471);
  const [userLon, setUserLon] = useState(100.3543);
  const [locationLabel, setLocationLabel] = useState('Padang Barat, Kota Padang');
  const [isDetectingLoc, setIsDetectingLoc] = useState(false);

  // Data State
  const [proximityData, setProximityData] = useState<ProximityCheckResponse | null>(null);
  const [shelterData, setShelterData] = useState<PoskoResponse | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Modals & Feedback
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });

  // User Reports History
  const [myReports, setMyReports] = useState<LaporanRecord[]>([
    {
      id: 'rep-01',
      jenis_bencana: 'Banjir / Genangan Air',
      lokasi_teks: 'Jl. Khatib Sulaiman, Padang Utara',
      deskripsi: 'Genangan air setinggi 40 cm merendam badan jalan utama pascahujan deras.',
      timestamp: '25 menit lalu',
      status: 'Menunggu Verifikasi BPBD',
      lat: -0.9250,
      lon: 100.3580,
    },
  ]);

  // Toast Trigger Helper
  const showToast = (title: string, message: string) => {
    setToast({ visible: true, title, message });
  };

  // 1. Initial Load & Geolocation
  const resolveLocationAndData = async () => {
    setIsDetectingLoc(true);
    setIsLoadingData(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let currentLat = -0.9471;
      let currentLon = 100.3543;

      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const rawLat = loc.coords.latitude;
        const rawLon = loc.coords.longitude;
        const isWithinSumbar = rawLat >= -4.5 && rawLat <= 1.5 && rawLon >= 96.0 && rawLon <= 103.0;

        if (isWithinSumbar) {
          currentLat = rawLat;
          currentLon = rawLon;
          setUserLat(currentLat);
          setUserLon(currentLon);

          // Reverse Geocode
          try {
            const rev = await Location.reverseGeocodeAsync({
              latitude: currentLat,
              longitude: currentLon,
            });
            if (rev && rev.length > 0) {
              const r = rev[0];
              const name = [r.district, r.city || r.subregion].filter(Boolean).join(', ');
              if (name) setLocationLabel(name);
            }
          } catch (_) {}
        } else {
          currentLat = -0.9471;
          currentLon = 100.3543;
          setUserLat(currentLat);
          setUserLon(currentLon);
          setLocationLabel('Padang Barat, Kota Padang');
          showToast('Kalibrasi Wilayah', 'Lokasi GPS disesuaikan ke Padang Barat untuk analisis kebencanaan Sumbar.');
        }
      } else {
        currentLat = -0.9471;
        currentLon = 100.3543;
        setUserLat(currentLat);
        setUserLon(currentLon);
        setLocationLabel('Padang Barat, Kota Padang');
      }

      // Fetch Proximity & Shelters
      const [proxRes, shelterRes] = await Promise.all([
        fetchProximityCheck(currentLat, currentLon),
        fetchShelters(currentLat, currentLon),
      ]);

      setProximityData(proxRes);
      setShelterData(shelterRes);
    } catch (err) {
      console.warn('Gagal sinkronisasi data awal:', err);
    } finally {
      setIsDetectingLoc(false);
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    resolveLocationAndData();
  }, []);

  // Handle New Report Created
  const handleReportCreated = (newReport: LaporanRecord) => {
    setMyReports((prev) => [newReport, ...prev]);
  };

  // Handoff Pandu Rute Evakuasi ke Web GIS
  const handleOpenWebEvacuationRoute = async (target?: FacilityRouteTarget & { bencana?: string; poskoId?: number; jenis?: string }) => {
    try {
      const webBaseUrl = 'http://127.0.0.1:5173';
      const bencanaType = target?.bencana || 'tsunami';
      let url = `${webBaseUrl}/?view=mobile_lite&action=evakuasi&userLat=${userLat}&userLon=${userLon}&zoom=16&layer=poskoEvakuasi,jalanTerputus,zonaTsunami,shelterTes`;
      
      if (target?.lat && target?.lon) {
        url += `&destLat=${target.lat}&destLon=${target.lon}`;
      }
      if (target?.nama) {
        url += `&destNama=${encodeURIComponent(target.nama)}`;
      }
      const targetPoskoId = (target as any)?.poskoId || (target as any)?.id;
      if (targetPoskoId) {
        url += `&poskoId=${targetPoskoId}`;
      }
      url += `&bencana=${encodeURIComponent(bencanaType)}`;

      showToast('Membuka Web GIS', `Mengarahkan rute evakuasi ke ${target?.nama || 'Titik Evakuasi'}...`);

      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        await WebBrowser.openBrowserAsync(url, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
          toolbarColor: colors.surface.card,
          controlsColor: colors.brand.primary,
        });
      }
    } catch (err) {
      console.warn('Gagal membuka rute Web GIS:', err);
    }
  };

  // Posko dan Shelter Terdekat dari dataset
  const nearestTesFeature = useMemo(() => {
    return (
      shelterData?.features?.find(
        (f) =>
          f.properties.jenis === 'shelter_tes_tea' ||
          f.properties.jenis === 'shelter_sementara' ||
          f.properties.nama?.toLowerCase().includes('tes') ||
          f.properties.nama?.toLowerCase().includes('shelter')
      ) || shelterData?.features?.[0]
    );
  }, [shelterData]);

  const nearestPoskoFeature = useMemo(() => {
    return (
      shelterData?.features?.find(
        (f) =>
          f.properties.jenis === 'posko_utama' ||
          f.properties.jenis === 'posko_pengungsi' ||
          f.properties.nama?.toLowerCase().includes('bpbd') ||
          f.properties.nama?.toLowerCase().includes('posko') ||
          f.properties.nama?.toLowerCase().includes('camat')
      ) || shelterData?.features?.[1]
    );
  }, [shelterData]);

  const nearestTesDistKm = useMemo(() => {
    if (nearestTesFeature?.geometry?.coordinates) {
      return calculateLocalHaversineKm(
        userLat,
        userLon,
        nearestTesFeature.geometry.coordinates[1],
        nearestTesFeature.geometry.coordinates[0]
      );
    }
    return 0.8;
  }, [nearestTesFeature, userLat, userLon]);

  const nearestPoskoDistKm = useMemo(() => {
    if (nearestPoskoFeature?.geometry?.coordinates) {
      return calculateLocalHaversineKm(
        userLat,
        userLon,
        nearestPoskoFeature.geometry.coordinates[1],
        nearestPoskoFeature.geometry.coordinates[0]
      );
    }
    return 1.25;
  }, [nearestPoskoFeature, userLat, userLon]);

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.surface.canvas}
        translucent={Platform.OS === 'android'}
      />

      {/* Floating Toast Notification */}
      <Toast
        visible={toast.visible}
        title={toast.title}
        message={toast.message}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />

      {/* Top Header */}
      <Header
        locationLabel={locationLabel}
        isDetecting={isDetectingLoc}
        onRefreshLocation={resolveLocationAndData}
        onOpenSos={() => setIsSosOpen(true)}
      />

      {/* Main Content Area */}
      {isLoadingData ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loadingText}>Menghubungkan ke Server PostGIS BPBD...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* TAB 1: BERANDA */}
          {activeTab === 'beranda' && (
            <View style={styles.tabContent}>
              {/* Hero Status Keselamatan */}
              <HeroStatus
                status={proximityData?.primary_threat.status || 'ZONA_AMAN'}
                directive={proximityData?.primary_threat.actionable_directive || ''}
              />

              {/* Grid Jarak Spasial Multi-Bahaya & Fasilitas Posko */}
              <DistanceGrid
                threats={proximityData?.all_threats || []}
                nearestShelterKm={nearestTesDistKm}
                shelterName={nearestTesFeature?.properties?.nama || 'TES Ulak Karang'}
                shelterTarget={
                  nearestTesFeature
                    ? {
                        id: nearestTesFeature.properties.id,
                        nama: nearestTesFeature.properties.nama,
                        lat: nearestTesFeature.geometry.coordinates[1],
                        lon: nearestTesFeature.geometry.coordinates[0],
                        jenis: nearestTesFeature.properties.jenis || 'shelter_tes_tea',
                        bencana: 'tsunami',
                      }
                    : undefined
                }
                nearestPoskoKm={nearestPoskoDistKm}
                poskoName={nearestPoskoFeature?.properties?.nama || 'Posko Komando BPBD'}
                poskoTarget={
                  nearestPoskoFeature
                    ? {
                        id: nearestPoskoFeature.properties.id,
                        nama: nearestPoskoFeature.properties.nama,
                        lat: nearestPoskoFeature.geometry.coordinates[1],
                        lon: nearestPoskoFeature.geometry.coordinates[0],
                        jenis: nearestPoskoFeature.properties.jenis || 'posko_utama',
                        bencana: 'gempa',
                      }
                    : undefined
                }
                onOpenRoute={handleOpenWebEvacuationRoute}
                onSelectHazard={(hazardType) => {
                  let destNama = 'Titik Evakuasi Teraman';
                  let targetJenis = 'shelter_tes_tea';
                  let targetFeature = nearestTesFeature;
                  if (hazardType === 'gempa' || hazardType === 'galodo' || hazardType === 'banjir') {
                    destNama = nearestPoskoFeature?.properties.nama || 'Posko Evakuasi Terdekat';
                    targetJenis = 'posko_utama';
                    targetFeature = nearestPoskoFeature;
                  }
                  handleOpenWebEvacuationRoute({
                    id: targetFeature?.properties.id,
                    nama: targetFeature?.properties.nama || destNama,
                    lat: targetFeature?.geometry.coordinates[1],
                    lon: targetFeature?.geometry.coordinates[0],
                    jenis: targetJenis,
                    bencana: hazardType,
                  });
                }}
              />

              {/* Web GIS Seamless Handoff */}
              <WebMapHandoff userLat={userLat} userLon={userLon} />
            </View>
          )}

          {/* TAB 2: FEED KEBENCANAAN */}
          {activeTab === 'feed' && (
            <View style={styles.tabContent}>
              <View style={styles.feedHeader}>
                <Text style={styles.feedTitle}>INFORMASI DATA RIIL LAPANGAN</Text>
                <Text style={styles.feedBadgeLive}>● Live Sync</Text>
              </View>

              {/* Gempa BMKG Alert */}
              <View style={styles.feedCard}>
                <View style={styles.feedCardTop}>
                  <View style={styles.badgeGempa}>
                    <Activity size={12} color="#ffffff" />
                    <Text style={styles.badgeGempaText}>GEMPA TERKINI (BMKG)</Text>
                  </View>
                  <Text style={styles.feedTime}>35 Menit lalu</Text>
                </View>
                <Text style={styles.gempaTitle}>M 5.3 - 48 km Barat Daya Pasaman Barat</Text>
                <Text style={styles.feedDesc}>
                  Kedalaman 10 km • Tidak berpotensi tsunami. Getaran dirasakan skala III-IV MMI di Simpang Empat dan Bukittinggi.
                </Text>
                <View style={styles.gempaFooter}>
                  <Text style={styles.gempaCoord}>Koordinat: 0.12 LU, 99.78 BT</Text>
                  <Text style={styles.safeTag}>Aman Tsunami</Text>
                </View>
              </View>

              {/* Ruas Jalan Terputus (Road Blockage) */}
              <View style={[styles.feedCard, { borderColor: 'rgba(239, 68, 68, 0.35)' }]}>
                <View style={styles.feedCardTop}>
                  <View style={[styles.badgeGempa, { backgroundColor: '#dc2626' }]}>
                    <AlertTriangle size={12} color="#ffffff" />
                    <Text style={styles.badgeGempaText}>JALAN TERPUTUS (BLOKADE)</Text>
                  </View>
                  <Text style={styles.feedTime}>2 Jam lalu</Text>
                </View>
                <Text style={styles.gempaTitle}>Ruas Padang - Bukittinggi via Lembah Anai</Text>
                <Text style={styles.feedDesc}>
                  Badan jalan amblas diterjang aliran banjir lahar dingin (galodo). Arus lalu lintas dialihkan melalui rute alternatif Malalak / Sitinjau Lauik.
                </Text>
              </View>

              {/* Bencana Terverifikasi Pusdalops */}
              <View style={styles.feedCard}>
                <View style={styles.feedCardTop}>
                  <View style={[styles.badgeGempa, { backgroundColor: colors.brand.primary }]}>
                    <ShieldAlert size={12} color="#ffffff" />
                    <Text style={styles.badgeGempaText}>VERIFIKASI PUSDALOPS</Text>
                  </View>
                  <Text style={styles.feedTime}>4 Jam lalu</Text>
                </View>
                <Text style={styles.gempaTitle}>Pohon Tumbang Menghalangi Jl. Raden Saleh</Text>
                <Text style={styles.feedDesc}>
                  Tim TRC BPBD Kota Padang dan Dinas Lingkungan Hidup telah selesai melakukan pemotongan dan evakuasi material. Jalan telah dapat dilalui normal.
                </Text>
              </View>
            </View>
          )}

          {/* TAB 3: AKUN & RIWAYAT */}
          {activeTab === 'riwayat' && (
            <View style={styles.tabContent}>
              {/* User Identity Card */}
              <View style={styles.profileCard}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>WS</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileName}>Warga Siaga Mandiri</Text>
                  <Text style={styles.profileMeta}>Terintegrasi Satu Data Pusdalops BPBD</Text>
                  <View style={styles.profileStatusBadge}>
                    <Text style={styles.profileStatusText}>● Akun Pelapor Aktif</Text>
                  </View>
                </View>
              </View>

              {/* Laporan Saya Section */}
              <View style={styles.feedHeader}>
                <Text style={styles.feedTitle}>STATUS RIWAYAT LAPORAN SAYA</Text>
                <Text style={styles.feedBadgeCount}>{myReports.length} Laporan</Text>
              </View>

              {myReports.length === 0 ? (
                <View style={styles.emptyReports}>
                  <Text style={styles.emptyText}>Belum ada laporan yang Anda kirimkan.</Text>
                </View>
              ) : (
                myReports.map((item) => (
                  <View key={item.id} style={styles.reportItemCard}>
                    <View style={styles.reportItemTop}>
                      <Text style={styles.reportItemType}>{item.jenis_bencana}</Text>
                      <View style={styles.badgeStatusReport}>
                        <Text style={styles.badgeStatusReportText}>{item.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.reportItemLoc}>{item.lokasi_teks}</Text>
                    <Text style={styles.reportItemDesc} numberOfLines={2}>
                      "{item.deskripsi}"
                    </Text>
                    <View style={styles.reportItemFooter}>
                      <Text style={styles.reportItemTime}>{item.timestamp}</Text>
                      <View style={styles.progressBarBg}>
                        <View style={styles.progressBarFill} />
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        {/* Nav Beranda */}
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setActiveTab('beranda')}
          activeOpacity={0.7}
        >
          <Home
            size={22}
            color={activeTab === 'beranda' ? colors.brand.primary : colors.text.muted}
          />
          <Text
            style={[
              styles.navBtnLabel,
              activeTab === 'beranda' && { color: colors.brand.primary, fontWeight: '800' },
            ]}
          >
            Beranda
          </Text>
        </TouchableOpacity>

        {/* Center Floating (+) Lapor Button */}
        <View style={styles.fabWrapper}>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={() => setIsReportOpen(true)}
            activeOpacity={0.9}
          >
            <Plus size={26} color="#ffffff" strokeWidth={3} />
          </TouchableOpacity>
          <Text style={styles.fabLabel}>Lapor</Text>
        </View>

        {/* Nav Feed Data Riil */}
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setActiveTab('feed')}
          activeOpacity={0.7}
        >
          <Radio
            size={22}
            color={activeTab === 'feed' ? colors.brand.primary : colors.text.muted}
          />
          <Text
            style={[
              styles.navBtnLabel,
              activeTab === 'feed' && { color: colors.brand.primary, fontWeight: '800' },
            ]}
          >
            Data Riil
          </Text>
        </TouchableOpacity>

        {/* Nav Riwayat */}
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => setActiveTab('riwayat')}
          activeOpacity={0.7}
        >
          <FileText
            size={22}
            color={activeTab === 'riwayat' ? colors.brand.primary : colors.text.muted}
          />
          <Text
            style={[
              styles.navBtnLabel,
              activeTab === 'riwayat' && { color: colors.brand.primary, fontWeight: '800' },
            ]}
          >
            Riwayat
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet Modal Lapor */}
      <ReportModal
        visible={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        userLat={userLat}
        userLon={userLon}
        locationLabel={locationLabel}
        onReportSuccess={handleReportCreated}
        onShowToast={showToast}
      />

      {/* SOS Dial Modal */}
      <SosModal
        visible={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        userLat={userLat}
        userLon={userLon}
        onShowToast={showToast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface.canvas,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  tabContent: {
    paddingTop: 4,
  },
  fastCallBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#b91c1c',
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
    marginBottom: 6,
  },
  callBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  callBannerSub: {
    fontSize: 10,
    color: '#fecaca',
    marginTop: 1,
  },
  call112Btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  call112Text: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#dc2626',
  },
  // Feed Tab Styles
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 2,
  },
  feedTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  feedBadgeLive: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.status.safeText,
  },
  feedBadgeCount: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  feedCard: {
    backgroundColor: colors.surface.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.surface.borderSubtle,
  },
  feedCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeGempa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeGempaText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  feedTime: {
    fontSize: 10,
    color: colors.text.muted,
  },
  gempaTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 4,
  },
  feedDesc: {
    fontSize: 11,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  gempaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: colors.surface.borderSubtle,
  },
  gempaCoord: {
    fontSize: 10,
    color: colors.text.muted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  safeTag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.status.safeText,
  },
  // Profile & Reports Styles
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surface.borderSubtle,
    marginBottom: 6,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.brand.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.brand.primary,
  },
  profileName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text.primary,
  },
  profileMeta: {
    fontSize: 10.5,
    color: colors.text.secondary,
    marginTop: 1,
  },
  profileStatusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  profileStatusText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.status.safeText,
  },
  emptyReports: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 11.5,
    color: colors.text.muted,
  },
  reportItemCard: {
    backgroundColor: colors.surface.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.surface.borderSubtle,
  },
  reportItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reportItemType: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.primary,
  },
  badgeStatusReport: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeStatusReportText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.status.warningText,
  },
  reportItemLoc: {
    fontSize: 10,
    color: colors.brand.primary,
    marginBottom: 4,
  },
  reportItemDesc: {
    fontSize: 11,
    color: colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 15,
  },
  reportItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  reportItemTime: {
    fontSize: 9.5,
    color: colors.text.muted,
  },
  progressBarBg: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface.cardSecondary,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '40%',
    height: '100%',
    backgroundColor: colors.status.warningText,
  },
  // Bottom Navigation
  bottomNav: {
    height: 62,
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderTopWidth: 1,
    borderColor: colors.surface.borderSubtle,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  navBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 65,
  },
  navBtnLabel: {
    fontSize: 9.5,
    color: colors.text.muted,
    fontWeight: '600',
    marginTop: 3,
  },
  fabWrapper: {
    alignItems: 'center',
    marginTop: -22,
  },
  fabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: colors.surface.canvas,
  },
  fabLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.brand.primary,
    marginTop: 2,
  },
});
