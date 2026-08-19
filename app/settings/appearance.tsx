import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Card, Text, haptics } from '../../src/components';
import { SettingsScreen, SettingsSection } from '../../src/components/SettingsScreen';
import {
  darkPalette,
  lightPalette,
  radii,
  spacing,
  useTheme,
  useThemedStyles,
  type Palette,
  type ThemeMode,
} from '../../src/theme';

const MODES: {
  value: ThemeMode;
  label: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
}[] = [
  {
    value: 'system',
    label: 'Match device',
    description: 'Follows your iOS appearance setting.',
    icon: 'brightness-auto',
  },
  { value: 'light', label: 'Light', description: 'Warm and bright, all day.', icon: 'light-mode' },
  { value: 'dark', label: 'Dark', description: 'Easier on the eyes at night.', icon: 'dark-mode' },
];

export default function Appearance() {
  const styles = useThemedStyles(makeStyles);
  const { colors, mode, setMode, scheme } = useTheme();

  return (
    <SettingsScreen title="Appearance">
      <SettingsSection title="THEME">
        {/* Previews are painted from the real palettes, so what you see here is
            literally what the app switches to. */}
        <View style={styles.previews}>
          <Preview label="Light" palette={lightPalette} active={scheme === 'light'} />
          <Preview label="Dark" palette={darkPalette} active={scheme === 'dark'} />
        </View>

        <Card large padded={false}>
          {MODES.map((option, i) => {
            const active = option.value === mode;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  haptics.select();
                  setMode(option.value);
                }}
                style={[styles.row, i < MODES.length - 1 && styles.rowDivider]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <MaterialIcons name={option.icon} size={22} color={colors.primary} />
                <View style={styles.rowText}>
                  <Text variant="body" color={colors.indigo}>
                    {option.label}
                  </Text>
                  <Text variant="labelSm">{option.description}</Text>
                </View>
                <MaterialIcons
                  name={active ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={22}
                  color={active ? colors.primary : colors.border}
                />
              </Pressable>
            );
          })}
        </Card>
      </SettingsSection>

      {mode === 'system' ? (
        <Animated.View entering={FadeIn.duration(240)}>
          <Card style={styles.note}>
            <MaterialIcons name="phone-iphone" size={20} color={colors.info} />
            <Text variant="bodyMuted" style={styles.noteText}>
              Showing the {scheme} theme, following your device. Change it in iOS Settings › Display
              &amp; Brightness, or pick one above to override.
            </Text>
          </Card>
        </Animated.View>
      ) : null}
    </SettingsScreen>
  );
}

/** Miniature of the app's own layout, painted in the palette it represents. */
function Preview({ label, palette, active }: { label: string; palette: Palette; active: boolean }) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();

  return (
    <View style={styles.previewWrap}>
      <View
        style={[
          styles.preview,
          {
            backgroundColor: palette.background,
            borderColor: active ? colors.primary : palette.border,
          },
        ]}
      >
        <View style={[styles.previewBar, { backgroundColor: palette.primary }]} />
        <View
          style={[styles.previewCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
        />
        <View
          style={[styles.previewCard, { backgroundColor: palette.surface, borderColor: palette.border }]}
        />
        <View style={[styles.previewLine, { backgroundColor: palette.textTertiary }]} />
      </View>

      <View style={styles.previewLabelRow}>
        {active ? <MaterialIcons name="check-circle" size={14} color={colors.primary} /> : null}
        <Text
          variant="labelSm"
          color={active ? colors.primary : colors.textTertiary}
          style={styles.previewLabel}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    previews: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
    previewWrap: { flex: 1, gap: spacing.sm, alignItems: 'center' },
    preview: {
      width: '100%',
      height: 130,
      borderRadius: radii.md,
      borderWidth: 2,
      padding: spacing.sm,
      gap: spacing.sm,
    },
    previewBar: { height: 26, borderRadius: radii.xs },
    previewCard: { height: 28, borderRadius: radii.xs, borderWidth: 1 },
    previewLine: { height: 6, width: '60%', borderRadius: 3, opacity: 0.6 },
    previewLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    previewLabel: { fontWeight: '700' },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      minHeight: 64,
    },
    rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    rowText: { flex: 1, gap: 1 },

    note: {
      flexDirection: 'row',
      gap: spacing.md,
      backgroundColor: colors.infoLight,
      borderColor: `${colors.info}44`,
    },
    noteText: { flex: 1, lineHeight: 22 },
  });
