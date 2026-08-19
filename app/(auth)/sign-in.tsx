import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { Button, IconButton, SocialButton, Text, TextField, haptics } from '../../src/components';
import { AuthScreen } from '../../src/components/AuthScreen';
import { spacing, useThemedStyles, type Palette, useTheme } from '../../src/theme';

export default function SignIn() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = () => {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = 'Enter your email address.';
    if (!password) next.password = 'Enter your password.';
    setErrors(next);
    setFormError(undefined);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      router.replace('/(tabs)');
    }, 700);
  };

  return (
    <AuthScreen
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      error={formError}
      footer={
        <View style={styles.footer}>
          <Text variant="bodyMuted">New to Festiva?</Text>
          <Button
            label="Create an account"
            variant="tertiary"
            block={false}
            onPress={() => router.replace('/(auth)/create-account')}
          />
        </View>
      }
    >
      <TextField
        label="Email"
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          if (errors.email) setErrors((e) => ({ ...e, email: '' }));
        }}
        placeholder="you@example.com"
        icon="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email || undefined}
      />

      <TextField
        label="Password"
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          if (errors.password) setErrors((e) => ({ ...e, password: '' }));
        }}
        placeholder="Your password"
        icon="lock-outline"
        secure
        autoCapitalize="none"
        error={errors.password || undefined}
      />

      <View style={styles.forgotRow}>
        <Button
          label="Forgot password?"
          variant="tertiary"
          block={false}
          onPress={() => router.push('/(auth)/recover')}
        />
      </View>

      <View style={styles.signInRow}>
        <Button label="Sign In" hero loading={submitting} onPress={submit} style={styles.signInButton} />
        <IconButton
          icon="fingerprint"
          label="Sign in with Face ID"
          color={colors.primary}
          size={28}
          chip
          onPress={() => {
            haptics.confirm();
            router.replace('/(tabs)');
          }}
        />
      </View>

      <View style={styles.divider}>
        <View style={styles.rule} />
        <Text variant="labelSm">or continue with</Text>
        <View style={styles.rule} />
      </View>

      <View style={styles.social}>
        <SocialButton label="Continue with Apple" icon="apple" />
        <SocialButton label="Continue with Google" icon="g-translate" />
      </View>
    </AuthScreen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  forgotRow: { alignItems: 'flex-end', marginTop: -spacing.sm },
  signInRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  signInButton: { flex: 1 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  social: { gap: spacing.md },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
