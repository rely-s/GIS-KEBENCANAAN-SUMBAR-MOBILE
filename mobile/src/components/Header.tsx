import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MapPin, RotateCw, PhoneCall } from 'lucide-react-native';
import { colors } from '../theme/colors';

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

        {/* SOS Fast Action */}
        <TouchableOpacity style={styles.sosButton} onPress={onOpenSos} activeOpacity={0.8}>
          <PhoneCall size={13} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={styles.sosText}>SOS 112</Text>
        </TouchableOpacity>
      </View>

      {/* Geolocation Card */}
      <View style={styles.locationCard}>
        <View style={styles.locationInfo}>
          <View style={styles.pinCircle}>
            <MapPin size={16} color="#38bdf8" />
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

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 6,
    backgroundColor: colors.surface.canvas,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    marginRight: 6,
  },
  logosWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 9.5,
    fontWeight: '600',
    color: colors.brand.primaryLight,
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
    flexShrink: 0,
  },
  sosText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  locationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface.card,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.surface.borderSubtle,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    marginRight: 6,
  },
  pinCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
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
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primaryFaint,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
    flexShrink: 0,
  },
  refreshText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.brand.primary,
  },
});
