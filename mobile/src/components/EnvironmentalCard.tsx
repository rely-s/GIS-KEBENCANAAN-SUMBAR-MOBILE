import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Wind,
  Flame,
  Droplets,
  Gauge,
  Activity,
  Sun,
} from 'lucide-react-native';
import { EnvironmentalHealthResponse } from '../types';

interface EnvironmentalCardProps {
  data: EnvironmentalHealthResponse | null;
  isLoading?: boolean;
}

export const EnvironmentalCard: React.FC<EnvironmentalCardProps> = ({ data, isLoading }) => {

  if (isLoading || !data) {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <Activity size={16} color="#38bdf8" />
            </View>
            <View>
              <Text style={styles.headerTitle}>KUALITAS UDARA & INDEKS PANAS</Text>
              <Text style={styles.headerSubtitle}>Memuat data sensor BMKG...</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  const { panas, kualitas_udara, lokasi } = data;

  return (
    <View style={styles.cardContainer}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
            <Wind size={16} color="#38bdf8" />
          </View>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>KUALITAS UDARA & INDEKS PANAS</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {lokasi?.stasiun_terdekat || 'Stasiun Meteorologi BMKG'}
            </Text>
          </View>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>BMKG Live</Text>
        </View>
      </View>

      {/* Two Column Metric Grid */}
      <View style={styles.gridRow}>
        {/* Metric 1: Indeks Kualitas Udara (ISPU / PM2.5) */}
        <View style={[styles.metricBox, { borderColor: '#38bdf840' }]}>
          <View style={styles.metricHeader}>
            <View style={styles.metricTagRow}>
              <Gauge size={14} color="#38bdf8" />
              <Text style={[styles.metricLabel, { color: '#38bdf8' }]}>ISPU (PM2.5)</Text>
            </View>
            {/* Parameter Kategori Status (Sedang/Baik/dll) dicomment dulu */}
            {/*
            <View style={[styles.statusBadge, { backgroundColor: kualitas_udara.warna + '22' }]}>
              <Text style={[styles.statusBadgeText, { color: kualitas_udara.warna }]}>
                {kualitas_udara.kategori.toUpperCase()}
              </Text>
            </View>
            */}
          </View>

          <View style={styles.metricValueRow}>
            <Text style={[styles.primaryValue, { color: '#38bdf8' }]}>
              {kualitas_udara.ispu_value}
            </Text>
            <View style={styles.subValueCol}>
              <Text style={styles.unitLabel}>Skala ISPU</Text>
              <Text style={styles.secondaryDetail}>
                PM2.5: <Text style={styles.whiteBold}>{kualitas_udara.pm25}</Text> µg/m³
              </Text>
            </View>
          </View>

          {/* Rekomendasi/kategori parameter dicomment dulu */}
          {/*
          <Text style={styles.recommendationText} numberOfLines={2}>
            {kualitas_udara.rekomendasi}
          </Text>
          */}
        </View>

        {/* Metric 2: Indeks Panas (Heat Index & Suhu Terasa) */}
        <View style={[styles.metricBox, { borderColor: '#f59e0b40' }]}>
          <View style={styles.metricHeader}>
            <View style={styles.metricTagRow}>
              <Flame size={14} color="#f59e0b" />
              <Text style={[styles.metricLabel, { color: '#f59e0b' }]}>INDEKS PANAS</Text>
            </View>
            {/* Parameter Kategori Status Panas (Waspada/Aman/dll) dicomment dulu */}
            {/*
            <View style={[styles.statusBadge, { backgroundColor: panas.warna + '22' }]}>
              <Text style={[styles.statusBadgeText, { color: panas.warna }]}>
                {panas.kategori.split(' ')[0].toUpperCase()}
              </Text>
            </View>
            */}
          </View>

          <View style={styles.metricValueRow}>
            <Text style={[styles.primaryValue, { color: '#f59e0b' }]}>
              {Math.round(panas.suhu_terasa_c)}°<Text style={styles.degSmall}>C</Text>
            </Text>
            <View style={styles.subValueCol}>
              <Text style={styles.unitLabel}>Suhu Terasa</Text>
              <Text style={styles.secondaryDetail}>
                Aktual: <Text style={styles.whiteBold}>{Math.round(panas.suhu_aktual_c)}°C</Text>
              </Text>
            </View>
          </View>

          {/* Rekomendasi/kategori parameter dicomment dulu */}
          {/*
          <Text style={styles.recommendationText} numberOfLines={2}>
            {panas.rekomendasi}
          </Text>
          */}
        </View>
      </View>

      {/* Quick Summary Pill Bar */}
      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <Droplets size={12} color="#38bdf8" />
          <Text style={styles.metaPillText}>Lembap {panas.kelembapan_persen}%</Text>
        </View>
        <View style={styles.metaPill}>
          <Wind size={12} color="#a855f7" />
          <Text style={styles.metaPillText}>Angin {panas.kecepatan_angin_kmh} km/j ({panas.arah_angin})</Text>
        </View>
        <View style={styles.metaPill}>
          <Sun size={12} color="#f59e0b" />
          <Text style={styles.metaPillText}>{panas.kondisi_cuaca}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#0f172a', // Slate 900
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 5,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#151f33',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    height: 20,
  },
  metricTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
  },
  primaryValue: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
  },
  degSmall: {
    fontSize: 18,
    fontWeight: '700',
  },
  subValueCol: {
    flex: 1,
    justifyContent: 'center',
  },
  unitLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    lineHeight: 15,
  },
  secondaryDetail: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 14,
  },
  whiteBold: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  recommendationText: {
    fontSize: 10,
    color: '#cbd5e1',
    lineHeight: 14,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 0,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  metaPillText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '600',
  },
});
