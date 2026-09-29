import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShieldAlert, MapPin, RotateCw, PhoneCall } from 'lucide-react-native';
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
          <View style={styles.logoBadge}>
            <ShieldAlert size={20} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.brandTitle}>Siaga Sumbar</Text>
            <Text style={styles.brandSubtitle}>Pusdalops PB Prov. Sumbar</Text>
          </View>
        </View>

        {/* SOS Fast Action */}
        <TouchableOpacity style={styles.sosButton} onPress={onOpenSos} activeOpacity={0.8}>
          <PhoneCall size={14} color="#ffffff" style={{ marginRight: 4 }} />
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.surface.canvas,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.brand.primaryLight,
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
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
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.surface.borderSubtle,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    marginRight: 8,
  },
  pinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTitle: {
    fontSize: 10,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  locationText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text.primary,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primaryFaint,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  refreshText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand.primary,
  },
});
