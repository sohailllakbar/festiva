import type { TextStyle } from 'react-native';

/**
 * Inter is the sole typeface per DESIGN.md. Weights map to the loaded
 * @expo-google-fonts families — React Native can't synthesise weights from a
 * single file, so each weight is its own family name.
 */
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/**
 * Deliberately colour-free.
 *
 * These run at module scope, so any colour baked in here would freeze to
 * whichever theme was loaded first. `Text` resolves the colour from the active
 * palette instead, using the role map below.
 */
export const typography = {
  /** Splash / hero moments only */
  display: { fontFamily: fontFamily.bold, fontSize: 40, lineHeight: 48, letterSpacing: -0.8 },
  headlineLg: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 36, letterSpacing: -0.3 },
  headlineMd: { fontFamily: fontFamily.semibold, fontSize: 24, lineHeight: 32, letterSpacing: -0.2 },
  headlineSm: { fontFamily: fontFamily.semibold, fontSize: 20, lineHeight: 28 },
  bodyLg: { fontFamily: fontFamily.regular, fontSize: 18, lineHeight: 28 },
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
  bodyMuted: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20, letterSpacing: 0.14 },
  /** Metadata and eyebrow labels; extra tracking keeps 12px legible. */
  labelSm: { fontFamily: fontFamily.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.24 },
  button: { fontFamily: fontFamily.semibold, fontSize: 16, lineHeight: 22 },
  /** Countdown numerals — tabular so digits don't jitter as they tick. */
  numeral: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    lineHeight: 38,
    fontVariant: ['tabular-nums'],
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

/** Which palette role each variant takes when no explicit colour is passed. */
export const variantColorRole = {
  display: 'textPrimary',
  headlineLg: 'textPrimary',
  headlineMd: 'textPrimary',
  headlineSm: 'textPrimary',
  bodyLg: 'textPrimary',
  body: 'textPrimary',
  bodyMuted: 'textSecondary',
  label: 'textPrimary',
  labelSm: 'textTertiary',
  button: 'textPrimary',
  numeral: 'textPrimary',
} as const satisfies Record<TypographyVariant, 'textPrimary' | 'textSecondary' | 'textTertiary'>;
