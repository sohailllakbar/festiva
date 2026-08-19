import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Text } from '../src/components';
import { Logo } from '../src/components/Logo';
import { useFestiva } from '../src/store/FestivaStore';
import { spacing, useTheme } from '../src/theme';

/** Long enough for the mark to land, short enough not to feel like a wait. */
const MIN_SPLASH_MS = 1600;

/**
 * Splash, and the app's routing decision.
 *
 * It waits for two things: the mark to have had its moment, and the store to
 * have finished reading from disk. Routing before hydration would send a
 * returning user back through onboarding they already completed.
 */
export default function Splash() {
  const { colors } = useTheme();
  const { hydrated, onboarded } = useFestiva();
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (!hydrated) return;

    const elapsed = Date.now() - startedAt.current;
    const wait = Math.max(0, MIN_SPLASH_MS - elapsed);

    const t = setTimeout(() => {
      router.replace(onboarded ? '/(tabs)' : '/(auth)/welcome');
    }, wait);

    return () => clearTimeout(t);
  }, [hydrated, onboarded]);

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.screen}
    >
      <Animated.View entering={FadeIn.duration(700)} style={styles.center}>
        <Logo size={84} color={colors.white} />
        <Animated.View entering={FadeInDown.delay(250).duration(600)}>
          <Text variant="display" color={colors.white} style={styles.wordmark}>
            Festiva
          </Text>
        </Animated.View>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(700).duration(700)} style={styles.footer}>
        <Text variant="bodyMuted" color="rgba(255,255,255,0.85)" style={styles.tagline}>
          Never miss what matters
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', gap: spacing.lg },
  wordmark: { letterSpacing: -1 },
  footer: { position: 'absolute', bottom: spacing.xxxl },
  tagline: { letterSpacing: 0.3 },
});
