import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { Button, SocialButton, Text, TextField } from '../../src/components';
import { AuthScreen } from '../../src/components/AuthScreen';
import { useFestiva } from '../../src/store/FestivaStore';
import { spacing, useThemedStyles, type Palette } from '../../src/theme';

export default function CreateAccount() {
  const styles = useThemedStyles(makeStyles);
  const { updateProfile } = useFestiva();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Enter your name so we know what to call you.';
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email address.';
    if (password.length < 8) next.password = 'Use at least 8 characters.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // Simulated request — swap for the real call when auth exists.
    setSubmitting(true);
    updateProfile({ name: name.trim(), email: email.trim() });
    setTimeout(() => {
      setSubmitting(false);
      router.push('/(auth)/verify');
    }, 700);
  };

  return (
    <AuthScreen
      title="Create your account"
      subtitle="Start remembering the occasions that matter to you."
      footer={
        <View style={styles.footer}>
          <Text variant="bodyMuted">Already have an account?</Text>
          <Button label="Sign In" variant="tertiary" block={false} onPress={() => router.replace('/(auth)/sign-in')} />
        </View>
      }
    >
      <TextField
        label="Full name"
        value={name}
        onChangeText={(v) => {
          setName(v);
          if (errors.name) setErrors((e) => ({ ...e, name: '' }));
        }}
        placeholder="Sohail Akbar"
        icon="person-outline"
        autoCapitalize="words"
        error={errors.name || undefined}
      />

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
        placeholder="At least 8 characters"
        icon="lock-outline"
        secure
        autoCapitalize="none"
        error={errors.password || undefined}
        helper={!errors.password ? 'Use 8 or more characters with a mix of letters and numbers.' : undefined}
      />

      <Button label="Create Account" hero loading={submitting} onPress={submit} />

      <View style={styles.divider}>
        <View style={styles.rule} />
        <Text variant="labelSm">or continue with</Text>
        <View style={styles.rule} />
      </View>

      <View style={styles.social}>
        <SocialButton label="Continue with Apple" icon="apple" />
        <SocialButton label="Continue with Google" icon="g-translate" />
      </View>

      <Text variant="labelSm" style={styles.legal}>
        By creating an account you agree to our Terms of Service and Privacy Policy.
      </Text>
    </AuthScreen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  social: { gap: spacing.md },
  legal: { textAlign: 'center', lineHeight: 17 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
