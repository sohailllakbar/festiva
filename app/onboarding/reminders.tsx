import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import { Card, DateTimeField, Text, ToggleRow, haptics } from '../../src/components';
import { OnboardingScreen } from '../../src/components/OnboardingScreen';
import { useFestiva } from '../../src/store/FestivaStore';
import { radii, spacing, useThemedStyles, type Palette, useTheme } from '../../src/theme';
import type { ReminderOffset } from '../../src/types';

const OFFSETS: { value: ReminderOffset; label: string }[] = [
  { value: 30, label: '30 days before' },
  { value: 14, label: '2 weeks before' },
  { value: 7, label: '1 week before' },
  { value: 1, label: '1 day before' },
  { value: 0, label: 'On the day' },
];

/**
 * Sets the *default* reminder applied to new festivals and events. Individual
 * occasions can still override it later — this just avoids asking every time.
 */
export default function ReminderSetup() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { preferences, updatePreferences } = useFestiva();
  const [offset, setOffset] = useState<ReminderOffset>(preferences.defaultOffset);
  const [time, setTime] = useState(() => {
    const [h, m] = preferences.defaultTime.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  });
  const [festivalOn, setFestivalOn] = useState(preferences.festivalReminders);
  const [eventOn, setEventOn] = useState(preferences.eventReminders);

  const save = () => {
    updatePreferences({
      defaultOffset: offset,
      defaultTime: `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`,
      festivalReminders: festivalOn,
      eventReminders: eventOn,
    });
    router.push('/onboarding/permissions');
  };

  return (
    <OnboardingScreen
      step={6}
      title="When should we remind you?"
      subtitle="Pick a default that suits you. You can set a different reminder on any single occasion."
      onPrimary={save}
    >
      <Text variant="labelSm" style={styles.groupLabel}>
        REMIND ME
      </Text>
      <View style={styles.options}>
        {OFFSETS.map((option) => {
          const active = option.value === offset;
          return (
            <Pressable
              key={String(option.value)}
              onPress={() => {
                haptics.select();
                setOffset(option.value);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={[styles.option, active && styles.optionActive]}
            >
              <MaterialIcons
                name={active ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={20}
                color={active ? colors.primary : colors.border}
              />
              <Text variant="body" color={colors.indigo} style={styles.optionLabel}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.timeField}>
        <DateTimeField label="At what time" value={time} onChange={setTime} mode="time" />
      </View>

      <Card style={styles.toggles}>
        <ToggleRow
          label="Festival reminders"
          description="For festivals and holidays you've saved."
          icon="celebration"
          value={festivalOn}
          onChange={setFestivalOn}
        />
        <View style={styles.divider} />
        <ToggleRow
          label="Personal event reminders"
          description="For birthdays, anniversaries and your own occasions."
          icon="cake"
          value={eventOn}
          onChange={setEventOn}
        />
      </Card>
    </OnboardingScreen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  groupLabel: { fontWeight: '700', marginBottom: spacing.sm },
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  optionLabel: { flex: 1, fontWeight: '500' },
  timeField: { marginTop: spacing.xl },
  toggles: { marginTop: spacing.xl },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
