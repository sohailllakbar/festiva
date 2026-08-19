import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Card, CategoryPill, EmptyState, IconButton, Text, haptics } from '../../src/components';
import { formatFestivalDate, parseISODate, toISO } from '../../src/data/dates';
import { useFestiva } from '../../src/store/FestivaStore';
import { radii, spacing, useThemedStyles, type Palette, useTheme, useCategoryColor } from '../../src/theme';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface DayEntry {
  id: string;
  name: string;
  date: string;
  kind: 'festival' | 'event';
  category?: string;
}

/**
 * Month grid with a per-day agenda. Days carrying an occasion get a coloured
 * dot, so the shape of the month is legible before tapping anything.
 */
export default function Calendar() {
  const { colors } = useTheme();
  const categoryColor = useCategoryColor();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const festiva = useFestiva();

  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => toISO(new Date()));

  /** Everything happening this month, keyed by ISO date. */
  const byDate = useMemo(() => {
    const map = new Map<string, DayEntry[]>();

    // The full catalogue, not just what's ahead — paging back a month should
    // show the festivals that actually happened, not an empty grid.
    festiva.allFestivals().forEach((f) => {
      const list = map.get(f.date) ?? [];
      list.push({ id: f.id, name: f.name, date: f.date, kind: 'festival', category: f.category });
      map.set(f.date, list);
    });

    festiva.upcomingEvents().forEach((e) => {
      const list = map.get(e.resolvedDate) ?? [];
      list.push({ id: e.id, name: e.name, date: e.resolvedDate, kind: 'event' });
      map.set(e.resolvedDate, list);
    });

    return map;
  }, [festiva]);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const out: (Date | null)[] = Array.from({ length: firstWeekday }, () => null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(year, month, d));
    return out;
  }, [cursor]);

  const shiftMonth = (delta: number) => {
    haptics.select();
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  };

  const agenda = byDate.get(selected) ?? [];
  const todayISO = toISO(new Date());

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text variant="headlineLg" color={colors.indigo}>
          Calendar
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Month navigator */}
        <Card large style={styles.monthCard}>
          <View style={styles.monthNav}>
            <IconButton icon="chevron-left" label="Previous month" onPress={() => shiftMonth(-1)} />
            <Text variant="headlineSm" color={colors.indigo} style={styles.monthLabel}>
              {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </Text>
            <IconButton icon="chevron-right" label="Next month" onPress={() => shiftMonth(1)} />
          </View>

          <View style={styles.weekdays}>
            {WEEKDAYS.map((d, i) => (
              <Text key={i} variant="labelSm" style={styles.weekday}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (!day) return <View key={`pad-${i}`} style={styles.cell} />;

              const iso = toISO(day);
              const entries = byDate.get(iso) ?? [];
              const isSelected = iso === selected;
              const isToday = iso === todayISO;

              return (
                <Pressable
                  key={iso}
                  onPress={() => {
                    haptics.select();
                    setSelected(iso);
                  }}
                  style={styles.cell}
                  accessibilityRole="button"
                  accessibilityLabel={`${day.toDateString()}${entries.length ? `, ${entries.length} occasions` : ''}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      isToday && !isSelected && styles.dayToday,
                      isSelected && styles.daySelected,
                    ]}
                  >
                    <Text
                      variant="body"
                      color={isSelected ? colors.white : colors.indigo}
                      style={styles.dayNum}
                    >
                      {day.getDate()}
                    </Text>
                  </View>

                  <View style={styles.dots}>
                    {entries.slice(0, 3).map((entry, di) => (
                      <View
                        key={`${entry.id}-${di}`}
                        style={[
                          styles.dot,
                          {
                            backgroundColor: isSelected
                              ? colors.white
                              : entry.kind === 'event'
                                ? categoryColor.personal
                                : categoryColor[(entry.category as keyof typeof categoryColor) ?? 'general'],
                          },
                        ]}
                      />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Agenda for the selected day */}
        <Animated.View key={selected} entering={FadeIn.duration(220)} style={styles.agenda}>
          <Text variant="labelSm" style={styles.agendaLabel}>
            {parseISODate(selected)
              .toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
              .toUpperCase()}
          </Text>

          {agenda.length === 0 ? (
            <EmptyState
              icon="event-available"
              title="Nothing on this day"
              message="A clear day. Tap another date to see what's coming."
              compact
            />
          ) : (
            <View style={styles.agendaList}>
              {agenda.map((entry) => (
                <Card
                  key={`${entry.kind}-${entry.id}`}
                  onPress={() =>
                    router.push(
                      entry.kind === 'festival' ? `/festival/${entry.id}` : `/event/${entry.id}`,
                    )
                  }
                >
                  <View style={styles.agendaRow}>
                    <View
                      style={[
                        styles.agendaAccent,
                        {
                          backgroundColor:
                            entry.kind === 'event'
                              ? categoryColor.personal
                              : categoryColor[(entry.category as keyof typeof categoryColor) ?? 'general'],
                        },
                      ]}
                    />
                    <View style={styles.agendaBody}>
                      <Text variant="body" color={colors.indigo} style={styles.agendaName}>
                        {entry.name}
                      </Text>
                      <Text variant="labelSm">{formatFestivalDate(entry.date)}</Text>
                      {entry.kind === 'festival' && entry.category ? (
                        <View style={styles.agendaPill}>
                          <CategoryPill category={entry.category as never} />
                        </View>
                      ) : (
                        <View style={styles.personalTag}>
                          <MaterialIcons name="lock" size={11} color={colors.textTertiary} />
                          <Text variant="labelSm">Private event</Text>
                        </View>
                      )}
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
                  </View>
                </Card>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.screenX,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: { paddingHorizontal: spacing.screenX, paddingTop: spacing.xl, gap: spacing.xl },

  monthCard: { paddingVertical: spacing.lg, paddingHorizontal: spacing.md },
  monthNav: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  monthLabel: { flex: 1, textAlign: 'center' },
  weekdays: { flexDirection: 'row', marginBottom: spacing.sm },
  weekday: { flex: 1, textAlign: 'center', fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4, gap: 3 },
  dayCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayToday: { borderWidth: 1.5, borderColor: colors.primary },
  daySelected: { backgroundColor: colors.primary },
  dayNum: { fontVariant: ['tabular-nums'] },
  dots: { flexDirection: 'row', gap: 3, height: 5 },
  dot: { width: 5, height: 5, borderRadius: 3 },

  agenda: { gap: spacing.md },
  agendaLabel: { fontWeight: '700', letterSpacing: 0.6 },
  agendaList: { gap: spacing.md },
  agendaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  agendaAccent: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  agendaBody: { flex: 1, gap: 4 },
  agendaName: { fontWeight: '600' },
  agendaPill: { flexDirection: 'row', marginTop: 2 },
  personalTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
});
