import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Map, ExternalLink, Layers, Phone } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';

interface WebMapHandoffProps {
  userLat: number;
  userLon: number;
  webBaseUrl?: string;
}

export const WebMapHandoff: React.FC<WebMapHandoffProps> = ({
  userLat,
  userLon,
  webBaseUrl = 'http://127.0.0.1:5173',
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleOpenWebGIS = async () => {
    try {
      const fullUrl = `${webBaseUrl}/?view=mobile_lite&lat=${userLat}&lon=${userLon}&zoom=15&layer=posko,sesar`;
      await WebBrowser.openBrowserAsync(fullUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        toolbarColor: colors.surface.card,
        controlsColor: colors.brand.primary,
      });
    } catch (err) {
      console.warn('Gagal membuka Web GIS:', err);
    }
  };

  const handleCallEmergency = () => {
    Linking.openURL('tel:112');
  };

  return (
    <View style={styles.container}>
      {/* Web GIS Handoff Card */}
      <View style={styles.card}>
        <View style={styles.leftRow}>
          <View style={styles.iconCircle}>
            <Map size={18} color={colors.brand.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <Text style={styles.title}>Visualisasi Peta Lengkap</Text>
              <View style={styles.layerBadge}>
                <Layers size={10} color={colors.category.banjir} />
                <Text style={styles.layerText}>Web GIS</Text>
              </View>
            </View>
            <Text style={styles.description}>
              Buka peta interaktif Pusdalops BPBD (vektor sebaran, poligon zonasi & analisis spasial penuh).
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.openBtn}
          onPress={handleOpenWebGIS}
          activeOpacity={0.8}
        >
          <Text style={styles.openBtnText}>Buka Web GIS Pusdalops</Text>
          <ExternalLink size={13} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Emergency Callout Card (Apple Emergency HIG) */}
      <View style={styles.emergencyCard}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.emergencyTitle} numberOfLines={1}>Siaga Tanggap Darurat</Text>
            <Text style={styles.emergencyDesc} numberOfLines={1}>Pusdalops BPBD Prov. Sumbar 24/7</Text>
          </View>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={handleCallEmergency}
            activeOpacity={0.8}
          >
            <Phone size={12} color="#FFFFFF" />
            <Text style={styles.callBtnText}>Panggil 112</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    marginVertical: 8,
    gap: 8,
  },
  card: {
    backgroundColor: colors.surface.card, // Apple #1C1C1E
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: colors.surface.borderSubtle,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 159, 10, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  layerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(10, 132, 255, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  layerText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.category.banjir,
  },
  description: {
    fontSize: 11.5,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  openBtn: {
    flexDirection: 'row',
    backgroundColor: colors.brand.primary,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  openBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#ffffff',
  },
  emergencyCard: {
    backgroundColor: 'rgba(255, 69, 58, 0.08)',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 69, 58, 0.25)',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  emergencyTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.status.dangerText,
    marginBottom: 1,
  },
  emergencyDesc: {
    fontSize: 10.5,
    color: colors.text.secondary,
  },
  callBtn: {
    flexDirection: 'row',
    backgroundColor: colors.status.dangerText, // Apple System Red #FF453A
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  callBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
});

