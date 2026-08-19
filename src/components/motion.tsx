import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { Text } from './Text';
import { radii, useTheme } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Motion language for Festiva.
 *
 * Springs are gentle and slightly over-damped: this app is about occasions
 * people care about, so movement should feel warm and settled rather than
 * bouncy. Nothing runs longer than ~500ms, so the app never feels sluggish.
 */
export const SPRING = { damping: 18, stiffness: 140, mass: 0.9 } as const;
export const TIMING = { duration: 420, easing: Easing.out(Easing.cubic) } as const;

/** Staggered entrance — 60ms apart reads as one wave rather than a queue. */
export const enterAt = (index: number) =>
  FadeInDown.delay(index * 60)
    .duration(320)
    .springify()
    .damping(18);

// ---------- haptics ----------

/**
 * Setting a reminder is the app's most important action, so it earns a real
 * tactile response. Calls are guarded — haptics reject on unsupported hardware.
 */
export const haptics = {
  confirm: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  warn: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },
  tap: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  select: () => {
    Haptics.selectionAsync().catch(() => {});
  },
};

// ---------- press feedback ----------

/**
 * Scales a card down slightly while held. Subtle on purpose (0.975) — it should
 * read as "this responds to touch", not as a bounce.
 */
export function PressableScale({
  children,
  onPress,
  style,
  containerStyle,
  scaleTo = 0.975,
  haptic = true,
  disabled,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  /** Applied to the inner Pressable. */
  style?: StyleProp<ViewStyle>;
  /**
   * Applied to the animated wrapper. Layout that must not be affected by the
   * scale transform — absolute positioning in particular — belongs here.
   */
  containerStyle?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, scaleTo]) }],
  }));

  return (
    <Animated.View style={[containerStyle, animatedStyle]}>
      <Pressable
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPressIn={() => {
          pressed.value = withSpring(1, { damping: 20, stiffness: 400 });
        }}
        onPressOut={() => {
          pressed.value = withSpring(0, SPRING);
        }}
        onPress={() => {
          if (haptic) haptics.tap();
          onPress?.();
        }}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

// ---------- progress ----------

/** Progress bar that springs to its new value instead of snapping. */
export function AnimatedProgressBar({
  value,
  total,
  height = 8,
  color,
  track,
}: {
  value: number;
  total: number;
  height?: number;
  color?: string;
  track?: string;
}) {
  const { colors } = useTheme();
  const ratio = total > 0 ? Math.min(Math.max(value / total, 0), 1) : 0;
  const progress = useSharedValue(ratio);

  useEffect(() => {
    progress.value = withSpring(ratio, SPRING);
  }, [ratio, progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  const isComplete = total > 0 && value >= total;
  const fill = color ?? (isComplete ? colors.success : colors.primary);

  return (
    <View
      style={[styles.track, { height, backgroundColor: track ?? colors.surfaceSunken }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: value }}
    >
      <Animated.View style={[styles.fill, { backgroundColor: fill }, fillStyle]} />
    </View>
  );
}

/** Ring that sweeps to its new value, with the percentage ticking alongside. */
export function AnimatedProgressRing({
  value,
  total,
  size = 72,
  strokeWidth = 7,
  color,
}: {
  value: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const { colors } = useTheme();
  const ratio = total > 0 ? Math.min(Math.max(value / total, 0), 1) : 0;
  const progress = useSharedValue(0);
  const [percent, setPercent] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  useEffect(() => {
    progress.value = withTiming(ratio, TIMING);
  }, [ratio, progress]);

  // Cross back to JS only when the displayed whole number actually changes.
  useAnimatedReaction(
    () => Math.round(progress.value * 100),
    (current, previous) => {
      if (current !== previous) runOnJS(setPercent)(current);
    },
  );

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const stroke = color ?? (ratio >= 1 ? colors.success : colors.primary);

  return (
    <View
      style={[styles.ringWrap, { width: size, height: size }]}
      accessibilityRole="progressbar"
      accessibilityLabel={`${Math.round(ratio * 100)} percent complete`}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.surfaceSunken}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.ringLabel} pointerEvents="none">
        <Text variant="bodyMuted" color={stroke} style={styles.ringText}>
          {percent}%
        </Text>
      </View>
    </View>
  );
}

/**
 * Counts a whole number up to its target — used for the big "14/17" stat so the
 * dashboard visibly reacts when a task is confirmed.
 */
export function CountUp({ value, style }: { value: number; style?: StyleProp<TextStyle> }) {
  const animated = useSharedValue(value);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    animated.value = withTiming(value, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, [value, animated]);

  useAnimatedReaction(
    () => Math.round(animated.value),
    (current, previous) => {
      if (current !== previous) runOnJS(setDisplay)(current);
    },
  );

  return (
    <Text variant="numeral" style={style}>
      {display}
    </Text>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', borderRadius: radii.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radii.full },
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  ringLabel: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ringText: { fontWeight: '700', fontVariant: ['tabular-nums'] },
});
