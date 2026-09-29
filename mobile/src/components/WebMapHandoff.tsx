import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Map, ExternalLink, Layers } from 'lucide-react-native';
import { colors } from '../theme/colors';

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

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.leftRow}>
          <View style={styles.iconCircle}>
            <Map size={20} color={colors.brand.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <Text style={styles.title}>Visualisasi Peta Lengkap</Text>
              <View style={styles.layerBadge}>
                <Layers size={10} color="#38bdf8" />
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
          activeOpacity={0.85}
        >
          <Text style={styles.openBtnText}>Buka Web GIS</Text>
          <ExternalLink size={14} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(249, 115, 22, 0.35)',
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.brand.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text.primary,
  },
  layerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  layerText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38bdf8',
  },
  description: {
    fontSize: 11,
    color: colors.text.secondary,
    lineHeight: 15,
  },
  openBtn: {
    flexDirection: 'row',
    backgroundColor: colors.brand.primary,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  openBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#ffffff',
  },
});
