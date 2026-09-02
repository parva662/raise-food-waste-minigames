import { CANTEEN_CONFIG } from '../config/canteen';
import { isSubmissionAllowed, type Clock, systemClock } from '../services/submissionWindow';
import type { ActiveDeclaration } from '../types/declaration';
import type { DailyMealSlots, MealDraft } from '../types/mealChoice';
import { declarationRepository } from '../repositories/declarationRepository';
import {
  buildSelectionsFromMealDraft,
  mealDraftFromDeclaration,
} from './mealChoice';

export { declarationRepository };

export type DraftSnapshot = MealDraft;

export interface SavedSnapshot extends MealDraft {
  submittedAt: string;
  updatedAt: string;
  menuVersion: string;
  menuCycleWeek: number;
}

export function createEmptyDraft(): DraftSnapshot {
  return {
    mealChoice: null,
    mainQuantity: 0,
    vegetarianQuantity: 0,
    soupQuantity: 0,
    dessertQuantity: 0,
  };
}

export function snapshotFromDeclaration(
  declaration: ActiveDeclaration,
  slots: DailyMealSlots,
): SavedSnapshot {
  const draft = mealDraftFromDeclaration(declaration, slots);
  return {
    ...draft,
    submittedAt: declaration.submittedAt,
    updatedAt: declaration.updatedAt,
    menuVersion: declaration.menuVersion,
    menuCycleWeek: declaration.menuCycleWeek,
  };
}

export function createDeclarationFromDraft(
  draft: DraftSnapshot,
  slots: DailyMealSlots,
  lunchDate: string,
  menuCycleWeek: number,
  menuVersion: string,
  clock: Clock = systemClock,
): ActiveDeclaration | null {
  if (draft.mealChoice === null) return null;

  const now = clock();
  if (!isSubmissionAllowed(now, lunchDate)) return null;

  const noLunch = draft.mealChoice === 'no_lunch';
  const selections = noLunch ? [] : buildSelectionsFromMealDraft(draft, slots);

  return {
    studentId: CANTEEN_CONFIG.studentId,
    lunchDate,
    menuCycleWeek,
    menuVersion,
    mealChoice: draft.mealChoice,
    regularMainSelected:
      draft.mealChoice === 'regular' ? draft.mainQuantity > 0 : undefined,
    regularVegetarianSelected:
      draft.mealChoice === 'regular' ? draft.vegetarianQuantity > 0 : undefined,
    noLunch,
    selections,
    submittedAt: now.toISOString(),
    updatedAt: now.toISOString(),
    includeInForecast: true,
  };
}
