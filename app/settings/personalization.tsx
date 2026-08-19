import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import {
  BottomSheet,
  Button,
  CATEGORY_META,
  Card,
  SelectableCard,
  Text,
  haptics,
} from '../../src/components';
import { SettingsScreen, SettingsSection } from '../../src/components/SettingsScreen';
import { useFestiva } from '../../src/store/FestivaStore';
import { radii, spacing, type CategoryKey, useThemedStyles, type Palette, useTheme } from '../../src/theme';

const INTERESTS: CategoryKey[] = [
  'religious',
  'cultural',
  'national',
  'international',
  'seasonal',
  'personal',
];

/**
 * Everything the onboarding flow asked, revisitable. Changes apply immediately
 * rather than needing a save — there's nothing destructive here.
 */
export default function Personalization() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const festiva = useFestiva();
  const { profile, updateProfile, countries, languages } = festiva;

  const [countrySheet, setCountrySheet] = useState(false);
  const [regionSheet, setRegionSheet] = useState(false);
  const [languageSheet, setLanguageSheet] = useState(false);

  const country = countries.find((c) => c.code === profile.countryCode);
  const language = languages.find((l) => l.code === profile.language);

  const toggleInterest = (key: CategoryKey) => {
    haptics.select();
    const next = profile.interests.includes(key)
      ? profile.interests.filter((k) => k !== key)
      : [...profile.interests, key];
    // Keep at least one so the app always has something to show.
    if (next.length === 0) return;
    updateProfile({ interests: next });
  };

  return (
    <SettingsScreen title="Personalization">
      <SettingsSection title="LOCATION" hint="This decides which national holidays and regional festivals you see.">
        <Card large padded={false}>
          <Row
            label="Country"
            value={`${country?.flag ?? ''} ${country?.name ?? 'Not set'}`}
            onPress={() => setCountrySheet(true)}
          />
          {country?.regions?.length ? (
            <Row
              label="Region"
              value={profile.region ?? 'All regions'}
              onPress={() => setRegionSheet(true)}
              isLast
            />
          ) : null}
        </Card>
      </SettingsSection>

      <SettingsSection title="LANGUAGE">
        <Card large padded={false}>
          <Row label="App language" value={language?.native ?? 'English'} onPress={() => setLanguageSheet(true)} isLast />
        </Card>
      </SettingsSection>

      <SettingsSection
        title="INTERESTS"
        hint="Pick at least one. These shape what appears on Home and in Discover."
      >
        <View style={styles.grid}>
          {INTERESTS.map((key) => (
            <View key={key} style={styles.cell}>
              <SelectableCard
                label={CATEGORY_META[key].label}
                icon={CATEGORY_META[key].icon}
                selected={profile.interests.includes(key)}
                onPress={() => toggleInterest(key)}
              />
            </View>
          ))}
        </View>
      </SettingsSection>

      {/* Country */}
      <BottomSheet visible={countrySheet} title="Choose your country" onClose={() => setCountrySheet(false)}>
        {countries.map((c) => (
          <SheetRow
            key={c.code}
            label={`${c.flag}  ${c.name}`}
            active={c.code === profile.countryCode}
            onPress={() => {
              updateProfile({ countryCode: c.code, region: undefined });
              setCountrySheet(false);
            }}
          />
        ))}
      </BottomSheet>

      {/* Region */}
      <BottomSheet visible={regionSheet} title="Choose your region" onClose={() => setRegionSheet(false)}>
        <SheetRow
          label="All regions"
          active={!profile.region}
          onPress={() => {
            updateProfile({ region: undefined });
            setRegionSheet(false);
          }}
        />
        {(country?.regions ?? []).map((r) => (
          <SheetRow
            key={r}
            label={r}
            active={profile.region === r}
            onPress={() => {
              updateProfile({ region: r });
              setRegionSheet(false);
            }}
          />
        ))}
      </BottomSheet>

      {/* Language */}
      <BottomSheet visible={languageSheet} title="Choose your language" onClose={() => setLanguageSheet(false)}>
        {languages.map((l) => (
          <SheetRow
            key={l.code}
            label={`${l.native}  ·  ${l.label}`}
            active={l.code === profile.language}
            onPress={() => {
              updateProfile({ language: l.code });
              setLanguageSheet(false);
            }}
          />
        ))}
      </BottomSheet>
    </SettingsScreen>
  );
}

function Row({
  label,
  value,
  onPress,
  isLast,
}: {
  label: string;
  value: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <Card onPress={onPress} padded={false} borderless style={styles.rowCard}>
      <View style={[styles.row, !isLast && styles.rowDivider]}>
        <Text variant="body" color={colors.indigo} style={styles.rowLabel}>
          {label}
        </Text>
        <Text variant="bodyMuted" numberOfLines={1} style={styles.rowValue}>
          {value}
        </Text>
        <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
      </View>
    </Card>
  );
}

function SheetRow({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        haptics.select();
        onPress();
      }}
      style={styles.sheetRow}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
    >
      <Text variant="body" color={colors.indigo} style={styles.sheetLabel}>
        {label}
      </Text>
      {active ? <MaterialIcons name="check" size={20} color={colors.primary} /> : null}
    </Pressable>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  rowCard: { borderRadius: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, minHeight: 58 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowLabel: { flex: 1 },
  rowValue: { maxWidth: 170, textAlign: 'right' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: { width: '47.5%', flexGrow: 1 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 52 },
  sheetLabel: { flex: 1 },
});
