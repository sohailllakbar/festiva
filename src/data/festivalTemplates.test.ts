import { FESTIVAL_TEMPLATES, resolveFestivals } from './festivalTemplates';

let failed = 0;
function check(name: string, pass: boolean, detail = '') {
  if (pass) {
    console.log(`  ok   ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

// Fixed reference point so this test's pass/fail doesn't depend on when it runs.
const from = new Date(2026, 7, 19); // 19 Aug 2026

check('no duplicate template ids', new Set(FESTIVAL_TEMPLATES.map((t) => t.id)).size === FESTIVAL_TEMPLATES.length);

const resolved = resolveFestivals(FESTIVAL_TEMPLATES, from);

check('resolves a substantial catalogue', resolved.length >= 50, `got ${resolved.length}`);
check('no duplicate resolved ids', new Set(resolved.map((f) => f.id)).size === resolved.length);

const allFuture = resolved.every((f) => {
  const [y, m, d] = f.date.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getTime() >= new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
});
check('every resolved date is today or later', allFuture);

const allHaveRequiredFields = resolved.every(
  (f) => f.name && f.description && f.image && f.region && f.countryCodes.length > 0,
);
check('every resolved festival has its required fields', allHaveRequiredFields);

// Table-sourced festivals should degrade gracefully once their years run out
// rather than crash or silently duplicate a stale date.
const farFuture = resolveFestivals(FESTIVAL_TEMPLATES, new Date(2035, 0, 1));
check(
  'a table-sourced festival with no data past its range is simply absent, not stale',
  !farFuture.some((f) => f.id === 'hanukkah'),
);
check(
  'computed festivals (Hijri, Easter, fixed) still resolve far in the future',
  farFuture.some((f) => f.id === 'eid-al-fitr') && farFuture.some((f) => f.id === 'easter-sunday'),
);

console.log(`\n${resolved.length} festivals resolved for ${from.toDateString()}`);

if (failed > 0) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log('all passed');
