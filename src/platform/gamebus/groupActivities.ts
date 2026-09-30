import { readGameBusSlug } from '@/platform/gamebus/gameBusSlug';
import type { GameBusInputCollectionsPayload } from '@/platform/gamebus/types';

/** Canonical GameBus Input Collection key for kitchen group activities. */
export const KITCHEN_GROUP_INPUT_COLLECTION_KEY = 'kitchenGroupInput';

/** Canonical GameBus Input Collection key for the authenticated student's own activities. */
export const KITCHEN_GROUP_SELF_INPUT_COLLECTION_KEY = 'kitchenGroupInputSelf';

/**
 * Canonical GameBus Input Collection key for Kitchen Skills trainer evidence.
 * Dedicated collection — do not reuse `kitchenGroupInput` (chefForecast / wasteMeasurement).
 */
export const KITCHEN_SKILLS_TRAINER_INPUT_COLLECTION_KEY = 'kitchenSkillsTrainerInput';

/** Input Request key within kitchen group / self / trainer collections (`activities`). */
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

/**
 * Raw `kitchenGroupInputSelf.activities` value (`GET /api/me/activities`) without parsing.
 */
export function getRawKitchenSelfActivitiesInput(
  payload: GameBusInputCollectionsPayload | null,
): unknown {
  if (!payload) return undefined;

  const collection = payload[KITCHEN_GROUP_SELF_INPUT_COLLECTION_KEY];
  if (isRecord(collection)) {
    const nested = collection[KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY];
    if (nested !== undefined) return nested;
  }

  return undefined;
}

/**
 * Raw `kitchenSkillsTrainerInput.activities` value from INPUT_COLLECTIONS.
 * GameBus request: `GET /api/groups/activities` filtered to
 * `trimSmart`, `rescueAndReuse`, `portionPrecision`, and `wastePracticeReview`.
 * Does not fall back to `kitchenGroupInput` or a top-level `activities` key.
 */
export function getRawKitchenSkillsTrainerActivitiesInput(
  payload: GameBusInputCollectionsPayload | null,
): unknown {
  if (!payload) return undefined;

  const collection = payload[KITCHEN_SKILLS_TRAINER_INPUT_COLLECTION_KEY];
  if (isRecord(collection)) {
    const nested = collection[KITCHEN_GROUP_ACTIVITIES_REQUEST_KEY];
    if (nested !== undefined) return nested;
  }

  return undefined;
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
  return readGameBusSlug(template) ?? null;
}

export function filterActivitiesByTemplateReference(
  activities: readonly unknown[],
  templateReference: string,
): unknown[] {
  return activities.filter(
    (activity) => getActivityTemplateReference(activity) === templateReference,
  );
}
