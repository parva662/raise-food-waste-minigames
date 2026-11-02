import { describe, expect, it } from 'vitest';
import { resolveStudentLunchServiceDate } from '@/products/lunch-declaration/studentLunchServiceDate';
import { resolveMealSlotsForDate } from '@/shared/menu/mealSlots';
import { resolveMenuForDate, getGeneratedMenuDateRange } from '@/shared/menu/menuResolver';
import { getGeneratedMenuMeta } from '@/shared/menu/generatedMenuData';
import { MENU_DATES, helsinki } from '@/test/fixtures/dates';

describe('extended sample menu coverage (Student Lunch / Forecast / Closeout)', () => {
  it('exposes the extended generated range through 2027-04-30', () => {
    expect(getGeneratedMenuDateRange()).toEqual({
      start: MENU_DATES.runtimeMonday,
      end: MENU_DATES.extendedSampleEnd,
    });
    expect(getGeneratedMenuMeta().runtimeSchedule?.strategy).toBe(
      'continuous-weekday-remap-with-cycle-extension',
    );
  });

  it('preserves 2026-10-30 and serves Nov 2026–Apr 2027 sample weekdays', () => {
    const preserved = resolveMenuForDate(MENU_DATES.preservedHistoricalFriday);
    const monday = resolveMenuForDate(MENU_DATES.extendedSampleMonday);
    const end = resolveMenuForDate(MENU_DATES.extendedSampleEnd);

    expect(preserved.status).toBe('available');
    expect(monday.status).toBe('available');
    expect(end.status).toBe('available');

    expect(resolveMealSlotsForDate(MENU_DATES.preservedHistoricalFriday)).not.toBeNull();
    expect(resolveMealSlotsForDate(MENU_DATES.extendedSampleMonday)).not.toBeNull();
    expect(resolveMealSlotsForDate(MENU_DATES.extendedSampleEnd)).not.toBeNull();

    for (const date of [
      MENU_DATES.preservedHistoricalFriday,
      MENU_DATES.extendedSampleMonday,
      MENU_DATES.extendedSampleEnd,
    ]) {
      const slots = resolveMealSlotsForDate(date)!;
      expect(slots.main.category).toBe('classic');
      expect(slots.vegetarian.category).toBe('vegetarian');
      expect(slots.soup.category).toBe('soup');
      expect(slots.dessert.category).toBe('dessert');
    }
  });

  it('keeps Sundays and post-range dates without sample menus', () => {
    expect(resolveMenuForDate(MENU_DATES.sundayInCoverageWindow).status).toBe('unavailable');
    expect(resolveMealSlotsForDate(MENU_DATES.sundayInCoverageWindow)).toBeNull();
    expect(resolveMenuForDate('2027-05-01').status).toBe('unavailable');
    expect(resolveMenuForDate(MENU_DATES.afterRange).status).toBe('unavailable');
  });

  it('resolves Student Lunch next service from Monday 2 Nov 2026 to Tuesday with a sample menu', () => {
    const now = helsinki('2026-11-02', '12:00:00');
    const next = resolveStudentLunchServiceDate(now);
    expect(next).toBe('2026-11-03');
    expect(resolveMenuForDate(next).status).toBe('available');
  });
});
