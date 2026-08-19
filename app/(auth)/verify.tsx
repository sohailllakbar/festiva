import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button, Text, haptics } from '../../src/components';
import { AuthScreen } from '../../src/components/AuthScreen';
import { useFestiva } from '../../src/store/FestivaStore';
import { radii, spacing, useThemedStyles, type Palette, useTheme } from '../../src/theme';

const LENGTH = 6;

/**
 * Six-digit verification. Boxes advance automatically and backspace steps back,
 * so the whole code can be typed without ever tapping a field.
 */
export default function Verify() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { profile } = useFestiva();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''));
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const setDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    setError(undefined);

    if (clean && index < LENGTH - 1) inputs.current[index + 1]?.focus();
    if (next.every((d) => d)) verify(next.join(''));
  };

  const onKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const verify = (code: string) => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      // Any complete code succeeds until a real backend exists.
      if (code.length === LENGTH) {
        haptics.confirm();
        router.replace('/onboarding/country');
      } else {
        setError("That code doesn't match. Check your email and try again.");
      }
    }, 600);
  };

  return (
    <AuthScreen
      title="Verify your email"
      subtitle={`We sent a 6-digit code to ${profile.email}. Enter it below to continue.`}
      error={error}
    >
      <View style={styles.codeRow}>
        {digits.map((digit, i) => (
          <TextInput
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={digit}
            onChangeText={(v) => setDigit(i, v)}
            onKeyPress={({ nativeEvent }) => onKeyPress(i, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={1}
            autoFocus={i === 0}
            style={[styles.codeBox, digit && styles.codeBoxFilled, !!error && styles.codeBoxError]}
            accessibilityLabel={`Digit ${i + 1} of ${LENGTH}`}
          />
        ))}
      </View>

      <Button
        label="Verify"
        hero
        loading={submitting}
        disabled={digits.some((d) => !d)}
        onPress={() => verify(digits.join(''))}
      />

      {secondsLeft > 0 ? (
        <View style={styles.resendRow}>
          <MaterialIcons name="schedule" size={15} color={colors.textTertiary} />
          <Text variant="labelSm">Resend code in {secondsLeft}s</Text>
        </View>
      ) : (
        <Animated.View entering={FadeIn.duration(240)} style={styles.resendRow}>
          <Button
            label="Resend code"
            variant="tertiary"
            block={false}
            onPress={() => {
              setSecondsLeft(30);
              haptics.tap();
            }}
          />
        </Animated.View>
      )}
    </AuthScreen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  codeRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  codeBox: {
    flex: 1,
    maxWidth: 52,
    height: 60,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: colors.indigo,
  },
  codeBoxFilled: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  codeBoxError: { borderColor: colors.danger },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
