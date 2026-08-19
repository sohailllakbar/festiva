import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';

import { Text, enterAt, haptics } from '../../src/components';
import { OnboardingScreen } from '../../src/components/OnboardingScreen';
import { useFestiva } from '../../src/store/FestivaStore';
import { radii, spacing, useThemedStyles, type Palette, useTheme } from '../../src/theme';

/** Optional step — some holidays are regional, but plenty of users can skip. */
export default function SelectRegion() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { countries, profile, updateProfile } = useFestiva();
  const [selected, setSelected] = useState(profile.region);

  const country = countries.find((c) => c.code === profile.countryCode);
  const regions = country?.regions ?? [];

  const next = (region?: string) => {
    updateProfile({ region });
    router.push('/onboarding/language');
  };

  return (
    <OnboardingScreen
      step={2}
      title={`Whereabouts in ${country?.name ?? 'your country'}?`}
      subtitle="Some holidays are only observed in certain regions. This is optional."
      onPrimary={() => next(selected)}
      onSkip={() => next(undefined)}
      secondaryLabel="Not now"
      onSecondary={() => next(undefined)}
    >
      <View style={styles.list}>
        {regions.map((region, i) => {
          const active = region === selected;
          return (
            <Animated.View key={region} entering={enterAt(i)}>
              <Pressable
                onPress={() => {
                  haptics.select();
                  setSelected(active ? undefined : region);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={[styles.row, active && styles.rowActive]}
              >
                <MaterialIcons
                  name="location-on"
                  size={20}
                  color={active ? colors.primary : colors.textTertiary}
                />
                <Text variant="body" color={colors.indigo} style={styles.name}>
                  {region}
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
    </OnboardingScreen>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
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
  name: { flex: 1, fontWeight: '500' },
});
