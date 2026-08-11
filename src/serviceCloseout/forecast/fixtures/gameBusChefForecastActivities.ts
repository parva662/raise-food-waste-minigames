import { MENU_DATES } from '../../../test/fixtures/dates';

type RawGameBusProperty = {
  value: { value: unknown };
  template: { reference: string; name: string };
};

export type RawGameBusChefForecastActivity = {
  id: string;
  actor: { id: string; name: string; image?: string | null };
  createdAt: string;
  template: { reference: 'chefForecast'; name: string };
  properties: RawGameBusProperty[];
};

function property(
  reference: string,
  name: string,
  value: unknown,
): RawGameBusProperty {
  return {
    template: { reference, name },
    value: { value },
  };
}

/** Anonymized activity matching the newest observed real GameBus chefForecast shape. */
export function buildAnonymizedChefForecastActivity(
  overrides: {
    id?: string;
    actorId?: string;
    actorName?: string;
    createdAt?: string;
    submittedAt?: string;
    targetDate?: string;
    forecastTotalCustomers?: number;
    forecastMain?: number;
    forecastVegetarian?: number;
    forecastSoup?: number;
    forecastDessert?: number;
    mainItemId?: string;
    vegetarianItemId?: string;
    soupItemId?: string;
    dessertItemId?: string;
    confidence?: number;
    notes?: string;
    timingStatus?: string;
    includeDessert?: boolean;
    includeItemIds?: boolean;
    includeTimingStatus?: boolean;
    propertyOrder?: string[];
  } = {},
): RawGameBusChefForecastActivity {
  const targetDate = overrides.targetDate ?? MENU_DATES.runtimeWednesday;
  const propertyBuilders: Record<string, RawGameBusProperty> = {
    submittedAt: property('submittedAt', 'Submitted at', overrides.submittedAt ?? '2026-07-28T16:05:00.000Z'),
    targetDate: property('targetDate', 'Target date', targetDate),
    forecastTotalCustomers: property(
      'forecastTotalCustomers',
      'Forecast total customers',
      overrides.forecastTotalCustomers ?? 142,
    ),
    mainItemId: property('mainItemId', 'Main item id', overrides.mainItemId ?? 'thai-pork-meatballs'),
    forecastMeat: property('forecastMeat', 'Forecast meat', overrides.forecastMain ?? 100),
    vegetarianItemId: property(
      'vegetarianItemId',
      'Vegetarian item id',
      overrides.vegetarianItemId ?? 'vegetable-lasagne',
    ),
    forecastVegetarian: property(
      'forecastVegetarian',
      'Forecast vegetarian',
      overrides.forecastVegetarian ?? 48,
    ),
    soupItemId: property('soupItemId', 'Soup item id', overrides.soupItemId ?? 'tomato-soup'),
    forecastSoup: property('forecastSoup', 'Forecast soup', overrides.forecastSoup ?? 36),
    dessertItemId: property('dessertItemId', 'Dessert item id', overrides.dessertItemId ?? 'yogurt-berries'),
    forecastDessert: property('forecastDessert', 'Forecast dessert', overrides.forecastDessert ?? 30),
    timingStatus: property('timingStatus', 'Timing status', overrides.timingStatus ?? 'on-time'),
    confidence: property('confidence', 'Confidence', overrides.confidence ?? 4),
    notes: property('notes', 'Notes', overrides.notes ?? 'Steady lunch service expected.'),
  };

  const includeDessert = overrides.includeDessert ?? false;
  const includeItemIds = overrides.includeItemIds ?? true;
  const includeTimingStatus = overrides.includeTimingStatus ?? false;

  const defaultOrder = [
    'targetDate',
    'forecastTotalCustomers',
    ...(includeItemIds ? ['mainItemId'] : []),
    'forecastMeat',
    ...(includeItemIds ? ['vegetarianItemId'] : []),
    'forecastVegetarian',
    ...(includeItemIds ? ['soupItemId'] : []),
    'forecastSoup',
    ...(includeDessert && includeItemIds ? ['dessertItemId'] : []),
    ...(includeDessert ? ['forecastDessert'] : []),
    ...(includeTimingStatus ? ['timingStatus'] : []),
    'submittedAt',
    'confidence',
    'notes',
  ];

  const order = overrides.propertyOrder ?? defaultOrder;
  const properties = order
    .map((ref) => propertyBuilders[ref])
    .filter((entry): entry is RawGameBusProperty => entry !== undefined);

  return {
    id: overrides.id ?? 'activity-forecast-anon-001',
    actor: {
      id: overrides.actorId ?? 'user-anon-chef-001',
      name: overrides.actorName ?? 'Chef A. Example',
      image: null,
    },
    createdAt: overrides.createdAt ?? '2026-07-28T16:05:01.000Z',
    template: { reference: 'chefForecast', name: 'Chef forecast' },
    properties,
  };
}

/** Empty-properties activity observed in real GameBus data. */
export const EMPTY_PROPERTIES_CHEF_FORECAST_ACTIVITY: RawGameBusChefForecastActivity = {
  id: 'activity-forecast-empty',
  actor: { id: 'user-anon-chef-002', name: 'Chef B. Example' },
  createdAt: '2026-07-27T10:00:00.000Z',
  template: { reference: 'chefForecast', name: 'Chef forecast' },
  properties: [],
};

/** Tomorrow forecast that must not match today's closeout. */
export const TOMORROW_CHEF_FORECAST_ACTIVITY = buildAnonymizedChefForecastActivity({
  id: 'activity-forecast-tomorrow',
  targetDate: MENU_DATES.runtimeThursday,
  submittedAt: '2026-08-11T07:30:00.000Z',
  createdAt: '2026-08-11T07:30:01.000Z',
  forecastMain: 88,
});

/** Older duplicate for the same closeout date (earlier submission). */
export const EARLIER_DUPLICATE_CHEF_FORECAST_ACTIVITY = buildAnonymizedChefForecastActivity({
  id: 'activity-forecast-duplicate-old',
  submittedAt: '2026-07-28T08:00:00.000Z',
  createdAt: '2026-07-28T08:00:01.000Z',
  forecastMain: 70,
  forecastTotalCustomers: 120,
});

/** Latest duplicate for the same closeout date. */
export const LATEST_DUPLICATE_CHEF_FORECAST_ACTIVITY = buildAnonymizedChefForecastActivity({
  id: 'activity-forecast-duplicate-new',
  submittedAt: '2026-07-28T18:00:00.000Z',
  createdAt: '2026-07-28T18:00:01.000Z',
  forecastMain: 100,
  forecastTotalCustomers: 142,
});

/**
 * Property references observed on the newest inspected real activity (anonymized fixture above
 * with includeDessert=false, includeTimingStatus=false).
 */
export const NEWEST_REAL_ACTIVITY_PRESENT_REFS = [
  'confidence',
  'forecastMeat',
  'forecastSoup',
  'forecastTotalCustomers',
  'forecastVegetarian',
  'mainItemId',
  'notes',
  'soupItemId',
  'submittedAt',
  'targetDate',
  'vegetarianItemId',
] as const;

/** Expected chefForecast references still absent on the newest inspected real activity. */
export const NEWEST_REAL_ACTIVITY_ABSENT_REFS = [
  'dessertItemId',
  'forecastDessert',
  'timingStatus',
] as const;
