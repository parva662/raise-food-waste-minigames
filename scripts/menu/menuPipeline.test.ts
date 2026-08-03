import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as XLSX from 'xlsx';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  convertWorkbookFile,
  inspectWorkbookFile,
  validateConversion,
} from './workbook.ts';
import { MenuPipelineError } from './types.ts';
import { slugFromMenuItemName } from './normalize.ts';

function writeWorkbook(path: string, sheets: Record<string, (string | number | Date)[][]>) {
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  XLSX.writeFile(wb, path);
}

describe('menu workbook pipeline', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'menu-pipeline-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  const validWeek1: (string | number | Date)[][] = [
    ['MENU ITEMS', 'QUANTITY', 'DATE'],
    ['Main dish', 200, new Date('2026-06-01')],
    ['Veg dish', 50, new Date('2026-06-01')],
    ['Soup dish', 30, new Date('2026-06-01')],
    ['Dessert dish', 30, new Date('2026-06-01')],
    ['Main two', 200, new Date('2026-06-02')],
    ['Veg two', 50, new Date('2026-06-02')],
    ['Soup two', 30, new Date('2026-06-02')],
    ['Dessert two', 30, new Date('2026-06-02')],
  ];

  it('converts a valid workbook deterministically', () => {
    const path = join(tempDir, 'valid.xlsx');
    writeWorkbook(path, { 'Week 1': validWeek1 });
    const first = convertWorkbookFile(path);
    const second = convertWorkbookFile(path);
    expect({ ...first, generatedAt: 'fixed' }).toEqual({ ...second, generatedAt: 'fixed' });
    expect(validateConversion(first)).toEqual([]);
    expect(first.dailyMenus).toHaveLength(2);
    expect(first.foodCatalogue.map((f) => f.id)).toContain(slugFromMenuItemName('Main dish'));
  });

  it('rejects missing required header', () => {
    const path = join(tempDir, 'bad-header.xlsx');
    writeWorkbook(path, {
      'Week 1': [
        ['ITEM', 'QUANTITY', 'DATE'],
        ['Main', 1, new Date('2026-06-01')],
      ],
    });
    expect(() => convertWorkbookFile(path)).toThrow(MenuPipelineError);
    expect(() => convertWorkbookFile(path)).toThrow(/Expected header/);
  });

  it('rejects missing item name', () => {
    const path = join(tempDir, 'no-name.xlsx');
    writeWorkbook(path, {
      'Week 1': [
        ['MENU ITEMS', 'QUANTITY', 'DATE'],
        ['', 10, new Date('2026-06-01')],
      ],
    });
    expect(() => convertWorkbookFile(path)).toThrow(/name is required/);
  });

  it('rejects duplicate explicit ID', () => {
    const path = join(tempDir, 'dup-id.xlsx');
    const rows: (string | number | Date)[][] = [
      ['MENU ITEMS', 'QUANTITY', 'DATE', 'ID'],
      ['Main dish', 200, new Date('2026-06-01'), 'same-id'],
      ['Veg dish', 50, new Date('2026-06-01'), 'other'],
      ['Soup', 30, new Date('2026-06-01'), 'x'],
      ['Dessert', 30, new Date('2026-06-01'), 'y'],
      ['Other main', 200, new Date('2026-06-02'), 'same-id'],
      ['Veg two', 50, new Date('2026-06-02'), 'a'],
      ['Soup two', 30, new Date('2026-06-02'), 'b'],
      ['Dessert two', 30, new Date('2026-06-02'), 'c'],
    ];
    writeWorkbook(path, { 'Week 1': rows });
    expect(() => convertWorkbookFile(path)).toThrow(/Duplicate explicit item ID/);
  });

  it('rejects duplicate generated slug for different names', () => {
    const path = join(tempDir, 'dup-slug.xlsx');
    writeWorkbook(path, {
      'Week 1': [
        ['MENU ITEMS', 'QUANTITY', 'DATE'],
        ['Cafe au lait', 10, new Date('2026-06-01')],
        ['Cafe   au   lait!', 10, new Date('2026-06-01')],
        ['Soup', 10, new Date('2026-06-01')],
        ['Dessert', 10, new Date('2026-06-01')],
      ],
    });
    expect(() => convertWorkbookFile(path)).toThrow(/Duplicate generated slug/);
  });

  it('rejects invalid week sheet name', () => {
    const path = join(tempDir, 'bad-week.xlsx');
    writeWorkbook(path, { Menu: validWeek1 });
    expect(() => convertWorkbookFile(path)).toThrow(/Unsupported sheet name/);
  });

  it('rejects invalid date row group size', () => {
    const path = join(tempDir, 'bad-group.xlsx');
    writeWorkbook(path, {
      'Week 1': [
        ['MENU ITEMS', 'QUANTITY', 'DATE'],
        ['Only one row', 10, new Date('2026-06-01')],
      ],
    });
    expect(() => convertWorkbookFile(path)).toThrow(/Expected 4 menu rows/);
  });

  it('rejects merged cells', () => {
    const path = join(tempDir, 'merged.xlsx');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['MENU ITEMS', 'QUANTITY', 'DATE'],
      ['Merged title', 10, new Date('2026-06-01')],
      ['Veg', 10, new Date('2026-06-01')],
      ['Soup', 10, new Date('2026-06-01')],
      ['Dessert', 10, new Date('2026-06-01')],
    ]);
    ws['!merges'] = [{ s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }];
    XLSX.utils.book_append_sheet(wb, ws, 'Week 1');
    XLSX.writeFile(wb, path);
    expect(() => convertWorkbookFile(path)).toThrow(/Merged cells/);
  });

  it('inspect produces a machine-readable report', () => {
    const path = join(tempDir, 'inspect.xlsx');
    writeWorkbook(path, { 'Week 2': validWeek1 });
    const report = inspectWorkbookFile(path);
    expect(report.sheetNames).toContain('Week 2');
    expect(report.slotOrderPerDay).toEqual(['main', 'vegetarian', 'soup', 'dessert']);
    expect(report.mappingStatus).toBe('mappable');
  });
});
