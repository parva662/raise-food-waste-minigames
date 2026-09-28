import { describe, it, expect } from 'vitest';
import { resolveMenuForDate } from '@/shared/menu/menuResolver';
import { resolveMealSlotsForDate } from '@/shared/menu/mealSlots';
import { MENU_DATES } from '@/test/fixtures/dates';

function menuWouldBeReady(lunchDate: string): boolean {
  const menu = resolveMenuForDate(lunchDate);
  const slots = resolveMealSlotsForDate(lunchDate);
  return menu.status === 'available' && slots !== null;
}

describe('runtime menu launch week (2026-07-27 – 2026-07-31)', () => {
  it('Monday 2026-07-27 serves the first shifted workbook day', () => {
    const menu = resolveMenuForDate(MENU_DATES.runtimeMonday);
    const slots = resolveMealSlotsForDate(MENU_DATES.runtimeMonday)!;
    expect(menu.status).toBe('available');
    expect(slots.main.id).toBe('thai-pork-meatballs-with-rice');
    expect(slots.vegetarian.id).toBe('quorn-and-mushroom-stew');
    expect(slots.soup.id).toBe('pumpkin-soup');
    expect(slots.dessert.id).toBe('apple-compote');
    expect(menuWouldBeReady(MENU_DATES.runtimeMonday)).toBe(true);
  });

  it('Tuesday 2026-07-28 continues the sequence', () => {
    const slots = resolveMealSlotsForDate(MENU_DATES.runtimeTuesday)!;
    expect(slots.main.id).toBe('sausage-stroganoff-with-mashed-potatoes');
    expect(resolveMenuForDate(MENU_DATES.runtimeTuesday).status).toBe('available');
    expect(menuWouldBeReady(MENU_DATES.runtimeTuesday)).toBe(true);
  });

  it('Wednesday 2026-07-29 matches the fixture lunch date', () => {
    const slots = resolveMealSlotsForDate(MENU_DATES.runtimeWednesday)!;
    expect(slots.main.id).toBe('chicken-steak-with-pesto-sauce-and-pasta');
    expect(menuWouldBeReady(MENU_DATES.runtimeWednesday)).toBe(true);
  });

  it('Thursday 2026-07-30 and Friday 2026-07-31 are available weekdays', () => {
    for (const date of [MENU_DATES.runtimeThursday, MENU_DATES.runtimeFriday]) {
      expect(resolveMenuForDate(date).status).toBe('available');
      expect(resolveMealSlotsForDate(date)).not.toBeNull();
      expect(menuWouldBeReady(date)).toBe(true);
    }
  });

  it('Saturday 2026-08-01 is unavailable (weekend)', () => {
    expect(resolveMenuForDate(MENU_DATES.weekend)).toEqual({ status: 'unavailable' });
    expect(resolveMealSlotsForDate(MENU_DATES.weekend)).toBeNull();
    expect(menuWouldBeReady(MENU_DATES.weekend)).toBe(false);
  });
});
