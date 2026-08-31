import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertWorkbookFile, validateConversion } from './workbook.ts';
import { applyContinuousRuntimeSchedule } from './dateShift.ts';
import { repoRootFromModule, writeRuntimeMenuOutputs } from './runtimeMenu.ts';

const root = repoRootFromModule(fileURLToPath(import.meta.url));
const input = process.argv[2] ?? resolve(root, 'reference/Example_menu.xlsx');

const raw = convertWorkbookFile(input);
const preScheduleErrors = validateConversion(raw);
if (preScheduleErrors.length > 0) {
  console.error('Workbook conversion validation failed:');
  for (const err of preScheduleErrors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

const { result, schedule } = applyContinuousRuntimeSchedule(raw);
const validationErrors = validateConversion(result);
if (validationErrors.length > 0) {
  console.error('Runtime menu validation failed:');
  for (const err of validationErrors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

const { missingImages, meta } = writeRuntimeMenuOutputs(root, result, schedule);
mkdirSync(resolve(root, 'generated-data/menu'), { recursive: true });

console.log(`Wrote generated menu JSON to ${resolve(root, 'generated-data/menu')}`);
console.log(`Wrote runtime menu JSON to ${resolve(root, 'src/data/generated')}`);
console.log(`Missing dedicated images: ${missingImages.length}`);
console.log(
  `Source workbook menu days: ${schedule.sourceMenuDayCount} (${schedule.sourceWorkbookDateRange.start} – ${schedule.sourceWorkbookDateRange.end})`,
);
console.log(
  `Runtime schedule: ${schedule.strategy} from ${schedule.runtimeStartDate} to ${schedule.runtimeEndDate} (${schedule.runtimeMenuDayCount} weekdays)`,
);
console.log(`Runtime date range: ${meta.dateRange.start} – ${meta.dateRange.end}`);
