import { Share } from 'react-native';
import { daysUntil, formatFullDate } from './dates';

/**
 * Sharing a festival.
 *
 * Personal occasions deliberately have no equivalent — they're private to the
 * account, and offering a share sheet on them would undercut that promise.
 */
export async function shareFestival(name: string, dateISO: string): Promise<void> {
  const days = daysUntil(dateISO);
  const when =
    days === 0
      ? 'today'
      : days === 1
        ? 'tomorrow'
        : days > 0
          ? `in ${days} days`
          : 'earlier this year';

  try {
    await Share.share({
      title: name,
      message: `${name} is ${when} — ${formatFullDate(dateISO)}. Counting down with Festiva.`,
    });
  } catch {
    // The user dismissing the sheet surfaces as a rejection on some platforms;
    // there's nothing to recover from and nothing worth interrupting them over.
  }
}
