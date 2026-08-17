import { describe, expect, it } from 'vitest';
import { parseGameBusChefForecastActivities } from './parseGameBusChefForecast';
import { buildAnonymizedChefForecastActivity } from './fixtures/gameBusChefForecastActivities';
import { selectForecastsForDate } from './selectCloseoutForecast';

const serviceDate = '2026-07-29';

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
});
