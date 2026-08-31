import type { GameBusInputCollectionsPayload } from '../../gamebus/types';
import {
  extractGroupActivities,
  getActivityTemplateReference,
  getRawKitchenGroupActivitiesInput,
  KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY,
  KITCHEN_GROUP_INPUT_COLLECTION_KEY,
} from '../../gamebus/groupActivities';
import {
  getInputCollectionKeys,
  getRawAuthenticatedMeInput,
} from '../../gamebus/inputCollections';
import { WASTE_MEASUREMENT_REQUIRED_REFS } from '../../gamebus/mapWasteMeasurement';

export type RawActivitiesShape = 'array' | 'docs-envelope' | 'other';

export type RawWasteMeasurementDebug = {
  activityId: string | null;
  actorId: string | null;
  actorName: string | null;
  createdAt: string | null;
  propertyCount: number;
  propertyRefs: readonly string[];
  propertyEntries: readonly { reference: string; displayValue: string }[];
  missingRequiredRefs: readonly string[];
};

export type NewestChefForecastDebug = {
  actorId: string | null;
  actorName: string | null;
  activityId: string | null;
  targetDate: string | null;
  createdAt: string | null;
  submittedAt: string | null;
};

export type InputCollectionsDebugInfo = {
  inputCollectionKeys: readonly string[];
  hasInputCollectionPariMe: boolean;
  hasKitchenGroupInputActivities: boolean;
  rawActivitiesShape: RawActivitiesShape;
  rawActivityCount: number;
  templateReferenceCounts: Record<string, number>;
  newestWasteMeasurement: RawWasteMeasurementDebug | null;
  newestGroupActivityCreatedAt: string | null;
  newestChefForecastsByActor: readonly NewestChefForecastDebug[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function detectRawActivitiesShape(raw: unknown): RawActivitiesShape {
  if (Array.isArray(raw)) return 'array';
  if (isRecord(raw) && Array.isArray(raw.docs)) return 'docs-envelope';
  return 'other';
}

function countTemplateReferences(activities: readonly unknown[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const activity of activities) {
    const ref = getActivityTemplateReference(activity) ?? '(missing)';
    counts[ref] = (counts[ref] ?? 0) + 1;
  }
  return counts;
}

function readActivityCreatedAt(activity: unknown): string | null {
  if (!isRecord(activity)) return null;
  return typeof activity.createdAt === 'string' ? activity.createdAt : null;
}

export function findNewestActivityByCreatedAt(
  activities: readonly unknown[],
  templateReference: string,
): unknown | null {
  const matching = activities.filter(
    (activity) => getActivityTemplateReference(activity) === templateReference,
  );
  if (matching.length === 0) return null;

  return [...matching].sort((left, right) => {
    const leftCreated = readActivityCreatedAt(left) ?? '';
    const rightCreated = readActivityCreatedAt(right) ?? '';
    return leftCreated.localeCompare(rightCreated);
  })[matching.length - 1]!;
}

function readActor(activity: unknown): { id: string | null; name: string | null } {
  if (!isRecord(activity)) return { id: null, name: null };
  const actor = activity.actor;
  if (!isRecord(actor)) return { id: null, name: null };
  return {
    id: typeof actor.id === 'string' ? actor.id : null,
    name: typeof actor.name === 'string' ? actor.name : null,
  };
}

function readPropertyRefs(activity: unknown): string[] {
  if (!isRecord(activity) || !Array.isArray(activity.properties)) return [];
  const refs: string[] = [];
  for (const property of activity.properties) {
    if (!isRecord(property)) continue;
    const template = property.template;
    if (!isRecord(template)) continue;
    const ref = template.reference;
    if (typeof ref === 'string' && ref.length > 0) refs.push(ref);
  }
  return refs;
}

function readPropertyEntries(activity: unknown): { reference: string; value: unknown }[] {
  if (!isRecord(activity) || !Array.isArray(activity.properties)) return [];
  const entries: { reference: string; value: unknown }[] = [];
  for (const property of activity.properties) {
    if (!isRecord(property)) continue;
    const template = property.template;
    if (!isRecord(template)) continue;
    const ref = template.reference;
    if (typeof ref !== 'string' || ref.length === 0) continue;
    const valueWrapper = property.value;
    const value =
      isRecord(valueWrapper) && 'value' in valueWrapper ? valueWrapper.value : undefined;
    entries.push({ reference: ref, value });
  }
  return entries;
}

function readStringProperty(activity: unknown, ref: string): string | null {
  const entry = readPropertyEntries(activity).find((property) => property.reference === ref);
  if (!entry) return null;
  if (typeof entry.value === 'string') return entry.value;
  if (entry.value === null || entry.value === undefined) return null;
  return String(entry.value);
}

export function findMissingRequiredWasteMeasurementRefs(
  propertyRefs: readonly string[],
): readonly string[] {
  const present = new Set(propertyRefs);
  return WASTE_MEASUREMENT_REQUIRED_REFS.filter((ref) => !present.has(ref));
}

export function formatDebugPropertyValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function buildNewestWasteMeasurementDebug(activity: unknown): RawWasteMeasurementDebug {
  const actor = readActor(activity);
  const propertyRefs = readPropertyRefs(activity);
  const propertyEntries = readPropertyEntries(activity).map(({ reference, value }) => ({
    reference,
    displayValue: formatDebugPropertyValue(value),
  }));

  return {
    activityId: isRecord(activity) && typeof activity.id === 'string' ? activity.id : null,
    actorId: actor.id,
    actorName: actor.name,
    createdAt: readActivityCreatedAt(activity),
    propertyCount: propertyRefs.length,
    propertyRefs,
    propertyEntries,
    missingRequiredRefs: findMissingRequiredWasteMeasurementRefs(propertyRefs),
  };
}

export function buildNewestChefForecastsByActor(
  activities: readonly unknown[],
): NewestChefForecastDebug[] {
  const forecasts = activities.filter(
    (activity) => getActivityTemplateReference(activity) === 'chefForecast',
  );
  const byActor = new Map<string, unknown>();

  for (const forecast of forecasts) {
    const actor = readActor(forecast);
    const actorId = actor.id ?? '(unknown)';
    const existing = byActor.get(actorId);
    if (!existing) {
      byActor.set(actorId, forecast);
      continue;
    }

    const existingCreated = readActivityCreatedAt(existing) ?? '';
    const candidateCreated = readActivityCreatedAt(forecast) ?? '';
    if (candidateCreated.localeCompare(existingCreated) > 0) {
      byActor.set(actorId, forecast);
      continue;
    }

    if (candidateCreated === existingCreated) {
      const existingSubmitted = readStringProperty(existing, 'submittedAt') ?? '';
      const candidateSubmitted = readStringProperty(forecast, 'submittedAt') ?? '';
      if (candidateSubmitted.localeCompare(existingSubmitted) > 0) {
        byActor.set(actorId, forecast);
      }
    }
  }

  return [...byActor.values()]
    .map((forecast) => {
      const actor = readActor(forecast);
      return {
        actorId: actor.id,
        actorName: actor.name,
        activityId:
          isRecord(forecast) && typeof forecast.id === 'string' ? forecast.id : null,
        targetDate: readStringProperty(forecast, 'targetDate'),
        createdAt: readActivityCreatedAt(forecast),
        submittedAt: readStringProperty(forecast, 'submittedAt'),
      };
    })
    .sort((left, right) => (left.actorName ?? '').localeCompare(right.actorName ?? ''));
}

export function findNewestGroupActivityCreatedAt(activities: readonly unknown[]): string | null {
  let newest: string | null = null;
  for (const activity of activities) {
    const createdAt = readActivityCreatedAt(activity);
    if (!createdAt) continue;
    if (!newest || createdAt.localeCompare(newest) > 0) newest = createdAt;
  }
  return newest;
}

export function buildInputCollectionsDebugInfo(
  payload: GameBusInputCollectionsPayload | null,
): InputCollectionsDebugInfo | null {
  if (!payload) return null;

  const raw = getRawKitchenGroupActivitiesInput(payload);
  const activities = extractGroupActivities(raw);
  const kitchenCollection = payload[KITCHEN_GROUP_INPUT_COLLECTION_KEY];
  const newestWasteRaw = findNewestActivityByCreatedAt(activities, 'wasteMeasurement');

  return {
    inputCollectionKeys: getInputCollectionKeys(payload),
    hasInputCollectionPariMe: getRawAuthenticatedMeInput(payload) !== undefined,
    hasKitchenGroupInputActivities:
      isRecord(kitchenCollection) &&
      kitchenCollection[KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY] !== undefined,
    rawActivitiesShape: detectRawActivitiesShape(raw),
    rawActivityCount: activities.length,
    templateReferenceCounts: countTemplateReferences(activities),
    newestWasteMeasurement: newestWasteRaw
      ? buildNewestWasteMeasurementDebug(newestWasteRaw)
      : null,
    newestGroupActivityCreatedAt: findNewestGroupActivityCreatedAt(activities),
    newestChefForecastsByActor: buildNewestChefForecastsByActor(activities),
  };
}
