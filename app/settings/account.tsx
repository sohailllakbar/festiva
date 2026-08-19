import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { BottomSheet, Button, Card, Text, TextField } from '../../src/components';
import { SettingsScreen, SettingsSection } from '../../src/components/SettingsScreen';
import { useFestiva } from '../../src/store/FestivaStore';
import { radii, spacing, useThemedStyles, type Palette, useTheme } from '../../src/theme';

export default function Account() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { profile, updateProfile } = useFestiva();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [saved, setSaved] = useState(false);

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [pwError, setPwError] = useState<string>();
  const [pwSaved, setPwSaved] = useState(false);

  const [signOutOpen, setSignOutOpen] = useState(false);

  const dirty = name !== profile.name || email !== profile.email;

  const saveProfile = () => {
    updateProfile({ name: name.trim(), email: email.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const changePassword = () => {
    if (!current) return setPwError('Enter your current password.');
    if (next.length < 8) return setPwError('New password must be at least 8 characters.');
    if (next === current) return setPwError('Choose a password you haven’t used before.');
    setPwError(undefined);
    setCurrent('');
    setNext('');
    setPwSaved(true);
    setTimeout(() => setPwSaved(false), 2500);
  };

  return (
    <SettingsScreen title="Account">
      <SettingsSection title="YOUR DETAILS">
        <View style={styles.fields}>
          <TextField label="Name" value={name} onChangeText={setName} icon="person-outline" autoCapitalize="words" />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            icon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Button label="Save changes" disabled={!dirty} haptic="success" onPress={saveProfile} />
          {saved ? <Banner icon="check-circle" tone={colors.success} text="Profile updated." /> : null}
        </View>
      </SettingsSection>

      <SettingsSection title="PASSWORD">
        <View style={styles.fields}>
          <TextField
            label="Current password"
            value={current}
            onChangeText={(v) => {
              setCurrent(v);
              if (pwError) setPwError(undefined);
            }}
            icon="lock-outline"
            secure
            autoCapitalize="none"
          />
          <TextField
            label="New password"
            value={next}
            onChangeText={(v) => {
              setNext(v);
              if (pwError) setPwError(undefined);
            }}
            icon="lock-reset"
            secure
            autoCapitalize="none"
            error={pwError}
            helper={!pwError ? 'At least 8 characters.' : undefined}
          />
          <Button
            label="Change password"
            variant="secondary"
            disabled={!current || !next}
            onPress={changePassword}
          />
          {pwSaved ? <Banner icon="check-circle" tone={colors.success} text="Password changed." /> : null}
        </View>
      </SettingsSection>

      <SettingsSection title="SESSION">
        <Button label="Sign out" variant="secondary" icon="logout" onPress={() => setSignOutOpen(true)} />
      </SettingsSection>

      <SettingsSection
        title="DANGER ZONE"
        hint="Deleting your account removes your occasions, favourites and reminders permanently."
      >
        <Card style={styles.dangerCard}>
          <View style={styles.dangerHead}>
            <MaterialIcons name="warning-amber" size={20} color={colors.danger} />
            <Text variant="label" color={colors.danger} style={styles.dangerTitle}>
              Delete account
            </Text>
          </View>
          <Text variant="bodyMuted" style={styles.dangerBody}>
            This can't be undone. You'll be asked to confirm on the next screen.
          </Text>
          <Button
            label="Continue to delete"
            variant="tertiary"
            labelColor={colors.danger}
            onPress={() => router.push('/settings/delete-account')}
          />
        </Card>
      </SettingsSection>

      <BottomSheet visible={signOutOpen} title="Sign out?" onClose={() => setSignOutOpen(false)}>
        <Text variant="bodyMuted" style={styles.sheetBody}>
          Your occasions and reminders stay saved. You'll just need to sign in again.
        </Text>
        <View style={styles.sheetActions}>
          <Button
            label="Sign out"
            hero
            haptic="warning"
            onPress={() => {
              setSignOutOpen(false);
              router.replace('/(auth)/welcome');
            }}
          />
          <Button label="Stay signed in" variant="tertiary" onPress={() => setSignOutOpen(false)} />
        </View>
      </BottomSheet>
    </SettingsScreen>
  );
}

function Banner({ icon, tone, text }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; tone: string; text: string }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Animated.View entering={FadeIn.duration(240)} style={[styles.banner, { backgroundColor: `${tone}1A` }]}>
      <MaterialIcons name={icon} size={18} color={tone} />
      <Text variant="label" color={tone} style={styles.bannerText}>
        {text}
      </Text>
    </Animated.View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  fields: { gap: spacing.lg },
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radii.sm },
  bannerText: { flex: 1 },
  dangerCard: { gap: spacing.sm, borderColor: `${colors.danger}44`, backgroundColor: colors.dangerLight },
  dangerHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dangerTitle: { fontWeight: '700' },
  dangerBody: { lineHeight: 22 },
  sheetBody: { marginBottom: spacing.xl, lineHeight: 24 },
  sheetActions: { gap: spacing.xs },
});
