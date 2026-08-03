import type { ActiveDeclaration } from '../../types/declaration';
import { CANTEEN_CONFIG } from '../../config/canteen';
import { resolveMealSlotsForDate } from '../../services/mealSlots';
import { buildSelectionsFromMealDraft } from '../../utils/mealChoice';
import { FIXTURE_LUNCH_DATE, SUBMISSION_TIMES } from './dates';

export function createFixtureDeclaration(
  overrides: Partial<ActiveDeclaration> = {},
): ActiveDeclaration {
  const slots = resolveMealSlotsForDate(FIXTURE_LUNCH_DATE);
  if (!slots) throw new Error('Expected fixture meal slots');

  const draft = {
    mealChoice: 'regular' as const,
    mainQuantity: 1,
    vegetarianQuantity: 0,
    soupQuantity: 0,
    dessertQuantity: 0,
  };
  const selections = buildSelectionsFromMealDraft(draft, slots);

  return {
    studentId: CANTEEN_CONFIG.studentId,
    lunchDate: FIXTURE_LUNCH_DATE,
    menuCycleWeek: 2,
    menuVersion: CANTEEN_CONFIG.menuVersion,
    mealChoice: 'regular',
    regularMainSelected: true,
    regularVegetarianSelected: false,
    noLunch: false,
    selections,
    timingStatus: 'on-time',
    basePoints: 20,
    timingAdjustment: 5,
    totalPoints: 25,
    submittedAt: SUBMISSION_TIMES.midday.toISOString(),
    updatedAt: SUBMISSION_TIMES.midday.toISOString(),
    includeInForecast: true,
    ...overrides,
  };
}

export function createLegacyFixtureDeclaration(): Record<string, unknown> {
  const declaration = createFixtureDeclaration();
  return {
    ...declaration,
    points: 5,
    basePoints: undefined,
    timingAdjustment: undefined,
    totalPoints: undefined,
  };
}
