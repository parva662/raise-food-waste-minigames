import { describe, expect, it, vi, afterEach } from 'vitest';
import { helsinki } from '../test/fixtures/dates';
import {
  resolveChefForecastServiceDate,
  resolveChefResultsServiceDate,
} from './operationalServiceCalendar';
import * as menuResolverModule from './menuResolver';

const SERVICE_DATES = {
  fridaySep4: '2026-09-04',
  mondaySep7: '2026-09-07',
  tuesdaySep8: '2026-09-08',
  fridayAug14: '2026-08-14',
  mondayAug17: '2026-08-17',
  tuesdayAug18: '2026-08-18',
  saturdayAug15: '2026-08-15',
  sundayAug16: '2026-08-16',
} as const;

describe('canonical chef results service date', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('targets Friday before Monday 08:30 cutoff on Monday 7 September 2026', () => {
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.mondaySep7, '08:29:59'))).toBe(
      SERVICE_DATES.mondaySep7,
    );
    expect(resolveChefResultsServiceDate(helsinki(SERVICE_DATES.mondaySep7, '08:29:59'))).toBe(
      SERVICE_DATES.fridaySep4,
    );
  });

  it('targets Monday when opened Monday 7 September exactly at 08:30:00', () => {
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.mondaySep7, '08:30:00'))).toBe(
      SERVICE_DATES.tuesdaySep8,
    );
    expect(resolveChefResultsServiceDate(helsinki(SERVICE_DATES.mondaySep7, '08:30:00'))).toBe(
      SERVICE_DATES.mondaySep7,
    );
  });

  it('targets Monday when opened Monday 7 September after the cutoff', () => {
    expect(resolveChefResultsServiceDate(helsinki(SERVICE_DATES.mondaySep7, '08:30:01'))).toBe(
      SERVICE_DATES.mondaySep7,
    );
    expect(resolveChefResultsServiceDate(helsinki(SERVICE_DATES.mondaySep7, '17:36:00'))).toBe(
      SERVICE_DATES.mondaySep7,
    );
  });

  it('targets Friday when opened Friday after the cutoff', () => {
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.fridayAug14, '08:30:00'))).toBe(
      SERVICE_DATES.mondayAug17,
    );
    expect(resolveChefResultsServiceDate(helsinki(SERVICE_DATES.fridayAug14, '08:30:00'))).toBe(
      SERVICE_DATES.fridayAug14,
    );
    expect(resolveChefResultsServiceDate(helsinki(SERVICE_DATES.fridayAug14, '15:00:00'))).toBe(
      SERVICE_DATES.fridayAug14,
    );
  });

  it('targets Friday when opened on Saturday or Sunday', () => {
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.saturdayAug15, '12:00:00'))).toBe(
      SERVICE_DATES.mondayAug17,
    );
    expect(resolveChefResultsServiceDate(helsinki(SERVICE_DATES.saturdayAug15, '12:00:00'))).toBe(
      SERVICE_DATES.fridayAug14,
    );
    expect(resolveChefResultsServiceDate(helsinki(SERVICE_DATES.sundayAug16, '12:00:00'))).toBe(
      SERVICE_DATES.fridayAug14,
    );
  });

  it('skips a closed Monday when resolving the canonical results date', () => {
    vi.spyOn(menuResolverModule, 'resolveMenuForDate').mockImplementation((isoDate) => {
      if (isoDate === SERVICE_DATES.mondayAug17) {
        return { status: 'closed', reason: 'Public holiday' };
      }
      if (
        isoDate === SERVICE_DATES.fridayAug14 ||
        isoDate === SERVICE_DATES.tuesdayAug18
      ) {
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
    expect(resolveChefResultsServiceDate(helsinki(SERVICE_DATES.fridayAug14, '15:00:00'))).toBe(
      SERVICE_DATES.fridayAug14,
    );
  });
});
