import { describe, expect, it, vi, afterEach } from 'vitest';
import { helsinki } from '../test/fixtures/dates';
import { resolveChefForecastServiceDate } from '../services/operationalServiceCalendar';
import { resolveMealSlotsForDate } from '../services/mealSlots';
import { MENU_DATES } from '../test/fixtures/dates';
import { mockExplicitClosures } from '../test/fixtures/serviceCalendar';
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

  it('keeps today as the target before the grace window opens', () => {
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.mondayAug17, '00:00:00'))).toBe(
      SERVICE_DATES.mondayAug17,
    );
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.mondayAug17, '07:59:59'))).toBe(
      SERVICE_DATES.mondayAug17,
    );
  });

  it('targets Monday when opened Monday at 08:00:00', () => {
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.mondayAug17, '08:00:00'))).toBe(
      SERVICE_DATES.mondayAug17,
    );
  });

  it('targets Monday when opened Monday at 08:29:59', () => {
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.mondayAug17, '08:29:59'))).toBe(
      SERVICE_DATES.mondayAug17,
    );
  });

  it('targets Tuesday when opened Monday exactly at 08:30:00', () => {
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.mondayAug17, '08:30:00'))).toBe(
      SERVICE_DATES.tuesdayAug18,
    );
  });

  it('targets Tuesday when opened Monday at 08:30:01', () => {
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.mondayAug17, '08:30:01'))).toBe(
      SERVICE_DATES.tuesdayAug18,
    );
  });

  it('targets Tuesday when opened Monday after the cutoff', () => {
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.mondayAug17, '15:00:00'))).toBe(
      SERVICE_DATES.tuesdayAug18,
    );
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.mondayAug17, '15:37:00'))).toBe(
      SERVICE_DATES.tuesdayAug18,
    );
  });

  it('targets Friday when opened Friday at 08:29:59', () => {
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.fridayAug14, '08:29:59'))).toBe(
      SERVICE_DATES.fridayAug14,
    );
  });

  it('targets Monday when opened Friday at 08:30:00', () => {
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.fridayAug14, '08:30:00'))).toBe(
      SERVICE_DATES.mondayAug17,
    );
  });

  it('targets Monday when opened Friday afternoon', () => {
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.fridayAug14, '15:00:00'))).toBe(
      SERVICE_DATES.mondayAug17,
    );
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.fridayAug14, '23:59:59'))).toBe(
      SERVICE_DATES.mondayAug17,
    );
  });

  it('targets Monday when opened on Saturday', () => {
    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.saturdayAug15, '12:00:00'))).toBe(
      SERVICE_DATES.mondayAug17,
    );
  });

  it('targets Tuesday when Monday is explicitly closed', () => {
    mockExplicitClosures(SERVICE_DATES.mondayAug17);

    expect(resolveChefForecastServiceDate(helsinki(SERVICE_DATES.fridayAug14, '15:00:00'))).toBe(
      SERVICE_DATES.tuesdayAug18,
    );
  });

  it('keeps a weekday target whose menu data is unavailable', () => {
    const wednesdayWithoutMenu = MENU_DATES.missingFromWorkbook;
    expect(menuResolverModule.resolveMenuForDate(wednesdayWithoutMenu).status).toBe('unavailable');

    expect(resolveChefForecastServiceDate(helsinki(wednesdayWithoutMenu, '08:00:00'))).toBe(
      wednesdayWithoutMenu,
    );
    expect(resolveChefForecastServiceDate(helsinki('2026-01-06', '15:00:00'))).toBe(
      wednesdayWithoutMenu,
    );
  });

  it('loads Monday menu items for a Friday forecast session', () => {
    const slots = resolveMealSlotsForDate(SERVICE_DATES.mondayAug17);
    expect(slots).not.toBeNull();
    expect(slots!.main.id).toBe('coq-au-vin-with-rice');
  });
});
