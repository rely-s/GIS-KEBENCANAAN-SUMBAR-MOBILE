import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, AlertTriangle, Flame, CheckCircle } from 'lucide-react-native';
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
        bg: '#7f1d1d', // Red 900
        border: '#991b1b', // Red 800
        iconBg: '#ef4444', // Red 500
        text: '#fecaca', // Red 200
        badgeText: 'STATUS BAHAYA',
        Icon: Flame,
      }
    : isWarning
    ? {
        bg: '#78350f', // Amber 900
        border: '#92400e', // Amber 800
        iconBg: '#f59e0b', // Amber 500
        text: '#fde68a', // Amber 200
        badgeText: 'STATUS WASPADA',
        Icon: AlertTriangle,
      }
    : {
        bg: '#064e3b', // Emerald 900
        border: '#065f46', // Emerald 800
        iconBg: '#10b981', // Emerald 500
        text: '#d1fae5', // Emerald 100
        badgeText: 'STATUS AMAN',
        Icon: ShieldCheck,
      };

  const { Icon } = config;

  return (
    <View style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }]}>
      <View style={styles.bgIconWrapper}>
        <CheckCircle size={100} color={config.iconBg} opacity={0.15} />
      </View>
      
      <View style={styles.contentWrapper}>
        <View style={[styles.iconCircle, { backgroundColor: config.iconBg, shadowColor: config.iconBg }]}>
          <Icon size={24} color="#ffffff" />
        </View>
        <Text style={styles.badgeLabel}>{config.badgeText}</Text>
        <Text style={[styles.directiveText, { color: config.text }]}>
          {directive || 'Anda berada di luar zona bahaya terdekat.'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  bgIconWrapper: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    zIndex: 0,
  },
  contentWrapper: {
    alignItems: 'center',
    textAlign: 'center',
    zIndex: 10,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  badgeLabel: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  directiveText: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.8,
  },
});
