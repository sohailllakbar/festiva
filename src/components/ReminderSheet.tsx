import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Button } from './Button';
import { BottomSheet, DateTimeField, Stepper } from './Form';
import { Text } from './Text';
import { haptics } from './motion';
import { useFestiva } from '../store/FestivaStore';
import { radii, spacing, useTheme, useThemedStyles, type Palette } from '../theme';
import type { Reminder, ReminderOffset } from '../types';

const OFFSETS: { value: ReminderOffset; label: string }[] = [
  { value: 30, label: '30 days before' },
  { value: 14, label: '2 weeks before' },
  { value: 7, label: '1 week before' },
  { value: 1, label: '1 day before' },
  { value: 0, label: 'On the day' },
  { value: 'custom', label: 'Custom…' },
];

/**
 * One reminder picker, shared by festivals and personal events.
 *
 * The spec calls for the same reminder system across both, so this owns the
 * offsets, the time and the custom case — callers only supply the id.
 */
export function ReminderSheet({
  visible,
  onClose,
  refId,
  occasionName,
}: {
  visible: boolean;
  onClose: () => void;
  refId: string;
  occasionName: string;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { reminderFor, setReminder, removeReminder, preferences } = useFestiva();
  const existing = reminderFor(refId);

  const [offset, setOffset] = useState<ReminderOffset>(existing?.offset ?? preferences.defaultOffset);
  const [customDays, setCustomDays] = useState(existing?.customDays ?? 3);
  const [time, setTime] = useState(() => toDate(existing?.time ?? preferences.defaultTime));

  // Re-seed from the store each time the sheet opens, so it never shows stale state.
  useEffect(() => {
    if (!visible) return;
    setOffset(existing?.offset ?? preferences.defaultOffset);
    setCustomDays(existing?.customDays ?? 3);
    setTime(toDate(existing?.time ?? preferences.defaultTime));
  }, [visible, existing, preferences.defaultOffset, preferences.defaultTime]);

  const save = () => {
    const reminder: Reminder = {
      offset,
      customDays: offset === 'custom' ? customDays : undefined,
      time: `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`,
      enabled: true,
    };
    haptics.confirm();
    setReminder(refId, reminder);
    onClose();
  };

  const clear = () => {
    haptics.warn();
    removeReminder(refId);
    onClose();
  };

  return (
    <BottomSheet visible={visible} title="Remind me about this" onClose={onClose}>
      <Text variant="bodyMuted" style={styles.intro}>
        We'll send a notification for {occasionName}.
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

      {offset === 'custom' ? (
        <View style={styles.custom}>
          <Stepper label="Days before" value={customDays} onChange={setCustomDays} min={1} max={365} />
        </View>
      ) : null}

      <View style={styles.timeField}>
        <DateTimeField label="Notify me at" value={time} onChange={setTime} mode="time" />
      </View>

      <View style={styles.actions}>
        <Button label={existing ? 'Update reminder' : 'Set reminder'} hero haptic="success" onPress={save} />
        {existing ? (
          <Button label="Remove reminder" variant="tertiary" onPress={clear} labelColor={colors.danger} />
        ) : null}
      </View>
    </BottomSheet>
  );
}

/** Human-readable summary used on detail screens and list rows. */
export function describeReminder(reminder?: Reminder): string | null {
  if (!reminder?.enabled) return null;
  const { offset, customDays } = reminder;
  if (offset === 'custom') return `${customDays} days before`;
  if (offset === 0) return 'On the day';
  if (offset === 1) return '1 day before';
  if (offset === 7) return '1 week before';
  if (offset === 14) return '2 weeks before';
  return `${offset} days before`;
}

function toDate(hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h || 9, m || 0, 0, 0);
  return d;
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  intro: { marginBottom: spacing.lg },
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  optionLabel: { flex: 1, fontWeight: '500' },
  custom: { marginTop: spacing.lg },
  timeField: { marginTop: spacing.lg },
  actions: { marginTop: spacing.xl, gap: spacing.xs },
});
