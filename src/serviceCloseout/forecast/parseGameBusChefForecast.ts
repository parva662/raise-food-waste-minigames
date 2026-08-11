import type {
  ChefForecastParseBatchResult,
  ChefForecastParseDiagnostic,
  GameBusChefForecast,
  GameBusChefForecastPropertyRef,
  ParsedChefForecastActivity,
} from './gameBusChefForecastTypes';
import { USABLE_CHEF_FORECAST_REQUIRED_REFS as REQUIRED_REFS } from './gameBusChefForecastTypes';

type RawProperty = {
  value?: { value?: unknown };
  template?: { reference?: string; name?: string };
};

type RawChefForecastActivity = {
  id?: string;
  actor?: { id?: string; name?: string; image?: string };
  createdAt?: string;
  template?: { reference?: string; name?: string };
  properties?: RawProperty[];
};

const RECOGNIZED_REFS = new Set<GameBusChefForecastPropertyRef>([
  'submittedAt',
  'targetDate',
  'forecastTotalCustomers',
  'forecastMeat',
  'forecastVegetarian',
  'forecastSoup',
  'forecastDessert',
  'mainItemId',
  'vegetarianItemId',
  'soupItemId',
  'dessertItemId',
  'confidence',
  'notes',
  'timingStatus',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readPropertyMap(activity: RawChefForecastActivity): Map<string, unknown> {
  const map = new Map<string, unknown>();
  for (const property of activity.properties ?? []) {
    const ref = property.template?.reference;
    if (!ref || typeof ref !== 'string') continue;
    map.set(ref, property.value?.value);
  }
  return map;
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  return value;
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function missingRequiredRefs(
  propertyMap: Map<string, unknown>,
): GameBusChefForecastPropertyRef[] {
  const missing: GameBusChefForecastPropertyRef[] = [];
  for (const ref of REQUIRED_REFS) {
    if (!propertyMap.has(ref)) {
      missing.push(ref);
      continue;
    }
    const value = propertyMap.get(ref);
    if (ref === 'targetDate') {
      if (readString(value) === null) missing.push(ref);
      continue;
    }
    if (readNumber(value) === null) missing.push(ref);
  }
  return missing;
}

function presentPropertyRefs(propertyMap: Map<string, unknown>): string[] {
  return [...propertyMap.keys()].sort();
}

function unrecognizedRefs(propertyMap: Map<string, unknown>): string[] {
  return [...propertyMap.keys()].filter((ref) => !RECOGNIZED_REFS.has(ref as GameBusChefForecastPropertyRef));
}

export function extractChefForecastActivities(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (isRecord(raw) && Array.isArray(raw.docs)) return raw.docs;
  return [];
}

export function parseGameBusChefForecastActivity(raw: unknown): ParsedChefForecastActivity {
  if (!isRecord(raw)) {
    return {
      ok: false,
      diagnostic: {
        activityId: null,
        reason: 'not_chef_forecast',
        presentRefs: [],
      },
    };
  }

  const activity = raw as RawChefForecastActivity;
  const activityId = readString(activity.id);
  const templateRef = activity.template?.reference;

  if (templateRef !== undefined && templateRef !== 'chefForecast') {
    return {
      ok: false,
      diagnostic: {
        activityId,
        reason: 'not_chef_forecast',
        presentRefs: [],
      },
    };
  }

  const properties = activity.properties ?? [];
  if (properties.length === 0) {
    return {
      ok: false,
      diagnostic: {
        activityId,
        reason: 'empty_properties',
        presentRefs: [],
      },
    };
  }

  const propertyMap = readPropertyMap(activity);
  const presentRefs = presentPropertyRefs(propertyMap);
  const unknownRefs = unrecognizedRefs(propertyMap);
  if (unknownRefs.length > 0) {
    presentRefs.push(...unknownRefs.filter((ref) => !presentRefs.includes(ref)));
  }

  const missingRefs = missingRequiredRefs(propertyMap);
  if (missingRefs.length > 0) {
    return {
      ok: false,
      diagnostic: {
        activityId,
        reason: 'missing_required',
        missingRefs,
        presentRefs,
      },
    };
  }

  const targetDate = readString(propertyMap.get('targetDate'))!;
  const forecastTotalCustomers = readNumber(propertyMap.get('forecastTotalCustomers'))!;
  const forecastMain = readNumber(propertyMap.get('forecastMeat'))!;
  const forecastVegetarian = readNumber(propertyMap.get('forecastVegetarian'))!;
  const forecastSoup = readNumber(propertyMap.get('forecastSoup'))!;

  const actorId = readString(activity.actor?.id) ?? '';
  const actorName = readString(activity.actor?.name) ?? 'Unknown chef';
  const createdAt = readString(activity.createdAt) ?? '';

  const forecast: GameBusChefForecast = {
    activityId: activityId ?? '',
    actorId,
    actorName,
    createdAt,
    submittedAt: readString(propertyMap.get('submittedAt')),
    targetDate,
    forecastTotalCustomers,
    forecastMain,
    forecastVegetarian,
    forecastSoup,
    forecastDessert: readNumber(propertyMap.get('forecastDessert')),
    mainItemId: readString(propertyMap.get('mainItemId')),
    vegetarianItemId: readString(propertyMap.get('vegetarianItemId')),
    soupItemId: readString(propertyMap.get('soupItemId')),
    dessertItemId: readString(propertyMap.get('dessertItemId')),
    confidence: readNumber(propertyMap.get('confidence')),
    notes: readString(propertyMap.get('notes')),
    timingStatus: readString(propertyMap.get('timingStatus')),
  };

  return { ok: true, forecast, presentRefs };
}

export function parseGameBusChefForecastActivities(raw: unknown): ChefForecastParseBatchResult {
  const activities = extractChefForecastActivities(raw);
  const valid: GameBusChefForecast[] = [];
  const rejected: ChefForecastParseDiagnostic[] = [];

  for (const activity of activities) {
    const parsed = parseGameBusChefForecastActivity(activity);
    if (parsed.ok) {
      valid.push(parsed.forecast);
    } else {
      rejected.push(parsed.diagnostic);
    }
  }

  return { valid, rejected };
}

export function forecastCategoryQuantity(
  forecast: GameBusChefForecast,
  category: 'main' | 'vegetarian' | 'soup' | 'dessert',
): number | null {
  switch (category) {
    case 'main':
      return forecast.forecastMain;
    case 'vegetarian':
      return forecast.forecastVegetarian;
    case 'soup':
      return forecast.forecastSoup;
    case 'dessert':
      return forecast.forecastDessert;
  }
}
