import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';

import { CategoryPill, EmptyState, Text, enterAt, haptics } from '../../src/components';
import { OnboardingScreen } from '../../src/components/OnboardingScreen';
import { formatFestivalDate } from '../../src/data/dates';
import { useFestiva } from '../../src/store/FestivaStore';
import { radii, spacing, useThemedStyles, type Palette, useTheme } from '../../src/theme';

/**
 * Pre-seeds Favourites during onboarding, so the app has real content the first
 * time Home opens instead of an empty shell.
 */
export default function SpecificFestivals() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { festivals, profile, favorites, toggleFavorite } = useFestiva();
  const [touched, setTouched] = useState(false);

  // Suggest only what matches the interests they just chose.
  const suggestions = useMemo(
    () => festivals.filter((f) => profile.interests.includes(f.category)).slice(0, 8),
    [festivals, profile.interests],
  );

  return (
    <OnboardingScreen
      step={5}
      title="Any of these to start?"
      subtitle="Save a few now and we'll keep an eye on the dates for you. You can add more any time."
      onPrimary={() => router.push('/onboarding/reminders')}
      onSkip={() => router.push('/onboarding/reminders')}
      primaryLabel={favorites.length > 0 ? `Continue with ${favorites.length} saved` : 'Continue'}
    >
      {suggestions.length === 0 ? (
        <EmptyState
          icon="explore"
          title="Nothing to suggest yet"
          message="Go back and pick a few interests, or skip ahead and browse everything later."
          compact
        />
      ) : (
        <View style={styles.list}>
          {suggestions.map((festival, i) => {
            const saved = favorites.includes(festival.id);
            return (
              <Animated.View key={festival.id} entering={enterAt(i)}>
                <Pressable
                  onPress={() => {
                    haptics.select();
                    setTouched(true);
                    toggleFavorite(festival.id);
                  }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: saved }}
                  accessibilityLabel={`${saved ? 'Remove' : 'Save'} ${festival.name}`}
                  style={[styles.row, saved && styles.rowSaved]}
                >
                  <View style={styles.body}>
                    <Text variant="body" color={colors.indigo} style={styles.name} numberOfLines={1}>
                      {festival.name}
                    </Text>
                    <View style={styles.meta}>
                      <Text variant="labelSm">{formatFestivalDate(festival.date)}</Text>
                      <Text variant="labelSm">·</Text>
                      <Text variant="labelSm" numberOfLines={1} style={styles.region}>
                        {festival.region}
                      </Text>
                    </View>
                    <View style={styles.pillRow}>
                      <CategoryPill category={festival.category} />
                    </View>
                  </View>

                  <MaterialIcons
                    name={saved ? 'favorite' : 'favorite-border'}
                    size={24}
                    color={saved ? colors.primary : colors.border}
                  />
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      )}
    </OnboardingScreen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  rowSaved: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  body: { flex: 1, gap: 4 },
  name: { fontWeight: '600' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  region: { flex: 1 },
  pillRow: { flexDirection: 'row', marginTop: 2 },
});
