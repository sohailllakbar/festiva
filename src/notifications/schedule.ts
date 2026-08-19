import { parseISODate } from '../data/dates';
import type { Reminder, ReminderPreferences } from '../types';

/**
 * When a reminder should fire.
 *
 * Kept free of `expo-notifications` on purpose: this is the part that can be
 * wrong in ways nobody notices until a reminder doesn't arrive, so it stays
 * pure and testable rather than tangled up with the platform API.
 */

export function offsetDays(reminder: Reminder): number {
  if (reminder.offset === 'custom') return reminder.customDays ?? 0;
  return reminder.offset;
}

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Quiet hours push a reminder forward to the moment they end, rather than
 * dropping it — the setting is "don't wake me", not "don't tell me".
 *
 * The window usually wraps midnight (22:00 → 07:00), so "inside" means *after*
 * the start or *before* the end, not between them.
 */
export function applyQuietHours(fireAt: Date, prefs: ReminderPreferences): Date {
  if (!prefs.quietHoursEnabled) return fireAt;

  const from = minutesOf(prefs.quietFrom);
  const to = minutesOf(prefs.quietTo);
  const at = fireAt.getHours() * 60 + fireAt.getMinutes();

  const wraps = from > to;
  const inside = wraps ? at >= from || at < to : at >= from && at < to;
  if (!inside) return fireAt;

  const out = new Date(fireAt);
  const [h, m] = prefs.quietTo.split(':').map(Number);
  // Landing after the window opened means quiet hours end tomorrow morning;
  // landing before it closed means we're already in that morning.
  if (wraps && at >= from) out.setDate(out.getDate() + 1);
  out.setHours(h || 0, m || 0, 0, 0);
  return out;
}

/**
 * The moment to fire, or null if there's nothing left to schedule.
 *
 * The chosen offset can be unsatisfiable — asking for "1 week before" on a
 * birthday that's three days away describes a moment already past. Rather than
 * silently scheduling nothing while the UI says "Reminder set", it falls back
 * to the morning of the occasion itself at the user's chosen time. Their intent
 * was to be reminded; only the lead time is impossible.
 */
export function computeFireDate(
  occasionISO: string,
  reminder: Reminder,
  prefs: ReminderPreferences,
  now: Date = new Date(),
): Date | null {
  const [h, m] = reminder.time.split(':').map(Number);

  const at = (daysBefore: number): Date => {
    const d = parseISODate(occasionISO);
    d.setDate(d.getDate() - daysBefore);
    d.setHours(h || 9, m || 0, 0, 0);
    return applyQuietHours(d, prefs);
  };

  const preferred = at(offsetDays(reminder));
  if (preferred.getTime() > now.getTime()) return preferred;

  // Lead time has passed; try the day itself before giving up.
  const dayOf = at(0);
  return dayOf.getTime() > now.getTime() ? dayOf : null;
}

function daysBetween(iso: string, from: Date): number {
  const target = parseISODate(iso);
  const a = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const b = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  return Math.round((a - b) / 86_400_000);
}

/** The line the user actually reads on the lock screen. */
export function notificationBody(name: string, dateISO: string, from: Date = new Date()): string {
  const days = daysBetween(dateISO, from);
  if (days <= 0) return `${name} is today.`;
  if (days === 1) return `${name} is tomorrow.`;
  return `${days} days until ${name}.`;
}
