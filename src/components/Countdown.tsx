import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { radii, spacing, useThemedStyles, type Palette, useTheme } from '../theme';

/**
 * Countdown is the product's signature element — the answer to "how long until
 * it happens?". Rendered as discrete boxes so days and hours stay scannable at
 * a glance rather than reading as one long string.
 */
export function Countdown({
  days,
  hours,
  tone = 'dark',
  size = 'lg',
}: {
  days: number;
  hours?: number;
  /** `dark` sits on hero imagery; `light` sits on white cards. */
  tone?: 'dark' | 'light';
  size?: 'sm' | 'lg';
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const onDark = tone === 'dark';
  const boxStyle = onDark ? styles.boxDark : styles.boxLight;
  const valueColor = onDark ? colors.white : colors.indigo;
  const labelColor = onDark ? 'rgba(255,255,255,0.75)' : colors.textTertiary;

  const units: { value: number; label: string }[] = [
    { value: days, label: days === 1 ? 'Day' : 'Days' },
  ];
  if (hours !== undefined) units.push({ value: hours, label: hours === 1 ? 'Hour' : 'Hours' });

  return (
    <View
      style={styles.row}
      accessibilityLabel={`${days} days${hours !== undefined ? ` and ${hours} hours` : ''} remaining`}
    >
      {units.map((unit) => (
        <View key={unit.label} style={[styles.box, boxStyle, size === 'sm' && styles.boxSm]}>
          <Text
            variant={size === 'lg' ? 'numeral' : 'headlineSm'}
            color={valueColor}
            style={styles.value}
          >
            {unit.value}
          </Text>
          <Text variant="labelSm" color={labelColor}>
            {unit.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Compact "in 8 days" phrasing for list rows. */
export function relativeDays(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 0) return `${Math.abs(days)} days ago`;
  return `In ${days} days`;
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  box: {
    minWidth: 78,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
  },
  boxSm: { minWidth: 60, paddingVertical: spacing.sm },
  // Frosted panel so the numerals stay legible over photography.
  boxDark: { backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
  boxLight: { backgroundColor: colors.surfaceAlt },
  value: { marginBottom: 2 },
});
