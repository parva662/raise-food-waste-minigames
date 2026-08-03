import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectWorkbookFile } from './workbook.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const input = process.argv[2] ?? resolve(root, 'reference/Example_menu.xlsx');
const outDir = resolve(root, 'generated-data/menu');
const reportPath = resolve(outDir, 'inspection-report.json');

const report = inspectWorkbookFile(input);
mkdirSync(outDir, { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(`Wrote ${reportPath}`);
console.log(`Mapping status: ${report.mappingStatus}`);
if (report.unresolved.length > 0) {
  console.log('Unresolved notes:');
  for (const line of report.unresolved) {
    console.log(`  - ${line}`);
  }
}
