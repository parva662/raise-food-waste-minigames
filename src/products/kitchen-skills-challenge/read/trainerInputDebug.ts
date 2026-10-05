import { hashPath } from '@/app/routes';
import {
  extractGroupActivities,
  getActivityTemplateReference,
  getRawKitchenSkillsTrainerActivitiesInput,
  KITCHEN_SKILLS_TRAINER_INPUT_COLLECTION_KEY,
} from '@/platform/gamebus/groupActivities';
import type { GameBusInputCollectionsPayload } from '@/platform/gamebus/types';
import {
  parsePersistedPortionEntry,
  parsePersistedRescueEntry,
  parsePersistedReviewEntry,
  parsePersistedTrimEntry,
  readActivityActorId,
  readActivityActorName,
} from '@/products/kitchen-skills-challenge/read/kitchenSkillsReadModel';
import {
  buildKitchenSkillsTrainerSessions,
  classifyKitchenSkillsTrainerFeed,
} from '@/products/kitchen-skills-challenge/read/trainerSessions';

const KITCHEN_SKILLS_FEED_TEMPLATES = new Set([
  'trimSmart',
  'rescueAndReuse',
  'portionPrecision',
  'wastePracticeReview',
]);

export type TrainerInputRawShape =
  | 'undefined'
  | 'null'
  | 'array'
  | 'docs-envelope'
  | 'object'
  | 'string'
  | 'number'
  | 'boolean'
  | 'other';

export type KitchenSkillsTrainerActivityActorDebug = {
  template: string;
  actorId: string | null;
  actorName: string | null;
};

export type KitchenSkillsTrainerInputDebugInfo = {
  collectionKeys: readonly string[];
  kitchenSkillsTrainerInputRaw: unknown;
  kitchenSkillsTrainerInputKeys: readonly string[] | null;
  kitchenSkillsTrainerInputPreview: unknown;
  kitchenSkillsTrainerActivitiesRaw: unknown;
  kitchenSkillsTrainerInputShape: TrainerInputRawShape;
  kitchenSkillsTrainerActivitiesShape: TrainerInputRawShape;
  activityCount: number;
  templateCounts: Record<string, number>;
  kitchenSkillsActivityActors: readonly KitchenSkillsTrainerActivityActorDebug[];
  parsedTrimCount: number;
  parsedRescueCount: number;
  parsedPortionCount: number;
  parsedReviewCount: number;
  parsedEvidenceMissingActorCount: number;
  kitchenSkillsTemplateUnparseableCount: number;
  trainerSessionCount: number;
};

function parseHashSearch(hash: string): URLSearchParams {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const trimmed = raw.startsWith('/') ? raw.slice(1) : raw;
  return new URLSearchParams(trimmed.split('?')[1] ?? '');
}

export function isKitchenSkillsTrainerGameBusDebugMode(
  hash: string = typeof window === 'undefined' ? '' : window.location.hash,
  search: string = typeof window === 'undefined' ? '' : window.location.search,
): boolean {
  if (hashPath(hash) !== 'kitchen-day-tutor') return false;
  if (parseHashSearch(hash).get('gamebusDebug') === '1') return true;
  return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('gamebusDebug') === '1';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asPayload(inputCollections: unknown): GameBusInputCollectionsPayload | null {
  return isRecord(inputCollections) ? inputCollections : null;
}

export function describeTrainerInputShape(value: unknown): TrainerInputRawShape {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (isRecord(value) && Array.isArray(value.docs)) return 'docs-envelope';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'other';
}

function summarizeNested(value: unknown): unknown {
  if (Array.isArray(value)) {
    return { _shape: 'array', length: value.length, first: value[0] ?? null };
  }
  if (isRecord(value)) {
    return Array.isArray(value.docs)
      ? {
          _shape: 'docs-envelope',
          _keys: Object.keys(value),
          docsLength: value.docs.length,
          first: value.docs[0] ?? null,
        }
      : { _shape: 'object', _keys: Object.keys(value) };
  }
  return value;
}

export function summarizeTrainerInputForDisplay(value: unknown): unknown {
  if (value === undefined) return { _shape: 'undefined' };
  if (value === null) return { _shape: 'null' };
  if (Array.isArray(value)) {
    return { _shape: 'array', length: value.length, first: value[0] ?? null };
  }
  if (isRecord(value)) {
    const summarized: Record<string, unknown> = {
      _shape: describeTrainerInputShape(value),
      _keys: Object.keys(value),
    };
    for (const [key, nested] of Object.entries(value)) {
      summarized[key] = summarizeNested(nested);
    }
    return summarized;
  }
  return value;
}

export function formatTrainerInputDebugJson(value: unknown): string {
  if (value === undefined) return '(undefined)';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function kitchenSkillsActivityActors(
  activities: readonly unknown[],
): KitchenSkillsTrainerActivityActorDebug[] {
  return activities
    .filter((activity) => {
      const template = getActivityTemplateReference(activity);
      return template !== null && KITCHEN_SKILLS_FEED_TEMPLATES.has(template);
    })
    .map((activity) => ({
      template: getActivityTemplateReference(activity) ?? '(missing)',
      actorId: readActivityActorId(activity),
      actorName: readActivityActorName(activity),
    }));
}

export function buildKitchenSkillsTrainerInputDebugInfo(
  inputCollections: unknown,
): KitchenSkillsTrainerInputDebugInfo {
  const payload = asPayload(inputCollections);
  const collectionKeys = payload ? Object.keys(payload) : [];
  const collectionRaw = payload?.[KITCHEN_SKILLS_TRAINER_INPUT_COLLECTION_KEY];
  const activitiesRaw = getRawKitchenSkillsTrainerActivitiesInput(payload);
  const activities = extractGroupActivities(activitiesRaw);
  const classified = classifyKitchenSkillsTrainerFeed(activities);
  let unparseableReviews = 0;
  for (const activity of activities) {
    if (getActivityTemplateReference(activity) !== 'wastePracticeReview') continue;
    if (!parsePersistedReviewEntry(activity)) unparseableReviews += 1;
  }

  return {
    collectionKeys,
    kitchenSkillsTrainerInputRaw: collectionRaw,
    kitchenSkillsTrainerInputKeys: isRecord(collectionRaw) ? Object.keys(collectionRaw) : null,
    kitchenSkillsTrainerInputPreview: summarizeTrainerInputForDisplay(collectionRaw),
    kitchenSkillsTrainerActivitiesRaw: activitiesRaw,
    kitchenSkillsTrainerInputShape: describeTrainerInputShape(collectionRaw),
    kitchenSkillsTrainerActivitiesShape: describeTrainerInputShape(activitiesRaw),
    activityCount: classified.total,
    templateCounts: classified.templateCounts,
    kitchenSkillsActivityActors: kitchenSkillsActivityActors(activities),
    parsedTrimCount: activities.filter((activity) => parsePersistedTrimEntry(activity) !== null).length,
    parsedRescueCount: activities.filter((activity) => parsePersistedRescueEntry(activity) !== null).length,
    parsedPortionCount: activities.filter((activity) => parsePersistedPortionEntry(activity) !== null).length,
    parsedReviewCount: activities.filter((activity) => parsePersistedReviewEntry(activity) !== null).length,
    parsedEvidenceMissingActorCount: classified.parsedEvidenceMissingActorCount,
    kitchenSkillsTemplateUnparseableCount:
      classified.kitchenSkillsTemplateUnparseableCount + unparseableReviews,
    trainerSessionCount: buildKitchenSkillsTrainerSessions(activities).length,
  };
}
