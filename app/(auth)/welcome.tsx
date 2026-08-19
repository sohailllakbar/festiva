import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Button, Text } from '../../src/components';
import { AmbientBackground } from '../../src/components/AmbientBackground';
import { FestivalDeck } from '../../src/components/FestivalDeck';
import { Logo } from '../../src/components/Logo';
import { useFestiva } from '../../src/store/FestivaStore';
import { spacing, useTheme, useThemedStyles, type Palette } from '../../src/theme';

/**
 * First impression, and the screen the decision to continue is made on.
 *
 * Rather than describe the product, it shows it: a fanned deck of the next real
 * festivals with live countdowns. Content sits directly on an ambient ground
 * instead of inside a card, so the screen reads open rather than like a form
 * waiting to be filled in.
 */
export default function Welcome() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const festiva = useFestiva();

  const upcoming = useMemo(() => festiva.upcomingFestivals().slice(0, 3), [festiva]);

  return (
    <View style={styles.screen}>
      <AmbientBackground />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        {/* Brand */}
        <Animated.View entering={FadeIn.duration(560)} style={styles.brand}>
          <Logo size={44} />
          <Text variant="headlineMd" color={colors.primary} style={styles.wordmark}>
            Festiva
          </Text>
        </Animated.View>

        {/* The product, shown rather than described */}
        <View style={styles.deckWrap}>
          <FestivalDeck festivals={upcoming} daysFor={festiva.daysFor} />
        </View>

        {/* Promise */}
        <Animated.View entering={FadeInDown.delay(420).duration(560)} style={styles.copy}>
          <Text variant="display" color={colors.indigo} style={styles.headline}>
            Never miss what matters.
          </Text>
          <Text variant="bodyLg" color={colors.textSecondary} style={styles.sub}>
            Festivals, holidays and the personal occasions you can't afford to forget — counted down,
            wherever you are in the world.
          </Text>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={FadeInDown.delay(560).duration(560)} style={styles.actions}>
          <Button label="Create Account" hero onPress={() => router.push('/(auth)/create-account')} />
          <Button label="Sign In" variant="secondary" onPress={() => router.push('/(auth)/sign-in')} />
          <Button
            label="Continue as Guest"
            variant="tertiary"
            iconRight="arrow-forward"
            onPress={() => router.replace('/onboarding/country')}
          />
        </Animated.View>

        {/* Reachable, not decorative — the App Store requires both to open. */}
        <Animated.View entering={FadeIn.delay(760).duration(460)} style={styles.legal}>
          <Pressable
            onPress={() => router.push('/settings/legal')}
            hitSlop={8}
            accessibilityRole="link"
            accessibilityLabel="Read the Terms of Service"
          >
            <Text variant="labelSm" style={styles.legalLink}>
              Terms of Service
            </Text>
          </Pressable>
          <View style={styles.legalDot} />
          <Pressable
            onPress={() => router.push('/settings/legal')}
            hitSlop={8}
            accessibilityRole="link"
            accessibilityLabel="Read the Privacy Policy"
          >
            <Text variant="labelSm" style={styles.legalLink}>
              Privacy Policy
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1, paddingHorizontal: spacing.screenX },

    brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    wordmark: { letterSpacing: -0.4 },

    // Takes the slack on tall screens so the deck stays optically centred.
    deckWrap: { flex: 1, justifyContent: 'center', minHeight: 216 },

    copy: { gap: spacing.md, marginBottom: spacing.xl },
    headline: { textAlign: 'center', letterSpacing: -1 },
    sub: { textAlign: 'center', lineHeight: 26 },

    actions: { gap: spacing.md },

    legal: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    legalDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textTertiary },
    legalLink: { textDecorationLine: 'underline' },
  });
