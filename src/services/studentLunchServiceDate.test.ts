import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  resolveStudentLunchServiceDate,
  tryResolveStudentLunchServiceDate,
} from './studentLunchServiceDate';
import { helsinki } from '../test/fixtures/dates';
import { mockExplicitClosures } from '../test/fixtures/serviceCalendar';
import * as menuResolverModule from './menuResolver';

const DATES = {
  mondayAug10: '2026-08-10',
  tuesdayAug11: '2026-08-11',
  fridayAug14: '2026-08-14',
  saturdayAug15: '2026-08-15',
  sundayAug16: '2026-08-16',
  mondayAug17: '2026-08-17',
  tuesdayAug18: '2026-08-18',
} as const;

describe('resolveStudentLunchServiceDate', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves Friday to Monday skipping the weekend', () => {
    const friday = helsinki(DATES.fridayAug14, '12:00:00');
    expect(resolveStudentLunchServiceDate(friday)).toBe(DATES.mondayAug17);
  });

  it('does not offer Saturday or Sunday from Friday', () => {
    const friday = helsinki(DATES.fridayAug14, '15:00:00');
    const resolved = resolveStudentLunchServiceDate(friday);
    expect(resolved).not.toBe(DATES.saturdayAug15);
    expect(resolved).not.toBe(DATES.sundayAug16);
  });

  it('skips an explicitly closed Monday and targets Tuesday', () => {
    mockExplicitClosures(DATES.mondayAug17);

    const friday = helsinki(DATES.fridayAug14, '12:00:00');
    expect(resolveStudentLunchServiceDate(friday)).toBe(DATES.tuesdayAug18);
  });

  it('skips consecutive closed weekdays until the next operational service', () => {
    mockExplicitClosures('2026-08-17', '2026-08-18', '2026-08-19');

    const friday = helsinki('2026-08-14', '12:00:00');
    expect(resolveStudentLunchServiceDate(friday)).toBe('2026-08-20');
  });

  it('does not skip a weekday merely because menu data is unavailable', () => {
    const wednesdayWithoutMenu = '2026-01-07';
    expect(menuResolverModule.resolveMenuForDate(wednesdayWithoutMenu).status).toBe('unavailable');

    const tuesday = helsinki('2026-01-06', '12:00:00');
    expect(resolveStudentLunchServiceDate(tuesday)).toBe(wednesdayWithoutMenu);
  });

  it('uses Europe/Helsinki operational calendar of the provided instant', () => {
    const mondayEvening = helsinki(DATES.mondayAug10, '23:30:00');
    expect(resolveStudentLunchServiceDate(mondayEvening)).toBe(DATES.tuesdayAug11);
  });

  it('tryResolve returns the next operational service for a normal weekday', () => {
    const result = tryResolveStudentLunchServiceDate(helsinki('2026-07-28', '12:00:00'));
    expect(result).toEqual({ ok: true, lunchDate: '2026-07-29' });
  });
});
