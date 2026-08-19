/**
 * Date helpers.
 *
 * Everything is computed against local midnight so "days until" never drifts by
 * one because of a timezone offset — a real risk for a product whose whole job
 * is counting down to dates across the world.
 */

const MS_PER_DAY = 86_400_000;

function atLocalMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Whole days from today until `iso`. Negative once it has passed. */
export function daysUntil(iso: string, from: Date = new Date()): number {
  const target = atLocalMidnight(parseISODate(iso));
  const today = atLocalMidnight(from);
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
}

/** Hours remaining within the final day, for the Home hero countdown. */
export function hoursUntil(iso: string, from: Date = new Date()): number {
  const target = atLocalMidnight(parseISODate(iso));
  const diffMs = target.getTime() - from.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor((diffMs % MS_PER_DAY) / 3_600_000);
}

/**
 * For annually recurring events, roll the stored date forward to its next
 * occurrence so a birthday in the past still counts down correctly.
 */
export function nextOccurrence(iso: string, recursAnnually: boolean, from: Date = new Date()): string {
  if (!recursAnnually) return iso;

  const stored = parseISODate(iso);
  const today = atLocalMidnight(from);
  const candidate = new Date(today.getFullYear(), stored.getMonth(), stored.getDate());
  if (candidate.getTime() < today.getTime()) candidate.setFullYear(today.getFullYear() + 1);

  return toISO(candidate);
}

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Locale-aware so date order follows the user's region rather than assuming a
 * single format — a requirement for a global product.
 */
export function formatFestivalDate(iso: string, locale?: string): string {
  return parseISODate(iso).toLocaleDateString(locale, { month: 'long', day: 'numeric' });
}

export function formatFullDate(iso: string, locale?: string): string {
  return parseISODate(iso).toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** "09:00" -> "9:00 AM" */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function greetingForHour(hour: number = new Date().getHours()): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * "2 hours ago" / "Yesterday" for the reminder inbox.
 *
 * Notification timestamps are stored as ISO strings and formatted at render
 * time, so a row that said "2 hours ago" yesterday doesn't still say it today.
 */
export function formatRelativeTime(iso: string, from: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return '';

  const seconds = Math.floor((from.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return 'Just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
