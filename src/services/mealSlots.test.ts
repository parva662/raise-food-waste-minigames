import { describe, it, expect } from 'vitest';
import {
  getDailyMenuCatalogueForSlots,
  mealSlotsFromDailyMenu,
  resolveMealSlotsForDate,
} from './mealSlots';
import { FIXTURE_LUNCH_DATE, ROTATION_DATES } from '../test/fixtures/dates';

describe('mealSlots', () => {
  it('resolves slots for fixture lunch date', () => {
    const slots = resolveMealSlotsForDate(FIXTURE_LUNCH_DATE);
    expect(slots).not.toBeNull();
    expect(slots!.main.category).toBe('classic');
    expect(slots!.vegetarian.category).toBe('vegetarian');
    expect(slots!.soup.category).toBe('soup');
    expect(slots!.dessert.category).toBe('dessert');
  });

  it('uses the first item in each daily menu section', () => {
    for (const dailyMenu of getDailyMenuCatalogueForSlots()) {
      const slots = mealSlotsFromDailyMenu(dailyMenu);
      expect(slots).not.toBeNull();
      expect(slots!.main.id).toBe(dailyMenu.classic[0]);
      expect(slots!.vegetarian.id).toBe(dailyMenu.vegetarian[0]);
      expect(slots!.soup.id).toBe(dailyMenu.soups[0]);
      expect(slots!.dessert.id).toBe(dailyMenu.desserts[0]);
    }
  });

  it('returns null for unavailable dates', () => {
    expect(resolveMealSlotsForDate(ROTATION_DATES.beforeValidity)).toBeNull();
  });
});
