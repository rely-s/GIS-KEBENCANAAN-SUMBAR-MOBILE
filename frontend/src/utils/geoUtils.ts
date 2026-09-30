/**
 * Utilitas Geospasial & Audit Perhitungan Jarak Terpadu (WGS84 Geodesic & Routing Engine)
 * GIS Kebencanaan Provinsi Sumatera Barat
 */

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export interface DistanceAuditLog {
  userLatitude: number;
  userLongitude: number;
  userAccuracy?: number | null;
  destinationLatitude: number;
  destinationLongitude: number;
  destinationName?: string;
  calculatedStraightDistanceKm: number;
  displayedDistanceKm: number;
  calculationMethod: 'osrm_road_network' | 'haversine_geodesic' | 'postgis_geography';
  disasterProtocol?: string;
  isCoordinateSwapped?: boolean;
}

// Titik Default Acuan Presisi Pusdalops BPBD (Pesisir Padang Barat)
export const DEFAULT_SUMBAR_COORDS = {
  lat: -0.9471,
  lng: 100.3543,
  nama: 'Padang Barat, Kota Padang (Titik Acuan Siaga Sumbar)'
};

/**
 * 1. Validasi Presisi Koordinat Geografis (WGS-84)
 */
export function isValidCoordinate(lat: any, lon: any): boolean {
  const numLat = Number(lat);
  const numLon = Number(lon);
  return (
    Number.isFinite(numLat) &&
    Number.isFinite(numLon) &&
    numLat >= -90 &&
    numLat <= 90 &&
    numLon >= -180 &&
    numLon <= 180
  );
}

/**
 * 2. Normalisasi & Deteksi Otomatis Jika Latitude dan Longitude Tertukar
 * Cakupan Sumatera Barat: Lintang [-4.5, 1.5], Bujur [96.0, 103.0]
 */
export function normalizeCoordinates(lat: any, lon: any): { lat: number; lng: number; isSwapped: boolean } | null {
  if (lat === null || lat === undefined || lon === null || lon === undefined) {
    return null;
  }
  let numLat = Number(lat);
  let numLon = Number(lon);

  if (!Number.isFinite(numLat) || !Number.isFinite(numLon)) {
    return null;
  }

  let isSwapped = false;
  // Deteksi tertukar: Jika lintang bernilai ~100 (bujur Indonesia barat) dan bujur bernilai negatif ~0.9
  if (numLat > 80 && numLon < 20) {
    const temp = numLat;
    numLat = numLon;
    numLon = temp;
    isSwapped = true;
    console.warn('⚠️ [GIS GeoUtils] Koordinat tertukar terdeteksi dan otomatis dinormalisasi:', { originalLat: lat, originalLon: lon, correctedLat: numLat, correctedLon: numLon });
  }

  if (isValidCoordinate(numLat, numLon)) {
    return { lat: numLat, lng: numLon, isSwapped };
  }
  return null;
}

/**
 * 3. Verifikasi apakah koordinat berada di dalam wilayah Sumatera Barat
 */
export function isWithinSumbar(lat: number, lon: number): boolean {
  return lat >= -4.5 && lat <= 1.5 && lon >= 96.0 && lon <= 103.0;
}

/**
 * 4. Formula Geodesik Haversine (Great-Circle Distance Presisi Tinggi)
 * Menghitung jarak garis lurus terpendek di atas permukaan bola bumi (WGS84).
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    return 0;
  }

  const R = 6371; // Radius rata-rata bumi (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Number(distance.toFixed(3));
}

/**
 * 5. Format tampilan jarak yang informatif dan ramah pengguna
 */
export function formatDistance(distanceKm: number | null | undefined): string {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return '-';
  }
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * 6. Audit & Console Table Debugger untuk Analisis Selisih Jarak
 */
export function logDistanceAudit(data: DistanceAuditLog) {
  const diffKm = Number((data.displayedDistanceKm - data.calculatedStraightDistanceKm).toFixed(3));
  const diffRatio = data.calculatedStraightDistanceKm > 0 
    ? Number((data.displayedDistanceKm / data.calculatedStraightDistanceKm).toFixed(2)) 
    : 1;

  console.group(`🧭 [GIS AUDIT JARAK] ${data.destinationName || 'Rute Evakuasi'}`);
  console.table({
    'User Latitude': data.userLatitude,
    'User Longitude': data.userLongitude,
    'GPS Accuracy (m)': data.userAccuracy ?? 'N/A (Simulasi/Default)',
    'Dest Latitude': data.destinationLatitude,
    'Dest Longitude': data.destinationLongitude,
    'Jarak Garis Lurus (Haversine)': `${data.calculatedStraightDistanceKm.toFixed(2)} km`,
    'Jarak Ditampilkan (UI/Route)': `${data.displayedDistanceKm.toFixed(2)} km`,
    'Selisih Jaringan Jalan vs Lurus': `${diffKm >= 0 ? '+' : ''}${diffKm} km (${diffRatio}x)`,
    'Metode Perhitungan': data.calculationMethod,
    'Protokol Bahaya': data.disasterProtocol ?? 'STANDAR'
  });
  console.groupEnd();
}
