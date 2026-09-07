import { describe, expect, it, vi, afterEach } from 'vitest';
import { helsinki } from '../test/fixtures/dates';
import {
  OperationalCalendarError,
  resolveChefForecastServiceDate,
} from '../services/operationalServiceCalendar';
import { resolveMealSlotsForDate } from '../services/mealSlots';
import { MENU_DATES } from '../test/fixtures/dates';
import * as menuResolverModule from '../services/menuResolver';

const SERVICE_DATES = {
  fridayAug14: '2026-08-14',
  mondayAug17: '2026-08-17',
  tuesdayAug18: '2026-08-18',
  saturdayAug15: '2026-08-15',
} as const;

describe('kitchen forecast service date', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('targets Monday when opened Monday at 08:59', () => {
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.mondayAug17, '08:59:59'))).toBe(
      SERVICE_DATES.mondayAug17,
    );
  });

  it('targets Tuesday when opened Monday exactly at 09:00', () => {
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.mondayAug17, '09:00:00'))).toBe(
      SERVICE_DATES.tuesdayAug18,
    );
  });

  it('targets Tuesday when opened Monday after 09:00', () => {
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.mondayAug17, '15:00:00'))).toBe(
      SERVICE_DATES.tuesdayAug18,
    );
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.mondayAug17, '15:37:00'))).toBe(
      SERVICE_DATES.tuesdayAug18,
    );
  });

  it('targets Monday when opened Friday afternoon', () => {
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.fridayAug14, '15:00:00'))).toBe(
      SERVICE_DATES.mondayAug17,
    );
  });

  it('targets Monday when opened on Saturday', () => {
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.saturdayAug15, '12:00:00'))).toBe(
      SERVICE_DATES.mondayAug17,
    );
  });

  it('targets Tuesday when Monday is explicitly closed', () => {
    vi.spyOn(menuResolverModule, 'resolveMenuForDate').mockImplementation((isoDate) => {
      if (isoDate === SERVICE_DATES.mondayAug17) {
        return { status: 'closed', reason: 'Public holiday' };
      }
      if (isoDate === SERVICE_DATES.fridayAug14 || isoDate === SERVICE_DATES.tuesdayAug18) {
        return {
          status: 'available',
          items: [],
          dailyMenuId: `dated-${isoDate}`,
          menuCycleWeek: 1,
          menuVersion: 'test',
        };
      }
      return { status: 'unavailable' };
    });

    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.fridayAug14, '15:00:00'))).toBe(
      SERVICE_DATES.tuesdayAug18,
    );
  });

  it('fails safely when a weekday menu is unavailable', () => {
    expect(() => resolveChefForecastServiceDate(helsinki(MENU_DATES.missingFromWorkbook, '08:00:00'))).toThrow(
      OperationalCalendarError,
    );
  });

  it('loads Monday menu items for a Friday forecast session', () => {
    const slots = resolveMealSlotsForDate(SERVICE_DATES.mondayAug17);
    expect(slots).not.toBeNull();
    expect(slots!.main.id).toBe('coq-au-vin-with-rice');
  });
});
