import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import Animated from 'react-native-reanimated';

import { CATEGORY_META, SelectableCard, Text, enterAt, haptics } from '../../src/components';
import { OnboardingScreen } from '../../src/components/OnboardingScreen';
import { useFestiva } from '../../src/store/FestivaStore';
import { spacing, type CategoryKey, useTheme } from '../../src/theme';

/** Interests filter what the user sees everywhere, so at least one is required. */
const CHOICES: { key: CategoryKey; label: string }[] = [
  { key: 'religious', label: 'Religious occasions' },
  { key: 'cultural', label: 'Cultural festivals' },
  { key: 'national', label: 'National holidays' },
  { key: 'international', label: 'International days' },
  { key: 'seasonal', label: 'Seasonal celebrations' },
  { key: 'personal', label: 'Birthdays & anniversaries' },
];

export default function Interests() {
  const { colors } = useTheme();
  const { profile, updateProfile } = useFestiva();
  const [selected, setSelected] = useState<CategoryKey[]>(profile.interests);

  const toggle = (key: CategoryKey) => {
    haptics.select();
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const allSelected = selected.length === CHOICES.length;

  return (
    <OnboardingScreen
      step={4}
      title="What would you like to remember?"
      subtitle="Choose the occasions that matter to you. We'll personalize your experience around them."
      onPrimary={() => {
        updateProfile({ interests: selected });
        router.push('/onboarding/festivals');
      }}
      primaryDisabled={selected.length === 0}
      primaryLabel={selected.length > 0 ? `Continue with ${selected.length}` : 'Continue'}
    >
      <View style={styles.toolbar}>
        <Text variant="bodyMuted">Select all that apply</Text>
        <Pressable
          onPress={() => {
            haptics.tap();
            setSelected(allSelected ? [] : CHOICES.map((c) => c.key));
          }}
          hitSlop={10}
          accessibilityRole="button"
        >
          <Text variant="label" color={colors.primary} style={styles.selectAll}>
            {allSelected ? 'Clear all' : 'Select all'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {CHOICES.map((choice, i) => (
          <Animated.View key={choice.key} entering={enterAt(i)} style={styles.cell}>
            <SelectableCard
              label={choice.label}
              icon={CATEGORY_META[choice.key].icon}
              selected={selected.includes(choice.key)}
              onPress={() => toggle(choice.key)}
            />
          </Animated.View>
        ))}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  selectAll: { fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: { width: '47.5%', flexGrow: 1 },
});
