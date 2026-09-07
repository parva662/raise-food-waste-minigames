import { describe, expect, it } from 'vitest';
import { fromZonedTime } from 'date-fns-tz';
import { CHEF_CONFIG } from '../config/chef';
import {
  formatChefForecastDeadlineLabel,
  getChefForecastCutoffInstant,
  isChefForecastActivityEligible,
  isChefForecastSubmissionInstantEligible,
} from './chefForecastEligibilityPolicy';
import { buildAnonymizedChefForecastActivity } from '../serviceCloseout/forecast/fixtures/gameBusChefForecastActivities';
import { parseGameBusChefForecastActivities } from '../serviceCloseout/forecast/parseGameBusChefForecast';

const SERVICE_DATE = '2026-08-17';
const TUESDAY_SERVICE_DATE = '2026-08-18';

function helsinki(dateIso: string, time: string): Date {
  return fromZonedTime(`${dateIso} ${time}`, CHEF_CONFIG.timezone);
}

describe('chefForecastEligibilityPolicy', () => {
  it('treats submissions strictly before 08:30 on the target service date as eligible', () => {
    expect(isChefForecastSubmissionInstantEligible(helsinki(SERVICE_DATE, '08:29:59'), SERVICE_DATE)).toBe(
      true,
    );
    expect(isChefForecastSubmissionInstantEligible(helsinki(SERVICE_DATE, '08:30:00'), SERVICE_DATE)).toBe(
      false,
    );
    expect(isChefForecastSubmissionInstantEligible(helsinki(SERVICE_DATE, '08:30:01'), SERVICE_DATE)).toBe(
      false,
    );
  });

  it('evaluates Tuesday target-day eligibility at the 08:30 boundary', () => {
    expect(
      isChefForecastSubmissionInstantEligible(helsinki(TUESDAY_SERVICE_DATE, '08:29:59'), TUESDAY_SERVICE_DATE),
    ).toBe(true);
    expect(
      isChefForecastSubmissionInstantEligible(helsinki(TUESDAY_SERVICE_DATE, '08:30:00'), TUESDAY_SERVICE_DATE),
    ).toBe(false);
    expect(
      isChefForecastSubmissionInstantEligible(helsinki(TUESDAY_SERVICE_DATE, '08:30:01'), TUESDAY_SERVICE_DATE),
    ).toBe(false);
  });

  it('allows earlier operational days before the service-date cutoff', () => {
    expect(
      isChefForecastSubmissionInstantEligible(helsinki('2026-08-14', '18:00:00'), SERVICE_DATE),
    ).toBe(true);
  });

  it('uses Helsinki timezone for the cutoff instant', () => {
    const cutoff = getChefForecastCutoffInstant(SERVICE_DATE);
    expect(cutoff.toISOString()).toBe('2026-08-17T05:30:00.000Z');
  });

  it('formats the deadline label from CHEF_CONFIG', () => {
    expect(formatChefForecastDeadlineLabel()).toBe('08:30 on service day');
  });

  it('evaluates activity eligibility from submittedAt with createdAt fallback', () => {
    const { valid } = parseGameBusChefForecastActivities([
      buildAnonymizedChefForecastActivity({
        targetDate: SERVICE_DATE,
        submittedAt: '2026-08-17T05:29:59.000Z',
      }),
    ]);
    expect(isChefForecastActivityEligible(valid[0]!)).toBe(true);

    const { valid: late } = parseGameBusChefForecastActivities([
      buildAnonymizedChefForecastActivity({
        targetDate: SERVICE_DATE,
        submittedAt: '2026-08-17T05:30:00.000Z',
      }),
    ]);
    expect(isChefForecastActivityEligible(late[0]!)).toBe(false);
  });
});
