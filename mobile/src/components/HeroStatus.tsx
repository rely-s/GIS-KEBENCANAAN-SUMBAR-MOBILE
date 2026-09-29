import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, AlertTriangle, Flame } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { ThreatStatus } from '../types';

interface HeroStatusProps {
  status: ThreatStatus;
  directive: string;
}

export const HeroStatus: React.FC<HeroStatusProps> = ({ status, directive }) => {
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
        badgeText: 'STATUS AMAN',
        Icon: ShieldCheck,
      };

  const { Icon } = config;

  return (
    <View style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }]}>
      <View style={styles.iconCircle}>
        <Icon size={28} color="#ffffff" />
      </View>
      <Text style={styles.badgeLabel}>{config.badgeText}</Text>
      <Text style={[styles.directiveText, { color: config.text }]}>
        {directive || 'Anda berada di luar radius sempadan bahaya aktif Sumatera Barat saat ini.'}
      </Text>
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
});
