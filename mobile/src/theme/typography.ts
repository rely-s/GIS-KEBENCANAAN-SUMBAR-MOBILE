import { Platform } from 'react-native';

/**
 * Modern Typography System (Plus Jakarta Sans)
 * Provides a contemporary, clean, and distinctive aesthetic
 * replacing generic system / template project styling.
 */

export const FONTS = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
};

export const typography = {
  // Display & Headings
  display: {
    fontFamily: FONTS.extraBold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.6,
  },
  title1: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  title2: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  title3: {
    fontFamily: FONTS.semiBold,
    fontSize: 13.5,
    lineHeight: 18,
    letterSpacing: -0.2,
  },

  // Body Text
  bodyLarge: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  bodyMedium: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  bodySemiBold: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    lineHeight: 17,
  },
  bodyBold: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 17,
  },

  // Micro & Captions
  caption: {
    fontFamily: FONTS.regular,
    fontSize: 10.5,
    lineHeight: 15,
  },
  captionMedium: {
    fontFamily: FONTS.medium,
    fontSize: 10.5,
    lineHeight: 15,
  },
  captionBold: {
    fontFamily: FONTS.semiBold,
    fontSize: 10.5,
    lineHeight: 15,
  },
  micro: {
    fontFamily: FONTS.medium,
    fontSize: 9.5,
    lineHeight: 13,
  },

  // Functional & Specialized
  badge: {
    fontFamily: FONTS.bold,
    fontSize: 9.5,
    lineHeight: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  button: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  buttonSmall: {
    fontFamily: FONTS.bold,
    fontSize: 10.5,
    lineHeight: 14,
    letterSpacing: 0.2,
  },
  mono: {
    fontFamily: FONTS.mono,
    fontSize: 10.5,
    lineHeight: 14,
  },
  metricLarge: {
    fontFamily: FONTS.extraBold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.7,
  },
};
