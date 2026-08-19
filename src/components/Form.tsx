import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

import { Text } from './Text';
import { Button } from './Button';
import { haptics, PressableScale } from './motion';
import { hitTarget, radii, shadows, spacing, useTheme, useThemedStyles, type Palette } from '../theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

/**
 * Form kit.
 *
 * Labels are always visible (never disappearing placeholders) and every field
 * is at least 56pt tall — both are accessibility requirements for the older
 * users this app serves.
 */

// ---------- text ----------

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType,
  secure,
  multiline,
  autoCapitalize = 'sentences',
  error,
  helper,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  icon?: IconName;
  keyboardType?: KeyboardTypeOptions;
  secure?: boolean;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  error?: string;
  helper?: string;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secure);

  return (
    <View style={styles.fieldWrap}>
      <Text variant="labelSm" style={styles.fieldLabel}>
        {label}
      </Text>

      <View
        style={[
          styles.field,
          multiline && styles.fieldMultiline,
          focused && styles.fieldFocused,
          !!error && styles.fieldError,
        ]}
      >
        {icon ? <MaterialIcons name={icon} size={20} color={colors.textTertiary} /> : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          keyboardType={keyboardType}
          secureTextEntry={hidden}
          multiline={multiline}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, multiline && styles.inputMultiline]}
          accessibilityLabel={label}
        />

        {secure ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <MaterialIcons
              name={hidden ? 'visibility-off' : 'visibility'}
              size={20}
              color={colors.textTertiary}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <View style={styles.helperRow}>
          <MaterialIcons name="error-outline" size={14} color={colors.danger} />
          <Text variant="labelSm" color={colors.danger}>
            {error}
          </Text>
        </View>
      ) : helper ? (
        <Text variant="labelSm" style={styles.helper}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

// ---------- select ----------

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
}

/** Tap opens a native-feeling bottom sheet rather than an inline dropdown. */
export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
  icon,
}: {
  label: string;
  value?: T;
  options: readonly SelectOption<T>[];
  onChange: (v: T) => void;
  placeholder?: string;
  icon?: IconName;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.fieldWrap}>
      <Text variant="labelSm" style={styles.fieldLabel}>
        {label}
      </Text>

      <Pressable
        onPress={() => {
          haptics.tap();
          setOpen(true);
        }}
        style={styles.field}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
      >
        {icon ? <MaterialIcons name={icon} size={20} color={colors.textTertiary} /> : null}
        <Text
          variant="body"
          color={selected ? colors.textPrimary : colors.textTertiary}
          style={styles.selectValue}
        >
          {selected?.label ?? placeholder}
        </Text>
        <MaterialIcons name="expand-more" size={22} color={colors.textTertiary} />
      </Pressable>

      <BottomSheet visible={open} title={label} onClose={() => setOpen(false)}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => {
                haptics.select();
                onChange(opt.value);
                setOpen(false);
              }}
              style={({ pressed }) => [styles.sheetRow, pressed && styles.sheetRowPressed]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              {opt.icon ? (
                <MaterialIcons name={opt.icon} size={22} color={colors.primary} />
              ) : null}
              <Text variant="body" style={styles.sheetLabel}>
                {opt.label}
              </Text>
              {active ? <MaterialIcons name="check" size={22} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </BottomSheet>
    </View>
  );
}

// ---------- date & time ----------

export function DateTimeField({
  label,
  value,
  onChange,
  mode = 'date',
  icon,
}: {
  label: string;
  value: Date;
  onChange: (d: Date) => void;
  mode?: 'date' | 'time';
  icon?: IconName;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const display =
    mode === 'date'
      ? value.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
      : value.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.fieldWrap}>
      <Text variant="labelSm" style={styles.fieldLabel}>
        {label}
      </Text>

      <Pressable
        onPress={() => {
          haptics.tap();
          setOpen(true);
        }}
        style={styles.field}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${display}`}
      >
        <MaterialIcons
          name={icon ?? (mode === 'date' ? 'event' : 'schedule')}
          size={20}
          color={colors.textTertiary}
        />
        <Text variant="body" style={styles.selectValue}>
          {display}
        </Text>
        <MaterialIcons name="expand-more" size={22} color={colors.textTertiary} />
      </Pressable>

      <BottomSheet visible={open} title={label} onClose={() => setOpen(false)}>
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={value}
            mode={mode}
            display="spinner"
            onChange={(_, picked) => picked && onChange(picked)}
          />
        </View>
        <Button label="Done" block onPress={() => setOpen(false)} />
      </BottomSheet>
    </View>
  );
}

// ---------- toggle ----------

export function ToggleRow({
  label,
  description,
  value,
  onChange,
  icon,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon?: IconName;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.toggleRow}>
      {icon ? <MaterialIcons name={icon} size={22} color={colors.primary} /> : null}
      <View style={styles.toggleText}>
        <Text variant="body">{label}</Text>
        {description ? (
          <Text variant="labelSm" style={styles.toggleDesc}>
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          haptics.select();
          onChange(v);
        }}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor={colors.white}
        accessibilityLabel={label}
      />
    </View>
  );
}

// ---------- stepper ----------

export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const step = (delta: number) => {
    const next = Math.min(Math.max(value + delta, min), max);
    if (next !== value) {
      haptics.select();
      onChange(next);
    }
  };

  return (
    <View style={styles.stepperRow}>
      <Text variant="body" style={styles.stepperLabel}>
        {label}
      </Text>
      <View style={styles.stepperControls}>
        <Pressable
          onPress={() => step(-1)}
          style={styles.stepperButton}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
        >
          <MaterialIcons name="remove" size={20} color={colors.primary} />
        </Pressable>
        <Text variant="body" style={styles.stepperValue}>
          {value}
          {suffix ? ` ${suffix}` : ''}
        </Text>
        <Pressable
          onPress={() => step(1)}
          style={styles.stepperButton}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
        >
          <MaterialIcons name="add" size={20} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

// ---------- chip input ----------

/** Free-text items entered one at a time, rendered as removable chips. */
export function ChipInput({
  label,
  items,
  onChange,
  placeholder = 'Add an item',
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const [draft, setDraft] = useState('');

  const add = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    haptics.tap();
    onChange([...items, trimmed]);
    setDraft('');
  };

  return (
    <View style={styles.fieldWrap}>
      <Text variant="labelSm" style={styles.fieldLabel}>
        {label}
      </Text>

      {items.length > 0 && (
        <View style={styles.chipWrap}>
          {items.map((item, i) => (
            <Pressable
              key={`${item}-${i}`}
              onPress={() => onChange(items.filter((_, idx) => idx !== i))}
              style={styles.chip}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item}`}
            >
              <Text variant="labelSm" color={colors.primary} style={styles.chipText}>
                {item}
              </Text>
              <MaterialIcons name="close" size={14} color={colors.primary} />
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.field}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          onSubmitEditing={add}
          returnKeyType="done"
          style={styles.input}
          accessibilityLabel={label}
        />
        <Pressable onPress={add} hitSlop={10} accessibilityRole="button" accessibilityLabel="Add item">
          <MaterialIcons name="add-circle" size={24} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

