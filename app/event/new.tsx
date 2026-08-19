import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

import {
  Card,
  DateTimeField,
  SelectableCard,
  Text,
  TextField,
  ToggleRow,
  haptics,
} from '../../src/components';
import { FormScreen } from '../../src/components/FormScreen';
import { EVENT_CATEGORIES, EVENT_META } from '../../src/data/eventMeta';
import { toISO } from '../../src/data/dates';
import { useFestiva } from '../../src/store/FestivaStore';
import { radii, spacing, useThemedStyles, type Palette, useTheme } from '../../src/theme';
import type { EventCategory, ReminderOffset } from '../../src/types';

const OFFSETS: { value: ReminderOffset; label: string }[] = [
  { value: 30, label: '30 days' },
  { value: 14, label: '2 weeks' },
  { value: 7, label: '1 week' },
  { value: 1, label: '1 day' },
  { value: 0, label: 'Same day' },
];

/**
 * Add / edit a personal occasion. Doubles as the edit form when an `id` is
 * passed, so the two stay in sync by construction.
 */
export default function EventForm() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { id } = useLocalSearchParams<{ id?: string }>();
  const festiva = useFestiva();
  const existing = id ? festiva.eventById(id) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [category, setCategory] = useState<EventCategory>(existing?.category ?? 'birthday');
  const [date, setDate] = useState(() => (existing ? new Date(existing.date) : new Date()));
  const [recurs, setRecurs] = useState(existing?.recursAnnually ?? true);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  // Default new occasions to reminding; keep whatever an existing one had.
  const [remindOn, setRemindOn] = useState(existing ? !!existing.reminder?.enabled : true);
  const [offset, setOffset] = useState<ReminderOffset>(
    existing?.reminder?.offset ?? festiva.preferences.defaultOffset,
  );
  const [time, setTime] = useState(() => {
    const [h, m] = (existing?.reminder?.time ?? festiva.preferences.defaultTime).split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  });
  const [error, setError] = useState<string>();

  const save = () => {
    if (!name.trim()) {
      setError('Give this occasion a name.');
      return;
    }

    const payload = {
      name: name.trim(),
      category,
      date: toISO(date),
      recursAnnually: recurs,
      notes: notes.trim() || undefined,
      reminder: remindOn
        ? {
            offset,
            time: `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`,
            enabled: true,
          }
        : undefined,
    };

    if (existing) festiva.updateEvent(existing.id, payload);
    else festiva.addEvent(payload);

    router.back();
  };

  return (
    <FormScreen
      title={existing ? 'Edit occasion' : 'New occasion'}
      saveLabel={existing ? 'Save changes' : 'Add occasion'}
      canSave={!!name.trim()}
      onSave={save}
    >
      <TextField
        label="What is it?"
        value={name}
        onChangeText={(v) => {
          setName(v);
          if (error) setError(undefined);
        }}
        placeholder="Mom's Birthday"
        icon="edit"
        autoCapitalize="words"
        error={error}
      />

      <View style={styles.group}>
        <Text variant="labelSm" style={styles.groupLabel}>
          CATEGORY
        </Text>
        <View style={styles.grid}>
          {EVENT_CATEGORIES.map((option) => (
            <View key={option.value} style={styles.gridCell}>
              <SelectableCard
                label={option.label}
                icon={option.icon}
                selected={category === option.value}
                onPress={() => {
                  haptics.select();
                  setCategory(option.value);
                }}
              />
            </View>
          ))}
        </View>
      </View>

      <DateTimeField label="When is it?" value={date} onChange={setDate} mode="date" />

      <Card>
        <ToggleRow
          label="Repeats every year"
          description="Birthdays and anniversaries usually do."
          icon="autorenew"
          value={recurs}
          onChange={setRecurs}
        />
      </Card>

      <Card>
        <ToggleRow
          label="Remind me"
          description="We'll send a notification before the day."
          icon="notifications-active"
          value={remindOn}
          onChange={setRemindOn}
        />

        {remindOn ? (
          <>
            <View style={styles.divider} />
            <Text variant="labelSm" style={styles.remindLabel}>
              HOW FAR AHEAD
            </Text>
            <View style={styles.offsets}>
              {OFFSETS.map((option) => {
                const active = option.value === offset;
                return (
                  <Pressable
                    key={String(option.value)}
                    onPress={() => {
                      haptics.select();
                      setOffset(option.value);
                    }}
                    style={[styles.offset, active && styles.offsetActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      variant="label"
                      color={active ? colors.white : colors.indigo}
                      style={styles.offsetLabel}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.timeField}>
              <DateTimeField label="At" value={time} onChange={setTime} mode="time" />
            </View>
          </>
        ) : null}
      </Card>

      <TextField
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Buy flowers and book dinner."
        multiline
        helper="Only you can see this."
      />

      <View style={styles.privacyNote}>
        <MaterialIcons name="lock" size={14} color={colors.textTertiary} />
        <Text variant="labelSm" style={styles.privacyText}>
          Personal occasions stay private to your account and are never shared.
        </Text>
      </View>
    </FormScreen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  group: { gap: spacing.sm },
  groupLabel: { fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridCell: { width: '30%', flexGrow: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.md },
  remindLabel: { fontWeight: '700', marginBottom: spacing.sm },
  offsets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  offset: {
    paddingHorizontal: spacing.lg,
    height: 40,
    justifyContent: 'center',
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  offsetActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  offsetLabel: { fontWeight: '600' },
  timeField: { marginTop: spacing.lg },
  privacyNote: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.xs },
  privacyText: { flex: 1, lineHeight: 17 },
});
