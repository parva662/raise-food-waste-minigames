import { describe, expect, it } from 'vitest';
import { fromZonedTime } from 'date-fns-tz';
import { CHEF_CONFIG } from '../../config/chef';
import { parseGameBusChefForecastActivities } from './parseGameBusChefForecast';
import { buildAnonymizedChefForecastActivity } from './fixtures/gameBusChefForecastActivities';
import { selectCurrentUserForecastForDate, selectForecastsForDate } from './selectCloseoutForecast';

const serviceDate = '2026-07-29';
const mondayServiceDate = '2026-08-17';

function helsinki(dateIso: string, time: string): string {
  return fromZonedTime(`${dateIso} ${time}`, CHEF_CONFIG.timezone).toISOString();
}

describe('selectForecastsForDate', () => {
  it('keeps two different actors for the same service date', () => {
    const { valid } = parseGameBusChefForecastActivities([
      buildAnonymizedChefForecastActivity({
        id: 'f-1',
        actorId: 'user-a',
        actorName: 'Aino Virtanen',
        targetDate: serviceDate,
        forecastMain: 44,
      }),
      buildAnonymizedChefForecastActivity({
        id: 'f-2',
        actorId: 'user-b',
        actorName: 'Kitchen Staff 2',
        targetDate: serviceDate,
        forecastMain: 47,
      }),
    ]);

    const selected = selectForecastsForDate(valid, serviceDate);
    expect(selected).toHaveLength(2);
    expect(selected.map((forecast) => forecast.actorName)).toEqual([
      'Aino Virtanen',
      'Kitchen Staff 2',
    ]);
  });

  it('uses latest submission for duplicate same actor and date', () => {
    const { valid } = parseGameBusChefForecastActivities([
      buildAnonymizedChefForecastActivity({
        id: 'f-old',
        actorId: 'user-a',
        actorName: 'Aino Virtanen',
        targetDate: serviceDate,
        submittedAt: '2026-07-28T10:00:00.000Z',
        forecastMain: 40,
      }),
      buildAnonymizedChefForecastActivity({
        id: 'f-new',
        actorId: 'user-a',
        actorName: 'Aino Virtanen',
        targetDate: serviceDate,
        submittedAt: '2026-07-28T16:00:00.000Z',
        forecastMain: 44,
      }),
    ]);

    const selected = selectForecastsForDate(valid, serviceDate);
    expect(selected).toHaveLength(1);
    expect(selected[0]!.forecastMain).toBe(44);
  });

  it('requires exact targetDate match', () => {
    const { valid } = parseGameBusChefForecastActivities([
      buildAnonymizedChefForecastActivity({ targetDate: '2026-07-30' }),
    ]);
    expect(selectForecastsForDate(valid, serviceDate)).toHaveLength(0);
  });

  it('rejects forecasts submitted at or after the service-date cutoff before deduplication', () => {
    const { valid } = parseGameBusChefForecastActivities([
      buildAnonymizedChefForecastActivity({
        id: 'f-valid',
        actorId: 'user-a',
        actorName: 'Aino Virtanen',
        targetDate: mondayServiceDate,
        submittedAt: helsinki(mondayServiceDate, '08:29:59'),
        forecastMain: 44,
      }),
      buildAnonymizedChefForecastActivity({
        id: 'f-late',
        actorId: 'user-a',
        actorName: 'Aino Virtanen',
        targetDate: mondayServiceDate,
        submittedAt: helsinki(mondayServiceDate, '08:30:00'),
        forecastMain: 99,
      }),
    ]);

    const selected = selectForecastsForDate(valid, mondayServiceDate);
    expect(selected).toHaveLength(1);
    expect(selected[0]!.forecastMain).toBe(44);
  });

  it('returns no forecast when all submissions for an actor are after cutoff', () => {
    const { valid } = parseGameBusChefForecastActivities([
      buildAnonymizedChefForecastActivity({
        actorId: 'user-a',
        actorName: 'Aino Virtanen',
        targetDate: mondayServiceDate,
        submittedAt: helsinki(mondayServiceDate, '08:30:01'),
      }),
    ]);

    expect(selectForecastsForDate(valid, mondayServiceDate)).toHaveLength(0);
    expect(selectCurrentUserForecastForDate(valid, mondayServiceDate, 'user-a')).toBeNull();
  });
});

describe('selectCurrentUserForecastForDate', () => {
  it('returns only the matching authenticated actor', () => {
    const { valid } = parseGameBusChefForecastActivities([
      buildAnonymizedChefForecastActivity({
        actorId: 'user-a',
        actorName: 'Staff One',
        targetDate: serviceDate,
        forecastMain: 200,
      }),
      buildAnonymizedChefForecastActivity({
        actorId: 'user-b',
        actorName: 'Staff Two',
        targetDate: serviceDate,
        forecastMain: 300,
      }),
    ]);

    expect(selectCurrentUserForecastForDate(valid, serviceDate, 'user-b')?.forecastMain).toBe(300);
    expect(selectCurrentUserForecastForDate(valid, serviceDate, 'user-a')?.actorName).toBe('Staff One');
  });
});
