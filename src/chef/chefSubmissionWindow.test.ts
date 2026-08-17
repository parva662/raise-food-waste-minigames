import { describe, expect, it } from 'vitest';
import { fromZonedTime } from 'date-fns-tz';
import { CHEF_CONFIG } from '../config/chef';
import {
  createChefForecastSubmission,
  getChefSubmissionPhase,
  isChefSubmissionAllowed,
} from './chefSubmissionWindow';
import { helsinki } from '../test/fixtures/dates';

const SERVICE_DATES = {
  fridayAug14: '2026-08-14',
  mondayAug17: '2026-08-17',
  tuesdayAug18: '2026-08-18',
} as const;

function chefInstant(dateIso: string, time: string): Date {
  return fromZonedTime(`${dateIso} ${time}`, CHEF_CONFIG.timezone);
}

describe('chef submission window operational days', () => {
  it('uses Friday as the submission day for a Monday service date', () => {
    expect(getChefSubmissionPhase(chefInstant(SERVICE_DATES.fridayAug14, '17:30:00'), SERVICE_DATES.mondayAug17)).toBe(
      'on-time',
    );
    expect(
      isChefSubmissionAllowed(chefInstant(SERVICE_DATES.fridayAug14, '22:30:00'), SERVICE_DATES.mondayAug17),
    ).toBe(true);
    expect(
      getChefSubmissionPhase(chefInstant(SERVICE_DATES.fridayAug14, '23:00:01'), SERVICE_DATES.mondayAug17),
    ).toBe('closed');
  });

  it('does not treat Sunday as the submission day for Monday service', () => {
    expect(
      getChefSubmissionPhase(helsinki('2026-08-16', '12:00:00'), SERVICE_DATES.mondayAug17),
    ).toBe('closed');
  });

  it('uses the previous weekday for an ordinary Tuesday service', () => {
    expect(
      getChefSubmissionPhase(chefInstant(SERVICE_DATES.mondayAug17, '17:30:00'), SERVICE_DATES.tuesdayAug18),
    ).toBe('on-time');
    expect(
      getChefSubmissionPhase(chefInstant(SERVICE_DATES.mondayAug17, '23:00:01'), SERVICE_DATES.tuesdayAug18),
    ).toBe('closed');
  });

  it('creates submissions with the resolved service date as targetDate', () => {
    const clock = () => chefInstant(SERVICE_DATES.fridayAug14, '12:00:00');
    const submission = createChefForecastSubmission(SERVICE_DATES.mondayAug17, clock);
    expect(submission).toEqual({
      targetDate: SERVICE_DATES.mondayAug17,
      timingStatus: 'on-time',
      submittedAt: clock().toISOString(),
    });
  });

  it('preserves Helsinki deadline semantics for on-time and late periods', () => {
    expect(
      getChefSubmissionPhase(chefInstant(SERVICE_DATES.fridayAug14, '18:00:00'), SERVICE_DATES.mondayAug17),
    ).toBe('on-time');
    expect(
      getChefSubmissionPhase(chefInstant(SERVICE_DATES.fridayAug14, '18:00:01'), SERVICE_DATES.mondayAug17),
    ).toBe('late');
    expect(
      getChefSubmissionPhase(chefInstant(SERVICE_DATES.fridayAug14, '22:59:59'), SERVICE_DATES.mondayAug17),
    ).toBe('late');
  });
});
