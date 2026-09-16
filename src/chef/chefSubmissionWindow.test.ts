import { describe, expect, it } from 'vitest';
import { fromZonedTime } from 'date-fns-tz';
import { CHEF_CONFIG } from '../config/chef';
import {
  getChefAdvanceWindowEndInstant,
  getChefGraceWindowEndInstant,
} from '../services/chefForecastWindow';
import {
  createChefForecastSubmission,
  getChefSubmissionPhase,
  getChefSubmissionWindowStatus,
  isChefSubmissionAllowed,
} from './chefSubmissionWindow';

const SERVICE_DATES = {
  fridayAug14: '2026-08-14',
  saturdayAug15: '2026-08-15',
  mondayAug17: '2026-08-17',
  tuesdayAug18: '2026-08-18',
} as const;

function chefInstant(dateIso: string, time: string): Date {
  return fromZonedTime(`${dateIso} ${time}`, CHEF_CONFIG.timezone);
}

describe('chef submission window', () => {
  it('is closed before the grace window opens on the service date', () => {
    expect(
      getChefSubmissionPhase(chefInstant(SERVICE_DATES.mondayAug17, '07:59:59'), SERVICE_DATES.mondayAug17),
    ).toBe('closed');
  });

  it('is open from 08:00:00 through 08:29:59 on the service date', () => {
    expect(
      getChefSubmissionPhase(chefInstant(SERVICE_DATES.mondayAug17, '08:00:00'), SERVICE_DATES.mondayAug17),
    ).toBe('on-time');
    expect(
      isChefSubmissionAllowed(chefInstant(SERVICE_DATES.mondayAug17, '08:29:59'), SERVICE_DATES.mondayAug17),
    ).toBe(true);
  });

  it('closes the service date at exactly 08:30', () => {
    expect(
      getChefSubmissionPhase(chefInstant(SERVICE_DATES.mondayAug17, '08:30:00'), SERVICE_DATES.mondayAug17),
    ).toBe('closed');
    expect(
      isChefSubmissionAllowed(chefInstant(SERVICE_DATES.mondayAug17, '08:30:01'), SERVICE_DATES.mondayAug17),
    ).toBe(false);
  });

  it('opens the advance window for the next service from 08:30 until midnight', () => {
    expect(
      getChefSubmissionPhase(chefInstant(SERVICE_DATES.fridayAug14, '08:30:00'), SERVICE_DATES.mondayAug17),
    ).toBe('on-time');
    expect(
      isChefSubmissionAllowed(chefInstant(SERVICE_DATES.fridayAug14, '23:59:59'), SERVICE_DATES.mondayAug17),
    ).toBe(true);
    expect(
      isChefSubmissionAllowed(chefInstant(SERVICE_DATES.fridayAug14, '08:29:59'), SERVICE_DATES.mondayAug17),
    ).toBe(false);
  });

  it('is closed on a weekend day between the advance window and the service date', () => {
    expect(
      isChefSubmissionAllowed(chefInstant(SERVICE_DATES.saturdayAug15, '12:00:00'), SERVICE_DATES.mondayAug17),
    ).toBe(false);
  });

  it('creates submissions with on-time timingStatus inside a window', () => {
    const clock = () => chefInstant(SERVICE_DATES.mondayAug17, '08:29:59');
    const submission = createChefForecastSubmission(SERVICE_DATES.mondayAug17, clock);
    expect(submission).toEqual({
      targetDate: SERVICE_DATES.mondayAug17,
      timingStatus: 'on-time',
      submittedAt: clock().toISOString(),
    });
  });

  it('refuses ACTIVITY creation outside an eligible window', () => {
    expect(
      createChefForecastSubmission(SERVICE_DATES.mondayAug17, () =>
        chefInstant(SERVICE_DATES.mondayAug17, '08:30:00'),
      ),
    ).toBeNull();
    expect(
      createChefForecastSubmission(SERVICE_DATES.mondayAug17, () =>
        chefInstant(SERVICE_DATES.mondayAug17, '07:59:59'),
      ),
    ).toBeNull();
    expect(
      createChefForecastSubmission(SERVICE_DATES.mondayAug17, () =>
        chefInstant(SERVICE_DATES.saturdayAug15, '12:00:00'),
      ),
    ).toBeNull();
  });

  it('counts down to 08:30 on the service date during the same-day window', () => {
    const now = chefInstant(SERVICE_DATES.mondayAug17, '08:05:00');
    const status = getChefSubmissionWindowStatus(now, SERVICE_DATES.mondayAug17);

    expect(status.phase).toBe('on-time');
    expect(status.countdownTargetIso).toBe(
      getChefGraceWindowEndInstant(SERVICE_DATES.mondayAug17).toISOString(),
    );
    expect(status.windowLabel).toBe('Deadline 08:30 today');
  });

  it('counts down to midnight during the advance window', () => {
    const now = chefInstant(SERVICE_DATES.mondayAug17, '15:37:00');
    const status = getChefSubmissionWindowStatus(now, SERVICE_DATES.tuesdayAug18);

    expect(status.phase).toBe('on-time');
    expect(status.countdownTargetIso).toBe(
      getChefAdvanceWindowEndInstant(SERVICE_DATES.mondayAug17).toISOString(),
    );
    expect(status.windowLabel).toBe('Deadline midnight tonight');
    expect(status.detailLines.join(' ')).toContain('reopens 08:00–08:30');
  });

  it('explains when the service date opens while entry is still closed', () => {
    const status = getChefSubmissionWindowStatus(
      chefInstant(SERVICE_DATES.mondayAug17, '06:30:00'),
      SERVICE_DATES.mondayAug17,
    );

    expect(status.phase).toBe('closed');
    expect(status.countdownTargetIso).toBeNull();
    expect(status.windowLabel).toBe('Opens 08:00 today');
    expect(status.detailLines.join(' ')).toContain('between 08:00 and 08:30');
  });

  it('explains that a non-operational day has no window', () => {
    const status = getChefSubmissionWindowStatus(
      chefInstant(SERVICE_DATES.saturdayAug15, '12:00:00'),
      SERVICE_DATES.mondayAug17,
    );

    expect(status.phase).toBe('closed');
    expect(status.windowLabel).toBe('Opens 08:30 on the previous service day');
    expect(status.detailLines.join(' ')).toContain('not an operational lunch-service day');
  });
});
