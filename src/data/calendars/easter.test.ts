import { gregorianEaster, orthodoxEaster } from './easter';

let failed = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  ok   ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name} — got ${a}, expected ${e}`);
  }
}

// Reference dates published by Chabad/Wikipedia/qppstudio and cross-checked
// across independent sources, Aug 2026.
check('Western Easter 2026', gregorianEaster(2026), { month: 4, day: 5 });
check('Western Easter 2027', gregorianEaster(2027), { month: 3, day: 28 });
check('Western Easter 2028', gregorianEaster(2028), { month: 4, day: 16 });
check('Western Easter 2029', gregorianEaster(2029), { month: 4, day: 1 });
check('Western Easter 2030', gregorianEaster(2030), { month: 4, day: 21 });

check('Orthodox Easter 2026', orthodoxEaster(2026), { month: 4, day: 12 });
check('Orthodox Easter 2027', orthodoxEaster(2027), { month: 5, day: 2 });
check('Orthodox Easter 2028 coincides with Western', orthodoxEaster(2028), { month: 4, day: 16 });

if (failed > 0) {
  console.log(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall passed');
