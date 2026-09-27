/**
 * Modul Penyimpanan Antrean Laporan Darurat Offline Menggunakan Browser IndexedDB.
 * Menggantikan localStorage untuk menghindari limit kuota 5MB saat menyimpan foto Base64 WebP.
 * Standar FOSS PWA Offline-First (BPBD Sumbar TRC Lapangan).
 */

const DB_NAME = 'gis_sumbar_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_reports';

export interface OfflineReportPayload {
  jenis_bencana: string;
  deskripsi: string;
  nama_pelapor?: string;
  kontak_pelapor?: string;
  lat: number;
  lon: number;
  foto_base64?: string | null;
}

export interface OfflineReportItem {
  id: string;
  timestamp: number;
  payload: OfflineReportPayload;
  retry_count: number;
}

export function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB tidak didukung pada browser ini.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveOfflineReport(payload: OfflineReportPayload): Promise<OfflineReportItem> {
  const db = await openOfflineDb();
  const item: OfflineReportItem = {
    id: `OFFLINE-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    payload,
    retry_count: 0
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(item);

    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineReports(): Promise<OfflineReportItem[]> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function removeOfflineReport(id: string): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function countOfflineReports(): Promise<number> {
  try {
    const db = await openOfflineDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => resolve(request.result || 0);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return 0;
  }
}

/**
 * Mengirimkan seluruh laporan yang tertunda di IndexedDB ke backend saat jaringan kembali online.
 */
export async function flushOfflineQueue(
  onReportSynced?: (item: OfflineReportItem) => void
): Promise<{ synced: number; remaining: number }> {
  const reports = await getOfflineReports();
  if (reports.length === 0) return { synced: 0, remaining: 0 };

  let synced = 0;
  let remaining = 0;

  for (const item of reports) {
    try {
      const res = await fetch('/api/bencana/lapor-warga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item.payload)
      });

      if (res.ok) {
        await removeOfflineReport(item.id);
        synced++;
        if (onReportSynced) onReportSynced(item);
      } else {
        remaining++;
      }
    } catch {
      remaining++;
    }
  }

  return { synced, remaining };
}
