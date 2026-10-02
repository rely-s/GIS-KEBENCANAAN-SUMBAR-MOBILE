import React, { useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { PhoneCall, X, Share2, Shield, HeartPulse } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { FONTS } from '../theme/typography';

interface SosModalProps {
  visible: boolean;
  onClose: () => void;
  userLat: number;
  userLon: number;
  onShowToast: (title: string, msg: string) => void;
}

export const SosModal: React.FC<SosModalProps> = ({
  visible,
  onClose,
  userLat,
  userLon,
  onShowToast,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const dialPhone = (number: string) => {
    Linking.openURL(`tel:${number}`).catch(() => {});
  };

  const shareCoordinates = () => {
    const textMsg = encodeURIComponent(
      `🚨 SOS KONDISI DARURAT! Posisi koordinat saya saat ini: https://maps.google.com/?q=${userLat},${userLon} (${userLat.toFixed(5)}, ${userLon.toFixed(5)}). Mohon bantuan evakuasi BPBD/SAR!`
    );
    Linking.openURL(`https://wa.me/?text=${textMsg}`).catch(() => {
      onShowToast('Berhasil Menyalin', 'Teks koordinat darurat disiapkan untuk dibagikan.');
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={16} color={colors.text.secondary} />
          </TouchableOpacity>

          {/* Icon SOS */}
          <View style={styles.iconCircle}>
            <PhoneCall size={30} color="#dc2626" />
          </View>

          <Text style={styles.title}>Pusat Bantuan Darurat SOS</Text>
          <Text style={styles.subtitle}>
            Hubungi instansi komando tanggap darurat resmi atau sebarkan koordinat GPS Anda:
          </Text>

          {/* Action List */}
          <View style={styles.actionList}>
            {/* Call Pusdalops BPBD 112 */}
            <TouchableOpacity
              style={[styles.btnAction, { backgroundColor: '#dc2626' }]}
              onPress={() => dialPhone('112')}
              activeOpacity={0.8}
            >
              <Shield size={16} color="#ffffff" />
              <Text style={styles.btnTextWhite}>Panggilan Darurat BPBD (112)</Text>
            </TouchableOpacity>

            {/* Call Basarnas 115 */}
            <TouchableOpacity
              style={[styles.btnAction, { backgroundColor: '#ea580c' }]}
              onPress={() => dialPhone('115')}
              activeOpacity={0.8}
            >
              <PhoneCall size={16} color="#ffffff" />
              <Text style={styles.btnTextWhite}>Basarnas / Tim SAR (115)</Text>
            </TouchableOpacity>

            {/* Call PMI Medis 118 */}
            <TouchableOpacity
              style={[styles.btnAction, { backgroundColor: colors.surface.cardSecondary, borderWidth: 1, borderColor: colors.surface.border }]}
              onPress={() => dialPhone('118')}
              activeOpacity={0.8}
            >
              <HeartPulse size={16} color="#38bdf8" />
              <Text style={styles.btnTextNeutral}>Ambulans & Medis PMI (118)</Text>
            </TouchableOpacity>

            {/* Share GPS Coordinates */}
            <TouchableOpacity
              style={[styles.btnAction, { backgroundColor: colors.brand.primaryFaint, borderWidth: 1, borderColor: colors.brand.primary }]}
              onPress={shareCoordinates}
              activeOpacity={0.8}
            >
              <Share2 size={16} color={colors.brand.primary} />
              <Text style={[styles.btnTextNeutral, { color: colors.brand.primary }]}>
                Sebarkan GPS ke WhatsApp / Kontak
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface.card,
    borderRadius: 28,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(220, 38, 38, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  title: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  actionList: {
    width: '100%',
    gap: 9,
  },
  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  btnTextWhite: {
    fontFamily: FONTS.bold,
    fontSize: 12.5,
    color: '#ffffff',
    letterSpacing: 0.1,
  },
  btnTextNeutral: {
    fontFamily: FONTS.bold,
    fontSize: 12.5,
    color: colors.text.primary,
    letterSpacing: 0.1,
  },
});
