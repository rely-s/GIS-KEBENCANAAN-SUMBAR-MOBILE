import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, AlertTriangle, Flame, CheckCircle } from 'lucide-react-native';
import { ThreatStatus } from '../types';
import { FONTS } from '../theme/typography';

interface HeroStatusProps {
  status: ThreatStatus;
  directive: string;
  lastUpdated?: string;
}

export const HeroStatus: React.FC<HeroStatusProps> = ({ status, directive }) => {
  const isDanger = status === 'BAHAYA_LANGSUNG';
  const isWarning = status === 'WASPADA';

  const config = isDanger
    ? {
        bg: '#7f1d1d', // Deep Red
        border: '#991b1b',
        iconBg: '#ef4444',
        text: '#fecaca',
        badgeText: 'STATUS BAHAYA',
        Icon: Flame,
        WatermarkIcon: Flame,
      }
    : isWarning
    ? {
        bg: '#78350f', // Deep Amber
        border: '#92400e',
        iconBg: '#f59e0b',
        text: '#fde68a',
        badgeText: 'STATUS WASPADA',
        Icon: AlertTriangle,
        WatermarkIcon: AlertTriangle,
      }
    : {
        bg: '#064e3b', // Deep Emerald Green
        border: '#065f46',
        iconBg: '#10b981',
        text: '#d1fae5',
        badgeText: 'STATUS AMAN',
        Icon: ShieldCheck,
        WatermarkIcon: CheckCircle,
      };

  const { Icon, WatermarkIcon } = config;

  return (
    <View style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }]}>
      {/* Background Watermark */}
      <View style={styles.bgIconWrapper}>
        <WatermarkIcon size={110} color={config.iconBg} opacity={0.12} />
      </View>

      {/* Centered Content */}
      <View style={styles.contentWrapper}>
        <View style={[styles.iconCircle, { backgroundColor: config.iconBg }]}>
          <Icon size={26} color="#ffffff" strokeWidth={2.5} />
        </View>

        <Text style={styles.badgeLabel}>{config.badgeText}</Text>
        <Text style={[styles.directiveText, { color: config.text }]}>
          {directive || 'Jika merasakan guncangan gempa kuat >20 detik, segera lari menjauhi pantai menuju shelter TES vertikal (>15 mdpl).'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginVertical: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  bgIconWrapper: {
    position: 'absolute',
    right: -20,
    bottom: -25,
    zIndex: 0,
  },
  contentWrapper: {
    alignItems: 'center',
    textAlign: 'center',
    zIndex: 10,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  badgeLabel: {
    fontFamily: FONTS.extraBold,
    fontSize: 18,
    color: '#ffffff',
    letterSpacing: 0.8,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  directiveText: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 17,
    opacity: 0.95,
    paddingHorizontal: 6,
  },
});

