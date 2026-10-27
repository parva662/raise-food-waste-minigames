import type { ChefForecastCompleteDraft } from '@/products/kitchen-forecast/types';

export function isAllZeroForecast(draft: ChefForecastCompleteDraft): boolean {
  return (
    draft.expectedCustomers === 0 &&
    draft.mainQuantity === 0 &&
    draft.vegetarianQuantity === 0 &&
    draft.soupQuantity === 0 &&
    draft.dessertQuantity === 0
  );
}

/**
 * Total planned lunch portions for the live overview.
 * Dessert is not counted separately — it belongs to the Soup + Dessert package.
 */
export function totalPlannedLunchPortions(input: {
  mainQuantity: number | null;
  vegetarianQuantity: number | null;
  soupQuantity: number | null;
}): number | null {
  const { mainQuantity, vegetarianQuantity, soupQuantity } = input;
  if (mainQuantity === null || vegetarianQuantity === null || soupQuantity === null) {
    return null;
  }
  return mainQuantity + vegetarianQuantity + soupQuantity;
}

export function plannedPortionsDifference(input: {
  expectedCustomers: number | null;
  mainQuantity: number | null;
  vegetarianQuantity: number | null;
  soupQuantity: number | null;
}): number | null {
  const total = totalPlannedLunchPortions(input);
  if (total === null || input.expectedCustomers === null) {
    return null;
  }
  return total - input.expectedCustomers;
}

export function formatPortionDifference(difference: number): string {
  if (difference === 0) return '0 portions';
  const sign = difference > 0 ? '+' : '';
  return `${sign}${difference} portions`;
}
