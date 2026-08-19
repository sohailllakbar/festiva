import { applyQuietHours, computeFireDate, notificationBody } from './schedule';
import type { Reminder, ReminderPreferences } from '../types';

/**
 * Scheduling tests.
 *
 * No test runner: `npm run test:schedule` transpiles this and runs it under
 * node. The logic it covers is the kind that fails silently — a reminder that
 * simply never arrives — so it's worth checking without waiting for a
 * framework decision.
 *
 * A fixed `NOW` keeps every case deterministic; "days until" maths that only
 * passes on the day you wrote it is worse than no test.
 */

const NOW = new Date(2026, 7, 18, 10, 0, 0); // 18 Aug 2026, 10:00 local

const prefs: ReminderPreferences = {
  notificationsEnabled: true,
  festivalReminders: true,
  eventReminders: true,
  defaultOffset: 7,
  defaultTime: '09:00',
  quietHoursEnabled: false,
  quietFrom: '22:00',
  quietTo: '07:00',
};
const quiet: ReminderPreferences = { ...prefs, quietHoursEnabled: true };

const remind = (offset: Reminder['offset'], time: string, customDays?: number): Reminder => ({
  offset,
  time,
  customDays,
  enabled: true,
});

let passed = 0;
let failed = 0;

const show = (d: Date | null) => (d ? d.toLocaleString('sv-SE') : 'null');

function check(name: string, got: string, want: string) {
  if (got === want) {
    passed++;
    console.log('  ok   ' + name);
  } else {
    failed++;
    console.log(`  FAIL ${name}\n         got ${got}\n         want ${want}`);
  }
}

// ---------- lead times ----------

check(
  'schedules 7 days before, at the chosen time',
  show(computeFireDate('2026-09-20', remind(7, '09:00'), prefs, NOW)),
  '2026-09-13 09:00:00',
);

check(
  'offset 0 fires on the day itself',
  show(computeFireDate('2026-09-20', remind(0, '08:30'), prefs, NOW)),
  '2026-09-20 08:30:00',
);

check(
  'custom offsets count back correctly',
  show(computeFireDate('2026-12-25', remind('custom', '09:00', 45), prefs, NOW)),
  '2026-11-10 09:00:00',
);

// ---------- unsatisfiable lead times ----------

check(
  'a 7-day lead on an occasion 3 days out falls back to the day itself',
  show(computeFireDate('2026-08-21', remind(7, '09:00'), prefs, NOW)),
  '2026-08-21 09:00:00',
);

check(
  'an occasion already past schedules nothing',
  show(computeFireDate('2026-08-01', remind(7, '09:00'), prefs, NOW)),
  'null',
);

check(
  "today, but the chosen time has passed, schedules nothing",
  show(computeFireDate('2026-08-18', remind(0, '09:00'), prefs, NOW)),
  'null',
);

check(
  'today with the time still ahead still fires',
  show(computeFireDate('2026-08-18', remind(0, '18:00'), prefs, NOW)),
  '2026-08-18 18:00:00',
);

// ---------- quiet hours (22:00 -> 07:00, wrapping midnight) ----------

check(
  'a late-evening reminder is held until the next morning',
  show(applyQuietHours(new Date(2026, 8, 13, 23, 0), quiet)),
  '2026-09-14 07:00:00',
);

check(
  'a small-hours reminder is held until later the same morning',
  show(applyQuietHours(new Date(2026, 8, 13, 3, 0), quiet)),
  '2026-09-13 07:00:00',
);

check(
  'a daytime reminder is left alone',
  show(applyQuietHours(new Date(2026, 8, 13, 9, 0), quiet)),
  '2026-09-13 09:00:00',
);

check(
  'the end of the window is outside it',
  show(applyQuietHours(new Date(2026, 8, 13, 7, 0), quiet)),
  '2026-09-13 07:00:00',
);

check(
  'quiet hours apply through the full scheduling path',
  show(computeFireDate('2026-09-20', remind(7, '23:30'), quiet, NOW)),
  '2026-09-14 07:00:00',
);

check(
  'a window that does not wrap midnight still holds',
  show(applyQuietHours(new Date(2026, 8, 13, 3, 0), { ...quiet, quietFrom: '01:00', quietTo: '06:00' })),
  '2026-09-13 06:00:00',
);

// ---------- the copy the user actually reads ----------

check('body counts the days', notificationBody('Diwali', '2026-08-26', NOW), '8 days until Diwali.');
check('body says tomorrow', notificationBody('Diwali', '2026-08-19', NOW), 'Diwali is tomorrow.');
check('body says today', notificationBody('Diwali', '2026-08-18', NOW), 'Diwali is today.');

console.log(`\n  ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
