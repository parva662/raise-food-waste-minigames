import { WASTE_MEASUREMENT_REQUIRED_REFS } from '../../gamebus/mapWasteMeasurement';

export type GameBusWasteMeasurement = {
  activityId: string;
  serviceDate: string;
  actualCustomers: number;
  mainItemId: string;
  preparedMainQuantity: number;
  vegetarianItemId: string;
  preparedVegetarianQuantity: number;
  soupItemId: string;
  preparedSoupQuantity: number;
  dessertItemId: string;
  preparedDessertQuantity: number;
  overproductionMeatKg: number;
  overproductionVegetarianKg: number;
  overproductionSoupKg: number;
  overproductionDessertKg: number;
  submittedAt: string;
  createdAt: string | null;
};

export type WasteMeasurementParseDiagnostic = {
  activityId: string | null;
  reason: 'empty_properties' | 'missing_required' | 'invalid_value' | 'not_waste_measurement';
  missingRefs?: readonly string[];
  invalidRefs?: readonly string[];
};

export type ParsedWasteMeasurementActivity =
  | { ok: true; measurement: GameBusWasteMeasurement }
  | { ok: false; diagnostic: WasteMeasurementParseDiagnostic };

export type WasteMeasurementParseBatchResult = {
  valid: GameBusWasteMeasurement[];
  rejected: WasteMeasurementParseDiagnostic[];
};

type RawProperty = {
  value?: { value?: unknown };
  template?: { reference?: string; name?: string };
};

type RawWasteMeasurementActivity = {
  id?: string;
  createdAt?: string;
  template?: { reference?: string; name?: string };
  properties?: RawProperty[];
};

const REQUIRED_REFS = WASTE_MEASUREMENT_REQUIRED_REFS;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readPropertyMap(activity: RawWasteMeasurementActivity): Map<string, unknown> {
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

function missingRequiredRefs(propertyMap: Map<string, unknown>): string[] {
  const missing: string[] = [];
  for (const ref of REQUIRED_REFS) {
    if (!propertyMap.has(ref)) {
      missing.push(ref);
      continue;
    }
    const value = propertyMap.get(ref);
    if (ref === 'serviceDate' || ref === 'submittedAt' || ref.endsWith('ItemId')) {
      if (readString(value) === null) missing.push(ref);
      continue;
    }
    if (readNumber(value) === null) missing.push(ref);
  }
  return missing;
}

function extractActivities(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (isRecord(raw) && Array.isArray(raw.docs)) return raw.docs;
  return [];
}

export function parseGameBusWasteMeasurementActivity(
  activity: unknown,
): ParsedWasteMeasurementActivity {
  if (!isRecord(activity)) {
    return {
      ok: false,
      diagnostic: { activityId: null, reason: 'not_waste_measurement' },
    };
  }

  const raw = activity as RawWasteMeasurementActivity;
  const templateRef = raw.template?.reference;
  if (templateRef !== 'wasteMeasurement') {
    return {
      ok: false,
      diagnostic: {
        activityId: typeof raw.id === 'string' ? raw.id : null,
        reason: 'not_waste_measurement',
      },
    };
  }

  const propertyMap = readPropertyMap(raw);
  if (propertyMap.size === 0) {
    return {
      ok: false,
      diagnostic: {
        activityId: typeof raw.id === 'string' ? raw.id : null,
        reason: 'empty_properties',
      },
    };
  }

  const missingRefs = missingRequiredRefs(propertyMap);
  if (missingRefs.length > 0) {
    return {
      ok: false,
      diagnostic: {
        activityId: typeof raw.id === 'string' ? raw.id : null,
        reason: 'missing_required',
        missingRefs,
      },
    };
  }

  const serviceDate = readString(propertyMap.get('serviceDate'));
  const submittedAt = readString(propertyMap.get('submittedAt'));
  const actualCustomers = readNumber(propertyMap.get('actualCustomers'));
  const mainItemId = readString(propertyMap.get('mainItemId'));
  const preparedMainQuantity = readNumber(propertyMap.get('preparedMainQuantity'));
  const vegetarianItemId = readString(propertyMap.get('vegetarianItemId'));
  const preparedVegetarianQuantity = readNumber(propertyMap.get('preparedVegetarianQuantity'));
  const soupItemId = readString(propertyMap.get('soupItemId'));
  const preparedSoupQuantity = readNumber(propertyMap.get('preparedSoupQuantity'));
  const dessertItemId = readString(propertyMap.get('dessertItemId'));
  const preparedDessertQuantity = readNumber(propertyMap.get('preparedDessertQuantity'));
  const overproductionMeatKg = readNumber(propertyMap.get('overproductionMeatKg'));
  const overproductionVegetarianKg = readNumber(propertyMap.get('overproductionVegetarianKg'));
  const overproductionSoupKg = readNumber(propertyMap.get('overproductionSoupKg'));
  const overproductionDessertKg = readNumber(propertyMap.get('overproductionDessertKg'));

  if (
    !serviceDate ||
    !submittedAt ||
    actualCustomers === null ||
    !mainItemId ||
    preparedMainQuantity === null ||
    !vegetarianItemId ||
    preparedVegetarianQuantity === null ||
    !soupItemId ||
    preparedSoupQuantity === null ||
    !dessertItemId ||
    preparedDessertQuantity === null ||
    overproductionMeatKg === null ||
    overproductionVegetarianKg === null ||
    overproductionSoupKg === null ||
    overproductionDessertKg === null
  ) {
    return {
      ok: false,
      diagnostic: {
        activityId: typeof raw.id === 'string' ? raw.id : null,
        reason: 'invalid_value',
      },
    };
  }

  return {
    ok: true,
    measurement: {
      activityId: typeof raw.id === 'string' ? raw.id : '',
      serviceDate,
      actualCustomers,
      mainItemId,
      preparedMainQuantity,
      vegetarianItemId,
      preparedVegetarianQuantity,
      soupItemId,
      preparedSoupQuantity,
      dessertItemId,
      preparedDessertQuantity,
      overproductionMeatKg,
      overproductionVegetarianKg,
      overproductionSoupKg,
      overproductionDessertKg,
      submittedAt,
      createdAt: readString(raw.createdAt),
    },
  };
}

export function parseGameBusWasteMeasurementActivities(
  raw: unknown,
): WasteMeasurementParseBatchResult {
  const activities = extractActivities(raw);
  const valid: GameBusWasteMeasurement[] = [];
  const rejected: WasteMeasurementParseDiagnostic[] = [];

  for (const activity of activities) {
    const parsed = parseGameBusWasteMeasurementActivity(activity);
    if (parsed.ok) {
      valid.push(parsed.measurement);
    } else {
      rejected.push(parsed.diagnostic);
    }
  }

  return { valid, rejected };
}

function submissionSortKey(measurement: GameBusWasteMeasurement): string {
  return measurement.submittedAt ?? measurement.createdAt ?? '';
}

/** Latest wasteMeasurement for an exact service date. */
export function selectWasteMeasurementForDate(
  measurements: readonly GameBusWasteMeasurement[],
  serviceDate: string,
): GameBusWasteMeasurement | null {
  const matching = measurements.filter((entry) => entry.serviceDate === serviceDate);
  if (matching.length === 0) return null;
  if (matching.length === 1) return matching[0]!;

  return [...matching].sort((left, right) =>
    submissionSortKey(left).localeCompare(submissionSortKey(right)),
  )[matching.length - 1]!;
}
