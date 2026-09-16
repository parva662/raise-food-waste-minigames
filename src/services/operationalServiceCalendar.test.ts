import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  isOperationalServiceDay,
  resolveChefForecastServiceDate,
  resolveNextServiceDate,
  resolvePreviousOperationalDay,
} from './operationalServiceCalendar';
import { MENU_DATES } from '../test/fixtures/dates';
import { helsinki } from '../test/fixtures/dates';
import { mockExplicitClosures } from '../test/fixtures/serviceCalendar';
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

describe('operational service day classification', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('treats a weekday with available menu data as an operational service day', () => {
    expect(menuResolverModule.resolveMenuForDate(SERVICE_CALENDAR_DATES.mondayAug17).status).toBe(
      'available',
    );
    expect(isOperationalServiceDay(SERVICE_CALENDAR_DATES.mondayAug17)).toBe(true);
  });

  it('still treats a weekday with unavailable menu data as an operational service day', () => {
    expect(menuResolverModule.resolveMenuForDate(MENU_DATES.missingFromWorkbook).status).toBe(
      'unavailable',
    );
    expect(isOperationalServiceDay(MENU_DATES.missingFromWorkbook)).toBe(true);
  });

  it('treats an explicitly closed weekday as non-service', () => {
    expect(isOperationalServiceDay(SERVICE_CALENDAR_DATES.mondayAug17)).toBe(true);

    mockExplicitClosures(SERVICE_CALENDAR_DATES.mondayAug17);
    expect(isOperationalServiceDay(SERVICE_CALENDAR_DATES.mondayAug17)).toBe(false);
  });

  it('treats weekends as non-service', () => {
    expect(isOperationalServiceDay(SERVICE_CALENDAR_DATES.saturdayAug15)).toBe(false);
    expect(isOperationalServiceDay(SERVICE_CALENDAR_DATES.sundayAug16)).toBe(false);
  });
});

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

  it('skips an explicitly closed weekday to the next operational service date', () => {
    mockExplicitClosures(SERVICE_CALENDAR_DATES.mondayAug17);

    expect(resolveNextServiceDate(SERVICE_CALENDAR_DATES.fridayAug14)).toBe(
      SERVICE_CALENDAR_DATES.tuesdayAug18,
    );
  });

  it('does not skip a weekday whose menu data is unavailable', () => {
    const wednesdayWithoutMenu = MENU_DATES.missingFromWorkbook;
    expect(menuResolverModule.resolveMenuForDate(wednesdayWithoutMenu).status).toBe('unavailable');

    expect(resolveNextServiceDate('2026-01-06')).toBe(wednesdayWithoutMenu);
    expect(resolvePreviousOperationalDay('2026-01-08')).toBe(wednesdayWithoutMenu);
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
    mockExplicitClosures(SERVICE_CALENDAR_DATES.mondayAug17);

    expect(resolvePreviousOperationalDay(SERVICE_CALENDAR_DATES.tuesdayAug18)).toBe(
      SERVICE_CALENDAR_DATES.fridayAug14,
    );
  });

  it('resolves kitchen forecast service date from Helsinki operational Friday to Monday', () => {
    const fridayAfternoon = helsinki(SERVICE_CALENDAR_DATES.fridayAug14, '15:00:00');
    expect(resolveChefForecastServiceDate(fridayAfternoon)).toBe(SERVICE_CALENDAR_DATES.mondayAug17);
  });

  it('resolves kitchen forecast service date to today before 08:30 on a service day', () => {
    const mondayMorning = helsinki(SERVICE_CALENDAR_DATES.mondayAug17, '08:29:59');
    expect(resolveChefForecastServiceDate(mondayMorning)).toBe(SERVICE_CALENDAR_DATES.mondayAug17);
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
