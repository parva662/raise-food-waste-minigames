import { getActivityTemplateReference } from '../../gamebus/groupActivities';
import { isKitchenDayIngredientCategory } from '../trim/categories';
import { isTrimTechnique } from '../trim/techniques';
import { isPortionUnit } from '../portion/validation';
import { isKitchenDayReviewScore } from '../review/scores';
import type {
  KitchenDayPortionEntry,
  KitchenDayRescueEntry,
  KitchenDayReviewEntry,
  KitchenDayTrimEntry,
  RecipeCompositionLine,
} from '../types';
import {
  readActivityPropertyNumber,
  readActivityPropertyString,
  readActivityPropertyValue,
} from './groupActivityProperties';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readActivityId(activity: unknown): string | null {
  if (!isRecord(activity) || typeof activity.id !== 'string' || activity.id.length === 0) {
    return null;
  }
  return activity.id;
}

export function readActivityActorId(activity: unknown): string | null {
  if (!isRecord(activity) || !isRecord(activity.actor)) return null;
  return typeof activity.actor.id === 'string' && activity.actor.id.length > 0
    ? activity.actor.id
    : null;
}

export function readActivityActorName(activity: unknown): string | null {
  if (!isRecord(activity) || !isRecord(activity.actor)) return null;
  return typeof activity.actor.name === 'string' && activity.actor.name.length > 0
    ? activity.actor.name
    : null;
}

function readDurationMinutes(activity: unknown): number | null {
  const raw = readActivityPropertyValue(activity, 'duration');
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (!isRecord(raw)) return null;
  const value = raw.value;
  const unit = raw.unit;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (unit === 'seconds') return value / 60;
  return value;
}

function readIso(activity: unknown, key: 'start' | 'end'): string | null {
  if (!isRecord(activity) || typeof activity[key] !== 'string') return null;
  return activity[key];
}

export function parsePersistedTrimEntry(activity: unknown): KitchenDayTrimEntry | null {
  if (getActivityTemplateReference(activity) !== 'trimSmart') return null;
  const ingredientCategory = readActivityPropertyString(activity, 'ingredientCategory');
  const trimTechniques = readActivityPropertyString(activity, 'trimTechniques');
  const sessionId = readActivityPropertyString(activity, 'sessionId');
  const sessionDate = readActivityPropertyString(activity, 'sessionDate');
  const ingredientId = readActivityPropertyString(activity, 'ingredientId');
  const ingredientName = readActivityPropertyString(activity, 'ingredientName');
  const ingredientWeightGrams = readActivityPropertyNumber(activity, 'ingredientWeightGrams');
  const estimatedWasteGrams = readActivityPropertyNumber(activity, 'estimatedWasteGrams');
  const actualWasteGrams = readActivityPropertyNumber(activity, 'actualWasteGrams');
  const submittedAt = readActivityPropertyString(activity, 'submittedAt');
  const durationMinutes = readDurationMinutes(activity);
  if (
    !sessionId ||
    !sessionDate ||
    !ingredientId ||
    !ingredientName ||
    !submittedAt ||
    ingredientWeightGrams == null ||
    ingredientWeightGrams <= 0 ||
    estimatedWasteGrams == null ||
    actualWasteGrams == null ||
    durationMinutes == null ||
    !ingredientCategory ||
    !isKitchenDayIngredientCategory(ingredientCategory) ||
    !trimTechniques ||
    !isTrimTechnique(trimTechniques)
  ) {
    return null;
  }
  return {
    sessionId,
    sessionDate,
    submittedAt,
    ingredientId,
    ingredientName,
    ingredientCategory,
    ingredientWeightGrams,
    trimTechniques,
    estimatedWasteGrams,
    actualWasteGrams,
    durationMinutes,
    preparationStartedAt: readIso(activity, 'start') ?? submittedAt,
    preparationEndedAt: readIso(activity, 'end') ?? submittedAt,
    source: 'persisted',
    persistId: readActivityId(activity) ?? undefined,
  };
}

export function parsePersistedRescueEntry(activity: unknown): KitchenDayRescueEntry | null {
  if (getActivityTemplateReference(activity) !== 'rescueAndReuse') return null;
  const sessionId = readActivityPropertyString(activity, 'sessionId');
  const sessionDate = readActivityPropertyString(activity, 'sessionDate');
  const ingredientId = readActivityPropertyString(activity, 'ingredientId');
  const reusableWasteGrams = readActivityPropertyNumber(activity, 'reusableWasteGrams');
  const reuseDestination = readActivityPropertyString(activity, 'reuseDestination');
  const submittedAt = readActivityPropertyString(activity, 'submittedAt');
  if (
    !sessionId ||
    !sessionDate ||
    !ingredientId ||
    reusableWasteGrams == null ||
    reusableWasteGrams < 0 ||
    !reuseDestination ||
    !submittedAt
  ) {
    return null;
  }
  return {
    sessionId,
    sessionDate,
    ingredientId,
    reusableWasteGrams,
    reuseDestination,
    submittedAt,
    source: 'persisted',
    persistId: readActivityId(activity) ?? undefined,
  };
}

