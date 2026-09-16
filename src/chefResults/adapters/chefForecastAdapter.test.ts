import { describe, expect, it } from 'vitest';
import { gameBusChefForecastToCalculationInput } from './chefForecastAdapter';
import type { GameBusChefForecast } from '../../serviceCloseout/forecast/gameBusChefForecastTypes';

function baseForecast(
  overrides: Partial<GameBusChefForecast> = {},
): GameBusChefForecast {
  return {
    activityId: 'a1',
    actorId: 'chef-1',
    actorName: 'Chef One',
    createdAt: '2026-07-27T10:00:00.000Z',
    submittedAt: '2026-07-27T10:00:00+03:00',
    targetDate: '2026-07-28',
    forecastTotalCustomers: 100,
    forecastMain: 40,
    forecastVegetarian: 30,
    forecastSoup: 25,
    forecastDessert: 25,
    mainItemId: null,
    vegetarianItemId: null,
    soupItemId: null,
    dessertItemId: null,
    confidence: null,
    notes: null,
    timingStatus: 'on-time',
    ...overrides,
  };
}

describe('gameBusChefForecastToCalculationInput dessert fallback', () => {
  it('uses soup quantity when dessert forecast is omitted', () => {
    const input = gameBusChefForecastToCalculationInput(
      baseForecast({ forecastDessert: null }),
    );
    expect(input).not.toBeNull();
    expect(input!.soup.forecastQuantity).toBe(25);
    expect(input!.dessert.forecastQuantity).toBe(25);
  });

  it('does not invent zero dessert when dessert is omitted', () => {
    const input = gameBusChefForecastToCalculationInput(
      baseForecast({ forecastDessert: null }),
    );
    expect(input!.dessert.forecastQuantity).not.toBe(0);
  });

  it('keeps an explicit dessert quantity when provided', () => {
    const input = gameBusChefForecastToCalculationInput(
      baseForecast({ forecastDessert: 18 }),
    );
    expect(input!.dessert.forecastQuantity).toBe(18);
  });
});
