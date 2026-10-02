import React, { useState, useMemo } from 'react';
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
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera, Image as ImageIcon, X, MapPin, Send, CheckCircle2, AlertCircle, Phone } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { FONTS } from '../theme/typography';
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [jenisBencana, setJenisBencana] = useState('Banjir / Genangan Air');
  const [urgensi, setUrgensi] = useState<'normal' | 'darurat'>('normal');
  const [keterangan, setKeterangan] = useState('');
  const [kontak, setKontak] = useState('');
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

  const processImageUri = async (uri: string) => {
    try {
      // Kompresi agresif on-device menjadi WebP (<200KB)
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.WEBP, base64: true }
      );

      setImageUri(manipResult.uri);
      setImageBase64(manipResult.base64 ? `data:image/webp;base64,${manipResult.base64}` : null);
    } catch (err) {
      console.warn('Gagal memproses gambar:', err);
    }
  };

  const handleLaunchCamera = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          onShowToast('Izin Kamera Ditolak', 'Aplikasi butuh izin kamera untuk bukti visual bencana.');
          return;
        }
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Gagal membuka kamera:', err);
      // Fallback ke library jika browser/simulator tidak ada kamera fisik
      handlePickFromLibrary();
    }
  };

  const handlePickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Gagal membuka galeri:', err);
    }
  };

  const handleSubmit = async () => {
    if (!keterangan.trim()) {
      onShowToast('Peringatan', 'Silakan masukkan deskripsi singkat kondisi lapangan.');
      return;
    }

    setIsSubmitting(true);
    const newRecord: LaporanRecord = {
      id: `rep-${Date.now()}`,
      jenis_bencana: jenisBencana,
      lokasi_teks: locationLabel,
      deskripsi: keterangan,
      timestamp: 'Baru saja',
      status: 'Menunggu Verifikasi BPBD',
      foto_uri: imageUri || undefined,
      lat: userLat,
      lon: userLon,
      urgensi: urgensi,
      kontak_pelapor: kontak || undefined,
    };

    try {
      const res = await sendLaporanKejadian({
        jenis_bencana: jenisBencana,
        lat: userLat,
        lon: userLon,
        deskripsi: `[Urgensi: ${urgensi.toUpperCase()}] ${keterangan}`,
        nama_pelapor: 'Warga Lapangan',
        kontak_pelapor: kontak || undefined,
        foto_base64: imageBase64 || undefined,
        urgensi: urgensi,
      });

      if (res.success) {
        if (res.id) newRecord.id = String(res.id);
        onReportSuccess(newRecord);
        onShowToast('Laporan Terkirim', 'Laporan dan koordinat GPS berhasil diterima Pusdalops BPBD.');
      } else {
        // Simpan offline ke AsyncStorage
        await saveReportOffline(newRecord);
        onReportSuccess(newRecord);
        onShowToast('Tersimpan di Antrean', 'Sinyal terputus. Laporan disimpan dan dikirim otomatis saat online.');
      }
      resetForm();
      onClose();
    } catch (err) {
      await saveReportOffline(newRecord);
      onReportSuccess(newRecord);
      onShowToast('Tersimpan di Antrean', 'Laporan disimpan di memori HP dan akan disinkronkan saat sinyal pulih.');
      resetForm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveReportOffline = async (record: LaporanRecord) => {
    try {
      const existing = await AsyncStorage.getItem('@offline_reports');
      const list = existing ? JSON.parse(existing) : [];
      list.unshift(record);
      await AsyncStorage.setItem('@offline_reports', JSON.stringify(list));
    } catch (_) { }
  };

  const resetForm = () => {
    setKeterangan('');
    setKontak('');
    setUrgensi('normal');
    setImageUri(null);
    setImageBase64(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Buat Laporan Bencana</Text>
              <Text style={styles.headerSub}>Terhubung langsung ke Command Center BPBD</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Tingkat Urgensi */}
            <Text style={styles.inputLabel}>Tingkat Urgensi Situasi</Text>
            <View style={styles.urgencyRow}>
              <TouchableOpacity
                style={[styles.urgencyBtn, urgensi === 'normal' && styles.urgencyBtnNormalActive]}
                onPress={() => setUrgensi('normal')}
              >
                <Text style={[styles.urgencyBtnText, urgensi === 'normal' && styles.urgencyBtnTextActive]}>
                  Informasi Bencana
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.urgencyBtn, urgensi === 'darurat' && styles.urgencyBtnDangerActive]}
                onPress={() => setUrgensi('darurat')}
              >
                <Text style={[styles.urgencyBtnText, urgensi === 'darurat' && styles.urgencyBtnTextDanger]}>
                  Butuh Evakuasi Darurat
                </Text>
              </TouchableOpacity>
            </View>

            {/* Foto Bukti Picker */}
            <Text style={styles.inputLabel}>Foto Bukti Lapangan</Text>
            {imageUri ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                <View style={styles.badgeReady}>
                  <CheckCircle2 size={12} color="#ffffff" />
                  <Text style={styles.badgeReadyText}>Foto Terlampir & Terkompresi</Text>
                </View>
                <TouchableOpacity
                  style={styles.retakeBtn}
                  onPress={() => {
                    setImageUri(null);
                    setImageBase64(null);
                  }}
                >
                  <Text style={styles.retakeText}>Ganti Foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoActionsRow}>
                <TouchableOpacity style={styles.photoActionBtn} onPress={handleLaunchCamera} activeOpacity={0.8}>
                  <Camera size={20} color={colors.brand.primary} />
                  <Text style={styles.photoActionText}>Ambil Foto Kamera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoActionBtn} onPress={handlePickFromLibrary} activeOpacity={0.8}>
                  <ImageIcon size={20} color={colors.category.banjir} />
                  <Text style={styles.photoActionText}>Pilih dari Galeri</Text>
                </TouchableOpacity>
              </View>
            )}

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
                <Text style={styles.locTitle}>Koordinat GPS Terdeteksi</Text>
                <Text style={styles.locText} numberOfLines={1}>
                  {locationLabel} ({userLat.toFixed(4)}, {userLon.toFixed(4)})
                </Text>
              </View>
            </View>

            {/* Kontak Pelapor */}
            <Text style={styles.inputLabel}>Nomor HP / WhatsApp Pelapor (Opsional)</Text>
            <View style={styles.phoneInputBox}>
              <Phone size={14} color={colors.text.muted} />
              <TextInput
                style={styles.phoneInput}
                placeholder="Contoh: 081234567890 (Untuk konfirmasi tim SAR)"
                placeholderTextColor={colors.text.muted}
                keyboardType="phone-pad"
                value={kontak}
                onChangeText={setKontak}
              />
            </View>

            {/* Deskripsi */}
            <Text style={styles.inputLabel}>Deskripsi Kondisi & Korban</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Contoh: Ketinggian air 60cm, ada 2 lansia terjebak di dalam rumah butuh perahu karet..."
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
              style={[styles.submitBtn, urgensi === 'darurat' && { backgroundColor: '#dc2626' }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Send size={15} color="#ffffff" />
                  <Text style={styles.submitBtnText}>
                    {urgensi === 'darurat' ? 'KIRIM LAPORAN DARURAT (PRIORITAS)' : 'Kirim Laporan ke BPBD'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      fontFamily: FONTS.bold,
      fontSize: 15,
      color: colors.text.primary,
      letterSpacing: -0.3,
    },
    headerSub: {
      fontFamily: FONTS.regular,
      fontSize: 10.5,
      color: colors.text.muted,
      marginTop: 2,
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
      fontFamily: FONTS.bold,
      fontSize: 11,
      color: colors.text.secondary,
      marginBottom: 8,
      marginTop: 6,
    },
    urgencyRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
    },
    urgencyBtn: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor: colors.surface.cardSecondary,
      borderWidth: 1,
      borderColor: colors.surface.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    urgencyBtnNormalActive: {
      backgroundColor: 'rgba(234, 179, 8, 0.15)',
      borderColor: '#eab308',
    },
    urgencyBtnDangerActive: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      borderColor: '#ef4444',
    },
    urgencyBtnText: {
      fontFamily: FONTS.semiBold,
      fontSize: 11,
      color: colors.text.muted,
    },
    urgencyBtnTextActive: {
      fontFamily: FONTS.bold,
      color: '#eab308',
    },
    urgencyBtnTextDanger: {
      fontFamily: FONTS.bold,
      color: '#ef4444',
    },
    photoActionsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
    },
    photoActionBtn: {
      flex: 1,
      height: 76,
      backgroundColor: colors.surface.cardSecondary,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.surface.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    photoActionText: {
      fontFamily: FONTS.semiBold,
      fontSize: 11,
      color: colors.text.secondary,
    },
    retakeBtn: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    retakeText: {
      fontFamily: FONTS.bold,
      fontSize: 10,
      color: '#ffffff',
    },
    phoneInputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface.cardSecondary,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.surface.border,
      marginBottom: 14,
      gap: 8,
    },
    phoneInput: {
      flex: 1,
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: colors.text.primary,
      padding: 0,
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
      fontFamily: FONTS.bold,
      fontSize: 12,
      color: colors.text.primary,
      marginTop: 6,
    },
    placeholderSub: {
      fontFamily: FONTS.regular,
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
      fontFamily: FONTS.bold,
      fontSize: 10,
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
      fontFamily: FONTS.semiBold,
      fontSize: 11,
      color: colors.text.secondary,
    },
    catChipTextActive: {
      color: '#ffffff',
      fontFamily: FONTS.bold,
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
      fontFamily: FONTS.bold,
      fontSize: 9.5,
      color: colors.brand.primary,
    },
    locText: {
      fontFamily: FONTS.semiBold,
      fontSize: 11,
      color: colors.text.primary,
    },
    textInput: {
      backgroundColor: colors.surface.cardSecondary,
      borderRadius: 14,
      padding: 12,
      color: colors.text.primary,
      fontFamily: FONTS.regular,
      fontSize: 12,
      borderWidth: 1,
      borderColor: colors.surface.border,
      minHeight: 70,
      textAlignVertical: 'top',
      marginBottom: 20,
    },
    footer: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'android' ? 24 : 16,
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
      fontFamily: FONTS.bold,
      fontSize: 13,
      color: '#ffffff',
      letterSpacing: 0.1,
    },
  });
