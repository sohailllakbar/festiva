import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';

import { Text, enterAt, haptics } from '../../src/components';
import { OnboardingScreen } from '../../src/components/OnboardingScreen';
import { useFestiva } from '../../src/store/FestivaStore';
import { radii, spacing, useThemedStyles, type Palette, useTheme } from '../../src/theme';

/** Each language shows its own endonym — the point is recognising your own. */
export default function SelectLanguage() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { languages, profile, updateProfile } = useFestiva();
  const [selected, setSelected] = useState(profile.language);

  return (
    <OnboardingScreen
      step={3}
      title="Which language do you prefer?"
      subtitle="You can change this any time in Settings."
      onPrimary={() => {
        updateProfile({ language: selected });
        router.push('/onboarding/interests');
      }}
    >
      <View style={styles.list}>
        {languages.map((lang, i) => {
          const active = lang.code === selected;
          return (
            <Animated.View key={lang.code} entering={enterAt(Math.min(i, 8))}>
              <Pressable
                onPress={() => {
                  haptics.select();
                  setSelected(lang.code);
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={[styles.row, active && styles.rowActive]}
              >
                <View style={styles.labels}>
                  <Text variant="body" color={colors.indigo} style={styles.name}>
                    {lang.label}
                  </Text>
                  <Text variant="labelSm">{lang.native}</Text>
                </View>
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
    minHeight: 64,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  rowActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  labels: { flex: 1, gap: 1 },
  name: { fontWeight: '500' },
});
