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

  it('preserves a 1:1 remap for the historical block through 2026-10-30', () => {
    const raw = convertWorkbookFile(exampleWorkbook);
    const { result, schedule } = applyContinuousRuntimeSchedule(raw);
    expect(schedule.preservedThroughDate).toBe('2026-10-30');
    expect(schedule.sourceMenuDayCount).toBe(raw.dailyMenus.length);

    const historical = result.dailyMenus
      .filter((day) => day.date <= schedule.preservedThroughDate)
      .sort((a, b) => a.date.localeCompare(b.date));
    expect(historical).toHaveLength(raw.dailyMenus.length);

    const expectedWeekdays = listRuntimeWeekdaysBetween(
      MENU_RUNTIME_SCHEDULE.runtimeStartDate,
      schedule.preservedThroughDate,
    );
    expect(historical.map((day) => day.date)).toEqual(expectedWeekdays);
  });

  it('extends sample menus by cycling open source days through the configured end date', () => {
    const raw = convertWorkbookFile(exampleWorkbook);
    const { result, schedule } = applyContinuousRuntimeSchedule(raw);
    expect(schedule.strategy).toBe('continuous-weekday-remap-with-cycle-extension');
    expect(schedule.extensionStartDate).toBe(MENU_RUNTIME_SCHEDULE.extensionStartDate);
    expect(schedule.extensionEndDate).toBe(MENU_RUNTIME_SCHEDULE.runtimeEndDate);
    expect(schedule.runtimeEndDate).toBe(MENU_RUNTIME_SCHEDULE.runtimeEndDate);
    expect(schedule.extensionDayCount).toBeGreaterThan(0);
    expect(schedule.runtimeMenuDayCount).toBe(
      schedule.sourceMenuDayCount + schedule.extensionDayCount,
    );

    const nov2 = result.dailyMenus.find((day) => day.date === '2026-11-02');
    const apr30 = result.dailyMenus.find((day) => day.date === '2027-04-30');
    expect(nov2).toBeDefined();
    expect(nov2?.closed).toBe(false);
    expect(nov2?.slots).toHaveLength(4);
    expect(apr30).toBeDefined();
    expect(apr30?.closed).toBe(false);
    expect(apr30?.slots).toHaveLength(4);

    expect(result.dailyMenus.some((day) => day.date === '2026-11-01')).toBe(false);
    expect(result.dailyMenus.some((day) => day.date === '2027-05-03')).toBe(false);
  });

  it('cycles templates deterministically across the extension', () => {
    const raw = convertWorkbookFile(exampleWorkbook);
    const { result, schedule } = applyContinuousRuntimeSchedule(raw);
    const openTemplates = [...raw.dailyMenus]
      .sort((left, right) => left.date.localeCompare(right.date) || left.sheetWeek - right.sheetWeek)
      .filter((day) => !day.closed);
    const extension = result.dailyMenus
      .filter((day) => day.date >= schedule.extensionStartDate)
      .sort((a, b) => a.date.localeCompare(b.date));

    expect(extension[0]?.slots).toEqual(openTemplates[0]?.slots);
    expect(extension[schedule.cycleTemplateDayCount]?.slots).toEqual(openTemplates[0]?.slots);
  });

  it('has no weekday gaps in the preserved historical block', () => {
    const { result, schedule } = applyContinuousRuntimeSchedule(convertWorkbookFile(exampleWorkbook));
    const runtimeDates = new Set(
      result.dailyMenus
        .filter((day) => day.date <= schedule.preservedThroughDate)
        .map((day) => day.date),
    );
    const weekdays = listRuntimeWeekdaysBetween(
      MENU_RUNTIME_SCHEDULE.runtimeStartDate,
      schedule.preservedThroughDate,
    );

    for (const weekday of weekdays) {
      expect(runtimeDates.has(weekday)).toBe(true);
    }
  });

  it('excludes weekends from the runtime schedule', () => {
    const { result } = applyContinuousRuntimeSchedule(convertWorkbookFile(exampleWorkbook));
    for (const day of result.dailyMenus) {
      expect(day.date === '2026-08-01' || day.date === '2026-08-02').toBe(false);
      expect(day.date === '2026-11-01').toBe(false);
      expect(nextRuntimeWeekday(day.date) > day.date).toBe(true);
    }
  });

  it('preserves workbook menu-day ordering and slot data in the historical block', () => {
    const raw = convertWorkbookFile(exampleWorkbook);
    const { result, schedule } = applyContinuousRuntimeSchedule(raw);
    const sortedRaw = [...raw.dailyMenus].sort(
      (left, right) => left.date.localeCompare(right.date) || left.sheetWeek - right.sheetWeek,
    );
    const historical = result.dailyMenus
      .filter((day) => day.date <= schedule.preservedThroughDate)
      .sort((left, right) => left.date.localeCompare(right.date));

    for (let index = 0; index < sortedRaw.length; index += 1) {
      const source = sortedRaw[index]!;
      const runtime = historical[index]!;
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

    const historical = [...result.dailyMenus]
      .filter((day) => day.date <= '2026-10-30')
      .sort((left, right) => left.date.localeCompare(right.date));
    const week10RuntimeDate = historical[sortedRaw.indexOf(week10Last!)]?.date;
    const week13RuntimeDate = historical[sortedRaw.indexOf(week13First!)]?.date;
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
