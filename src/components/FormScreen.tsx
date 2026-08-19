import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Button, IconButton } from './Button';
import { Text } from './Text';
import { spacing, useThemedStyles, type Palette } from '../theme';

/**
 * Shared shell for every add/edit sheet: modal-style header with Cancel,
 * scrollable body, and a pinned Save bar so the primary action never scrolls
 * out of reach.
 */
export function FormScreen({
  title,
  saveLabel = 'Save',
  onSave,
  canSave = true,
  children,
}: {
  title: string;
  saveLabel?: string;
  onSave: () => void;
  canSave?: boolean;
  children: React.ReactNode;
}) {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <IconButton icon="close" label="Cancel" onPress={() => router.back()} />
        <Text variant="body" style={styles.title}>
          {title}
        </Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: spacing.xxxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button label={saveLabel} block disabled={!canSave} haptic="success" onPress={onSave} />
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { flex: 1, textAlign: 'center', fontWeight: '600' },
  spacer: { width: 44 },
  body: { paddingHorizontal: spacing.screenX, paddingTop: spacing.xl, gap: spacing.lg },
  footer: {
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
