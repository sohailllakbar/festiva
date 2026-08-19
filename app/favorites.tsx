import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOut, LinearTransition } from 'react-native-reanimated';

import {
  BottomSheet,
  Button,
  Card,
  CategoryPill,
  EmptyState,
  IconButton,
  Text,
  ToggleRow,
  enterAt,
  haptics,
} from '../src/components';
import { describeReminder } from '../src/components/ReminderSheet';
import { formatFestivalDate } from '../src/data/dates';
import { useFestiva } from '../src/store/FestivaStore';
import { radii, spacing, useThemedStyles, type Palette, useTheme, useCategoryColor } from '../src/theme';

type SortKey = 'soonest' | 'name' | 'recent';

/**
 * The user's own collection. Removal is the risky action here — a mis-tap loses
 * something they deliberately saved — so it's always undoable via a snackbar
 * rather than a confirmation dialog that would slow down the common case.
 */
export default function Favorites() {
  const { colors } = useTheme();
  const categoryColor = useCategoryColor();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const festiva = useFestiva();

  const [sort, setSort] = useState<SortKey>('soonest');
  const [onlyReminders, setOnlyReminders] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [undoVisible, setUndoVisible] = useState(false);

  const saved = useMemo(() => {
    let list = festiva.favorites
      .map((id) => festiva.festivalById(id))
      .filter((f): f is NonNullable<typeof f> => !!f);

    if (onlyReminders) list = list.filter((f) => !!festiva.reminderFor(f.id));

    if (sort === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'recent') return [...list].reverse();
    return [...list].sort((a, b) => festiva.daysFor(a.date) - festiva.daysFor(b.date));
  }, [festiva, sort, onlyReminders]);

  // Auto-dismiss the undo bar so it doesn't linger over the content.
  useEffect(() => {
    if (!undoVisible) return;
    const t = setTimeout(() => setUndoVisible(false), 5000);
    return () => clearTimeout(t);
  }, [undoVisible]);

  const remove = (id: string) => {
    haptics.warn();
    festiva.toggleFavorite(id);
    setUndoVisible(true);
  };

  const isEmpty = festiva.favorites.length === 0;

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <IconButton icon="arrow-back" label="Back" onPress={() => router.back()} size={22} />
        <Text variant="headlineSm" color={colors.indigo} style={styles.title}>
          Favourites
        </Text>
        {!isEmpty ? (
          <IconButton icon="tune" label="Sort and filter" onPress={() => setSheetOpen(true)} size={22} />
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <EmptyState
            icon="favorite-border"
            title="No favourites yet"
            message="Save the festivals you care about and they'll live here, with countdowns and reminders."
          >
            <Button label="Explore festivals" onPress={() => router.replace('/(tabs)/discover')} />
          </EmptyState>
        ) : saved.length === 0 ? (
          <EmptyState
            icon="filter-alt-off"
            title="Nothing matches"
            message="None of your favourites have reminders set. Try clearing the filter."
            compact
          >
            <Button label="Clear filter" variant="secondary" onPress={() => setOnlyReminders(false)} />
          </EmptyState>
        ) : (
          <>
            <Text variant="bodyMuted" style={styles.count}>
              {saved.length} saved {saved.length === 1 ? 'occasion' : 'occasions'}
            </Text>

            <View style={styles.list}>
              {saved.map((festival, i) => {
                const days = festiva.daysFor(festival.date);
                const reminderLabel = describeReminder(festiva.reminderFor(festival.id));

                return (
                  <Animated.View
                    key={festival.id}
                    entering={enterAt(Math.min(i, 8))}
                    exiting={FadeOut.duration(200)}
                    layout={LinearTransition.springify().damping(18)}
                  >
                    <Card onPress={() => router.push(`/festival/${festival.id}`)}>
                      <View style={styles.row}>
                        <View
                          style={[styles.accent, { backgroundColor: categoryColor[festival.category] }]}
                        />

                        <View style={styles.body}>
                          <Text variant="body" color={colors.indigo} numberOfLines={2} style={styles.name}>
                            {festival.name}
                          </Text>
                          <View style={styles.meta}>
                            <MaterialIcons name="event" size={13} color={colors.textTertiary} />
                            <Text variant="labelSm">{formatFestivalDate(festival.date)}</Text>
                            <Text variant="labelSm">·</Text>
                            <Text variant="labelSm" color={colors.primary} style={styles.days}>
                              {days === 0 ? 'Today' : `${days} days`}
                            </Text>
                          </View>

                          <View style={styles.pills}>
                            <CategoryPill category={festival.category} />
                            {reminderLabel ? (
                              <View style={styles.reminderTag}>
                                <MaterialIcons
                                  name="notifications-active"
                                  size={12}
                                  color={colors.success}
                                />
                                <Text variant="labelSm" color={colors.success}>
                                  {reminderLabel}
                                </Text>
                              </View>
                            ) : (
                              <View style={styles.reminderTag}>
                                <MaterialIcons
                                  name="notifications-none"
                                  size={12}
                                  color={colors.textTertiary}
                                />
                                <Text variant="labelSm">No reminder</Text>
                              </View>
                            )}
                          </View>
                        </View>

                        <IconButton
                          icon="favorite"
                          label={`Remove ${festival.name} from favourites`}
                          color={colors.primary}
                          size={22}
                          onPress={() => remove(festival.id)}
                        />
                      </View>
                    </Card>
                  </Animated.View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* Undo snackbar */}
      {undoVisible && festiva.lastRemovedFavorite ? (
        <Animated.View
          entering={FadeInUp.duration(260).springify().damping(18)}
          exiting={FadeOut.duration(200)}
          style={[styles.snackbar, { bottom: insets.bottom + spacing.xl }]}
        >
          <MaterialIcons name="heart-broken" size={18} color={colors.white} />
          <Text variant="label" color={colors.white} style={styles.snackText}>
            Removed from favourites
          </Text>
          <Pressable
            onPress={() => {
              haptics.confirm();
              festiva.undoRemoveFavorite();
              setUndoVisible(false);
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Undo removing favourite"
          >
            <Text variant="label" color={colors.primary} style={styles.undo}>
              UNDO
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}

      <BottomSheet visible={sheetOpen} title="Sort & filter" onClose={() => setSheetOpen(false)}>
        <Text variant="labelSm" style={styles.sheetLabel}>
          SORT BY
        </Text>
        {(
          [
            { key: 'soonest' as const, label: 'Soonest first' },
            { key: 'name' as const, label: 'Name (A–Z)' },
            { key: 'recent' as const, label: 'Recently saved' },
          ]
        ).map((option) => {
          const active = sort === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => {
                haptics.select();
                setSort(option.key);
              }}
              style={styles.sheetRow}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <MaterialIcons
                name={active ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={20}
                color={active ? colors.primary : colors.border}
              />
              <Text variant="body" color={colors.indigo} style={styles.sheetRowLabel}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}

        <View style={styles.sheetDivider} />

        <ToggleRow
          label="Only with reminders"
          description="Hide favourites you haven't set a reminder for."
          icon="notifications-active"
          value={onlyReminders}
          onChange={setOnlyReminders}
        />

        <View style={styles.sheetActions}>
          <Button label="Done" hero onPress={() => setSheetOpen(false)} />
        </View>
      </BottomSheet>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { flex: 1, textAlign: 'center' },
  headerSpacer: { width: 44 },
  content: { paddingHorizontal: spacing.screenX, paddingTop: spacing.xl },
  count: { marginBottom: spacing.md },
  list: { gap: spacing.md },

  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  accent: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  body: { flex: 1, gap: 4 },
  name: { fontWeight: '600' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  days: { fontWeight: '700' },
  pills: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2, flexWrap: 'wrap' },
  reminderTag: { flexDirection: 'row', alignItems: 'center', gap: 3 },

  snackbar: {
    position: 'absolute',
    left: spacing.screenX,
    right: spacing.screenX,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.indigo,
  },
  snackText: { flex: 1 },
  undo: { fontWeight: '700', letterSpacing: 0.6 },

  sheetLabel: { fontWeight: '700', marginBottom: spacing.sm },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48 },
  sheetRowLabel: { flex: 1 },
  sheetDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.lg },
  sheetActions: { marginTop: spacing.xl },
});
