import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { loadThemeMode, saveThemeMode } from '../store/persistence';
import {
  darkCategoryColor,
  darkPalette,
  lightCategoryColor,
  lightPalette,
  type CategoryColors,
  type Palette,
} from './colors';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeValue {
  /** What the user chose. */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** What that resolves to right now, after consulting the OS. */
  scheme: 'light' | 'dark';
  isDark: boolean;
  colors: Palette;
  categoryColor: CategoryColors;
}

const ThemeContext = createContext<ThemeValue | null>(null);

const isMode = (v: string | null): v is ThemeMode =>
  v === 'system' || v === 'light' || v === 'dark';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  // Restore the user's choice. Until this resolves the app follows the OS,
  // which is the same thing 'system' does — so there's no flash to design around.
  useEffect(() => {
    let cancelled = false;
    void loadThemeMode().then((stored) => {
      if (!cancelled && isMode(stored)) setModeState(stored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void saveThemeMode(next);
  }, []);

  const value = useMemo<ThemeValue>(() => {
    // 'system' defers to the OS; an explicit choice always wins.
    const scheme: 'light' | 'dark' = mode === 'system' ? (systemScheme ?? 'light') : mode;
    const isDark = scheme === 'dark';

    return {
      mode,
      setMode,
      scheme,
      isDark,
      colors: isDark ? darkPalette : lightPalette,
      categoryColor: isDark ? darkCategoryColor : lightCategoryColor,
    };
  }, [mode, setMode, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

/**
 * Turns a module-scope StyleSheet into one that follows the active palette.
 *
 * `StyleSheet.create` runs once at import time, so any block that bakes in a
 * colour is frozen to whichever theme was active at load. Declaring the block
 * as `makeStyles(colors)` and resolving it here re-creates it whenever the
 * palette changes — which is what actually makes the toggle work.
 *
 *   const makeStyles = (c: Palette) => StyleSheet.create({
 *     card: { backgroundColor: c.surface },
 *   });
 *
 *   function Card() {
 *     const styles = useThemedStyles(makeStyles);
 *   }
 *
 * Pass a module-scope factory (a stable reference) so the memo actually holds.
 */
export function useThemedStyles<T>(factory: (colors: Palette) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [factory, colors]);
}

/** Same idea for components that need category colours in their styles. */
export function useCategoryColor(): CategoryColors {
  return useTheme().categoryColor;
}
