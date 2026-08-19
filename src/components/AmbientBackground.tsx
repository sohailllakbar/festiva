import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

/**
 * Two soft brand-coloured blooms behind the content.
 *
 * The warm ground and white cards sit only a few percent apart in luminance, so
 * a flat background reads as "unfinished form". These give the screen depth
 * without a photograph — drawn with gradients, so there's nothing to load and
 * nothing to fail.
 *
 * Kept deliberately low-opacity: it should register as warmth, not as a
 * gradient someone applied on purpose.
 */
export function AmbientBackground() {
  const { colors, isDark } = useTheme();

  // Dark grounds swallow tint, so the blooms carry a little more weight there.
  const warmStop = isDark ? 'rgba(251,139,60,0.20)' : 'rgba(249,115,22,0.16)';
  const coolStop = isDark ? 'rgba(124,120,220,0.16)' : 'rgba(30,27,75,0.08)';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />

      {/* Warm bloom, upper right — the celebratory half */}
      <LinearGradient
        colors={[warmStop, 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.15, y: 0.55 }}
        style={styles.warm}
      />

      {/* Cool anchor, lower left — keeps it from reading as purely orange */}
      <LinearGradient
        colors={['transparent', coolStop]}
        start={{ x: 0.8, y: 0.35 }}
        end={{ x: 0, y: 1 }}
        style={styles.cool}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  warm: { position: 'absolute', top: 0, right: 0, left: 0, height: '62%' },
  cool: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%' },
});
