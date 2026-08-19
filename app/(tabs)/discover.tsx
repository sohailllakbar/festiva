import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';

import {
  BottomSheet,
  Button,
  CATEGORY_META,
  Card,
  CategoryPill,
  EmptyState,
  FestivalCard,
  IconButton,
  Text,
  ToggleRow,
  enterAt,
  haptics,
} from '../../src/components';
import { formatFestivalDate } from '../../src/data/dates';
import { useFestiva } from '../../src/store/FestivaStore';
import { radii, spacing, type CategoryKey, useThemedStyles, type Palette, useTheme, useCategoryColor } from '../../src/theme';

type SortKey = 'soonest' | 'name';

const CATEGORIES: CategoryKey[] = [
  'religious',
  'cultural',
  'national',
  'international',
  'seasonal',
  'general',
];

/**
 * Discovery should feel like browsing, not querying a database — so the default
 * view is a visual category grid, and search/filter are there when wanted.
 */
export default function Discover() {
  const { colors } = useTheme();
  const categoryColor = useCategoryColor();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const festiva = useFestiva();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>('soonest');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyReminders, setOnlyReminders] = useState(false);
  const [onlyMyCountry, setOnlyMyCountry] = useState(false);

  const searching = query.trim().length > 0 || activeCategory !== null;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Browsing starts from the user's interests; an explicit category or
    // search term is a deliberate step outside them, so it searches everything.
    let list = activeCategory || q ? festiva.upcomingFestivals() : festiva.personalizedFestivals();

    if (q) {
      // Match name, region or category so "japan", "religious" and "diwali" all work.
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.region.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q),
      );
    }
    if (activeCategory) list = list.filter((f) => f.category === activeCategory);
    if (onlyFavorites) list = list.filter((f) => festiva.isFavorite(f.id));
    if (onlyReminders) list = list.filter((f) => !!festiva.reminderFor(f.id));
    if (onlyMyCountry) {
      const code = festiva.profile.countryCode;
      list = list.filter((f) => f.countryCodes[0] === 'GLOBAL' || f.countryCodes.includes(code));
    }

    return sort === 'name'
      ? [...list].sort((a, b) => a.name.localeCompare(b.name))
      : list;
  }, [query, activeCategory, onlyFavorites, onlyReminders, onlyMyCountry, sort, festiva]);

  const activeFilterCount =
    (onlyFavorites ? 1 : 0) + (onlyReminders ? 1 : 0) + (onlyMyCountry ? 1 : 0) + (sort !== 'soonest' ? 1 : 0);

  const myCountryName =
    festiva.countries.find((c) => c.code === festiva.profile.countryCode)?.name ?? 'your country';

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.titleRow}>
          <Text variant="headlineLg" color={colors.indigo} style={styles.title}>
            Discover
          </Text>
          <IconButton
            icon="favorite-border"
            label="Your favourites"
            chip
            onPress={() => router.push('/favorites')}
          />
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <MaterialIcons name="search" size={20} color={colors.textTertiary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search festivals, countries, categories"
              placeholderTextColor={colors.textTertiary}
              style={styles.searchInput}
              autoCapitalize="none"
              accessibilityLabel="Search festivals"
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
                <MaterialIcons name="close" size={18} color={colors.textTertiary} />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            onPress={() => {
              haptics.tap();
              setFiltersOpen(true);
            }}
            style={styles.filterButton}
            accessibilityRole="button"
            accessibilityLabel="Filters and sorting"
          >
            <MaterialIcons name="tune" size={20} color={colors.indigo} />
            {activeFilterCount > 0 ? (
              <View style={styles.filterBadge}>
                <Text variant="labelSm" color={colors.white} style={styles.filterBadgeText}>
                  {activeFilterCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Category browse — hidden once the user starts narrowing down */}
        {!searching ? (
          <View style={styles.section}>
            <Text variant="headlineSm" color={colors.indigo} style={styles.sectionTitle}>
              Browse by category
            </Text>
            <View style={styles.grid}>
              {CATEGORIES.map((key, i) => (
                <Animated.View key={key} entering={enterAt(i)} style={styles.gridCell}>
                  <Pressable
                    onPress={() => {
                      haptics.select();
                      setActiveCategory(key);
                    }}
                    style={[styles.categoryCard, { borderColor: `${categoryColor[key]}55` }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Browse ${CATEGORY_META[key].label} festivals`}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: `${categoryColor[key]}1A` }]}>
                      <MaterialIcons name={CATEGORY_META[key].icon} size={24} color={categoryColor[key]} />
                    </View>
                    <Text variant="label" color={colors.indigo} style={styles.categoryLabel}>
                      {CATEGORY_META[key].label}
                    </Text>
                    <Text variant="labelSm">
                      {festiva.upcomingFestivals().filter((f) => f.category === key).length} upcoming
                    </Text>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Active filter chip */}
        {activeCategory ? (
          <View style={styles.activeChipRow}>
            <Pressable
              onPress={() => setActiveCategory(null)}
              style={styles.activeChip}
              accessibilityRole="button"
              accessibilityLabel={`Clear ${activeCategory} filter`}
            >
              <CategoryPill category={activeCategory} />
              <MaterialIcons name="close" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        ) : null}

        {/* Results */}
        <View style={styles.section}>
          <Text variant="headlineSm" color={colors.indigo} style={styles.sectionTitle}>
            {searching ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'Upcoming worldwide'}
          </Text>

          {results.length === 0 ? (
            <EmptyState
              icon="search-off"
              title="Nothing found"
              message={
                query
                  ? `No festivals match "${query}". Try a country, a category, or a different spelling.`
                  : 'No festivals match these filters. Try clearing a few.'
              }
            >
              <Button
                label="Clear search and filters"
                variant="secondary"
                onPress={() => {
                  setQuery('');
                  setActiveCategory(null);
                  setOnlyFavorites(false);
                  setOnlyReminders(false);
                  setOnlyMyCountry(false);
                }}
              />
            </EmptyState>
          ) : (
            <View style={styles.results}>
              {results.map((festival, i) => (
                <Animated.View
                  key={festival.id}
                  entering={enterAt(Math.min(i, 8))}
                  exiting={FadeOut.duration(180)}
                  layout={LinearTransition.springify().damping(18)}
                >
                  <ResultRow
                    onPress={() => router.push(`/festival/${festival.id}`)}
                    name={festival.name}
                    date={formatFestivalDate(festival.date)}
                    region={festival.region}
                    category={festival.category}
                    days={festiva.daysFor(festival.date)}
                    favorite={festiva.isFavorite(festival.id)}
                    hasReminder={!!festiva.reminderFor(festival.id)}
                    onToggleFavorite={() => festiva.toggleFavorite(festival.id)}
                  />
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <BottomSheet visible={filtersOpen} title="Sort & filter" onClose={() => setFiltersOpen(false)}>
        <Text variant="labelSm" style={styles.sheetLabel}>
          SORT BY
        </Text>
        {(
          [
            { key: 'soonest' as const, label: 'Soonest first' },
            { key: 'name' as const, label: 'Name (A–Z)' },
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
          label="Only my favourites"
          icon="favorite"
          value={onlyFavorites}
          onChange={setOnlyFavorites}
        />
        <ToggleRow
          label="Only with reminders"
          icon="notifications-active"
          value={onlyReminders}
          onChange={setOnlyReminders}
        />
        <ToggleRow
          label={`Only observed in ${myCountryName}`}
          description="Hides festivals that aren't marked as celebrated in your country."
          icon="public"
          value={onlyMyCountry}
          onChange={setOnlyMyCountry}
        />

        <View style={styles.sheetActions}>
          <Button label="Show results" hero onPress={() => setFiltersOpen(false)} />
          <Button
            label="Reset"
            variant="tertiary"
            onPress={() => {
              setSort('soonest');
              setOnlyFavorites(false);
              setOnlyReminders(false);
              setOnlyMyCountry(false);
            }}
          />
        </View>
      </BottomSheet>
    </View>
  );
}

function ResultRow({
  name,
  date,
  region,
  category,
  days,
  favorite,
  hasReminder,
  onPress,
  onToggleFavorite,
}: {
  name: string;
  date: string;
  region: string;
  category: CategoryKey;
  days: number;
  favorite: boolean;
  hasReminder: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const categoryColor = useCategoryColor();
  return (
    <Card onPress={onPress}>
      <View style={styles.rowInner}>
        <View style={[styles.rowAccent, { backgroundColor: categoryColor[category] }]} />
        <View style={styles.rowBody}>
          <Text variant="body" color={colors.indigo} numberOfLines={2} style={styles.rowName}>
            {name}
          </Text>
          <View style={styles.rowMeta}>
            <Text variant="labelSm">{date}</Text>
            <Text variant="labelSm">·</Text>
            <Text variant="labelSm" numberOfLines={1} style={styles.rowRegion}>
              {region}
            </Text>
          </View>
          <View style={styles.rowPills}>
            <CategoryPill category={category} />
            {hasReminder ? (
              <View style={styles.reminderTag}>
                <MaterialIcons name="notifications-active" size={12} color={colors.success} />
                <Text variant="labelSm" color={colors.success}>
                  Reminder
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.rowTrailing}>
          <Text variant="label" color={colors.primary} style={styles.rowDays}>
            {days === 0 ? 'Today' : `${days}d`}
          </Text>
          <IconButton
            icon={favorite ? 'favorite' : 'favorite-border'}
            label={favorite ? `Remove ${name} from favourites` : `Save ${name}`}
            color={favorite ? colors.primary : colors.textTertiary}
            size={20}
            onPress={onToggleFavorite}
          />
        </View>
      </View>
    </Card>
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
    gap: spacing.lg,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1 },
  searchRow: { flexDirection: 'row', gap: spacing.md },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.indigo },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { fontSize: 10, lineHeight: 13 },

  content: { paddingHorizontal: spacing.screenX, paddingTop: spacing.xl },
  section: { marginBottom: spacing.section },
  sectionTitle: { marginBottom: spacing.md },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridCell: { width: '47.5%', flexGrow: 1 },
  categoryCard: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
  },
  categoryIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { fontWeight: '600' },

  activeChipRow: { flexDirection: 'row', marginBottom: spacing.lg },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.md,
    paddingLeft: 4,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  results: { gap: spacing.md },
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowAccent: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  rowBody: { flex: 1, gap: 4 },
  rowName: { fontWeight: '600' },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rowRegion: { flex: 1 },
  rowPills: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2, flexWrap: 'wrap' },
  reminderTag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rowTrailing: { alignItems: 'center', gap: 2 },
  rowDays: { fontWeight: '700' },

  sheetLabel: { fontWeight: '700', marginBottom: spacing.sm },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48 },
  sheetRowLabel: { flex: 1 },
  sheetDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.lg },
  sheetActions: { marginTop: spacing.xl, gap: spacing.xs },
});
