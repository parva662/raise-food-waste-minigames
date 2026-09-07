import { describe, expect, it } from 'vitest';
import { fromZonedTime } from 'date-fns-tz';
import { CHEF_CONFIG } from '../config/chef';
import {
  getChefForecastCutoffInstant,
  isChefForecastActivityEligible,
  isChefForecastSubmissionInstantEligible,
} from './chefForecastEligibilityPolicy';
import { buildAnonymizedChefForecastActivity } from '../serviceCloseout/forecast/fixtures/gameBusChefForecastActivities';
import { parseGameBusChefForecastActivities } from '../serviceCloseout/forecast/parseGameBusChefForecast';

const SERVICE_DATE = '2026-08-17';

function helsinki(dateIso: string, time: string): Date {
  return fromZonedTime(`${dateIso} ${time}`, CHEF_CONFIG.timezone);
}

describe('chefForecastEligibilityPolicy', () => {
  it('treats submissions strictly before 09:00 on the target service date as eligible', () => {
    expect(isChefForecastSubmissionInstantEligible(helsinki(SERVICE_DATE, '08:59:59'), SERVICE_DATE)).toBe(
      true,
    );
    expect(isChefForecastSubmissionInstantEligible(helsinki(SERVICE_DATE, '09:00:00'), SERVICE_DATE)).toBe(
      false,
    );
    expect(isChefForecastSubmissionInstantEligible(helsinki(SERVICE_DATE, '09:05:00'), SERVICE_DATE)).toBe(
      false,
    );
  });

  it('allows earlier operational days before the service-date cutoff', () => {
    expect(
      isChefForecastSubmissionInstantEligible(helsinki('2026-08-14', '18:00:00'), SERVICE_DATE),
    ).toBe(true);
  });

  it('uses Helsinki timezone for the cutoff instant', () => {
    const cutoff = getChefForecastCutoffInstant(SERVICE_DATE);
    expect(cutoff.toISOString()).toBe('2026-08-17T06:00:00.000Z');
  });

  it('evaluates activity eligibility from submittedAt with createdAt fallback', () => {
    const { valid } = parseGameBusChefForecastActivities([
      buildAnonymizedChefForecastActivity({
        targetDate: SERVICE_DATE,
        submittedAt: '2026-08-17T05:30:00.000Z',
      }),
    ]);
    expect(isChefForecastActivityEligible(valid[0]!)).toBe(true);

    const { valid: late } = parseGameBusChefForecastActivities([
      buildAnonymizedChefForecastActivity({
        targetDate: SERVICE_DATE,
        submittedAt: '2026-08-17T06:05:00.000Z',
      }),
    ]);
    expect(isChefForecastActivityEligible(late[0]!)).toBe(false);
  });
});
