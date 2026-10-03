import React, { useMemo } from 'react';
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
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { FONTS } from '../theme/typography';

interface EnvironmentalCardProps {
  data: EnvironmentalHealthResponse | null;
  isLoading?: boolean;
}

export const EnvironmentalCard: React.FC<EnvironmentalCardProps> = ({ data, isLoading }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (isLoading || !data) {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Activity size={13} color={colors.text.secondary} />
            <Text style={styles.headerTitle}>KUALITAS UDARA & CUACA</Text>
          </View>
          <Text style={styles.headerSubtitle} numberOfLines={1}>Memuat BMKG...</Text>
        </View>
      </View>
    );
  }

  const { panas, kualitas_udara, lokasi } = data;

  const stationName = useMemo(() => {
    if (!lokasi?.stasiun_terdekat) return 'BMKG';
    const clean = lokasi.stasiun_terdekat
      .replace(/^Stasiun\s+(Meteorologi|Geofisika|Klimatologi|Pemantau\s+Atmosfer\s+Global|GAW)\s+/i, '')
      .replace(/^BMKG\s+/i, '')
      .trim();
    return clean ? `BMKG ${clean.split(' ')[0]}` : 'BMKG';
  }, [lokasi?.stasiun_terdekat]);

  return (
    <View style={styles.cardContainer}>
      {/* Apple Weather Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Wind size={13} color={colors.text.secondary} />
          <Text style={styles.headerTitle}>UDARA & CUACA</Text>
        </View>
        <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
          {stationName}
        </Text>
      </View>

      {/* Two Column Metric Wells */}
      <View style={styles.gridRow}>
        {/* Metric 1: ISPU PM2.5 */}
        <View style={styles.metricWell}>
          <View style={styles.wellTop}>
            <Gauge size={13} color={colors.category.tsunami} />
            <Text style={styles.wellLabel}>ISPU (PM2.5)</Text>
          </View>
          <Text style={[styles.largeValue, { color: colors.category.tsunami }]}>
            {kualitas_udara.ispu_value}
          </Text>
          <Text style={styles.wellDetail}>
            PM2.5: <Text style={styles.boldText}>{kualitas_udara.pm25}</Text> µg/m³
          </Text>
        </View>

        {/* Metric 2: Indeks Panas */}
        <View style={styles.metricWell}>
          <View style={styles.wellTop}>
            <Flame size={13} color={colors.brand.primary} />
            <Text style={styles.wellLabel}>SUHU TERASA</Text>
          </View>
          <Text style={[styles.largeValue, { color: colors.brand.primary }]}>
            {Math.round(panas.suhu_terasa_c)}°
          </Text>
          <Text style={styles.wellDetail}>
            Aktual: <Text style={styles.boldText}>{Math.round(panas.suhu_aktual_c)}°C</Text>
          </Text>
        </View>
      </View>

      {/* Hairline Divider */}
      <View style={styles.divider} />

      {/* Quick Telemetry Row (Apple Weather Style) */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Droplets size={12} color={colors.text.secondary} />
          <Text style={styles.metaText}>Lembap {panas.kelembapan_persen}%</Text>
        </View>
        <View style={styles.metaItem}>
          <Wind size={12} color={colors.text.secondary} />
          <Text style={styles.metaText}>{panas.kecepatan_angin_kmh} km/j {panas.arah_angin}</Text>
        </View>
        <View style={styles.metaItem}>
          <Sun size={12} color={colors.text.secondary} />
          <Text style={styles.metaText}>{panas.kondisi_cuaca}</Text>
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    cardContainer: {
      backgroundColor: colors.surface.card,
      borderRadius: 16,
      borderWidth: 0.5,
      borderColor: colors.surface.border,
      padding: 16,
      marginVertical: 6,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 0,
    },
    headerTitle: {
      fontFamily: FONTS.bold,
      fontSize: 11,
      color: colors.text.secondary,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    headerSubtitle: {
      fontFamily: FONTS.medium,
      fontSize: 11,
      color: colors.text.muted,
      flexShrink: 1,
      textAlign: 'right',
      marginLeft: 8,
    },
    gridRow: {
      flexDirection: 'row',
      gap: 10,
    },
    metricWell: {
      flex: 1,
      backgroundColor: colors.surface.cardSecondary,
      borderRadius: 12,
      padding: 12,
    },
    wellTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 6,
    },
    wellLabel: {
      fontFamily: FONTS.semiBold,
      fontSize: 10.5,
      color: colors.text.secondary,
      letterSpacing: 0.2,
    },
    largeValue: {
      fontFamily: FONTS.extraBold,
      fontSize: 28,
      letterSpacing: -0.6,
      marginBottom: 4,
    },
    wellDetail: {
      fontFamily: FONTS.regular,
      fontSize: 11.5,
      color: colors.text.secondary,
    },
    boldText: {
      fontFamily: FONTS.bold,
      color: colors.text.primary,
    },
    divider: {
      height: 0.5,
      backgroundColor: colors.surface.border,
      marginVertical: 12,
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    metaText: {
      fontFamily: FONTS.medium,
      fontSize: 11.5,
      color: colors.text.secondary,
    },
  });

