import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Text } from './Text';
import { haptics, PressableScale } from './motion';
import { hitTarget, radii, shadows, spacing, useThemedStyles, type Palette, useTheme } from '../theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

/**
 * Per DESIGN.md: primary is solid Festiva Orange, secondary is a ghost with a
 * 2px Deep Indigo border, tertiary is text-only with a chevron for navigation.
 */
type Variant = 'primary' | 'secondary' | 'tertiary' | 'destructive';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: IconName;
  /** Trailing icon — used by tertiary "Continue as Guest →" style actions. */
  iconRight?: IconName;
  block?: boolean;
  disabled?: boolean;
  loading?: boolean;
  /** 56px hero height instead of the standard 48px. */
  hero?: boolean;
  style?: StyleProp<ViewStyle>;
  haptic?: 'light' | 'success' | 'warning' | 'none';
  labelColor?: string;
}

/** Resolved per render so variants follow the active palette. */
const variantsFor = (
  colors: Palette,
): Record<Variant, { bg: string; fg: string; border?: string; borderWidth?: number }> => ({
  primary: { bg: colors.primary, fg: colors.onPrimary },
  secondary: { bg: 'transparent', fg: colors.indigo, border: colors.indigo, borderWidth: 2 },
  tertiary: { bg: 'transparent', fg: colors.indigo },
  destructive: { bg: colors.danger, fg: colors.white },
});

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconRight,
  block = true,
  disabled,
  loading,
  hero,
  style,
  haptic,
  labelColor,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const v = variantsFor(colors)[variant];
  const fg = labelColor ?? v.fg;
  const feedback = haptic ?? (variant === 'destructive' ? 'warning' : 'light');
  const isBlocked = disabled || loading;

  return (
    <Pressable
      onPress={() => {
        if (isBlocked) return;
        if (feedback === 'success') haptics.confirm();
        else if (feedback === 'warning') haptics.warn();
        else if (feedback === 'light') haptics.tap();
        onPress?.();
      }}
      disabled={isBlocked}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!isBlocked, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.bg, minHeight: hero ? hitTarget.hero : hitTarget.action },
        v.border ? { borderWidth: v.borderWidth ?? 1, borderColor: v.border } : null,
        variant === 'tertiary' && styles.tertiary,
        block && styles.block,
        pressed && styles.pressed,
        isBlocked && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <Text variant="button" color={fg}>
          Please wait…
        </Text>
      ) : (
        <>
          {icon ? <MaterialIcons name={icon} size={20} color={fg} /> : null}
          <Text variant="button" color={fg}>
            {label}
          </Text>
          {iconRight ? <MaterialIcons name={iconRight} size={18} color={fg} /> : null}
        </>
      )}
    </Pressable>
  );
}

/** Circular orange FAB — "add personal event" on list screens. */
export function Fab({
  onPress,
  icon = 'add',
  label,
}: {
  onPress?: () => void;
  icon?: IconName;
  label: string;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      scaleTo={0.9}
      containerStyle={[styles.fabAnchor, shadows.ambient]}
      style={styles.fab}
    >
      <MaterialIcons name={icon} size={28} color={colors.onPrimary} />
    </PressableScale>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  color,
  size = 24,
  /** Circular white chip, as used for the header bell and card share button. */
  chip,
}: {
  icon: IconName;
  onPress?: () => void;
  label: string;
  color?: string;
  size?: number;
  chip?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  // Defaults resolve at render, not in the parameter list, so they track theme.
  const tint = color ?? colors.indigo;

  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress?.();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.iconButton, chip && styles.iconChip, pressed && styles.pressed]}
    >
      <MaterialIcons name={icon} size={size} color={tint} />
    </Pressable>
  );
}

/** Tinted circular icon container used in list rows and empty states. */
export function IconBubble({
  icon,
  color,
  background,
  size = 40,
}: {
  icon: IconName;
  color?: string;
  background?: string;
  size?: number;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const tint = color ?? colors.primary;
  const fill = background ?? colors.primaryLight;

  return (
    <View
      style={[
        styles.bubble,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: fill },
      ]}
    >
      <MaterialIcons name={icon} size={size * 0.5} color={tint} />
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.sm,
  },
  tertiary: { minHeight: hitTarget.min, paddingHorizontal: spacing.sm },
  block: { alignSelf: 'stretch' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.45 },
  fabAnchor: { position: 'absolute', right: spacing.screenX, bottom: spacing.xl, borderRadius: 28 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: hitTarget.min,
    height: hitTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChip: {
    borderRadius: hitTarget.min / 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubble: { alignItems: 'center', justifyContent: 'center' },
});
