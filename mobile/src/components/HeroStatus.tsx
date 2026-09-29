import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, AlertTriangle, Flame } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { ThreatStatus } from '../types';

interface HeroStatusProps {
  status: ThreatStatus;
  directive: string;
  lastUpdated?: string;
}

export const HeroStatus: React.FC<HeroStatusProps> = ({ status, directive, lastUpdated }) => {
  const isDanger = status === 'BAHAYA_LANGSUNG';
  const isWarning = status === 'WASPADA';

  const config = isDanger
    ? {
        bg: colors.status.dangerBg,
        border: colors.status.dangerBorder,
        text: colors.status.dangerText,
        badgeText: 'ZONA BAHAYA LANGSUNG',
        Icon: Flame,
      }
    : isWarning
    ? {
        bg: colors.status.warningBg,
        border: colors.status.warningBorder,
        text: colors.status.warningText,
        badgeText: 'ZONA WASPADA BENCANA',
        Icon: AlertTriangle,
      }
    : {
        bg: colors.status.safeBg,
        border: colors.status.safeBorder,
        text: colors.status.safeText,
        badgeText: 'KONDISI TERPANTAU KONDUSIF',
        Icon: ShieldCheck,
      };

  const { Icon } = config;

  return (
    <View style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }]}>
      <View style={styles.iconCircle}>
        <Icon size={26} color="#ffffff" />
      </View>
      <Text style={styles.badgeLabel}>{config.badgeText}</Text>
      <Text style={[styles.directiveText, { color: config.text }]}>
        {directive || 'Lokasi berada di luar radius sempadan langsung ancaman bahaya saat ini.'}
      </Text>
      {lastUpdated && (
        <View style={styles.timestampBox}>
          <Text style={styles.timestampText}>Pembaruan Sistem: {lastUpdated}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1.5,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  badgeLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  directiveText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  timestampBox: {
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timestampText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
  },
});
