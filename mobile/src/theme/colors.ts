/**
 * Calibrated Color Tokens - Siaga Sumbar Mobile
 * Memadukan oranye BPBD resmi dengan Slate 950 untuk keterbacaan tinggi di bawah terik matahari & hemat baterai OLED.
 */

export const colors = {
  // Brand BPBD
  brand: {
    primary: '#f97316',      // Orange BPBD
    primaryDark: '#ea580c',  // Active state
    primaryLight: '#fdba74',
    primaryFaint: 'rgba(249, 115, 22, 0.12)',
  },

  // Surfaces & Backgrounds (Dark OLED Ergonomics)
  surface: {
    canvas: '#020617',       // Slate 950 (Latar utama aplikasi)
    card: '#0f172a',         // Slate 900 (Kontainer kartu informasi)
    cardSecondary: '#1e293b',// Slate 800 (Nested cards)
    border: '#334155',       // Slate 700 (Border 1px)
    borderSubtle: '#1e293b', // Slate 800 (Border pemisah halus)
  },

  // Status Bencana & Triage Keselamatan (Rasio Kontras > 7:1)
  status: {
    // Zona Aman (Hijau Zamrud)
    safeBg: '#064e3b',
    safeBorder: '#059669',
    safeText: '#34d399',
    safeBadge: 'rgba(16, 185, 129, 0.15)',

    // Zona Waspada (Kuning Amber)
    warningBg: '#78350f',
    warningBorder: '#d97706',
    warningText: '#fbbf24',
    warningBadge: 'rgba(245, 158, 11, 0.15)',

    // Zona Bahaya Langsung (Merah Crimson)
    dangerBg: '#7f1d1d',
    dangerBorder: '#dc2626',
    dangerText: '#f87171',
    dangerBadge: 'rgba(239, 68, 68, 0.15)',
  },

  // Kategori Bencana
  category: {
    tsunami: '#06b6d4',      // Cyan
    sesar: '#a855f7',        // Purple
    banjir: '#38bdf8',       // Sky Blue
    galodo: '#f43f5e',       // Rose Red
    posko: '#10b981',        // Emerald
    shelter: '#c084fc',      // Violet
  },

  // Text Hierarchy
  text: {
    primary: '#f8fafc',      // White slate (kontras tinggi)
    secondary: '#94a3b8',    // Slate 400
    muted: '#64748b',        // Slate 500
    inverted: '#0f172a',
  },
};