// ---------- selectable cards ----------

/** Big illustrated choice used in onboarding ("What would you like to remember?"). */
export function OptionCard({
  label,
  description,
  icon,
  selected,
  onPress,
}: {
  label: string;
  description?: string;
  icon: IconName;
  selected?: boolean;
  onPress?: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} style={styles.optionPress}>
      <View style={[styles.option, selected && styles.optionSelected]}>
        <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
          <MaterialIcons
            name={icon}
            size={26}
            color={selected ? colors.white : colors.primary}
          />
        </View>
        <View style={styles.optionText}>
          <Text variant="body" style={styles.optionLabel}>
            {label}
          </Text>
          {description ? <Text variant="labelSm">{description}</Text> : null}
        </View>
        <MaterialIcons
          name={selected ? 'check-circle' : 'radio-button-unchecked'}
          size={24}
          color={selected ? colors.primary : colors.border}
        />
      </View>
    </PressableScale>
  );
}

/** Apple / Google sign-in buttons. Presentation only — no auth wired up. */
export function SocialButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: IconName;
  onPress?: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} style={styles.social}>
      <MaterialIcons name={icon} size={20} color={colors.textPrimary} />
      <Text variant="button">{label}</Text>
    </PressableScale>
  );
}

// ---------- bottom sheet ----------

export function BottomSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(180)} style={styles.backdrop}>
        <Pressable style={styles.backdropTap} onPress={onClose} accessibilityLabel="Close" />

        <Animated.View entering={SlideInDown.duration(280).springify().damping(20)} style={styles.sheet}>
          <View style={styles.grabber} />
          <View style={styles.sheetHeader}>
            <Text variant="headlineSm">{title}</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <MaterialIcons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView style={styles.sheetBody} bounces={false}>
            {children}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  fieldWrap: { gap: 6 },
  fieldLabel: { fontWeight: '600', color: colors.textSecondary },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: hitTarget.hero,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
  },
  fieldMultiline: { minHeight: 110, alignItems: 'flex-start', paddingTop: spacing.md },
  fieldFocused: { borderColor: colors.primary, borderWidth: 1.5 },
  fieldError: { borderColor: colors.danger },
  input: { flex: 1, fontSize: 17, color: colors.textPrimary, paddingVertical: spacing.md },
  inputMultiline: { textAlignVertical: 'top', minHeight: 90 },
  selectValue: { flex: 1 },
  helperRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  helper: { paddingHorizontal: 2 },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: hitTarget.hero,
  },
  toggleText: { flex: 1, gap: 2 },
  toggleDesc: { lineHeight: 17 },

  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  stepperLabel: { flex: 1 },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radii.full,
    padding: 4,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { minWidth: 44, textAlign: 'center', fontWeight: '600', fontVariant: ['tabular-nums'] },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    backgroundColor: colors.primaryLight,
    borderRadius: radii.full,
  },
  chipText: { fontWeight: '600' },

  optionPress: { borderRadius: radii.lg },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: { backgroundColor: colors.primary },
  optionText: { flex: 1, gap: 2 },
  optionLabel: { fontWeight: '600' },

  social: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: hitTarget.hero,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
  },

  backdrop: { flex: 1, backgroundColor: 'rgba(11,28,48,0.45)', justifyContent: 'flex-end' },
  backdropTap: { flex: 1 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingBottom: spacing.xxxl,
    maxHeight: '80%',
    ...shadows.ambient,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  sheetBody: { paddingHorizontal: spacing.xl },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: hitTarget.hero,
    paddingVertical: spacing.md,
  },
  sheetRowPressed: { opacity: 0.6 },
  sheetLabel: { flex: 1 },
  pickerWrap: { alignItems: 'center', marginBottom: spacing.lg },
});
