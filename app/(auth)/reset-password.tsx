import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { Button, Text, TextField } from '../../src/components';
import { AuthScreen } from '../../src/components/AuthScreen';
import { radii, spacing, useThemedStyles, type Palette, useTheme } from '../../src/theme';

/** Live strength rules — clearer than failing the whole form on submit. */
const RULES = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'case', label: 'Upper and lowercase letters', test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { id: 'number', label: 'At least one number', test: (p: string) => /\d/.test(p) },
];

export default function ResetPassword() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const allRulesPass = RULES.every((r) => r.test(password));
  const matches = password.length > 0 && password === confirm;

  const submit = () => {
    if (!allRulesPass) {
      setError('Your password does not meet the requirements below.');
      return;
    }
    if (!matches) {
      setError('The two passwords do not match.');
      return;
    }
    setError(undefined);
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      router.replace('/(auth)/sign-in');
    }, 700);
  };

  return (
    <AuthScreen
      title="Choose a new password"
      subtitle="Pick something you haven't used before."
      error={error}
    >
      <TextField
        label="New password"
        value={password}
        onChangeText={setPassword}
        placeholder="New password"
        icon="lock-outline"
        secure
        autoCapitalize="none"
      />

      <View style={styles.rules}>
        {RULES.map((rule) => {
          const pass = rule.test(password);
          return (
            <View key={rule.id} style={styles.ruleRow}>
              <MaterialIcons
                name={pass ? 'check-circle' : 'radio-button-unchecked'}
                size={16}
                color={pass ? colors.success : colors.textTertiary}
              />
              <Text variant="labelSm" color={pass ? colors.success : colors.textTertiary}>
                {rule.label}
              </Text>
            </View>
          );
        })}
      </View>

      <TextField
        label="Confirm password"
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Repeat your password"
        icon="lock-outline"
        secure
        autoCapitalize="none"
        error={confirm.length > 0 && !matches ? 'Passwords do not match.' : undefined}
      />

      <Button
        label="Update password"
        hero
        loading={submitting}
        disabled={!allRulesPass || !matches}
        onPress={submit}
      />
    </AuthScreen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  rules: {
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginTop: -spacing.sm,
  },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
