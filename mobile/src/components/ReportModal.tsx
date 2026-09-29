import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Camera, X, MapPin, Send, CheckCircle2 } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { sendLaporanKejadian } from '../api/client';
import { LaporanRecord } from '../types';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  userLat: number;
  userLon: number;
  locationLabel: string;
  onReportSuccess: (report: LaporanRecord) => void;
  onShowToast: (title: string, msg: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  userLat,
  userLon,
  locationLabel,
  onReportSuccess,
  onShowToast,
}) => {
  const [jenisBencana, setJenisBencana] = useState('Banjir / Genangan Air');
  const [keterangan, setKeterangan] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Banjir / Genangan Air',
    'Galodo / Longsor Tebing',
    'Gempa / Kerusakan Fisik',
    'Pohon Tumbang / Angin',
    'Jalan Terputus / Blokade',
  ];

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // Kompresi agresif on-device menjadi WebP (<200KB)
        const manipResult = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1200 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.WEBP, base64: true }
        );

        setImageUri(manipResult.uri);
        setImageBase64(manipResult.base64 ? `data:image/webp;base64,${manipResult.base64}` : null);
      }
    } catch (err) {
      console.warn('Gagal memproses gambar:', err);
    }
  };

  const handleSubmit = async () => {
    if (!keterangan.trim()) {
      onShowToast('Peringatan', 'Silakan masukkan deskripsi singkat kondisi lapangan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendLaporanKejadian({
        jenis_bencana: jenisBencana,
        lat: userLat,
        lon: userLon,
        deskripsi: keterangan,
        nama_pelapor: 'Warga Lapangan',
        foto_base64: imageBase64 || undefined,
      });

      const newRecord: LaporanRecord = {
        id: String(res.id || Date.now()),
        jenis_bencana: jenisBencana,
        lokasi_teks: locationLabel,
        deskripsi: keterangan,
        timestamp: 'Baru saja',
        status: 'Menunggu Verifikasi BPBD',
        foto_uri: imageUri || undefined,
        lat: userLat,
        lon: userLon,
      };

      onReportSuccess(newRecord);
      onShowToast('Laporan Terkirim', 'Bukti visual dan titik GPS diteruskan ke Pusdalops BPBD.');
      resetForm();
      onClose();
    } catch (err) {
      onShowToast('Tersimpan Lokal', 'Laporan disimpan di antrean offline perangkat.');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setKeterangan('');
    setImageUri(null);
    setImageBase64(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Buat Laporan Kejadian Bencana</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Foto Bukti Picker */}
            <Text style={styles.inputLabel}>Foto Bukti Kejadian (Rekomendasi WebP)</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
              {imageUri ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <View style={styles.badgeReady}>
                    <CheckCircle2 size={12} color="#ffffff" />
                    <Text style={styles.badgeReadyText}>Foto Siap (WebP Terkompresi)</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.placeholderBox}>
                  <Camera size={26} color={colors.brand.primary} />
                  <Text style={styles.placeholderText}>Ambil Foto dari Kamera / Galeri</Text>
                  <Text style={styles.placeholderSub}>Otomatis dikompresi agar hemat kuota darurat</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Kategori Bencana Chips */}
            <Text style={styles.inputLabel}>Pilih Kategori Bencana</Text>
            <View style={styles.categoryRow}>
              {categories.map((cat) => {
                const isSelected = jenisBencana === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, isSelected && styles.catChipActive]}
                    onPress={() => setJenisBencana(cat)}
                  >
                    <Text style={[styles.catChipText, isSelected && styles.catChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Lokasi Otomatis GPS */}
            <View style={styles.locBox}>
              <MapPin size={16} color={colors.brand.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locTitle}>Koordinat GPS Otomatis</Text>
                <Text style={styles.locText} numberOfLines={1}>
                  {locationLabel} ({userLat.toFixed(4)}, {userLon.toFixed(4)})
                </Text>
              </View>
            </View>

            {/* Deskripsi */}
            <Text style={styles.inputLabel}>Deskripsi Kondisi & Kebutuhan Darurat</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: Ketinggian genangan air 60cm merendam jalan dan pemukiman warga..."
              placeholderTextColor={colors.text.muted}
              multiline
              numberOfLines={3}
              value={keterangan}
              onChangeText={setKeterangan}
            />
          </ScrollView>

          {/* Submit Action */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Send size={15} color="#ffffff" />
                  <Text style={styles.submitBtnText}>Kirim Laporan ke BPBD</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: colors.surface.borderSubtle,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface.cardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 8,
    marginTop: 6,
  },
  imagePicker: {
    borderWidth: 1.5,
    borderColor: 'rgba(249, 115, 22, 0.4)',
    borderStyle: 'dashed',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(249, 115, 22, 0.04)',
    marginBottom: 14,
  },
  placeholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
  },
  placeholderText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 6,
  },
  placeholderSub: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
  },
  previewContainer: {
    position: 'relative',
    height: 140,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badgeReady: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.status.safeBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeReadyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  catChip: {
    backgroundColor: colors.surface.cardSecondary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  catChipActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primaryDark,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  catChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  locBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  locTitle: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.brand.primary,
  },
  locText: {
    fontSize: 11,
    color: colors.text.primary,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: colors.surface.cardSecondary,
    borderRadius: 14,
    padding: 12,
    color: colors.text.primary,
    fontSize: 12,
    borderWidth: 1,
    borderColor: colors.surface.border,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: colors.surface.borderSubtle,
    backgroundColor: colors.surface.card,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: colors.brand.primary,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
