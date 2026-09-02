import type { ActiveDeclaration } from '../types/declaration';
import type { MealChoice } from '../types/mealChoice';

export interface DeclarationRepository {
  getDeclaration(studentId: string, lunchDate: string): ActiveDeclaration | null;
  upsertDeclaration(declaration: ActiveDeclaration): ActiveDeclaration;
}

const STORAGE_PREFIX = 'lunch-declaration-';

export function buildStorageKey(studentId: string, lunchDate: string): string {
  return `${STORAGE_PREFIX}${studentId}-${lunchDate}`;
}

export function normalizeDeclarationRecord(parsed: Record<string, unknown>): ActiveDeclaration | null {
  const studentId = parsed.studentId;
  const lunchDate = parsed.lunchDate;
  if (typeof studentId !== 'string' || typeof lunchDate !== 'string') {
    return null;
  }

  const {
    timingStatus: _timingStatus,
    basePoints: _basePoints,
    timingAdjustment: _timingAdjustment,
    totalPoints: _totalPoints,
    points: _legacyPoints,
    ...rest
  } = parsed;

  if (typeof rest.submittedAt !== 'string' || typeof rest.updatedAt !== 'string') {
    return null;
  }

  return rest as unknown as ActiveDeclaration;
}

function withDefaultMealChoice(declaration: ActiveDeclaration): ActiveDeclaration {
  if (
    declaration.mealChoice === 'regular' ||
    declaration.mealChoice === 'soup' ||
    declaration.mealChoice === 'no_lunch'
  ) {
    return declaration;
  }
  const mealChoice: MealChoice = declaration.noLunch ? 'no_lunch' : 'regular';
  return { ...declaration, mealChoice };
}

/**
 * Local prototype persistence. This repository can later be replaced
 * by a GameBus-backed implementation without changing UI or business rules.
 */
export class LocalStorageDeclarationRepository implements DeclarationRepository {
  getDeclaration(studentId: string, lunchDate: string): ActiveDeclaration | null {
    try {
      const raw = localStorage.getItem(buildStorageKey(studentId, lunchDate));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const normalized = normalizeDeclarationRecord(parsed);
      if (!normalized || normalized.studentId !== studentId || normalized.lunchDate !== lunchDate) {
        return null;
      }
      return withDefaultMealChoice(normalized);
    } catch {
      return null;
    }
  }

  upsertDeclaration(declaration: ActiveDeclaration): ActiveDeclaration {
    localStorage.setItem(
      buildStorageKey(declaration.studentId, declaration.lunchDate),
      JSON.stringify(declaration),
    );
    return declaration;
  }
}

export const declarationRepository = new LocalStorageDeclarationRepository();
