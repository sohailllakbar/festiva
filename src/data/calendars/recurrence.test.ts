import { resolveForYear, type Recurrence } from './recurrence';

let failed = 0;
function check(name: string, pass: boolean, detail = '') {
  if (pass) {
    console.log(`  ok   ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

// ---------- fixed ----------
check('fixed rolls to the right year', resolveForYear({ kind: 'fixed', month: 12, day: 25 }, 2026) === '2026-12-25');

// ---------- nthWeekday: verified against JS Date, not memory ----------
// "Nth weekday" is self-checkable: the result must actually fall on that
// weekday, and must be the Nth such occurrence counting from day 1.
function verifyNth(year: number, month: number, weekday: number, n: number) {
  const dateStr = resolveForYear({ kind: 'nthWeekday', month, weekday, n }, year);
  if (!dateStr) return { ok: false, detail: 'no result' };
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getDay() !== weekday) return { ok: false, detail: `${dateStr} is weekday ${date.getDay()}, expected ${weekday}` };

  if (n > 0) {
    const occurrence = Math.floor((d - 1) / 7) + 1;
    return { ok: occurrence === n, detail: `${dateStr} is occurrence ${occurrence}, expected ${n}` };
  }
  // n === -1: no later date in the same month can share this weekday.
  const nextWeek = new Date(y, m - 1, d + 7);
  return { ok: nextWeek.getMonth() !== m - 1, detail: `${dateStr} is not the last ${weekday} in month ${m}` };
}

for (const year of [2026, 2027, 2028, 2030]) {
  check(`US Thanksgiving ${year} (4th Thursday of November) lands on a Thursday`, verifyNth(year, 11, 4, 4).ok, verifyNth(year, 11, 4, 4).detail);
  check(`US Labor Day ${year} (1st Monday of September) lands on a Monday`, verifyNth(year, 9, 1, 1).ok, verifyNth(year, 9, 1, 1).detail);
  check(`Last Monday of May ${year} lands on the last Monday`, verifyNth(year, 5, 1, -1).ok, verifyNth(year, 5, 1, -1).detail);
}

// Independently known fact used as a spot check: Thanksgiving 2026 is
// Thursday 26 November.
check(
  'US Thanksgiving 2026 is November 26',
  resolveForYear({ kind: 'nthWeekday', month: 11, weekday: 4, n: 4 }, 2026) === '2026-11-26',
);

// ---------- table ----------
const table: Recurrence = { kind: 'table', dates: { 2026: '2026-09-11', 2027: '2027-10-01' } };
check('table returns the stored year', resolveForYear(table, 2026) === '2026-09-11');
check('table returns null for a year with no data', resolveForYear(table, 2031) === null);

if (failed > 0) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall passed');