function parseComposition(value: unknown): RecipeCompositionLine[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const lines: RecipeCompositionLine[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const ingredientId = typeof item.ingredientId === 'string' ? item.ingredientId : '';
    const ingredientName = typeof item.ingredientName === 'string' ? item.ingredientName : '';
    const actualAmount = item.actualAmount;
    const unit = typeof item.unit === 'string' ? item.unit : '';
    if (
      !ingredientId ||
      !ingredientName ||
      typeof actualAmount !== 'number' ||
      !isPortionUnit(unit)
    ) {
      return null;
    }
    lines.push({ ingredientId, ingredientName, actualAmount, unit });
  }
  return lines;
}

export function parsePersistedPortionEntry(activity: unknown): KitchenDayPortionEntry | null {
  if (getActivityTemplateReference(activity) !== 'portionPrecision') return null;
  const sessionId = readActivityPropertyString(activity, 'sessionId');
  const sessionDate = readActivityPropertyString(activity, 'sessionDate');
  const submittedAt = readActivityPropertyString(activity, 'submittedAt');
  const recipeId = readActivityPropertyString(activity, 'recipeId');
  const recipeName = readActivityPropertyString(activity, 'recipeName');
  const finalRecipeWeightGrams = readActivityPropertyNumber(activity, 'finalRecipeWeightGrams');
  const recipeComposition = parseComposition(readActivityPropertyValue(activity, 'recipeComposition'));
  if (
    !sessionId ||
    !sessionDate ||
    !submittedAt ||
    !recipeId ||
    !recipeName ||
    finalRecipeWeightGrams == null ||
    !recipeComposition
  ) {
    return null;
  }
  return {
    sessionId,
    sessionDate,
    submittedAt,
    recipeId,
    recipeName,
    recipeComposition,
    finalRecipeWeightGrams,
    source: 'persisted',
    persistId: readActivityId(activity) ?? undefined,
  };
}

export function parsePersistedReviewEntry(activity: unknown): KitchenDayReviewEntry | null {
  if (getActivityTemplateReference(activity) !== 'wastePracticeReview') return null;
  const sessionId = readActivityPropertyString(activity, 'sessionId');
  const sessionDate = readActivityPropertyString(activity, 'sessionDate');
  const submittedAt = readActivityPropertyString(activity, 'submittedAt');
  const timeEfficiencyScore = readActivityPropertyNumber(activity, 'timeEfficiencyScore');
  const preparationQualityScore = readActivityPropertyNumber(activity, 'preparationQualityScore');
  const chefFeedback = readActivityPropertyString(activity, 'chefFeedback');
  if (
    !sessionId ||
    !sessionDate ||
    !submittedAt ||
    timeEfficiencyScore == null ||
    preparationQualityScore == null ||
    !isKitchenDayReviewScore(timeEfficiencyScore) ||
    !isKitchenDayReviewScore(preparationQualityScore)
  ) {
    return null;
  }
  return {
    sessionId,
    sessionDate,
    submittedAt,
    timeEfficiencyScore,
    preparationQualityScore,
    ...(chefFeedback ? { chefFeedback } : {}),
    source: 'persisted',
    persistId: readActivityId(activity) ?? undefined,
  };
}

export interface KitchenDayReadModel {
  trimEntries: KitchenDayTrimEntry[];
  rescueEntries: KitchenDayRescueEntry[];
  portionEntries: KitchenDayPortionEntry[];
}

export function buildKitchenDayReadModel(
  activities: readonly unknown[],
  options: {
    sessionId: string;
    actorId?: string | null;
  },
): KitchenDayReadModel {
  const trimEntries: KitchenDayTrimEntry[] = [];
  const rescueEntries: KitchenDayRescueEntry[] = [];
  const portionEntries: KitchenDayPortionEntry[] = [];

  for (const activity of activities) {
    if (options.actorId) {
      const actorId = readActivityActorId(activity);
      if (actorId !== options.actorId) continue;
    }
    const trim = parsePersistedTrimEntry(activity);
    if (trim && trim.sessionId === options.sessionId) {
      trimEntries.push(trim);
      continue;
    }
    const rescue = parsePersistedRescueEntry(activity);
    if (rescue && rescue.sessionId === options.sessionId) {
      rescueEntries.push(rescue);
      continue;
    }
    const portion = parsePersistedPortionEntry(activity);
    if (portion && portion.sessionId === options.sessionId) {
      portionEntries.push(portion);
    }
  }

  return { trimEntries, rescueEntries, portionEntries };
}

export function mergeKitchenDayRecords<T extends { persistId?: string }>(
  local: readonly T[],
  persisted: readonly T[],
  sameRecord: (left: T, right: T) => boolean,
): T[] {
  const merged = [...persisted];
  for (const item of local) {
    if (item.persistId && persisted.some((entry) => entry.persistId === item.persistId)) {
      continue;
    }
    if (persisted.some((entry) => sameRecord(entry, item))) {
      continue;
    }
    merged.push(item);
  }
  return merged;
}
