import { Platform, type ViewStyle } from 'react-native';

/**
 * 4px scale. "Spaciousness" comes from reaching one step further than usual —
 * DESIGN.md asks for stack-md where a typical layout would use stack-sm.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  /** 24px outer margin on mobile. */
  screenX: 24,
  section: 32,
} as const;

/** "Round Eight": 8px core components, 16px large containers, full pills. */
export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const hitTarget = {
  min: 44,
  /** Standard CTA height. */
  action: 48,
  /** "Hero" actions. */
  hero: 56,
} as const;

/**
 * Depth comes from tonal layers and hairline borders, not heavy shadows.
 * Where shadow is used it's ambient: large blur, low opacity, tinted with the
 * indigo secondary so it never reads as muddy grey.
 */
export const shadows = {
  /** Floating elements only — modals, sheets, FAB. */
  ambient: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#1E1B4B',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
    },
    default: { elevation: 6 },
  })!,
  /** Subtle lift for pressed/active cards. */
  lift: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#1E1B4B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
    },
    default: { elevation: 2 },
  })!,
} as const;
