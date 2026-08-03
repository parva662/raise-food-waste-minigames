import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertWorkbookFile, validateConversion } from './workbook.ts';
import { applyRuntimeDateShift } from './dateShift.ts';
import { repoRootFromModule, writeRuntimeMenuOutputs } from './runtimeMenu.ts';

const root = repoRootFromModule(fileURLToPath(import.meta.url));
const input = process.argv[2] ?? resolve(root, 'reference/Example_menu.xlsx');

const raw = convertWorkbookFile(input);
const preShiftErrors = validateConversion(raw);
if (preShiftErrors.length > 0) {
  console.error('Workbook conversion validation failed:');
  for (const err of preShiftErrors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

const { result, shift } = applyRuntimeDateShift(raw);
const validationErrors = validateConversion(result);
if (validationErrors.length > 0) {
  console.error('Shifted menu validation failed:');
  for (const err of validationErrors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

const { missingImages, meta } = writeRuntimeMenuOutputs(root, result, shift);
mkdirSync(resolve(root, 'generated-data/menu'), { recursive: true });

console.log(`Wrote generated menu JSON to ${resolve(root, 'generated-data/menu')}`);
console.log(`Wrote runtime menu JSON to ${resolve(root, 'src/data/generated')}`);
console.log(`Missing dedicated images: ${missingImages.length}`);
console.log(`Workbook date range: ${shift.workbookDateRange.start} – ${shift.workbookDateRange.end}`);
console.log(`Runtime date range: ${meta.dateRange.start} – ${meta.dateRange.end} (offset ${shift.dateOffsetDays} days)`);
