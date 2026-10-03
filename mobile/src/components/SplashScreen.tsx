import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { FONTS } from '../theme/typography';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Entrance animation (Logo scale & fade in)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Gentle pulsing glow behind logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Complete splash screen after 1.8s
    const timer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" translucent />

      {/* Ambient background glow */}
      <Animated.View
        style={[
          styles.ambientGlow,
          {
            opacity: glowAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />

      {/* Center Logo Section */}
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoCard}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </View>
      </Animated.View>

      {/* Brand & Typography Section */}
      <Animated.View style={[styles.brandContainer, { opacity: textFadeAnim }]}>
        <Text style={styles.appName}>SIAGA SUMBAR</Text>
        <Text style={styles.appTagline}>SISTEM GEOSPASIAL KEBENCANAAN TERPADU</Text>
        <View style={styles.divider} />
        <Text style={styles.institutionText}>BPBD PROVINSI SUMATERA BARAT</Text>
      </Animated.View>

      {/* Bottom Footer */}
      <Animated.View style={[styles.footerContainer, { opacity: textFadeAnim }]}>
        <Text style={styles.footerNote}>Pusdalops PB Sumbar • Riset LPPM UPI YPTK</Text>
        <Text style={styles.versionText}>Versi 1.0.0 (Produksi)</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19', // CoinWell deep night slate
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  ambientGlow: {
    position: 'absolute',
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: (width * 0.75) / 2,
    backgroundColor: 'rgba(56, 189, 248, 0.12)', // Cyan radial glow
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  logoCard: {
    width: 140,
    height: 140,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: '#F8FAFC',
    letterSpacing: 2.5,
    textAlign: 'center',
    marginBottom: 6,
  },
  appTagline: {
    fontFamily: FONTS.semiBold,
    fontSize: 10,
    color: '#38BDF8', // Cyan accent
    letterSpacing: 1.4,
    textAlign: 'center',
    marginBottom: 12,
  },
  divider: {
    width: 36,
    height: 2,
    backgroundColor: 'rgba(56, 189, 248, 0.4)',
    borderRadius: 1,
    marginBottom: 12,
  },
  institutionText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: '#94A3B8',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 36,
    alignItems: 'center',
  },
  footerNote: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: '#64748B',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  versionText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: '#475569',
  },
});
