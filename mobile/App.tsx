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
import * as Haptics from 'expo-haptics';
import {
  Home,
  Plus,
  PlusCircle,
  Radio,
  FileText,
  Activity,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  PhoneCall,
  Sun,
  Moon,
} from 'lucide-react-native';

import * as WebBrowser from 'expo-web-browser';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { ThemeColors } from './src/theme/colors';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { FONTS } from './src/theme/typography';
import { Header } from './src/components/Header';
import { HeroStatus } from './src/components/HeroStatus';
import { EnvironmentalCard } from './src/components/EnvironmentalCard';
import { DistanceGrid, type FacilityRouteTarget } from './src/components/DistanceGrid';
import { WebMapHandoff } from './src/components/WebMapHandoff';
import { ReportModal } from './src/components/ReportModal';
import { SosModal } from './src/components/SosModal';
import { Toast } from './src/components/Toast';

import { fetchProximityCheck, fetchShelters, calculateLocalHaversineKm, fetchEnvironmentalHealth, LAN_HOST } from './src/api/client';
import { ProximityCheckResponse, PoskoResponse, LaporanRecord, EnvironmentalHealthResponse } from './src/types';

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF9F0A" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function MainApp() {
  const insets = useSafeAreaInsets();
  const { theme, isDark, colors, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

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
  const [envData, setEnvData] = useState<EnvironmentalHealthResponse | null>(null);
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
          } catch (_) { }
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

      // Fetch Proximity, Shelters, and Environmental Health (Heat & Air Quality BMKG)
      const [proxRes, shelterRes, envRes] = await Promise.all([
        fetchProximityCheck(currentLat, currentLon),
        fetchShelters(currentLat, currentLon),
        fetchEnvironmentalHealth(currentLat, currentLon),
      ]);

      setProximityData(proxRes);
      setShelterData(shelterRes);
      setEnvData(envRes);
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
      const webBaseUrl = Platform.OS === 'web' ? 'http://127.0.0.1:5173' : `http://${LAN_HOST}:5173`;
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

  const handleTabPress = (tab: 'beranda' | 'feed' | 'riwayat') => {
    if (activeTab !== tab) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (_) {}
      setActiveTab(tab);
    }
  };

  const handleOpenReport = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {}
    setIsReportOpen(true);
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
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

              {/* Pemantauan Indeks Kualitas Udara (ISPU/PM2.5) & Indeks Panas BMKG */}
              <EnvironmentalCard data={envData} isLoading={isLoadingData} />

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
              />

              {/* Web GIS Seamless Handoff */}
              <WebMapHandoff userLat={userLat} userLon={userLon} />
            </View>
          )}

          {/* TAB 2: FEED KEBENCANAAN */}
          {activeTab === 'feed' && (
            <View style={styles.tabContent}>
              <View style={styles.feedHeader}>
                <Text style={styles.feedTitle}>INFORMASI DATA </Text>
                <Text style={styles.feedBadgeLive}></Text>
              </View>

              {/* Indeks Kualitas Udara (ISPU) & Panas BMKG Alert */}
              {envData && (
                <View style={styles.feedCard}>
                  <View style={styles.feedCardTop}>
                    <View style={[styles.badgePill, { backgroundColor: isDark ? 'rgba(100, 210, 255, 0.15)' : 'rgba(37, 99, 235, 0.12)' }]}>
                      <Activity size={12} color={isDark ? '#64D2FF' : '#1D4ED8'} />
                      <Text style={[styles.badgePillText, { color: isDark ? '#64D2FF' : '#1D4ED8' }]}>
                        KUALITAS UDARA & PANAS (BMKG)
                      </Text>
                    </View>
                    <Text style={styles.feedTime}>Sensor Real-Time</Text>
                  </View>
                  <Text style={styles.gempaTitle}>
                    ISPU: {envData.kualitas_udara.ispu_value} ({envData.kualitas_udara.kategori}) • Suhu Terasa: {Math.round(envData.panas.suhu_terasa_c)}°C ({envData.panas.kategori.split(' ')[0]})
                  </Text>
                  <Text style={styles.feedDesc}>
                    {envData.kualitas_udara.rekomendasi} {envData.panas.rekomendasi}
                  </Text>
                  <View style={styles.gempaFooter}>
                    <Text style={styles.gempaCoord} numberOfLines={1}>
                      Stasiun: {envData.lokasi?.stasiun_terdekat || 'BMKG GAW Kototabang'}
                    </Text>
                    <View style={styles.metaTagPill}>
                      <Text style={[styles.metaTagText, { color: isDark ? colors.brand.primary : '#B45309' }]}>
                        Suhu {Math.round(envData.panas.suhu_aktual_c)}°C / Lembap {envData.panas.kelembapan_persen}%
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Gempa BMKG Alert */}
              <View style={styles.feedCard}>
                <View style={styles.feedCardTop}>
                  <View style={[styles.badgePill, { backgroundColor: isDark ? 'rgba(10, 132, 255, 0.15)' : 'rgba(2, 132, 199, 0.12)' }]}>
                    <Activity size={12} color={isDark ? '#64D2FF' : '#0369A1'} />
                    <Text style={[styles.badgePillText, { color: isDark ? '#64D2FF' : '#0369A1' }]}>
                      GEMPA TERKINI (BMKG)
                    </Text>
                  </View>
                  <Text style={styles.feedTime}>35 Menit lalu</Text>
                </View>
                <Text style={styles.gempaTitle}>M 5.3 - 48 km Barat Daya Pasaman Barat</Text>
                <Text style={styles.feedDesc}>
                  Kedalaman 10 km • Tidak berpotensi tsunami. Getaran dirasakan skala III-IV MMI di Simpang Empat dan Bukittinggi.
                </Text>
                <View style={styles.gempaFooter}>
                  <Text style={styles.gempaCoord}>Koordinat: 0.12 LU, 99.78 BT</Text>
                  <View style={styles.metaTagPill}>
                    <Text style={[styles.metaTagText, { color: isDark ? colors.status.safeText : '#15803D' }]}>
                      Aman Tsunami
                    </Text>
                  </View>
                </View>
              </View>

              {/* Ruas Jalan Terputus (Road Blockage) */}
              <View style={styles.feedCard}>
                <View style={styles.feedCardTop}>
                  <View style={[styles.badgePill, { backgroundColor: isDark ? 'rgba(255, 69, 58, 0.15)' : 'rgba(220, 38, 38, 0.12)' }]}>
                    <AlertTriangle size={12} color={isDark ? '#FF453A' : '#B91C1C'} />
                    <Text style={[styles.badgePillText, { color: isDark ? '#FF453A' : '#B91C1C' }]}>
                      JALAN TERPUTUS (BLOKADE)
                    </Text>
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
                  <View style={[styles.badgePill, { backgroundColor: isDark ? 'rgba(255, 159, 10, 0.15)' : 'rgba(217, 119, 6, 0.12)' }]}>
                    <ShieldAlert size={12} color={isDark ? '#FF9F0A' : '#B45309'} />
                    <Text style={[styles.badgePillText, { color: isDark ? '#FF9F0A' : '#B45309' }]}>
                      VERIFIKASI PUSDALOPS
                    </Text>
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
                    <Text style={styles.profileStatusText}> Akun Pelapor Aktif</Text>
                  </View>
                </View>
              </View>

              {/* Pengaturan Tampilan Tema (Dark/Light Mode) */}
              <View style={styles.themeSettingsCard}>
                <View style={styles.themeRow}>
                  <View style={styles.themeLeft}>
                    <View style={styles.themeIconCircle}>
                      {isDark ? (
                        <Moon size={16} color={colors.brand.primary} />
                      ) : (
                        <Sun size={16} color={colors.brand.primary} />
                      )}
                    </View>
                    <View>
                      <Text style={styles.themeTitle}>Mode Tampilan</Text>
                      <Text style={styles.themeSubtitle}>
                        {isDark ? 'Mode Gelap Aktif (Dark Mode)' : 'Mode Terang Aktif (Light Mode)'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.toggleThemeBtn}
                    onPress={toggleTheme}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.toggleThemeBtnText}>
                      {isDark ? 'Ganti ke Terang' : 'Ganti ke Gelap'}
                    </Text>
                  </TouchableOpacity>
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

      {/* Native iOS Tab Bar */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {/* Nav Beranda */}
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => handleTabPress('beranda')}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        >
          <View style={[styles.navIconWrapper, activeTab === 'beranda' && styles.navIconWrapperActive]}>
            <Home
              size={20}
              color={activeTab === 'beranda' ? colors.brand.primary : colors.text.muted}
              strokeWidth={activeTab === 'beranda' ? 2.4 : 1.9}
            />
          </View>
          <Text
            style={[
              styles.navBtnLabel,
              activeTab === 'beranda' && styles.navBtnLabelActive,
            ]}
          >
            Beranda
          </Text>
        </TouchableOpacity>

        {/* Nav Data Riil */}
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => handleTabPress('feed')}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        >
          <View style={[styles.navIconWrapper, activeTab === 'feed' && styles.navIconWrapperActive]}>
            <Radio
              size={20}
              color={activeTab === 'feed' ? colors.brand.primary : colors.text.muted}
              strokeWidth={activeTab === 'feed' ? 2.4 : 1.9}
            />
          </View>
          <Text
            style={[
              styles.navBtnLabel,
              activeTab === 'feed' && styles.navBtnLabelActive,
            ]}
          >
            Data Bencana
          </Text>
        </TouchableOpacity>

        {/* Nav Lapor (iOS High-Priority Action Tab) */}
        <TouchableOpacity
          style={styles.navBtnLapor}
          onPress={handleOpenReport}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        >
          <View style={styles.laporCircle}>
            <Plus
              size={18}
              color="#ffffff"
              strokeWidth={2.8}
            />
          </View>
          <Text style={styles.navBtnLaporLabel}>
            Lapor
          </Text>
        </TouchableOpacity>

        {/* Nav Riwayat */}
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => handleTabPress('riwayat')}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        >
          <View style={[styles.navIconWrapper, activeTab === 'riwayat' && styles.navIconWrapperActive]}>
            <FileText
              size={20}
              color={activeTab === 'riwayat' ? colors.brand.primary : colors.text.muted}
              strokeWidth={activeTab === 'riwayat' ? 2.4 : 1.9}
            />
          </View>
          <Text
            style={[
              styles.navBtnLabel,
              activeTab === 'riwayat' && styles.navBtnLabelActive,
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

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
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
      fontFamily: FONTS.semiBold,
      fontSize: 12,
      color: colors.text.secondary,
    },
    mainScroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 14,
      paddingBottom: 36,
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
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: '#ffffff',
      letterSpacing: -0.2,
    },
    callBannerSub: {
      fontFamily: FONTS.regular,
      fontSize: 10.5,
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
      fontFamily: FONTS.bold,
      fontSize: 11.5,
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
      fontFamily: FONTS.bold,
      fontSize: 11,
      color: colors.text.secondary,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    feedBadgeLive: {
      fontFamily: FONTS.bold,
      fontSize: 10,
      color: colors.status.safeText,
    },
    feedBadgeCount: {
      fontFamily: FONTS.bold,
      fontSize: 10,
      color: colors.brand.primary,
    },
    feedCard: {
      backgroundColor: colors.surface.card, // Apple #1C1C1E
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 0.5,
      borderColor: colors.surface.borderSubtle,
    },
    feedCardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    badgePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    badgePillText: {
      fontFamily: FONTS.bold,
      fontSize: 10,
      letterSpacing: 0.3,
    },
    feedTime: {
      fontFamily: FONTS.medium,
      fontSize: 10.5,
      color: colors.text.muted,
    },
    gempaTitle: {
      fontFamily: FONTS.bold,
      fontSize: 14,
      color: colors.text.primary,
      marginBottom: 4,
      lineHeight: 20,
      letterSpacing: -0.2,
    },
    feedDesc: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: colors.text.secondary,
      lineHeight: 18,
    },
    gempaFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 0.5,
      borderColor: colors.surface.border,
    },
    gempaCoord: {
      fontFamily: FONTS.mono,
      fontSize: 10.5,
      color: colors.text.secondary,
      flex: 1,
      marginRight: 6,
    },
    metaTagPill: {
      backgroundColor: colors.surface.cardSecondary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    metaTagText: {
      fontFamily: FONTS.bold,
      fontSize: 10,
    },
    // Profile & Reports Styles
    profileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.surface.card,
      borderRadius: 14,
      padding: 14,
      borderWidth: 0.5,
      borderColor: colors.surface.borderSubtle,
      marginBottom: 6,
    },
    avatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface.cardSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.5,
      borderColor: colors.surface.border,
    },
    avatarText: {
      fontFamily: FONTS.bold,
      fontSize: 15,
      color: colors.brand.primary,
    },
    profileName: {
      fontFamily: FONTS.bold,
      fontSize: 13.5,
      color: colors.text.primary,
      letterSpacing: -0.2,
    },
    profileMeta: {
      fontFamily: FONTS.regular,
      fontSize: 10.5,
      color: colors.text.secondary,
      marginTop: 1,
    },
    profileStatusBadge: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(48, 209, 88, 0.12)',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 4,
      marginTop: 4,
    },
    profileStatusText: {
      fontFamily: FONTS.semiBold,
      fontSize: 9.5,
      color: colors.status.safeText,
    },
    emptyReports: {
      paddingVertical: 30,
      alignItems: 'center',
    },
    emptyText: {
      fontFamily: FONTS.medium,
      fontSize: 11.5,
      color: colors.text.muted,
    },
    reportItemCard: {
      backgroundColor: colors.surface.card,
      borderRadius: 14,
      padding: 12,
      marginBottom: 8,
      borderWidth: 0.5,
      borderColor: colors.surface.borderSubtle,
    },
    reportItemTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    reportItemType: {
      fontFamily: FONTS.bold,
      fontSize: 12.5,
      color: colors.text.primary,
    },
    badgeStatusReport: {
      backgroundColor: 'rgba(255, 159, 10, 0.12)',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 4,
    },
    badgeStatusReportText: {
      fontFamily: FONTS.semiBold,
      fontSize: 9,
      color: colors.status.warningText,
    },
    reportItemLoc: {
      fontFamily: FONTS.medium,
      fontSize: 10.5,
      color: colors.brand.primary,
      marginBottom: 4,
    },
    reportItemDesc: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      color: colors.text.secondary,
      lineHeight: 15,
    },
    reportItemFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    reportItemTime: {
      fontFamily: FONTS.medium,
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
    // Theme Settings Card
    themeSettingsCard: {
      backgroundColor: colors.surface.card,
      borderRadius: 14,
      padding: 12,
      borderWidth: 0.5,
      borderColor: colors.surface.borderSubtle,
      marginBottom: 10,
    },
    themeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    themeLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    themeIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.brand.primaryFaint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeTitle: {
      fontFamily: FONTS.bold,
      fontSize: 12.5,
      color: colors.text.primary,
    },
    themeSubtitle: {
      fontFamily: FONTS.regular,
      fontSize: 10.5,
      color: colors.text.secondary,
      marginTop: 1,
    },
    toggleThemeBtn: {
      backgroundColor: colors.surface.cardSecondary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 0.5,
      borderColor: colors.surface.border,
    },
    toggleThemeBtnText: {
      fontFamily: FONTS.bold,
      fontSize: 11,
      color: colors.brand.primary,
    },
    // Native iOS Tab Bar
    bottomNav: {
      backgroundColor: colors.surface.tabBar,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: colors.surface.border,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingTop: 8,
      paddingHorizontal: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: isDark ? 0.35 : 0.07,
      shadowRadius: 10,
      elevation: 12,
    },
    navBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 3,
      minHeight: 46,
    },
    navIconWrapper: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navIconWrapperActive: {
      backgroundColor: colors.brand.primaryFaint,
    },
    navBtnLabel: {
      fontFamily: FONTS.medium,
      fontSize: 10.5,
      color: colors.text.muted,
      marginTop: 2,
      letterSpacing: -0.2,
    },
    navBtnLabelActive: {
      fontFamily: FONTS.bold,
      color: colors.brand.primary,
    },
    // Center Quick Action: Lapor
    navBtnLapor: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 2,
      minHeight: 46,
    },
    laporCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.brand.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.brand.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 5,
      elevation: 4,
      marginBottom: 2,
    },
    navBtnLaporLabel: {
      fontFamily: FONTS.bold,
      fontSize: 10.5,
      color: colors.brand.primary,
      letterSpacing: -0.2,
    },
  });
