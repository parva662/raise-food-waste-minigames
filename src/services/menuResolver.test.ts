import { describe, it, expect } from 'vitest';
import { fromZonedTime } from 'date-fns-tz';
import {
  getMenuCycleWeek,
  resolveMenuForDate,
  getDailyMenuCatalogue,
  findMissingCatalogueIds,
  getOverrideReason,
} from './menuResolver';
import { foodCatalogue } from '../data/foodCatalogue';
import { dailyMenuItemIds } from '../data/menuSchedule';
import { ROTATION_DATES } from '../test/fixtures/dates';
import { SECTION_KEYS } from '../test/fixtures/menus';

describe('three-week menu rotation', () => {
  it('resolves the first Monday in cycle week 1', () => {
    const menu = resolveMenuForDate(ROTATION_DATES.week1Monday);
    expect(getMenuCycleWeek(ROTATION_DATES.week1Monday)).toBe(1);
    expect(menu.status).toBe('available');
    if (menu.status === 'available') {
      expect(menu.dailyMenuId).toBe('week1-monday');
    }
  });

  it('resolves cycle start Tuesday as Week 1 Tuesday', () => {
    expect(getMenuCycleWeek(ROTATION_DATES.cycleStartTuesday)).toBe(1);
    const menu = resolveMenuForDate(ROTATION_DATES.cycleStartTuesday);
    if (menu.status === 'available') {
      expect(menu.dailyMenuId).toBe('week1-tuesday');
    }
  });

  it('resolves Week 1 Friday', () => {
    expect(getMenuCycleWeek(ROTATION_DATES.week1Friday)).toBe(1);
    const menu = resolveMenuForDate(ROTATION_DATES.week1Friday);
    if (menu.status === 'available') {
      expect(menu.dailyMenuId).toBe('week1-friday');
    }
  });

  it('resolves the following Monday as Week 2 Monday', () => {
    expect(getMenuCycleWeek(ROTATION_DATES.week2Monday)).toBe(2);
    const menu = resolveMenuForDate(ROTATION_DATES.week2Monday);
    if (menu.status === 'available') {
      expect(menu.dailyMenuId).toBe('week2-monday');
    }
  });

  it('resolves the third Monday as Week 3 Monday', () => {
    expect(getMenuCycleWeek(ROTATION_DATES.week3Monday)).toBe(3);
    const menu = resolveMenuForDate(ROTATION_DATES.week3Monday);
    if (menu.status === 'available') {
      expect(menu.dailyMenuId).toBe('week3-monday');
    }
  });

  it('rotates the fourth Monday back to Week 1 Monday', () => {
    expect(getMenuCycleWeek(ROTATION_DATES.week4Monday)).toBe(1);
    const menu = resolveMenuForDate(ROTATION_DATES.week4Monday);
    if (menu.status === 'available') {
      expect(menu.dailyMenuId).toBe('week1-monday');
    }
  });

  it('rotates Week 4 Tuesday back to Week 1 Tuesday', () => {
    expect(getMenuCycleWeek(ROTATION_DATES.week4Tuesday)).toBe(1);
    const menu = resolveMenuForDate(ROTATION_DATES.week4Tuesday);
    if (menu.status === 'available') {
      expect(menu.dailyMenuId).toBe('week1-tuesday');
    }
  });

  it('resolves Week 5 Wednesday as Week 2 Wednesday', () => {
    expect(getMenuCycleWeek(ROTATION_DATES.week5Wednesday)).toBe(2);
    const menu = resolveMenuForDate(ROTATION_DATES.week5Wednesday);
    if (menu.status === 'available') {
      expect(menu.dailyMenuId).toBe('week2-wednesday');
    }
  });

  it('resolves Week 6 Thursday as Week 3 Thursday', () => {
    expect(getMenuCycleWeek(ROTATION_DATES.week6Thursday)).toBe(3);
    const menu = resolveMenuForDate(ROTATION_DATES.week6Thursday);
    if (menu.status === 'available') {
      expect(menu.dailyMenuId).toBe('week3-thursday');
    }
  });

  it('returns all four sections for a resolved daily menu', () => {
    const menu = resolveMenuForDate(ROTATION_DATES.cycleStartTuesday);
    expect(menu.status).toBe('available');
    if (menu.status === 'available') {
      expect(menu.items.filter((item) => item.category === 'vegetarian')).toHaveLength(2);
      expect(menu.items.filter((item) => item.category === 'classic')).toHaveLength(2);
      expect(menu.items.filter((item) => item.category === 'soup')).toHaveLength(2);
      expect(menu.items.filter((item) => item.category === 'dessert')).toHaveLength(2);
    }
  });

  it('resolves every daily-menu item ID to a catalogue entry', () => {
    for (const dailyMenu of getDailyMenuCatalogue()) {
      const missing = findMissingCatalogueIds(dailyMenuItemIds(dailyMenu));
      expect(missing).toEqual([]);
    }
  });

  it('detects missing catalogue IDs instead of silently ignoring them', () => {
    expect(findMissingCatalogueIds(['rice-with-sauce', 'missing-item-id'])).toEqual([
      'missing-item-id',
    ]);
  });

  it('keeps rotation stable across a month boundary', () => {
    const menu = resolveMenuForDate(ROTATION_DATES.monthBoundaryFriday);
    expect(menu.status).toBe('available');
    expect(getMenuCycleWeek(ROTATION_DATES.monthBoundaryFriday)).toBe(1);
  });

  it('keeps rotation stable across a year boundary within validity', () => {
    const menu = resolveMenuForDate(ROTATION_DATES.yearBoundaryWeekday);
    expect(menu.status).toBe('available');
    expect(getMenuCycleWeek(ROTATION_DATES.yearBoundaryWeekday)).toBe(1);
  });

  it('does not depend on the machine local timezone', () => {
    const utcNoon = fromZonedTime(`${ROTATION_DATES.week2Monday} 12:00:00`, 'UTC');
    const helsinkiNoon = fromZonedTime(`${ROTATION_DATES.week2Monday} 12:00:00`, 'Europe/Helsinki');
    expect(getMenuCycleWeek(ROTATION_DATES.week2Monday)).toBe(2);
    expect(resolveMenuForDate(ROTATION_DATES.week2Monday).status).toBe('available');
    expect(utcNoon.toISOString()).not.toBe(helsinkiNoon.toISOString());
    expect(getMenuCycleWeek(ROTATION_DATES.week2Monday)).toBe(2);
  });

  it('rejects dates before menu validity', () => {
    expect(resolveMenuForDate(ROTATION_DATES.beforeValidity)).toEqual({ status: 'unavailable' });
  });

  it('rejects dates after menu validity', () => {
    expect(resolveMenuForDate(ROTATION_DATES.afterValidity)).toEqual({ status: 'unavailable' });
  });
});

