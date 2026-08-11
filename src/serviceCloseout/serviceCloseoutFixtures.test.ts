import { describe, it, expect } from 'vitest';
import {
  FIXTURE_KITCHEN_STAFF,
  FIXTURE_SERVICE_DAY_STAFF,
  getFixtureStaffDay,
  getHeadChefOptionsForDate,
} from './fixtures/staffRotation';
import {
  FIXTURE_CHEF_FORECASTS,
  getFixtureChefForecastsForDate,
} from './fixtures/chefForecastFixtures';

describe('service closeout development fixtures', () => {
  it('defines five fictional kitchen users', () => {
    expect(FIXTURE_KITCHEN_STAFF.length).toBe(5);
  });

  it('covers five consecutive service dates with rotating participation', () => {
    expect(FIXTURE_SERVICE_DAY_STAFF.length).toBe(5);
    expect(FIXTURE_SERVICE_DAY_STAFF[0].targetDate).toBe('2026-07-27');
    expect(FIXTURE_SERVICE_DAY_STAFF[4].targetDate).toBe('2026-07-31');
  });

  it('rotates head chef across days', () => {
    const headChefs = FIXTURE_SERVICE_DAY_STAFF.map((day) => day.headChefUserId);
    expect(new Set(headChefs).size).toBeGreaterThan(1);
    expect(headChefs).toEqual([
      'fixture-user-a',
      'fixture-user-c',
      'fixture-user-e',
      'fixture-user-b',
      'fixture-user-d',
    ]);
  });

  it('does not include every user on every day', () => {
    const monday = getFixtureStaffDay('2026-07-27')!;
    expect(monday.participantUserIds).not.toContain('fixture-user-d');
    expect(monday.participantUserIds).not.toContain('fixture-user-e');
  });

  it('limits head chef options to participants for a known date', () => {
    const options = getHeadChefOptionsForDate('2026-07-29');
    expect(options.map((o) => o.userId).sort()).toEqual([
      'fixture-user-a',
      'fixture-user-c',
      'fixture-user-e',
    ]);
  });

  it('provides isolated chef forecast fixtures per user and date', () => {
    const wednesday = getFixtureChefForecastsForDate('2026-07-29');
    expect(wednesday.length).toBe(3);
    expect(FIXTURE_CHEF_FORECASTS.length).toBeGreaterThan(10);
    const customers = wednesday.map((f) => f.expectedCustomers);
    expect(new Set(customers).size).toBeGreaterThan(1);
  });
});
