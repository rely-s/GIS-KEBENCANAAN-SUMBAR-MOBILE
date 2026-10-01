import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MapPin, RotateCw, PhoneCall, Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';

interface HeaderProps {
  locationLabel: string;
  isDetecting: boolean;
  onRefreshLocation: () => void;
  onOpenSos: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  locationLabel,
  isDetecting,
  onRefreshLocation,
  onOpenSos,
}) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={styles.container}>
      {/* Top Bar Brand */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          {/* Trio Logo: BPBD, Pemprov Sumbar, & UPI YPTK */}
          <View style={styles.logosWrapper}>
            <View style={styles.logoBox}>
              <Image
                source={require('../../assets/logo-bpbd.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.logoBox}>
              <Image
                source={require('../../assets/logo-pemprov.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.logoBox}>
              <Image
                source={require('../../assets/logo-upi.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
          <View style={styles.brandTextContainer}>
            <Text style={styles.brandTitle}>Siaga Sumbar</Text>
            <Text style={styles.brandSubtitle} numberOfLines={1}>
              Pemprov Sumbar • BPBD • UPI
            </Text>
          </View>
        </View>

        {/* Right Actions: Theme Switcher & SOS 112 */}
        <View style={styles.topRightActions}>
          <TouchableOpacity
            style={styles.themeToggleBtn}
            onPress={toggleTheme}
            activeOpacity={0.7}
            accessibilityLabel={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          >
            {isDark ? (
              <Sun size={15} color={colors.text.primary} />
            ) : (
              <Moon size={15} color={colors.text.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.sosButton} onPress={onOpenSos} activeOpacity={0.8}>
            <PhoneCall size={13} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.sosText}>SOS 112</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Geolocation Card */}
      <View style={styles.locationCard}>
        <View style={styles.locationInfo}>
          <View style={styles.pinCircle}>
            <MapPin size={16} color="#0A84FF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationTitle}>Lokasi Koordinat Anda</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {isDetecting ? 'Mendeteksi satelit GPS...' : locationLabel}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={onRefreshLocation}
          disabled={isDetecting}
          activeOpacity={0.7}
        >
          <RotateCw size={13} color={colors.brand.primary} />
          <Text style={styles.refreshText}>{isDetecting ? '...' : 'Perbarui'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 6,
      backgroundColor: colors.surface.canvas,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    brandContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
      marginRight: 6,
    },
    logosWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    logoBox: {
      width: 26,
      height: 26,
      borderRadius: 6,
      backgroundColor: '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 1.5,
      borderWidth: isDark ? 0 : 0.5,
      borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    logoImage: {
      width: '100%',
      height: '100%',
    },
    brandTextContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    brandTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text.primary,
      letterSpacing: -0.3,
    },
    brandSubtitle: {
      fontSize: 10,
      fontWeight: '500',
      color: colors.text.secondary,
    },
    topRightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    themeToggleBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.surface.card,
      borderWidth: 0.5,
      borderColor: colors.surface.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sosButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.status.dangerText,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 15,
      gap: 4,
      flexShrink: 0,
    },
    sosText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#ffffff',
      letterSpacing: 0.2,
    },
    locationCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderWidth: 0.5,
      borderColor: colors.surface.border,
    },
    locationInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 8,
      marginRight: 6,
    },
    pinCircle: {
      width: 26,
      height: 26,
      borderRadius: 6,
      backgroundColor: 'rgba(10, 132, 255, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    locationTitle: {
      fontSize: 9.5,
      color: colors.text.secondary,
      fontWeight: '500',
    },
    locationText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.text.primary,
    },
    refreshBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.brand.primaryFaint,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      gap: 4,
      flexShrink: 0,
    },
    refreshText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.brand.primary,
    },
  });

