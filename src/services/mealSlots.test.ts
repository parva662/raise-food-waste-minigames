import { describe, it, expect, vi } from 'vitest';
import { resolveMealSlotsForDate } from './mealSlots';
import { FIXTURE_LUNCH_DATE, MENU_DATES } from '../test/fixtures/dates';
import * as menuResolverModule from './menuResolver';
describe('mealSlots', () => {
  it('resolves slots for fixture lunch date', () => {
    const slots = resolveMealSlotsForDate(FIXTURE_LUNCH_DATE);
    expect(slots).not.toBeNull();
    expect(slots!.main.category).toBe('classic');
    expect(slots!.vegetarian.category).toBe('vegetarian');
    expect(slots!.soup.category).toBe('soup');
    expect(slots!.dessert.category).toBe('dessert');
  });

  it('returns null for unavailable dates', () => {
    expect(resolveMealSlotsForDate(MENU_DATES.missingFromWorkbook)).toBeNull();
  });

  it('returns null for closed workbook days', () => {
    vi.spyOn(menuResolverModule, 'resolveMenuForDate').mockReturnValue({
      status: 'closed',
      reason: 'Canteen closed',
    });
    expect(resolveMealSlotsForDate(MENU_DATES.closedWorkbookDay)).toBeNull();
  });});
