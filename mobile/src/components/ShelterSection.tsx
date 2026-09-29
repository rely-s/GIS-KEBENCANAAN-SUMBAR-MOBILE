import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Building2, Navigation, Phone, HeartPulse, CheckCircle2 } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { PoskoFeature } from '../types';

interface ShelterSectionProps {
  shelters: PoskoFeature[];
  onOpenWebRoute: (poskoId?: number) => void;
}

export const ShelterSection: React.FC<ShelterSectionProps> = ({
  shelters,
  onOpenWebRoute,
}) => {
  const tesShelter =
    shelters.find(
      (s) =>
        s.properties.jenis === 'shelter_tes_tea' ||
        s.properties.jenis === 'shelter_sementara' ||
        s.properties.nama.toLowerCase().includes('tes') ||
        s.properties.nama.toLowerCase().includes('shelter')
    ) || shelters[0];

  const poskoBpbd =
    shelters.find(
      (s) =>
        s.properties.jenis === 'posko_utama' ||
        s.properties.nama.toLowerCase().includes('bpbd') ||
        s.properties.nama.toLowerCase().includes('camat')
    ) || shelters[1];

  const poskoMedis =
    shelters.find(
      (s) =>
        s.properties.jenis === 'fasilitas_kesehatan' ||
        s.properties.nama.toLowerCase().includes('rs') ||
        s.properties.nama.toLowerCase().includes('faskes') ||
        s.properties.nama.toLowerCase().includes('medis')
    ) || shelters[2];

  const formatDistance = (feature?: PoskoFeature) => {
    if (!feature || !feature.properties) return '~ Titik Aman';
    const m = feature.properties.jarak_meter;
    const km = feature.properties.jarak_km;
    if (m != null) {
      return m < 1000 ? `${m} M` : `${(m / 1000).toFixed(1)} KM`;
    }
    if (km != null) {
      return `${km} KM`;
    }
    return '~';
  };

  const handleCall = (phoneNumber: string | null) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {});
  };

  return (
    <View style={styles.container}>
      {/* 1. Primary Shelter TES */}
      <View style={styles.sectionHeader}>
        <View style={styles.titleWithIcon}>
          <Building2 size={16} color={colors.brand.primary} />
          <Text style={styles.titleText}>SHELTER EVAKUASI TERDEKAT (TES)</Text>
        </View>
        <Text style={styles.badgeSiaga}>Siaga 24 Jam</Text>
      </View>

      {tesShelter && (
        <View style={styles.tesCard}>
          <View style={styles.tesTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tesName}>{tesShelter.properties.nama}</Text>
              <Text style={styles.tesDetails}>
                Kapasitas: {(tesShelter.properties.kapasitas || 1500).toLocaleString('id-ID')} Jiwa • Titik Kumpul Aman
              </Text>
            </View>
            <View style={styles.badgeDistance}>
              <Text style={styles.distText}>{formatDistance(tesShelter)}</Text>
            </View>
          </View>

          <View style={styles.facilityRow}>
            <View style={styles.facilityItem}>
              <CheckCircle2 size={12} color={colors.status.safeText} />
              <Text style={styles.facilityText}>Air Bersih Siaga</Text>
            </View>
            <View style={styles.facilityItem}>
              <CheckCircle2 size={12} color={colors.status.safeText} />
              <Text style={styles.facilityText}>Tenaga Medis</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.routeBtn}
              onPress={() => onOpenWebRoute(tesShelter.properties.id)}
              activeOpacity={0.8}
            >
              <Navigation size={13} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.routeBtnText}>Pandu Rute Evakuasi (Peta Teraman)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 2. Posko Darurat & Medis Grid */}
      <View style={[styles.sectionHeader, { marginTop: 14 }]}>
        <View style={styles.titleWithIcon}>
          <HeartPulse size={16} color="#ef4444" />
          <Text style={styles.titleText}>POSKO DARURAT & MEDIS TERDEKAT</Text>
        </View>
      </View>

      <View style={styles.poskoGrid}>
        {/* Posko BPBD */}
        <View style={styles.poskoCard}>
          <View>
            <Text style={styles.poskoBadgeBpbd}>KOMANDO BPBD</Text>
            <Text style={styles.poskoTitle} numberOfLines={2}>
              {poskoBpbd?.properties.nama || 'Posko Komando BPBD'}
            </Text>
            <Text style={styles.poskoMeta}>Jarak: {formatDistance(poskoBpbd)}</Text>
          </View>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => handleCall(poskoBpbd?.properties.kontak_telepon || '112')}
            activeOpacity={0.7}
          >
            <Phone size={12} color="#10b981" />
            <Text style={styles.callBtnText}>Panggil {poskoBpbd?.properties.kontak_telepon || '112'}</Text>
          </TouchableOpacity>
        </View>

        {/* Pos Medis */}
        <View style={styles.poskoCard}>
          <View>
            <Text style={styles.poskoBadgeMedis}>DARURAT MEDIS</Text>
            <Text style={styles.poskoTitle} numberOfLines={2}>
              {poskoMedis?.properties.nama || 'Faskes RSUP Darurat'}
            </Text>
            <Text style={styles.poskoMeta}>Jarak: {formatDistance(poskoMedis)}</Text>
          </View>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => handleCall(poskoMedis?.properties.kontak_telepon || '118')}
            activeOpacity={0.7}
          >
            <Phone size={12} color="#38bdf8" />
            <Text style={styles.callBtnText}>Panggil {poskoMedis?.properties.kontak_telepon || '118'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  badgeSiaga: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.status.safeText,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tesCard: {
    backgroundColor: colors.surface.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surface.borderSubtle,
  },
  tesTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tesName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  tesDetails: {
    fontSize: 10.5,
    color: colors.text.secondary,
  },
  badgeDistance: {
    backgroundColor: colors.brand.primaryFaint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  distText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brand.primary,
  },
  facilityRow: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.surface.borderSubtle,
    marginBottom: 10,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  facilityText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.primary,
  },
  actionRow: {
    flexDirection: 'row',
  },
  routeBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.brand.primary,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  poskoGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  poskoCard: {
    flex: 1,
    backgroundColor: colors.surface.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.surface.borderSubtle,
    justifyContent: 'space-between',
  },
  poskoBadgeBpbd: {
    fontSize: 9,
    fontWeight: '800',
    color: '#f87171',
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  poskoBadgeMedis: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  poskoTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.text.primary,
    minHeight: 32,
  },
  poskoMeta: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
    marginBottom: 8,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.cardSecondary,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  callBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.text.primary,
  },
});
