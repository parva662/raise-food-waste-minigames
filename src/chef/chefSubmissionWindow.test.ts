import { describe, expect, it } from 'vitest';
import { fromZonedTime } from 'date-fns-tz';
import { CHEF_CONFIG } from '../config/chef';
import { getChefForecastCutoffInstant } from '../services/chefForecastEligibilityPolicy';
import {
  createChefForecastSubmission,
  getChefSubmissionPhase,
  getChefSubmissionWindowStatus,
  isChefSubmissionAllowed,
} from './chefSubmissionWindow';

const SERVICE_DATES = {
  fridayAug14: '2026-08-14',
  mondayAug17: '2026-08-17',
  tuesdayAug18: '2026-08-18',
} as const;

function chefInstant(dateIso: string, time: string): Date {
  return fromZonedTime(`${dateIso} ${time}`, CHEF_CONFIG.timezone);
}

describe('chef submission window', () => {
  it('allows submission before 08:30 on the target service date', () => {
    expect(
      getChefSubmissionPhase(chefInstant(SERVICE_DATES.mondayAug17, '08:29:59'), SERVICE_DATES.mondayAug17),
    ).toBe('on-time');
    expect(
      isChefSubmissionAllowed(chefInstant(SERVICE_DATES.mondayAug17, '08:29:59'), SERVICE_DATES.mondayAug17),
    ).toBe(true);
  });

  it('closes submission at exactly 08:30 on the target service date', () => {
    expect(
      getChefSubmissionPhase(chefInstant(SERVICE_DATES.mondayAug17, '08:30:00'), SERVICE_DATES.mondayAug17),
    ).toBe('closed');
    expect(
      isChefSubmissionAllowed(chefInstant(SERVICE_DATES.mondayAug17, '08:30:01'), SERVICE_DATES.mondayAug17),
    ).toBe(false);
  });

  it('allows Friday submissions for a Monday service date before Monday 08:30', () => {
    expect(
      isChefSubmissionAllowed(chefInstant(SERVICE_DATES.fridayAug14, '15:00:00'), SERVICE_DATES.mondayAug17),
    ).toBe(true);
  });

  it('creates submissions with on-time timingStatus before cutoff', () => {
    const clock = () => chefInstant(SERVICE_DATES.mondayAug17, '08:29:59');
    const submission = createChefForecastSubmission(SERVICE_DATES.mondayAug17, clock);
    expect(submission).toEqual({
      targetDate: SERVICE_DATES.mondayAug17,
      timingStatus: 'on-time',
      submittedAt: clock().toISOString(),
    });
  });

  it('refuses ACTIVITY creation at or after cutoff', () => {
    const clock = () => chefInstant(SERVICE_DATES.mondayAug17, '08:30:00');
    expect(createChefForecastSubmission(SERVICE_DATES.mondayAug17, clock)).toBeNull();
    expect(
      createChefForecastSubmission(
        SERVICE_DATES.mondayAug17,
        () => chefInstant(SERVICE_DATES.mondayAug17, '08:35:00'),
      ),
    ).toBeNull();
  });

  it('allows submissions on earlier operational days until the service-date cutoff', () => {
    expect(
      getChefSubmissionPhase(chefInstant(SERVICE_DATES.fridayAug14, '23:30:00'), SERVICE_DATES.mondayAug17),
    ).toBe('on-time');
    expect(
      getChefSubmissionPhase(chefInstant(SERVICE_DATES.mondayAug17, '08:00:00'), SERVICE_DATES.tuesdayAug18),
    ).toBe('on-time');
  });

  it('counts down to the 08:30 Helsinki cutoff on the target service date', () => {
    const now = chefInstant(SERVICE_DATES.mondayAug17, '15:37:00');
    const status = getChefSubmissionWindowStatus(now, SERVICE_DATES.tuesdayAug18);
    expect(status.countdownTargetIso).toBe(
      getChefForecastCutoffInstant(SERVICE_DATES.tuesdayAug18).toISOString(),
    );
  });
});
