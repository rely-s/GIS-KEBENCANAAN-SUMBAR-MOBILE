/**
 * Type Contracts - Siaga Sumbar Mobile
 * Sinkron dengan Pydantic DTO FastAPI Backend (bencana.py, posko.py, proximity.py)
 */

export type ThreatStatus = 'ZONA_AMAN' | 'WASPADA' | 'BAHAYA_LANGSUNG';

export interface ThreatItem {
  id: string;
  name: string;
  type: 'tsunami' | 'sesar' | 'galodo' | 'banjir' | 'longsor';
  distance_meters: number;
  distance_km: number;
  buffer_limit_meters: number;
  status: ThreatStatus;
  description: string;
  actionable_directive: string;
  nearest_point: {
    lat: number;
    lon: number;
  };
}

export interface ProximityCheckResponse {
  status: string;
  user_location: {
    lat: number;
    lon: number;
  };
  primary_threat: ThreatItem;
  all_threats: ThreatItem[];
  engine: string;
}

export interface PoskoProperties {
  id: number;
  nama: string;
  jenis: 'posko_utama' | 'posko_pengungsi' | 'titik_kumpul' | 'shelter_sementara' | 'fasilitas_kesehatan' | 'shelter_tes_tea' | 'sirine_tsunami';
  kapasitas: number;
  fasilitas: string[];
  kontak_pic: string | null;
  kontak_telepon: string | null;
  status: 'aktif' | 'penuh' | 'nonaktif';
  jumlah_pengungsi?: number;
  ketersediaan_air_bersih?: string;
  ketersediaan_tenaga_medis?: string;
  ketersediaan_dapur_umum?: string;
  updated_at?: string;
}

export interface PoskoFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lon, lat]
  };
  properties: PoskoProperties;
}

export interface PoskoResponse {
  type: 'FeatureCollection';
  features: PoskoFeature[];
}

export interface LaporWargaPayload {
  jenis_bencana: string;
  lat: number;
  lon: number;
  deskripsi: string;
  nama_pelapor?: string;
  kontak_pelapor?: string;
  foto_base64?: string;
}

export interface LaporanRecord {
  id: string;
  jenis_bencana: string;
  lokasi_teks: string;
  deskripsi: string;
  timestamp: string;
  status: 'Menunggu Verifikasi BPBD' | 'Terverifikasi & Diteruskan' | 'Selesai Ditangani';
  foto_uri?: string;
  lat: number;
  lon: number;
}

export interface UserLocation {
  lat: number;
  lon: number;
  addressLabel: string;
  accuracyMeters?: number;
}
