import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Button, Card, Text } from '../../src/components';
import { relativeDays } from '../../src/components/Countdown';
import { useFestiva } from '../../src/store/FestivaStore';
import { radii, spacing, useThemedStyles, type Palette, useTheme } from '../../src/theme';

/**
 * Closing the loop: rather than a generic "you're all set", show the first
 * occasion Festiva will actually remind them about. Proof over promise.
 */
export default function OnboardingComplete() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { profile, countries, favorites, festivalById, daysFor, nextOccasion, completeOnboarding } =
    useFestiva();

  const country = countries.find((c) => c.code === profile.countryCode);
  const firstSaved = favorites.map((id) => festivalById(id)).filter(Boolean)[0];
  const upNext = firstSaved ?? nextOccasion();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.xxxl, paddingBottom: insets.bottom + spacing.lg }]}>
      <View style={styles.body}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.badge}>
          <View style={styles.badgeCircle}>
            <MaterialIcons name="check" size={44} color={colors.white} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(500)} style={styles.copy}>
          <Text variant="headlineLg" color={colors.indigo} style={styles.title}>
            {profile.name ? `You're all set, ${profile.name}` : "You're all set"}
          </Text>
          <Text variant="bodyMuted" style={styles.subtitle}>
            Festiva is now tuned to {country?.name ?? 'your country'}
            {profile.region ? ` · ${profile.region}` : ''} and the {profile.interests.length} kinds of
            occasion you chose.
          </Text>
        </Animated.View>

        {upNext ? (
          <Animated.View entering={FadeInDown.delay(340).duration(500)} style={styles.nextWrap}>
            <Card large style={styles.nextCard}>
              <Text variant="labelSm" color={colors.primary} style={styles.nextLabel}>
                FIRST UP
              </Text>
              <Text variant="headlineSm" color={colors.indigo}>
                {upNext.name}
              </Text>
              <Text variant="bodyMuted">{relativeDays(daysFor(upNext.date))}</Text>
            </Card>
          </Animated.View>
        ) : null}
      </View>

      <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.actions}>
        <Button
          label="Take me to Festiva"
          hero
          onPress={() => {
            // Recorded here rather than on first launch, so an interrupted
            // setup resumes at onboarding instead of skipping it.
            completeOnboarding();
            router.replace('/(tabs)');
          }}
        />
      </Animated.View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.screenX },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  badge: { alignItems: 'center' },
  badgeCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { gap: spacing.sm },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  nextWrap: { alignSelf: 'stretch' },
  nextCard: { alignItems: 'center', gap: spacing.xs, borderColor: colors.primary },
  nextLabel: { fontWeight: '700', letterSpacing: 0.8 },
  actions: { alignSelf: 'stretch' },
});
