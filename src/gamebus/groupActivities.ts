import type { GameBusInputCollectionsPayload } from './types';

/** Canonical GameBus Input Collection key for kitchen group activities. */
export const KITCHEN_GROUP_INPUT_COLLECTION_KEY = 'kitchenGroupInput';

/** Input Request key within `kitchenGroupInput` (`GET /groups/activities`). */
export const KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY = 'activities';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Raw `kitchenGroupInput.activities` value from INPUT_COLLECTIONS without parsing.
 * Falls back to a top-level `activities` key when collection nesting is absent.
 */
export function getRawKitchenGroupActivitiesInput(
  payload: GameBusInputCollectionsPayload | null,
): unknown {
  if (!payload) return undefined;

  const collection = payload[KITCHEN_GROUP_INPUT_COLLECTION_KEY];
  if (isRecord(collection)) {
    const nested = collection[KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY];
    if (nested !== undefined) return nested;
  }

  return payload[KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY];
}

/** Extracts activity objects from array or paginated `{ docs: [...] }` envelopes. */
export function extractGroupActivities(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (isRecord(raw) && Array.isArray(raw.docs)) return raw.docs;
  return [];
}

export function getActivityTemplateReference(activity: unknown): string | null {
  if (!isRecord(activity)) return null;
  const template = activity.template;
  if (!isRecord(template)) return null;
  const reference = template.reference;
  return typeof reference === 'string' && reference.length > 0 ? reference : null;
}

export function filterActivitiesByTemplateReference(
  activities: readonly unknown[],
  templateReference: string,
): unknown[] {
  return activities.filter(
    (activity) => getActivityTemplateReference(activity) === templateReference,
  );
}
