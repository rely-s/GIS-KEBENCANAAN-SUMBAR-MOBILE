import { useEffect, useState, useRef, useCallback } from 'react';

export interface SSEEvent<T = any> {
  type: string;
  data: T;
  timestamp: string;
}

export interface UseSSEEventsOptions {
  onGempaBaru?: (gempa: any) => void;
  onLaporanBaru?: (laporan: any) => void;
  onLaporanDiverifikasi?: (bencana: any) => void;
  onBencanaBaru?: (bencana: any) => void;
  onConnected?: () => void;
  autoReconnect?: boolean;
}

/**
 * Hook Server-Sent Events (SSE) Real-Time EWS Pusdalops BPBD Sumbar.
 * Menghubungkan frontend ke /api/events/stream untuk menerima notifikasi gempa,
 * laporan warga, dan verifikasi bencana tanpa perlu reload halaman.
 */
export function useSSEEvents(options: UseSSEEventsOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Simpan callbacks di ref agar tidak memicu reconnect yang tidak perlu saat callback berubah
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const es = new EventSource('/api/events/stream');
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
      };

      // 1. Event Connected
      es.addEventListener('connected', (event) => {
        setIsConnected(true);
        try {
          const payload = JSON.parse(event.data);
          setLastEvent(payload);
          optionsRef.current.onConnected?.();
        } catch {
          // parse error fallback
        }
      });

      // 2. Event Gempa Baru (BMKG Autogempa & Sesar Darat Sumbar)
      es.addEventListener('gempa_baru', (event) => {
        try {
          const payload: SSEEvent = JSON.parse(event.data);
          setLastEvent(payload);
          optionsRef.current.onGempaBaru?.(payload.data);
        } catch (e) {
          console.error('[SSE] Error parsing gempa_baru event:', e);
        }
      });

      // 3. Event Laporan Warga Baru (Antrean Triage Pusdalops)
      es.addEventListener('laporan_baru', (event) => {
        try {
          const payload: SSEEvent = JSON.parse(event.data);
          setLastEvent(payload);
          optionsRef.current.onLaporanBaru?.(payload.data);
        } catch (e) {
          console.error('[SSE] Error parsing laporan_baru event:', e);
        }
      });

      // 4. Event Laporan Terverifikasi (Pembaruan Peta Publik)
      es.addEventListener('laporan_diverifikasi', (event) => {
        try {
          const payload: SSEEvent = JSON.parse(event.data);
          setLastEvent(payload);
          optionsRef.current.onLaporanDiverifikasi?.(payload.data);
        } catch (e) {
          console.error('[SSE] Error parsing laporan_diverifikasi event:', e);
        }
      });

      // 5. Event Bencana Baru (Dicatat Operator / Admin)
      es.addEventListener('bencana_baru', (event) => {
        try {
          const payload: SSEEvent = JSON.parse(event.data);
          setLastEvent(payload);
          optionsRef.current.onBencanaBaru?.(payload.data);
        } catch (e) {
          console.error('[SSE] Error parsing bencana_baru event:', e);
        }
      });

      es.onerror = () => {
        setIsConnected(false);
        es.close();

        // Reconnect otomatis setelah 5 detik
        if (optionsRef.current.autoReconnect !== false) {
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        }
      };
    } catch (err) {
      console.error('[SSE] Failed to establish EventSource connection:', err);
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    lastEvent,
    reconnect: connect
  };
}
