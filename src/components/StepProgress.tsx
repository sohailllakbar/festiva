import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { radii, spacing, useThemedStyles, type Palette } from '../theme';

/**
 * Stepped onboarding progress: completed segments fill Festiva Orange, pending
 * stay neutral. Each segment animates its own fill so advancing a step reads as
 * forward motion rather than a jump.
 */
export function StepProgress({ step, total }: { step: number; total: number }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: step }}
      accessibilityLabel={`Step ${step} of ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => (
        <Segment key={i} filled={i < step} index={i} />
      ))}
    </View>
  );
}

function Segment({ filled, index }: { filled: boolean; index: number }) {
  const styles = useThemedStyles(makeStyles);
  const progress = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(filled ? 1 : 0, { duration: 260 });
  }, [filled, progress]);

  const style = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <View style={styles.segment}>
      <Animated.View style={[styles.fill, style]} />
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, flex: 1 },
  segment: {
    flex: 1,
    height: 5,
    borderRadius: radii.full,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.primary, borderRadius: radii.full },
});
