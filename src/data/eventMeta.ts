import { MaterialIcons } from '@expo/vector-icons';
import { useCategoryColor, useTheme, type CategoryKey } from '../theme';
import type { EventCategory } from '../types';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

/**
 * One icon + colour per personal-event category, reused wherever they appear.
 *
 * Colour is stored as a *role* rather than a value, because a hex baked in at
 * module scope freezes to whichever theme loaded first. Most roles borrow a
 * festival category colour so the two systems stay visually related; the two
 * that don't map cleanly carry an explicit light/dark pair instead.
 */
type ColorRole = { category: CategoryKey } | { light: string; dark: string };

export const EVENT_META: Record<
  EventCategory,
  { label: string; icon: IconName; color: ColorRole }
> = {
  birthday: { label: 'Birthday', icon: 'cake', color: { category: 'personal' } },
  anniversary: { label: 'Anniversary', icon: 'favorite', color: { light: '#E11D48', dark: '#FF7A96' } },
  wedding: { label: 'Wedding', icon: 'diversity-3', color: { light: '#9333EA', dark: '#C79BFF' } },
  graduation: { label: 'Graduation', icon: 'school', color: { category: 'international' } },
  family: { label: 'Family event', icon: 'groups', color: { category: 'national' } },
  custom: { label: 'Custom', icon: 'star-outline', color: { category: 'general' } },
};

export const EVENT_CATEGORIES = Object.entries(EVENT_META).map(([value, meta]) => ({
  value: value as EventCategory,
  label: meta.label,
  icon: meta.icon,
}));

/** Resolves every event category's colour against the active theme. */
export function useEventColor(): (category: EventCategory) => string {
  const categoryColor = useCategoryColor();
  const { isDark } = useTheme();

  return (category: EventCategory) => {
    const role = EVENT_META[category].color;
    if ('category' in role) return categoryColor[role.category];
    return isDark ? role.dark : role.light;
  };
}
