import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Waves, Mountain, CloudRain, Activity, Home, Building2, Navigation, ChevronRight } from 'lucide-react-native';
import { colors } from '../theme/colors';
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
      return `${t.distance_km} KM`;
    }
    return `${defaultKm} KM`;
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

  const tsunamiStatus = findStatusInfo('tsunami');
  const sesarStatus = findStatusInfo('sesar');
  const galodoStatus = findStatusInfo('galodo');
  const banjirStatus = findStatusInfo('banjir');

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>ANALISIS JARAK ZONA ANCAMAN (GIS)</Text>
        <Text style={styles.tagLive}>● Pantauan Spasial Real-Time</Text>
      </View>

      {/* 4 Hazards Grid */}
      <View style={styles.grid}>
        {/* Tsunami */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => onSelectHazard && onSelectHazard('tsunami')}
          activeOpacity={0.75}
        >
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
              <Waves size={16} color={colors.category.tsunami} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hazardName}>Zona Tsunami</Text>
            </View>
            <View style={[styles.miniStatusBadge, { backgroundColor: tsunamiStatus.bg }]}>
              <Text style={[styles.miniStatusText, { color: tsunamiStatus.color }]}>
                {tsunamiStatus.label}
              </Text>
            </View>
          </View>
          <Text style={[styles.distValue, { color: tsunamiStatus.color }]}>
            {findDist('tsunami', 1.9)}
          </Text>
          <View style={styles.cardFooterRow}>
            <Text style={styles.subtext}>Pesisir Padang</Text>
            <View style={styles.navHintRow}>
              <Navigation size={10} color={colors.brand.primary} />
              <Text style={styles.navHintText}>Rute</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Sesar Semangko */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => onSelectHazard && onSelectHazard('gempa')}
          activeOpacity={0.75}
        >
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Activity size={16} color={colors.category.sesar} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hazardName}>Sesar Darat</Text>
            </View>
            <View style={[styles.miniStatusBadge, { backgroundColor: sesarStatus.bg }]}>
              <Text style={[styles.miniStatusText, { color: sesarStatus.color }]}>
                {sesarStatus.label}
              </Text>
            </View>
          </View>
          <Text style={[styles.distValue, { color: sesarStatus.color }]}>
            {findDist('sesar', 36.0)}
          </Text>
          <View style={styles.cardFooterRow}>
            <Text style={styles.subtext}>Sianok / Semangko</Text>
            <View style={styles.navHintRow}>
              <Navigation size={10} color={colors.brand.primary} />
              <Text style={styles.navHintText}>Rute</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Galodo Marapi */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => onSelectHazard && onSelectHazard('galodo')}
          activeOpacity={0.75}
        >
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
              <Mountain size={16} color={colors.category.galodo} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hazardName}>Lahar Galodo</Text>
            </View>
            <View style={[styles.miniStatusBadge, { backgroundColor: galodoStatus.bg }]}>
              <Text style={[styles.miniStatusText, { color: galodoStatus.color }]}>
                {galodoStatus.label}
              </Text>
            </View>
          </View>
          <Text style={[styles.distValue, { color: galodoStatus.color }]}>
            {findDist('galodo', 46.5)}
          </Text>
          <View style={styles.cardFooterRow}>
            <Text style={styles.subtext}>Hulu Batang Anai</Text>
            <View style={styles.navHintRow}>
              <Navigation size={10} color={colors.brand.primary} />
              <Text style={styles.navHintText}>Rute</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Banjir DAS */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => onSelectHazard && onSelectHazard('banjir')}
          activeOpacity={0.75}
        >
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <CloudRain size={16} color={colors.category.banjir} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.hazardName}>Rawan Banjir</Text>
            </View>
            <View style={[styles.miniStatusBadge, { backgroundColor: banjirStatus.bg }]}>
              <Text style={[styles.miniStatusText, { color: banjirStatus.color }]}>
                {banjirStatus.label}
              </Text>
            </View>
          </View>
          <Text style={[styles.distValue, { color: banjirStatus.color }]}>
            {findDist('banjir', 5.5)}
          </Text>
          <View style={styles.cardFooterRow}>
            <Text style={styles.subtext}>DAS Batang Kuranji</Text>
            <View style={styles.navHintRow}>
              <Navigation size={10} color={colors.brand.primary} />
              <Text style={styles.navHintText}>Rute</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Fasilitas Evakuasi Terdekat: Posko Pengungsi & Shelter TES */}
      <View style={styles.facilitySection}>
        {/* Metric Posko Pengungsian Terdekat */}
        <TouchableOpacity
          style={styles.poskoMetric}
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
          activeOpacity={0.8}
        >
          <View style={styles.shelterLeft}>
            <View style={[styles.shelterIcon, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
              <Building2 size={16} color={colors.brand.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.shelterLabel}>Posko Pengungsian Terdekat</Text>
              <Text style={styles.shelterName} numberOfLines={1}>
                {poskoName || 'Posko Komando BPBD'}
              </Text>
            </View>
          </View>
          <View style={styles.shelterRight}>
            <Text style={[styles.shelterDist, { color: colors.brand.primary }]}>
              {typeof nearestPoskoKm === 'number' ? nearestPoskoKm.toFixed(2) : nearestPoskoKm} KM
            </Text>
            <View style={styles.actionPillBtn}>
              <Navigation size={10} color="#ffffff" />
              <Text style={styles.actionPillText}>Pandu Rute</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Metric Shelter TES Terdekat */}
        <TouchableOpacity
          style={styles.shelterMetric}
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
          activeOpacity={0.8}
        >
          <View style={styles.shelterLeft}>
            <View style={styles.shelterIcon}>
              <Home size={16} color="#c084fc" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.shelterLabel}>Shelter Vertikal TES Terdekat</Text>
              <Text style={styles.shelterName} numberOfLines={1}>
                {shelterName || 'TES Ulak Karang'}
              </Text>
            </View>
          </View>
          <View style={styles.shelterRight}>
            <Text style={styles.shelterDist}>
              {typeof nearestShelterKm === 'number' ? nearestShelterKm.toFixed(2) : nearestShelterKm} KM
            </Text>
            <View style={[styles.actionPillBtn, { backgroundColor: '#9333ea' }]}>
              <Navigation size={10} color="#ffffff" />
              <Text style={styles.actionPillText}>Pandu Rute</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    width: '48.5%',
    backgroundColor: colors.surface.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.surface.borderSubtle,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hazardName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.text.primary,
  },
  distValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtext: {
    fontSize: 9.5,
    color: colors.text.muted,
    marginTop: 2,
  },
  facilitySection: {
    marginTop: 8,
    gap: 8,
  },
  poskoMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.25)',
  },
  shelterMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(192, 132, 252, 0.1)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.25)',
  },
  shelterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  shelterIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shelterLabel: {
    fontSize: 10,
    color: '#e9d5ff',
    fontWeight: '600',
  },
  shelterName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  shelterRight: {
    alignItems: 'flex-end',
  },
  shelterDist: {
    fontSize: 16,
    fontWeight: '900',
    color: '#c084fc',
  },
  shelterSafe: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.status.safeText,
  },
  miniStatusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStatusText: {
    fontSize: 8.5,
    fontWeight: '800',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  navHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  navHintText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.brand.primary,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 3,
  },
  actionPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
});
