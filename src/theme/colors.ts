/**
 * Festiva Modern colour tokens (from the project's DESIGN.md).
 *
 * Two roles carry the brand: Festiva Orange is reserved for calls-to-action,
 * progress and interactive state — never decoration — and Deep Indigo anchors
 * typography, headers and navigation in the light theme.
 *
 * The dark theme is authored, not inverted. Three things change role:
 *   - The ground goes warm-dark (#16100D), never pure black, so it stays a
 *     sibling of the warm light ground rather than a different product.
 *   - Deep Indigo can't carry text on a dark ground, so `textPrimary` becomes a
 *     warm off-white and `indigo` becomes the light periwinkle that reads as
 *     "the indigo role" without failing contrast.
 *   - Orange lightens slightly (#FB8B3C) because saturated orange on dark
 *     vibrates; the lighter tint holds its meaning without glare.
 */

const brand = {
  white: "#FFFFFF",
  black: "#000000",
};

export const lightPalette = {
  // Brand
  primary: '#F97316', // Festiva Orange — CTAs only
  primaryDark: '#9D4300', // pressed states
  primaryLight: '#FFEDE4', // tinted fills, selected chips
  onPrimary: '#FFFFFF',

  indigo: '#1E1B4B', // Deep Indigo — headings, nav, emphasis
  indigoSoft: '#5B598C',
  indigoLight: '#E3DFFF',

  // Surfaces — "layering of whites" over a warm tinted ground
  background: '#FFF8F6',
  surface: '#FFFFFF',
  surfaceAlt: '#FFF1EB',
  surfaceSunken: '#FCE3D9',

  // Text
  textPrimary: '#1E1B4B',
  textSecondary: '#584237',
  textTertiary: '#8C7164',
  onDark: '#FFEDE6',

  // Lines
  border: '#E2E8F0',
  borderWarm: '#E0C0B1',

  // Semantic — deliberately separate from the brand accent
  success: '#0F8A5F',
  successLight: '#E3F6EE',
  warning: '#B7791F',
  warningLight: '#FDF3DF',
  danger: '#BA1A1A',
  dangerLight: '#FFDAD6',
  info: '#006398',
  infoLight: '#CDE5FF',

  ...brand,
};

/** The palette shape every component consumes. */
export type Palette = typeof lightPalette;

export const darkPalette: Palette = {
  primary: '#FB8B3C',
  primaryDark: '#C25A12',
  primaryLight: '#3A2113', // tinted fill that still reads as "orange-ish"
  onPrimary: '#2A1200',

  // In dark, the indigo role is carried by its light counterpart so headings
  // keep their distinct voice against body text.
  indigo: '#CFCBFF',
  indigoSoft: '#9D99CE',
  indigoLight: '#2B2752',

  background: '#16100D',
  surface: '#221A16',
  surfaceAlt: '#2C221C',
  surfaceSunken: '#3A2C24',

  textPrimary: '#F6EAE3',
  textSecondary: '#D2BFB4',
  textTertiary: '#A08D82',
  onDark: '#FFEDE6',

  border: '#3A2C24',
  borderWarm: '#4A382E',

  // Lifted for legibility on a dark ground; the "light" variants become
  // low-alpha tints rather than pale washes.
  success: '#4ED8A0',
  successLight: '#12352A',
  warning: '#F0B849',
  warningLight: '#3A2E14',
  danger: '#FF7A72',
  dangerLight: '#43191A',
  info: '#79C7FF',
  infoLight: '#142E42',

  ...brand,
};

/**
 * Category colours are tuned per theme — the light set is too dark to read on
 * a dark ground, so each gets a lighter, less saturated sibling.
 */
export const lightCategoryColor = {
  religious: '#7C3AED',
  cultural: '#F97316',
  national: '#0F766E',
  international: '#006398',
  seasonal: '#B7791F',
  personal: '#DB2777',
  general: '#5B598C',
};

export type CategoryKey = keyof typeof lightCategoryColor;
export type CategoryColors = Record<CategoryKey, string>;

export const darkCategoryColor: CategoryColors = {
  religious: '#B18AFF',
  cultural: '#FB8B3C',
  national: '#4DBFA8',
  international: '#79C7FF',
  seasonal: '#F0B849',
  personal: '#FF7AB8',
  general: '#A9A5E0',
};

/**
 * Static light exports.
 *
 * Kept so non-visual modules (and anything not yet migrated) still resolve, but
 * components should read the palette from `useTheme()` so they react to the
 * active mode.
 */
export const palette = lightPalette;
export const colors = lightPalette;
export const categoryColor = lightCategoryColor;
