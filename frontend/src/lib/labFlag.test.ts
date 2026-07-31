import { labFlag } from './labFlag.ts';

let fails = 0;
function eq(actual: unknown, expected: unknown, what: string) {
  if (actual === expected) return;
  fails++;
  console.error(`FAIL ${what}: beklenen ${String(expected)}, gelen ${String(actual)}`);
}

eq(labFlag(5, 10, 20), 'low', 'value below refLow -> low');
eq(labFlag(25, 10, 20), 'high', 'value above refHigh -> high');
eq(labFlag(10, 10, 20), 'normal', 'value bounds refLow -> normal');
eq(labFlag(20, 10, 20), 'normal', 'value bounds refHigh -> normal');
eq(labFlag(15, null, null), 'normal', 'both refs null -> normal');
eq(labFlag(15, 10, null), 'normal', 'only refLow set, value above -> normal');
eq(labFlag(15, null, 20), 'normal', 'only refHigh set, value below -> normal');

if (fails) throw new Error(`${fails} test basarisiz`);
console.log('OK: labFlag testleri basariyla gecti');
