/** Parsed read model for an inbound GameBus chefForecast activity. */
export type GameBusChefForecast = {
  activityId: string;
  actorId: string;
  actorName: string;
  createdAt: string;
  submittedAt: string | null;
  targetDate: string;

  forecastTotalCustomers: number;
  forecastMain: number;
  forecastVegetarian: number;
  forecastSoup: number;
  forecastDessert: number | null;

  mainItemId: string | null;
  vegetarianItemId: string | null;
  soupItemId: string | null;
  dessertItemId: string | null;

  confidence: number | null;
  notes: string | null;
  timingStatus: string | null;
};

export type GameBusChefForecastPropertyRef =
  | 'submittedAt'
  | 'targetDate'
  | 'forecastTotalCustomers'
  | 'forecastMeat'
  | 'forecastVegetarian'
  | 'forecastSoup'
  | 'forecastDessert'
  | 'mainItemId'
  | 'vegetarianItemId'
  | 'soupItemId'
  | 'dessertItemId'
  | 'confidence'
  | 'notes'
  | 'timingStatus';

/** Minimum property references required for a usable closeout forecast. */
export const USABLE_CHEF_FORECAST_REQUIRED_REFS: readonly GameBusChefForecastPropertyRef[] = [
  'targetDate',
  'forecastTotalCustomers',
  'forecastMeat',
  'forecastVegetarian',
  'forecastSoup',
] as const;

export type ChefForecastParseDiagnostic = {
  activityId: string | null;
  reason: 'empty_properties' | 'missing_required' | 'invalid_value' | 'not_chef_forecast';
  missingRefs?: readonly GameBusChefForecastPropertyRef[];
  invalidRefs?: readonly GameBusChefForecastPropertyRef[];
  presentRefs?: readonly string[];
};

export type ParsedChefForecastActivity =
  | { ok: true; forecast: GameBusChefForecast; presentRefs: readonly string[] }
  | { ok: false; diagnostic: ChefForecastParseDiagnostic };

export type ChefForecastParseBatchResult = {
  valid: GameBusChefForecast[];
  rejected: ChefForecastParseDiagnostic[];
};

export type CloseoutChefForecastResolution =
  | { status: 'standalone'; forecasts: readonly GameBusChefForecast[] }
  | { status: 'pending'; forecasts: readonly GameBusChefForecast[] }
  | { status: 'no_forecast'; forecasts: readonly GameBusChefForecast[]; message: string }
  | { status: 'matched'; forecasts: readonly GameBusChefForecast[]; isSynthetic?: boolean };

export const NO_CLOSEOUT_FORECAST_MESSAGE =
  'No submitted forecast was found for this service date.';
