/**
 * iOS Human Interface Guidelines (HIG) Design Tokens
 * Apple System Dark & Light Mode Palettes - Minimal, Elegan, dan Presisi
 */

export interface ThemeColors {
  brand: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    primaryFaint: string;
  };
  surface: {
    canvas: string;
    card: string;
    cardSecondary: string;
    border: string;
    borderSubtle: string;
    tabBar: string;
  };
  status: {
    safeBg: string;
    safeBorder: string;
    safeText: string;
    safeBadge: string;

    warningBg: string;
    warningBorder: string;
    warningText: string;
    warningBadge: string;

    dangerBg: string;
    dangerBorder: string;
    dangerText: string;
    dangerBadge: string;
  };
  category: {
    tsunami: string;
    sesar: string;
    banjir: string;
    galodo: string;
    posko: string;
    shelter: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverted: string;
  };
}

export const darkColors: ThemeColors = {
  brand: {
    primary: '#FF9F0A',      // iOS System Orange
    primaryDark: '#D97706',
    primaryLight: '#FFB340',
    primaryFaint: 'rgba(255, 159, 10, 0.15)',
  },
  surface: {
    canvas: '#000000',               // Pure iOS True Black
    card: '#1C1C1E',                 // Secondary System Grouped Card
    cardSecondary: '#2C2C2E',        // Tertiary System Well
    border: 'rgba(255, 255, 255, 0.08)',
    borderSubtle: 'rgba(255, 255, 255, 0.05)',
    tabBar: '#161618',
  },
  status: {
    safeBg: 'rgba(48, 209, 88, 0.12)',
    safeBorder: 'rgba(48, 209, 88, 0.25)',
    safeText: '#30D158',
    safeBadge: 'rgba(48, 209, 88, 0.15)',

    warningBg: 'rgba(255, 159, 10, 0.12)',
    warningBorder: 'rgba(255, 159, 10, 0.25)',
    warningText: '#FF9F0A',
    warningBadge: 'rgba(255, 159, 10, 0.15)',

    dangerBg: 'rgba(255, 69, 58, 0.12)',
    dangerBorder: 'rgba(255, 69, 58, 0.3)',
    dangerText: '#FF453A',
    dangerBadge: 'rgba(255, 69, 58, 0.15)',
  },
  category: {
    tsunami: '#64D2FF',      // iOS System Teal
    sesar: '#BF5AF2',        // iOS System Purple
    banjir: '#0A84FF',       // iOS System Blue
    galodo: '#FF453A',       // iOS System Red
    posko: '#30D158',        // iOS System Green
    shelter: '#BF5AF2',      // iOS System Indigo
  },
  text: {
    primary: '#FFFFFF',      // High emphasis white
    secondary: '#A1A1AA',    // High readability light gray
    muted: '#71717A',        // Tertiary low gray
    inverted: '#000000',
  },
};

export const lightColors: ThemeColors = {
  brand: {
    primary: '#EA580C',      // Accessible Warm Orange
    primaryDark: '#C2410C',
    primaryLight: '#FB923C',
    primaryFaint: 'rgba(234, 88, 12, 0.12)',
  },
  surface: {
    canvas: '#F8FAFC',               // Clean Slate canvas
    card: '#FFFFFF',                 // Pure white card
    cardSecondary: '#F1F5F9',        // Slate-100 well
    border: '#E2E8F0',               // Clean hairline border
    borderSubtle: '#F1F5F9',
    tabBar: '#FFFFFF',
  },
  status: {
    safeBg: 'rgba(22, 163, 74, 0.12)',
    safeBorder: 'rgba(22, 163, 74, 0.25)',
    safeText: '#15803D',             // High contrast dark green
    safeBadge: 'rgba(22, 163, 74, 0.15)',

    warningBg: 'rgba(217, 119, 6, 0.12)',
    warningBorder: 'rgba(217, 119, 6, 0.25)',
    warningText: '#B45309',          // High contrast amber
    warningBadge: 'rgba(217, 119, 6, 0.15)',

    dangerBg: 'rgba(220, 38, 38, 0.12)',
    dangerBorder: 'rgba(220, 38, 38, 0.25)',
    dangerText: '#B91C1C',           // High contrast red
    dangerBadge: 'rgba(220, 38, 38, 0.15)',
  },
  category: {
    tsunami: '#0284C7',      // Deep Blue
    sesar: '#7C3AED',        // Deep Violet
    banjir: '#0369A1',       // Deep Sky
    galodo: '#B91C1C',       // Deep Red
    posko: '#15803D',        // Deep Green
    shelter: '#7C3AED',      // Deep Indigo
  },
  text: {
    primary: '#0F172A',      // Slate-900 (High contrast bold black)
    secondary: '#334155',    // Slate-700 (Very readable charcoal)
    muted: '#64748B',        // Slate-500 (Accessible medium gray)
    inverted: '#FFFFFF',
  },
};

// Default backward compatibility
export const colors = darkColors;
