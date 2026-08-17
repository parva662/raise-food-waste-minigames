import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  OperationalCalendarError,
  resolveChefForecastServiceDate,
  resolveNextServiceDate,
  resolvePreviousOperationalDay,
} from './operationalServiceCalendar';
import { MENU_DATES } from '../test/fixtures/dates';
import { helsinki } from '../test/fixtures/dates';
import * as menuResolverModule from './menuResolver';

const SERVICE_CALENDAR_DATES = {
  mondayAug10: '2026-08-10',
  tuesdayAug11: '2026-08-11',
  fridayAug14: '2026-08-14',
  saturdayAug15: '2026-08-15',
  sundayAug16: '2026-08-16',
  mondayAug17: '2026-08-17',
  tuesdayAug18: '2026-08-18',
} as const;

describe('operational service calendar', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves Monday to Tuesday as the next service date', () => {
    expect(resolveNextServiceDate(SERVICE_CALENDAR_DATES.mondayAug10)).toBe(
      SERVICE_CALENDAR_DATES.tuesdayAug11,
    );
  });

  it('skips Saturday and Sunday from Friday to Monday', () => {
    expect(resolveNextServiceDate(SERVICE_CALENDAR_DATES.fridayAug14)).toBe(
      SERVICE_CALENDAR_DATES.mondayAug17,
    );
  });

  it('skips Saturday when advancing from Friday', () => {
    expect(resolveNextServiceDate(SERVICE_CALENDAR_DATES.fridayAug14)).not.toBe(
      SERVICE_CALENDAR_DATES.saturdayAug15,
    );
  });

  it('skips Sunday when advancing from Saturday', () => {
    expect(resolveNextServiceDate(SERVICE_CALENDAR_DATES.saturdayAug15)).toBe(
      SERVICE_CALENDAR_DATES.mondayAug17,
    );
  });

  it('skips an explicitly closed weekday to the next available service date', () => {
    vi.spyOn(menuResolverModule, 'resolveMenuForDate').mockImplementation((isoDate) => {
      if (isoDate === SERVICE_CALENDAR_DATES.mondayAug17) {
        return { status: 'closed', reason: 'Public holiday' };
      }
      if (
        isoDate === SERVICE_CALENDAR_DATES.fridayAug14 ||
        isoDate === SERVICE_CALENDAR_DATES.tuesdayAug18
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

    expect(resolveNextServiceDate(SERVICE_CALENDAR_DATES.fridayAug14)).toBe(
      SERVICE_CALENDAR_DATES.tuesdayAug18,
    );
  });

  it('does not silently skip a weekday with unavailable menu data', () => {
    expect(() => resolveNextServiceDate(MENU_DATES.missingFromWorkbook)).toThrow(
      OperationalCalendarError,
    );
  });

  it('resolves previous operational day Tuesday to Monday', () => {
    expect(resolvePreviousOperationalDay(SERVICE_CALENDAR_DATES.tuesdayAug11)).toBe(
      SERVICE_CALENDAR_DATES.mondayAug10,
    );
  });

  it('resolves previous operational day Monday to Friday across the weekend', () => {
    expect(resolvePreviousOperationalDay(SERVICE_CALENDAR_DATES.mondayAug17)).toBe(
      SERVICE_CALENDAR_DATES.fridayAug14,
    );
  });

  it('skips closed Monday when resolving previous operational day for Tuesday', () => {
    vi.spyOn(menuResolverModule, 'resolveMenuForDate').mockImplementation((isoDate) => {
      if (isoDate === SERVICE_CALENDAR_DATES.mondayAug17) {
        return { status: 'closed', reason: 'Public holiday' };
      }
      if (
        isoDate === SERVICE_CALENDAR_DATES.fridayAug14 ||
        isoDate === SERVICE_CALENDAR_DATES.tuesdayAug18
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

    expect(resolvePreviousOperationalDay(SERVICE_CALENDAR_DATES.tuesdayAug18)).toBe(
      SERVICE_CALENDAR_DATES.fridayAug14,
    );
  });

  it('resolves chef forecast service date from Helsinki operational Friday to Monday', () => {
    const fridayNoon = helsinki(SERVICE_CALENDAR_DATES.fridayAug14, '12:00:00');
    expect(resolveChefForecastServiceDate(fridayNoon)).toBe(SERVICE_CALENDAR_DATES.mondayAug17);
  });
});

describe('operational service calendar menu resolver integration', () => {
  it('uses generated menu availability for Friday to Monday without overrides', () => {
    const menu = menuResolverModule.resolveMenuForDate(SERVICE_CALENDAR_DATES.mondayAug17);
    expect(menu.status).toBe('available');
    expect(resolveNextServiceDate(SERVICE_CALENDAR_DATES.fridayAug14)).toBe(
      SERVICE_CALENDAR_DATES.mondayAug17,
    );
  });
});
