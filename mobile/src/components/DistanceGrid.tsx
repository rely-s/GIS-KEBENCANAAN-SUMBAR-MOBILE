import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Waves, Mountain, CloudRain, Activity, Home } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { ThreatItem } from '../types';

interface DistanceGridProps {
  threats: ThreatItem[];
  nearestShelterKm: number;
  shelterName: string;
}

export const DistanceGrid: React.FC<DistanceGridProps> = ({
  threats,
  nearestShelterKm,
  shelterName,
}) => {
  const findDist = (type: string) => {
    const t = threats.find((item) => item.type === type);
    return t ? `${t.distance_km} KM` : '-- KM';
  };

  const findStatusColor = (type: string) => {
    const t = threats.find((item) => item.type === type);
    if (!t) return colors.text.secondary;
    if (t.status === 'BAHAYA_LANGSUNG') return colors.status.dangerText;
    if (t.status === 'WASPADA') return colors.status.warningText;
    return colors.status.safeText;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>ANALISIS JARAK ZONA ANCAMAN (GIS)</Text>
        <Text style={styles.tagLive}>● PostGIS Live</Text>
      </View>

      {/* 4 Hazards Grid */}
      <View style={styles.grid}>
        {/* Tsunami */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
              <Waves size={16} color={colors.category.tsunami} />
            </View>
            <Text style={styles.hazardName}>Zona Tsunami</Text>
          </View>
          <Text style={[styles.distValue, { color: findStatusColor('tsunami') }]}>
            {findDist('tsunami')}
          </Text>
          <Text style={styles.subtext}>Pesisir Padang</Text>
        </View>

        {/* Sesar Semangko */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
              <Activity size={16} color={colors.category.sesar} />
            </View>
            <Text style={styles.hazardName}>Sesar Darat</Text>
          </View>
          <Text style={[styles.distValue, { color: findStatusColor('sesar') }]}>
            {findDist('sesar')}
          </Text>
          <Text style={styles.subtext}>Sianok / Semangko</Text>
        </View>

        {/* Galodo Marapi */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}>
              <Mountain size={16} color={colors.category.galodo} />
            </View>
            <Text style={styles.hazardName}>Lahar Galodo</Text>
          </View>
          <Text style={[styles.distValue, { color: findStatusColor('galodo') }]}>
            {findDist('galodo')}
          </Text>
          <Text style={styles.subtext}>Hulu Batang Anai</Text>
        </View>

        {/* Banjir DAS */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <CloudRain size={16} color={colors.category.banjir} />
            </View>
            <Text style={styles.hazardName}>Rawan Banjir</Text>
          </View>
          <Text style={[styles.distValue, { color: findStatusColor('banjir') }]}>
            {findDist('banjir')}
          </Text>
          <Text style={styles.subtext}>DAS Batang Kuranji</Text>
        </View>
      </View>

      {/* Shelter Banner (Metric ke-5) */}
      <View style={styles.shelterMetric}>
        <View style={styles.shelterLeft}>
          <View style={styles.shelterIcon}>
            <Home size={18} color="#c084fc" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shelterLabel}>Shelter Evakuasi Terdekat</Text>
            <Text style={styles.shelterName} numberOfLines={1}>
              {shelterName || 'TES Ulak Karang'}
            </Text>
          </View>
        </View>
        <View style={styles.shelterRight}>
          <Text style={styles.shelterDist}>{nearestShelterKm} KM</Text>
          <Text style={styles.shelterSafe}>Titik Aman</Text>
        </View>
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
  shelterMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(192, 132, 252, 0.1)',
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
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
});
