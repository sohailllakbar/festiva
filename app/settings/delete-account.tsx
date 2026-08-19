import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { Button, Card, Text, TextField } from '../../src/components';
import { SettingsScreen } from '../../src/components/SettingsScreen';
import { useFestiva } from '../../src/store/FestivaStore';
import { radii, spacing, useThemedStyles, type Palette, useTheme } from '../../src/theme';

const CONFIRM_WORD = 'DELETE';

/**
 * Account deletion requires deliberate confirmation, per the spec.
 *
 * Two gates rather than one dialog: the user must read what's being destroyed,
 * then type the word. That's intentional friction on an irreversible action.
 */
export default function DeleteAccount() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const festiva = useFestiva();
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);

  const confirmed = typed.trim().toUpperCase() === CONFIRM_WORD;

  const losing = [
    { icon: 'celebration' as const, label: `${festiva.favorites.length} saved festivals` },
    { icon: 'cake' as const, label: `${festiva.events.length} personal occasions` },
    { icon: 'notifications-active' as const, label: `${Object.keys(festiva.reminders).length} reminders` },
    { icon: 'tune' as const, label: 'Your country, language and interests' },
  ];

  const destroy = async () => {
    setDeleting(true);
    // Cancels every scheduled reminder and clears the stored blob, so the app
    // relaunches as a fresh install rather than restoring what was "deleted".
    await festiva.resetEverything();
    router.replace('/(auth)/welcome');
  };

  return (
    <SettingsScreen title="Delete account">
      <Card style={styles.warningCard}>
        <View style={styles.warningIcon}>
          <MaterialIcons name="warning-amber" size={30} color={colors.danger} />
        </View>
        <Text variant="headlineSm" color={colors.danger} style={styles.warningTitle}>
          This can't be undone
        </Text>
        <Text variant="bodyMuted" style={styles.warningBody}>
          Deleting your account permanently removes everything below. We can't recover it afterwards,
          even if you sign up again with the same email.
        </Text>
      </Card>

      <View style={styles.losing}>
        <Text variant="labelSm" style={styles.losingTitle}>
          YOU WILL LOSE
        </Text>
        <Card large padded={false}>
          {losing.map((item, i) => (
            <View key={item.label} style={[styles.losingRow, i < losing.length - 1 && styles.losingDivider]}>
              <MaterialIcons name={item.icon} size={20} color={colors.textTertiary} />
              <Text variant="body" color={colors.indigo} style={styles.losingLabel}>
                {item.label}
              </Text>
            </View>
          ))}
        </Card>
      </View>

      <View style={styles.confirmBlock}>
        <Text variant="bodyMuted" style={styles.confirmIntro}>
          Type <Text variant="body" color={colors.indigo} style={styles.word}>{CONFIRM_WORD}</Text> below to
          confirm.
        </Text>
        <TextField
          label="Confirmation"
          value={typed}
          onChangeText={setTyped}
          placeholder={CONFIRM_WORD}
          icon="keyboard"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.actions}>
        <Button
          label="Delete my account"
          variant="destructive"
          hero
          disabled={!confirmed}
          loading={deleting}
          onPress={() => void destroy()}
        />
        <Button label="Keep my account" variant="tertiary" onPress={() => router.back()} />
      </View>

      <View style={styles.alternative}>
        <MaterialIcons name="lightbulb-outline" size={16} color={colors.textTertiary} />
        <Text variant="labelSm" style={styles.alternativeText}>
          Just want fewer notifications? You can turn reminders off in Settings instead of deleting
          your account.
        </Text>
      </View>
    </SettingsScreen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  warningCard: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerLight,
    borderColor: `${colors.danger}44`,
  },
  warningIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.danger}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  warningTitle: { textAlign: 'center' },
  warningBody: { textAlign: 'center', lineHeight: 24 },

  losing: { gap: spacing.sm },
  losingTitle: { fontWeight: '700', letterSpacing: 0.6, paddingHorizontal: spacing.xs },
  losingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, minHeight: 54 },
  losingDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  losingLabel: { flex: 1 },

  confirmBlock: { gap: spacing.md },
  confirmIntro: { lineHeight: 24 },
  word: { fontWeight: '700', letterSpacing: 1 },

  actions: { gap: spacing.xs },
  alternative: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xs },
  alternativeText: { flex: 1, lineHeight: 18 },
});
