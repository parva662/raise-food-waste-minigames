import { resolveMealSlotsForDate } from '../../services/mealSlots';
import { parseGameBusChefForecastActivity } from './parseGameBusChefForecast';
import type { GameBusChefForecast } from './gameBusChefForecastTypes';

const SYNTHETIC_FORECAST_ID = 'synthetic-closeout-test-forecast';
const SYNTHETIC_FORECAST_SUBMITTED_AT = '2020-01-01T10:00:00.000Z';
const SYNTHETIC_FORECAST_CREATED_AT = '2020-01-01T10:00:01.000Z';

export type SyntheticCloseoutActor = {
  id: string;
  name: string;
};

/** Deterministic test-only forecast values for Service Closeout UI exercises. */
export const SYNTHETIC_CLOSEOUT_FORECAST_VALUES = {
  forecastTotalCustomers: 150,
  forecastMain: 105,
  forecastVegetarian: 50,
  forecastSoup: 38,
  forecastDessert: 32,
} as const;

type SyntheticChefForecastProperty = {
  value: { value: unknown };
  template: { reference: string; name: string };
};

type SyntheticChefForecastActivity = {
  id: string;
  actor: { id: string; name: string; image: null };
  createdAt: string;
  template: { reference: 'chefForecast'; name: string };
  properties: SyntheticChefForecastProperty[];
};

function syntheticProperty(
  reference: string,
  name: string,
  value: unknown,
): SyntheticChefForecastProperty {
  return {
    template: { reference, name },
    value: { value },
  };
}

function buildSyntheticChefForecastActivity(
  serviceDate: string,
  authenticatedUser: SyntheticCloseoutActor,
): SyntheticChefForecastActivity {
  const mealSlots = resolveMealSlotsForDate(serviceDate);
  const values = SYNTHETIC_CLOSEOUT_FORECAST_VALUES;

  return {
    id: SYNTHETIC_FORECAST_ID,
    actor: {
      id: authenticatedUser.id,
      name: authenticatedUser.name,
      image: null,
    },
    createdAt: SYNTHETIC_FORECAST_CREATED_AT,
    template: { reference: 'chefForecast', name: 'Chef forecast' },
    properties: [
      syntheticProperty('targetDate', 'Target date', serviceDate),
      syntheticProperty(
        'forecastTotalCustomers',
        'Forecast total customers',
        values.forecastTotalCustomers,
      ),
      syntheticProperty('mainItemId', 'Main item id', mealSlots?.main.id ?? 'synthetic-main-item'),
      syntheticProperty('forecastMeat', 'Forecast meat', values.forecastMain),
      syntheticProperty(
        'vegetarianItemId',
        'Vegetarian item id',
        mealSlots?.vegetarian.id ?? 'synthetic-vegetarian-item',
      ),
      syntheticProperty('forecastVegetarian', 'Forecast vegetarian', values.forecastVegetarian),
      syntheticProperty('soupItemId', 'Soup item id', mealSlots?.soup.id ?? 'synthetic-soup-item'),
      syntheticProperty('forecastSoup', 'Forecast soup', values.forecastSoup),
      syntheticProperty(
        'dessertItemId',
        'Dessert item id',
        mealSlots?.dessert.id ?? 'synthetic-dessert-item',
      ),
      syntheticProperty('forecastDessert', 'Forecast dessert', values.forecastDessert),
      syntheticProperty('submittedAt', 'Submitted at', SYNTHETIC_FORECAST_SUBMITTED_AT),
    ],
  };
}

/**
 * Builds a parsed synthetic chefForecast for the exact closeout service date.
 * Never posted to GameBus and never inserted into INPUT_COLLECTIONS.
 */
export function buildSyntheticCloseoutChefForecast(
  serviceDate: string,
  authenticatedUser: SyntheticCloseoutActor,
): GameBusChefForecast {
  const parsed = parseGameBusChefForecastActivity(
    buildSyntheticChefForecastActivity(serviceDate, authenticatedUser),
  );
  if (!parsed.ok) {
    throw new Error('Synthetic closeout chef forecast fixture is invalid.');
  }

  return parsed.forecast;
}

export function isSyntheticCloseoutForecast(forecast: GameBusChefForecast): boolean {
  return forecast.activityId === SYNTHETIC_FORECAST_ID;
}
