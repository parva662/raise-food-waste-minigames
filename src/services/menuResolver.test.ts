import { describe, it, expect } from 'vitest';
import {
  findMissingCatalogueIds,
  getGeneratedMenuDateRange,
  getMenuCycleWeek,
  getOverrideReason,
  resolveMenuForDate,
} from './menuResolver';
import { resolveMealSlotsForDate } from './mealSlots';
import { buildActivityMessage } from '../gamebus/buildActivityMessage';
import { pariStudentLunchTaskFixture } from '../gamebus/taskFixtures';
import { MENU_DATES } from '../test/fixtures/dates';
import { foodCatalogue } from '../data/foodCatalogue';
import { getAllGeneratedDailyMenus } from '../data/generatedMenuData';

describe('generated dated menu resolver', () => {
  it('resolves Monday 2026-07-27 as the runtime menu start', () => {
    const menu = resolveMenuForDate(MENU_DATES.runtimeMonday);
    expect(menu.status).toBe('available');
    const range = getGeneratedMenuDateRange();
    expect(range.start).toBe(MENU_DATES.runtimeMonday);
    if (menu.status === 'available') {
      expect(menu.items).toHaveLength(4);
      expect(menu.dailyMenuId).toBe(`dated-${MENU_DATES.runtimeMonday}`);
    }
  });

  it('resolves Tuesday 2026-07-28 in sequence after Monday', () => {
    const menu = resolveMenuForDate(MENU_DATES.runtimeTuesday);
    expect(menu.status).toBe('available');
  });

  it('resolves a known runtime date with four slots', () => {
    const menu = resolveMenuForDate(MENU_DATES.runtimeWednesday);
    expect(menu.status).toBe('available');
    if (menu.status === 'available') {
      expect(menu.items).toHaveLength(4);
      expect(menu.dailyMenuId).toBe(`dated-${MENU_DATES.runtimeWednesday}`);
      expect(menu.items.map((item) => item.category).sort()).toEqual(
        ['classic', 'dessert', 'soup', 'vegetarian'].sort(),
      );
    }
  });

  it('maps main, vegetarian, soup, and dessert to the correct catalogue IDs', () => {
    const slots = resolveMealSlotsForDate(MENU_DATES.runtimeWednesday);
    expect(slots).not.toBeNull();
    expect(slots!.main.id).toBe('chicken-steak-with-pesto-sauce-and-pasta');
    expect(slots!.vegetarian.id).toBe('chickpea-and-apricot-stew-with-pasta');
    expect(slots!.soup.id).toBe('pike-fish-ball-soup');
    expect(slots!.dessert.id).toBe('mango-and-pear-lassi');
  });

  it('uses sheet week metadata instead of a 3-week rotation', () => {
    expect(getMenuCycleWeek(MENU_DATES.runtimeWednesday)).toBe(2);
    const menu = resolveMenuForDate(MENU_DATES.runtimeMonday);
    if (menu.status === 'available') {
      expect(menu.menuCycleWeek).toBe(2);
      expect(menu.menuCycleWeek).not.toBe(1);
    }
    expect(resolveMenuForDate(MENU_DATES.missingFromWorkbook).status).toBe('unavailable');
  });

  it('marks workbook CLOSED days as closed', () => {
    expect(resolveMenuForDate(MENU_DATES.closedWorkbookDay)).toEqual({
      status: 'closed',
      reason: 'Canteen closed',
    });
    expect(resolveMealSlotsForDate(MENU_DATES.closedWorkbookDay)).toBeNull();
  });

  it('returns unavailable for dates missing from the workbook', () => {
    expect(resolveMenuForDate(MENU_DATES.missingFromWorkbook)).toEqual({ status: 'unavailable' });
    expect(resolveMealSlotsForDate(MENU_DATES.missingFromWorkbook)).toBeNull();
  });

  it('returns unavailable for weekends', () => {
    expect(resolveMenuForDate(MENU_DATES.weekend)).toEqual({ status: 'unavailable' });
  });

  it('returns unavailable before and after the generated date range', () => {
    const range = getGeneratedMenuDateRange();
    expect(range.start).toBe(MENU_DATES.runtimeMonday);
    expect(range.end).toBe('2026-11-20');
    expect(resolveMenuForDate(MENU_DATES.beforeRange)).toEqual({ status: 'unavailable' });
    expect(resolveMenuForDate(MENU_DATES.afterRange)).toEqual({ status: 'unavailable' });
  });

  it('exposes generated item IDs to GameBus studentLunchCheckin mapper', () => {
    const slots = resolveMealSlotsForDate(MENU_DATES.runtimeWednesday)!;
    const draft = {
      mealChoice: 'regular' as const,
      mainQuantity: 1,
      vegetarianQuantity: 0,
      soupQuantity: 0,
      dessertQuantity: 0,
    };
    const message = buildActivityMessage(
      pariStudentLunchTaskFixture,
      {
        studentId: 'demo',
        lunchDate: MENU_DATES.runtimeWednesday,
        menuCycleWeek: 2,
        menuVersion: 'test',
        mealChoice: 'regular',
        regularMainSelected: true,
        regularVegetarianSelected: false,
        noLunch: false,
        selections: [],
        timingStatus: 'on-time',
        basePoints: 20,
        timingAdjustment: 5,
        totalPoints: 25,
        submittedAt: '2026-02-03T12:00:00.000Z',
        updatedAt: '2026-02-03T12:00:00.000Z',
        includeInForecast: true,
      },
      draft,
      slots,
    );
    const mainProp = message.data.properties.find((p) => p.template === 'mainItemId');
    expect(mainProp?.obj).toEqual({ value: slots.main.id });
  });

  it('resolves every catalogue item with image paths', () => {
    for (const item of Object.values(foodCatalogue)) {
      expect(item.image.length).toBeGreaterThan(0);
      expect(item.imagePlaceholder?.length).toBeGreaterThan(0);
      expect(item.imageDedicated?.length).toBeGreaterThan(0);
    }
  });

  it('detects missing catalogue IDs', () => {
    expect(findMissingCatalogueIds(['chicken-steak-with-pesto-sauce-and-pasta', 'missing'])).toEqual([
      'missing',
    ]);
  });
});

describe('menu overrides with generated catalogue', () => {
  it('marks a closed-date override as closed', () => {
    expect(resolveMenuForDate(MENU_DATES.closedOverride)).toEqual({
      status: 'closed',
      reason: 'Public holiday',
    });
  });

  it('uses a replacement override instead of the generated daily menu', () => {
    const normal = resolveMenuForDate(MENU_DATES.replaceOverrideNormalDay);
    const overridden = resolveMenuForDate(MENU_DATES.replaceOverride);
    expect(normal.status).toBe('available');
    expect(overridden.status).toBe('available');
    if (normal.status === 'available' && overridden.status === 'available') {
      expect(overridden.dailyMenuId).toBe(`override-${MENU_DATES.replaceOverride}`);
      expect(overridden.items.map((item) => item.id)).not.toEqual(normal.items.map((item) => item.id));
      expect(overridden.items[0]?.id).toBe('thai-pork-meatballs-with-rice');
    }
  });

  it('preserves the optional closure reason', () => {
    expect(getOverrideReason(MENU_DATES.closedOverride)).toBe('Public holiday');
  });
});

describe('generated daily menu integrity', () => {
  it('defines one record per workbook lunch day', () => {
    expect(getAllGeneratedDailyMenus().length).toBeGreaterThan(0);
  });
});
