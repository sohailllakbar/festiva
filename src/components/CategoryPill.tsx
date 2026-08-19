import { StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Text } from './Text';
import { radii, spacing, type CategoryKey, useTheme, useCategoryColor } from '../theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

export const CATEGORY_META: Record<CategoryKey, { label: string; icon: IconName }> = {
  religious: { label: 'Religious', icon: 'mosque' },
  cultural: { label: 'Cultural', icon: 'theater-comedy' },
  national: { label: 'National', icon: 'flag' },
  international: { label: 'International', icon: 'public' },
  seasonal: { label: 'Seasonal', icon: 'ac-unit' },
  personal: { label: 'Personal', icon: 'favorite' },
  general: { label: 'General', icon: 'celebration' },
};

/**
 * Category is shown as icon + word + colour so it survives translation and
 * stays readable for colour-blind users.
 */
export function CategoryPill({
  category,
  /** `overlay` sits on hero photography; `soft` sits on white. */
  tone = 'soft',
}: {
  category: CategoryKey;
  tone?: 'soft' | 'overlay';
}) {
  const { colors } = useTheme();
  const categoryColor = useCategoryColor();
  const meta = CATEGORY_META[category];
  const tint = categoryColor[category];
  const overlay = tone === 'overlay';

  return (
    <View style={[styles.pill, overlay ? styles.overlay : { backgroundColor: `${tint}1A` }]}>
      <MaterialIcons name={meta.icon} size={13} color={overlay ? colors.white : tint} />
      <Text variant="labelSm" color={overlay ? colors.white : tint} style={styles.label}>
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  label: { letterSpacing: 0.2 },
});