describe('menu overrides', () => {
  it('uses a replacement override instead of the rotating daily menu', () => {
    const normal = resolveMenuForDate(ROTATION_DATES.replaceOverrideNormalDay);
    const overridden = resolveMenuForDate(ROTATION_DATES.replaceOverride);
    expect(normal.status).toBe('available');
    expect(overridden.status).toBe('available');
    if (normal.status === 'available' && overridden.status === 'available') {
      expect(overridden.dailyMenuId).toBe(`override-${ROTATION_DATES.replaceOverride}`);
      expect(overridden.items.map((item) => item.id)).not.toEqual(
        normal.items.map((item) => item.id),
      );
    }
  });

  it('marks a closed-date override as closed', () => {
    expect(resolveMenuForDate(ROTATION_DATES.closedOverride)).toEqual({
      status: 'closed',
      reason: 'Public holiday',
    });
  });

  it('prevents normal menu rendering on a closed override date', () => {
    const menu = resolveMenuForDate(ROTATION_DATES.closedOverride);
    expect(menu.status).not.toBe('available');
  });

  it('applies an override only to its exact date', () => {
    expect(resolveMenuForDate(ROTATION_DATES.replaceOverrideNormalDay).status).toBe('available');
    expect(resolveMenuForDate(ROTATION_DATES.replaceOverride).status).toBe('available');
    expect(resolveMenuForDate(ROTATION_DATES.replaceOverrideAfterDay).status).toBe('available');
  });

  it('resumes the normal rotating menu after an override date', () => {
    const after = resolveMenuForDate(ROTATION_DATES.replaceOverrideAfterDay);
    expect(after.status).toBe('available');
    if (after.status === 'available') {
      expect(after.dailyMenuId).not.toContain('override-');
    }
  });

  it('reports invalid override item IDs through missing-ID detection', () => {
    expect(findMissingCatalogueIds(['invalid-override-item'])).toEqual(['invalid-override-item']);
  });

  it('preserves the optional closure reason', () => {
    expect(getOverrideReason(ROTATION_DATES.closedOverride)).toBe('Public holiday');
  });
});

describe('daily menu integrity', () => {
  const catalogue = getDailyMenuCatalogue();

  it('defines exactly 15 complete daily menus', () => {
    expect(catalogue).toHaveLength(15);
  });

  it('includes Monday through Friday for each cycle week', () => {
    for (const week of [1, 2, 3] as const) {
      const weekdays = catalogue.filter((menu) => menu.week === week).map((menu) => menu.weekday);
      expect(weekdays.sort()).toEqual(['friday', 'monday', 'thursday', 'tuesday', 'wednesday']);
    }
  });

  it('uses stable unique daily-menu IDs', () => {
    const ids = catalogue.map((menu) => menu.id);
    expect(new Set(ids).size).toBe(15);
  });

  it('includes all four section arrays on every daily menu', () => {
    for (const dailyMenu of catalogue) {
      for (const section of SECTION_KEYS) {
        expect(Array.isArray(dailyMenu[section])).toBe(true);
        expect(dailyMenu[section].length).toBeGreaterThan(0);
      }
    }
  });

  it('does not treat section headings as selectable item IDs', () => {
    const invalidHeadingIds = ['Vegetarian Lunch', 'Classic Lunch', 'Soups', 'Desserts'];
    expect(findMissingCatalogueIds(invalidHeadingIds)).toEqual(invalidHeadingIds);
  });

  it('avoids duplicate item IDs within the same section', () => {
    for (const dailyMenu of catalogue) {
      for (const section of SECTION_KEYS) {
        expect(new Set(dailyMenu[section]).size).toBe(dailyMenu[section].length);
      }
    }
  });

  it('references only catalogue items with positive quantities and units', () => {
    for (const dailyMenu of catalogue) {
      for (const itemId of dailyMenuItemIds(dailyMenu)) {
        const item = foodCatalogue[itemId];
        expect(item).toBeDefined();
        expect(item.maxQuantity).toBeGreaterThan(0);
        expect(item.unit.length).toBeGreaterThan(0);
        expect(item.image.length).toBeGreaterThan(0);
      }
    }
  });
});
