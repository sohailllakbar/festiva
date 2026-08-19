import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';

import { Card, Text, TextField, enterAt, haptics } from '../../src/components';
import { OnboardingScreen } from '../../src/components/OnboardingScreen';
import { useFestiva } from '../../src/store/FestivaStore';
import { radii, spacing, useThemedStyles, type Palette, useTheme } from '../../src/theme';

/**
 * Country drives which festivals are surfaced, so it's the first thing asked.
 * Search matters here — the real list is ~195 entries.
 */
export default function SelectCountry() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { countries, profile, updateProfile } = useFestiva();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(profile.countryCode);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q);
  }, [countries, query]);

  const chosen = countries.find((c) => c.code === selected);

  const next = () => {
    updateProfile({ countryCode: selected, region: undefined });
    // Only ask for a region when the country actually has them.
    router.push(chosen?.regions?.length ? '/onboarding/region' : '/onboarding/language');
  };

  return (
    <OnboardingScreen
      step={1}
      title="Where are you celebrating?"
      subtitle="We'll show the festivals and holidays that matter where you are."
      onPrimary={next}
      primaryDisabled={!selected}
    >
      <View style={styles.search}>
        <TextField
          label="Search"
          value={query}
          onChangeText={setQuery}
          placeholder="Search countries or regions"
          icon="search"
          autoCapitalize="none"
        />
      </View>

      {results.length === 0 ? (
        <Card style={styles.noResults}>
          <MaterialIcons name="search-off" size={22} color={colors.textTertiary} />
          <Text variant="bodyMuted" style={styles.noResultsText}>
            No countries match "{query}". Try a different spelling.
          </Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {results.map((country, i) => {
            const active = country.code === selected;
            return (
              <Animated.View key={country.code} entering={enterAt(Math.min(i, 8))}>
                <Pressable
                  onPress={() => {
                    haptics.select();
                    setSelected(country.code);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={[styles.row, active && styles.rowActive]}
                >
                  <Text style={styles.flag}>{country.flag}</Text>
                  <Text variant="body" color={colors.indigo} style={styles.name}>
                    {country.name}
                  </Text>
                  <MaterialIcons
                    name={active ? 'radio-button-checked' : 'radio-button-unchecked'}
                    size={22}
                    color={active ? colors.primary : colors.border}
                  />
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      )}
    </OnboardingScreen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  search: { marginBottom: spacing.lg },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 60,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  rowActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  flag: { fontSize: 26 },
  name: { flex: 1, fontWeight: '500' },
  noResults: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  noResultsText: { flex: 1 },
});
