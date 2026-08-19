import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button, Text, TextField } from '../../src/components';
import { AuthScreen } from '../../src/components/AuthScreen';
import { spacing, useThemedStyles, type Palette, useTheme } from '../../src/theme';

export default function Recover() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setError(undefined);
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSent(true);
    }, 700);
  };

  if (sent) {
    return (
      <AuthScreen title="Check your inbox" subtitle={`We sent a reset link to ${email}.`}>
        <Animated.View entering={FadeIn.duration(320)} style={styles.confirm}>
          <View style={styles.successIcon}>
            <MaterialIcons name="mark-email-read" size={36} color={colors.success} />
          </View>
          <Text variant="bodyMuted" style={styles.confirmText}>
            The link expires in 30 minutes. If it doesn't arrive, check your spam folder.
          </Text>
        </Animated.View>

        <Button label="Back to sign in" hero onPress={() => router.replace('/(auth)/sign-in')} />
        <Button label="Send it again" variant="tertiary" onPress={() => setSent(false)} />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Reset your password"
      subtitle="Enter the email on your account and we'll send you a reset link."
    >
      <TextField
        label="Email"
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          if (error) setError(undefined);
        }}
        placeholder="you@example.com"
        icon="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        error={error}
      />

      <Button label="Send reset link" hero loading={submitting} onPress={submit} />
      <Button label="Back to sign in" variant="tertiary" onPress={() => router.back()} />
    </AuthScreen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  confirm: { alignItems: 'center', gap: spacing.lg },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { textAlign: 'center' },
});
