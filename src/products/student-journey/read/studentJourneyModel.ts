import type { ParsedStudentLunchCheckin } from '@/products/student-journey/read/parseStudentLunchCheckin';
import type { MealChoice } from '@/shared/menu/mealChoice';

export type StudentJourneyParticipationSummary = {
  declarationCount: number;
  distinctServiceDates: number;
  mostRecentServiceDate: string | null;
  mostRecentSubmittedAt: string | null;
  mostRecentMealType: MealChoice | null;
};

export type StudentJourneyMealLabel = {
  optionLabel: string;
  quantityDetail: string | null;
};

export function summarizeStudentParticipation(
  history: readonly ParsedStudentLunchCheckin[],
): StudentJourneyParticipationSummary {
  if (history.length === 0) {
    return {
      declarationCount: 0,
      distinctServiceDates: 0,
      mostRecentServiceDate: null,
      mostRecentSubmittedAt: null,
      mostRecentMealType: null,
    };
  }

  const latest = history[0]!;
  return {
    declarationCount: history.length,
    distinctServiceDates: history.length,
    mostRecentServiceDate: latest.targetDate,
    mostRecentSubmittedAt: latest.submittedAt,
    mostRecentMealType: latest.mealType,
  };
}

export function describeStudentLunchEntry(entry: ParsedStudentLunchCheckin): StudentJourneyMealLabel {
  if (entry.mealType === 'no_lunch') {
    return { optionLabel: 'No lunch', quantityDetail: null };
  }
  if (entry.mealType === 'soup') {
    return {
      optionLabel: 'Soup + Dessert package',
      quantityDetail: `Package × ${entry.soupQuantity}`,
    };
  }
  if (entry.vegetarianQuantity > 0 && entry.mainQuantity === 0) {
    return {
      optionLabel: 'Vegetarian dish',
      quantityDetail: `Quantity × ${entry.vegetarianQuantity}`,
    };
  }
  if (entry.mainQuantity > 0) {
    return {
      optionLabel: 'Classic dish',
      quantityDetail: `Quantity × ${entry.mainQuantity}`,
    };
  }
  return { optionLabel: 'Regular lunch', quantityDetail: null };
}

/** Simple sparkline-friendly counts per service date (newest first history → oldest chart left). */
export function participationSeries(history: readonly ParsedStudentLunchCheckin[]): number[] {
  return [...history].reverse().map(() => 1);
}
