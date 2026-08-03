import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertWorkbookFile } from './workbook.ts';
import { applyRuntimeDateShift, shiftIsoDate } from './dateShift.ts';
import { MENU_DATE_SHIFT, menuDateOffsetDays } from './menuConfig.ts';

const exampleWorkbook = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../reference/Example_menu.xlsx',
);

describe('runtime menu date shift', () => {
  const offset = menuDateOffsetDays();

  it('uses a 175-day offset from workbook start to runtime start', () => {
    expect(offset).toBe(175);
    expect(shiftIsoDate(MENU_DATE_SHIFT.workbookStartDate, offset)).toBe(
      MENU_DATE_SHIFT.runtimeStartDate,
    );
  });

  it('maps original first date 2026-02-02 to 2026-07-27', () => {
    const { result } = applyRuntimeDateShift(convertWorkbookFile(exampleWorkbook));
    const first = result.dailyMenus.find((d) => d.date === '2026-07-27');
    expect(first).toBeDefined();
  });

  it('maps the second weekday to the next calendar day in sequence', () => {
    const raw = convertWorkbookFile(exampleWorkbook);
    const { result } = applyRuntimeDateShift(raw);
    const rawSecond = [...raw.dailyMenus].sort((a, b) => a.date.localeCompare(b.date))[1];
    const shiftedSecond = [...result.dailyMenus].sort((a, b) => a.date.localeCompare(b.date))[1];
    expect(shiftedSecond.date).toBe(shiftIsoDate(rawSecond.date, offset));
    expect(shiftedSecond.slots).toEqual(rawSecond.slots);
  });

  it('maps the final workbook date to the shifted end date', () => {
    const { result, shift } = applyRuntimeDateShift(convertWorkbookFile(exampleWorkbook));
    expect(shift.workbookDateRange.end).toBe('2026-05-29');
    expect(shift.runtimeEndDate).toBe('2026-11-20');
    const last = [...result.dailyMenus].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
    expect(last?.date).toBe('2026-11-20');
  });

  it('preserves menu items and item IDs after shifting', () => {
    const raw = convertWorkbookFile(exampleWorkbook);
    const { result } = applyRuntimeDateShift(raw);
    const rawWed = raw.dailyMenus.find((d) => d.date === '2026-02-04');
    const shiftedWed = result.dailyMenus.find((d) => d.date === '2026-07-29');
    expect(shiftedWed?.slots).toEqual(rawWed?.slots);
    expect(shiftedWed?.slots.map((s) => s.itemId)).toEqual([
      'chicken-steak-with-pesto-sauce-and-pasta',
      'chickpea-and-apricot-stew-with-pasta',
      'pike-fish-ball-soup',
      'mango-and-pear-lassi',
    ]);
  });

  it('keeps CLOSED days in the same relative order', () => {
    const raw = convertWorkbookFile(exampleWorkbook);
    const { result } = applyRuntimeDateShift(raw);
    const rawClosedIndexes = raw.dailyMenus
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d, i) => (d.closed ? i : -1))
      .filter((i) => i >= 0);
    const shiftedClosedIndexes = result.dailyMenus
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d, i) => (d.closed ? i : -1))
      .filter((i) => i >= 0);
    expect(shiftedClosedIndexes).toEqual(rawClosedIndexes);
  });

  it('remains deterministic across repeated conversions', () => {
    const first = applyRuntimeDateShift(convertWorkbookFile(exampleWorkbook));
    const second = applyRuntimeDateShift(convertWorkbookFile(exampleWorkbook));
    expect(first.result.dailyMenus).toEqual(second.result.dailyMenus);
    expect(first.shift).toEqual(second.shift);
  });
});
