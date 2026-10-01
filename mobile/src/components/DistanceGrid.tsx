import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Waves, Mountain, CloudRain, Activity, Home, Building2, Navigation, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { ThreatItem } from '../types';

export interface FacilityRouteTarget {
  id?: number;
  nama: string;
  lat?: number;
  lon?: number;
  jenis?: string;
  bencana?: string;
}

interface DistanceGridProps {
  threats: ThreatItem[];
  nearestShelterKm: number;
  shelterName: string;
  shelterTarget?: FacilityRouteTarget;
  nearestPoskoKm?: number;
  poskoName?: string;
  poskoTarget?: FacilityRouteTarget;
  onOpenRoute?: (target: FacilityRouteTarget) => void;
  onSelectHazard?: (hazardType: string) => void;
}

export const DistanceGrid: React.FC<DistanceGridProps> = ({
  threats,
  nearestShelterKm,
  shelterName,
  shelterTarget,
  nearestPoskoKm = 1.2,
  poskoName = 'Posko Komando BPBD',
  poskoTarget,
  onOpenRoute,
  onSelectHazard,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const getThreat = (type: string) => {
    return threats.find((item) => {
      if (type === 'tsunami') return item.type === 'tsunami' || (item as any).raw_type === 'megathrust';
      if (type === 'sesar') return item.type === 'sesar';
      if (type === 'galodo') return item.type === 'galodo';
      if (type === 'banjir') return item.type === 'banjir';
      return item.type === type;
    });
  };

  const findDist = (type: string, defaultKm: number) => {
    const t = getThreat(type);
    if (t && t.distance_km != null) {
      return `${t.distance_km} km`;
    }
    return `${defaultKm} km`;
  };

  const findStatusInfo = (type: string) => {
    const t = getThreat(type);
    if (!t) return { label: 'AMAN', color: colors.status.safeText, bg: colors.status.safeBg };
    if (t.status === 'BAHAYA_LANGSUNG') {
      return { label: 'BAHAYA', color: colors.status.dangerText, bg: colors.status.dangerBg };
    }
    if (t.status === 'WASPADA') {
      return { label: 'WASPADA', color: colors.status.warningText, bg: colors.status.warningBg };
    }
    return { label: 'AMAN', color: colors.status.safeText, bg: colors.status.safeBg };
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>ANALISIS JARAK ZONA ANCAMAN</Text>
      </View>

      {/* 4 Hazards 2x2 Grid */}
      <View style={styles.grid}>
        {/* Tsunami */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(100, 210, 255, 0.12)' }]}>
              <Waves size={15} color={colors.category.tsunami} />
            </View>
            <Text style={styles.hazardName} numberOfLines={1}>Zona Tsunami</Text>
          </View>
          <Text style={styles.distValue}>
            {findDist('tsunami', 1.9)}
          </Text>
          <Text style={styles.subtext}>Pesisir Padang</Text>
        </View>

        {/* Sesar Semangko */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(191, 90, 242, 0.12)' }]}>
              <Activity size={15} color={colors.category.sesar} />
            </View>
            <Text style={styles.hazardName} numberOfLines={1}>Sesar Darat</Text>
          </View>
          <Text style={styles.distValue}>
            {findDist('sesar', 36.0)}
          </Text>
          <Text style={styles.subtext}>Sianok / Semangko</Text>
        </View>

        {/* Galodo Marapi */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 69, 58, 0.12)' }]}>
              <Mountain size={15} color={colors.category.galodo} />
            </View>
            <Text style={styles.hazardName} numberOfLines={1}>Lahar Galodo</Text>
          </View>
          <Text style={styles.distValue}>
            {findDist('galodo', 46.5)}
          </Text>
          <Text style={styles.subtext}>Hulu Batang Anai</Text>
        </View>

        {/* Banjir DAS */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(10, 132, 255, 0.12)' }]}>
              <CloudRain size={15} color={colors.category.banjir} />
            </View>
            <Text style={styles.hazardName} numberOfLines={1}>Rawan Banjir</Text>
          </View>
          <Text style={styles.distValue}>
            {findDist('banjir', 5.5)}
          </Text>
          <Text style={styles.subtext}>DAS Batang Kuranji</Text>
        </View>
      </View>

      {/* Fasilitas Evakuasi Terdekat: iOS Inset Grouped List */}
      <View style={styles.groupedListContainer}>
        {/* Row 1: Posko Pengungsian */}
        <TouchableOpacity
          style={styles.groupedRow}
          onPress={() =>
            onOpenRoute &&
            onOpenRoute(
              poskoTarget || {
                nama: poskoName,
                jenis: 'posko_utama',
                bencana: 'gempa',
              }
            )
          }
          activeOpacity={0.7}
        >
          <View style={[styles.facilityIconCircle, { backgroundColor: 'rgba(255, 159, 10, 0.15)' }]}>
            <Building2 size={16} color={colors.brand.primary} />
          </View>
          <View style={styles.facilityContent}>
            <Text style={styles.facilityType}>Posko Pengungsian Terdekat</Text>
            <Text style={styles.facilityName} numberOfLines={1}>
              {poskoName || 'Posko Komando BPBD'}
            </Text>
          </View>
          <View style={styles.facilityRight}>
            <Text style={styles.facilityDist}>
              {typeof nearestPoskoKm === 'number' ? nearestPoskoKm.toFixed(2) : nearestPoskoKm} km
            </Text>
            <View style={styles.routeBtn}>
              <Navigation size={10} color="#FFFFFF" />
              <Text style={styles.routeBtnText}>Rute</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Inset Hairline Divider */}
        <View style={styles.insetDivider} />

        {/* Row 2: Shelter TES */}
        <TouchableOpacity
          style={styles.groupedRow}
          onPress={() =>
            onOpenRoute &&
            onOpenRoute(
              shelterTarget || {
                nama: shelterName,
                jenis: 'shelter_tes_tea',
                bencana: 'tsunami',
              }
            )
          }
          activeOpacity={0.7}
        >
          <View style={[styles.facilityIconCircle, { backgroundColor: 'rgba(191, 90, 242, 0.15)' }]}>
            <Home size={16} color="#BF5AF2" />
          </View>
          <View style={styles.facilityContent}>
            <Text style={styles.facilityType}>Shelter Vertikal TES Terdekat</Text>
            <Text style={styles.facilityName} numberOfLines={1}>
              {shelterName || 'TES Ulak Karang'}
            </Text>
          </View>
          <View style={styles.facilityRight}>
            <Text style={styles.facilityDist}>
              {typeof nearestShelterKm === 'number' ? nearestShelterKm.toFixed(2) : nearestShelterKm} km
            </Text>
            <View style={[styles.routeBtn, { backgroundColor: '#BF5AF2' }]}>
              <Navigation size={10} color="#FFFFFF" />
              <Text style={styles.routeBtnText}>Rute</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  tagLive: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.status.safeText,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    maxWidth: '49%',
    minWidth: 140,
    backgroundColor: colors.surface.card, // Apple #1C1C1E
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 0.5,
    borderColor: colors.surface.borderSubtle,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  hazardName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  distValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.text.primary,
  },
  subtext: {
    fontSize: 10.5,
    color: colors.text.secondary,
    marginTop: 2,
  },
  // iOS Inset Grouped List Styles
  groupedListContainer: {
    marginTop: 10,
    backgroundColor: colors.surface.card, // Apple #1C1C1E
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.surface.borderSubtle,
    overflow: 'hidden',
  },
  groupedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  facilityIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  facilityContent: {
    flex: 1,
  },
  facilityType: {
    fontSize: 10.5,
    color: colors.text.secondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  facilityName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  facilityRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: 4,
  },
  facilityDist: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  routeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.brand.primary,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  routeBtnText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  insetDivider: {
    height: 0.5,
    backgroundColor: colors.surface.border,
    marginLeft: 58,
  },
});

