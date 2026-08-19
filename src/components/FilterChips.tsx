import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from './Text';
import { haptics } from './motion';
import { radii, spacing, useTheme, useThemedStyles, type Palette } from '../theme';

/**
 * Horizontal pill group for filters. Selected chips fill with Festiva Orange;
 * the rest stay outlined so the active one reads instantly.
 */
export function FilterChips<T extends string>({
  segments,
  value,
  onChange,
}: {
  segments: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {segments.map((segment) => {
        const active = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            onPress={() => {
              haptics.select();
              onChange(segment.value);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.chip,
              active ? styles.chipActive : styles.chipIdle,
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text
              variant="label"
              color={active ? colors.white : colors.indigo}
              style={styles.label}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  row: { paddingHorizontal: spacing.screenX, gap: spacing.sm, paddingVertical: spacing.xs },
  chip: { paddingHorizontal: spacing.lg, height: 40, justifyContent: 'center', borderRadius: radii.full },
  chipActive: { backgroundColor: colors.primary },
  chipIdle: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  label: { fontWeight: '600' },
});
