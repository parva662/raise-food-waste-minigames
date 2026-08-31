import { describe, it, expect } from 'vitest';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertWorkbookFile } from './workbook.ts';
import {
  applyContinuousRuntimeSchedule,
  listRuntimeWeekdaysBetween,
  nextRuntimeWeekday,
} from './dateShift.ts';
import { MENU_RUNTIME_SCHEDULE } from './menuConfig.ts';

const exampleWorkbook = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../reference/Example_menu.xlsx',
);

describe('continuous runtime menu schedule', () => {
  it('starts runtime menus on 2026-07-27', () => {
    const { result } = applyContinuousRuntimeSchedule(convertWorkbookFile(exampleWorkbook));
    const first = [...result.dailyMenus].sort((a, b) => a.date.localeCompare(b.date))[0];
    expect(first?.date).toBe(MENU_RUNTIME_SCHEDULE.runtimeStartDate);
  });

  it('maps every source menu day to one consecutive runtime weekday', () => {
    const raw = convertWorkbookFile(exampleWorkbook);
    const { result, schedule } = applyContinuousRuntimeSchedule(raw);
    expect(schedule.sourceMenuDayCount).toBe(raw.dailyMenus.length);
    expect(schedule.runtimeMenuDayCount).toBe(raw.dailyMenus.length);
    expect(schedule.strategy).toBe('continuous-weekday-remap');

    const runtimeDates = result.dailyMenus.map((day) => day.date).sort();
    const expectedWeekdays = listRuntimeWeekdaysBetween(
      MENU_RUNTIME_SCHEDULE.runtimeStartDate,
      schedule.runtimeEndDate,
    );

    expect(runtimeDates).toEqual(expectedWeekdays);
    expect(runtimeDates).toHaveLength(raw.dailyMenus.length);
  });

  it('has no weekday gaps between runtime start and end', () => {
    const { result, schedule } = applyContinuousRuntimeSchedule(convertWorkbookFile(exampleWorkbook));
    const runtimeDates = new Set(result.dailyMenus.map((day) => day.date));
    const weekdays = listRuntimeWeekdaysBetween(
      MENU_RUNTIME_SCHEDULE.runtimeStartDate,
      schedule.runtimeEndDate,
    );

    for (const weekday of weekdays) {
      expect(runtimeDates.has(weekday)).toBe(true);
    }
  });

  it('excludes weekends from the runtime schedule', () => {
    const { result } = applyContinuousRuntimeSchedule(convertWorkbookFile(exampleWorkbook));
    for (const day of result.dailyMenus) {
      expect(day.date.endsWith('-Sat') || day.date.includes('Saturday')).toBe(false);
      const weekend = day.date === '2026-08-01' || day.date === '2026-08-02';
      expect(weekend).toBe(false);
      expect(nextRuntimeWeekday(day.date) > day.date).toBe(true);
    }
  });

  it('preserves workbook menu-day ordering and slot data', () => {
    const raw = convertWorkbookFile(exampleWorkbook);
    const { result } = applyContinuousRuntimeSchedule(raw);
    const sortedRaw = [...raw.dailyMenus].sort(
      (left, right) => left.date.localeCompare(right.date) || left.sheetWeek - right.sheetWeek,
    );
    const sortedRuntime = [...result.dailyMenus].sort((left, right) =>
      left.date.localeCompare(right.date),
    );

    for (let index = 0; index < sortedRaw.length; index += 1) {
      const source = sortedRaw[index]!;
      const runtime = sortedRuntime[index]!;
      expect(runtime.slots).toEqual(source.slots);
      expect(runtime.closed).toBe(source.closed);
      expect(runtime.sheetWeek).toBe(source.sheetWeek);
    }
  });

  it('does not create a runtime gap where workbook Week 10 is followed by Week 13', () => {
    const raw = convertWorkbookFile(exampleWorkbook);
    const { result } = applyContinuousRuntimeSchedule(raw);
    const sortedRaw = [...raw.dailyMenus].sort(
      (left, right) => left.date.localeCompare(right.date) || left.sheetWeek - right.sheetWeek,
    );
    const week10Last = sortedRaw.filter((day) => day.sheetWeek === 10).at(-1);
    const week13First = sortedRaw.find((day) => day.sheetWeek === 13);
    expect(week10Last).toBeDefined();
    expect(week13First).toBeDefined();

    const runtimeBySourceOrder = [...result.dailyMenus].sort((left, right) =>
      left.date.localeCompare(right.date),
    );
    const week10RuntimeDate = runtimeBySourceOrder[sortedRaw.indexOf(week10Last!)]?.date;
    const week13RuntimeDate = runtimeBySourceOrder[sortedRaw.indexOf(week13First!)]?.date;
    expect(week13RuntimeDate).toBe(nextRuntimeWeekday(week10RuntimeDate!));
  });

  it('makes 2026-09-01 available after continuous remap', () => {
    const { result } = applyContinuousRuntimeSchedule(convertWorkbookFile(exampleWorkbook));
    const runtimeDay = result.dailyMenus.find((day) => day.date === '2026-09-01');
    expect(runtimeDay).toBeDefined();
    expect(runtimeDay?.closed).toBe(false);
    expect(runtimeDay?.slots).toHaveLength(4);
    expect(runtimeDay?.slots.every((slot) => slot.closed === false)).toBe(true);
  });

  it('remains deterministic across repeated conversions', () => {
    const first = applyContinuousRuntimeSchedule(convertWorkbookFile(exampleWorkbook));
    const second = applyContinuousRuntimeSchedule(convertWorkbookFile(exampleWorkbook));
    expect(first.result.dailyMenus).toEqual(second.result.dailyMenus);
    expect(first.schedule).toEqual(second.schedule);
  });
});
