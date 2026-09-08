import { formatGrams } from './useChefResultsData';

/** Tolerance for treating actual and estimated surplus as equivalent (grams). */
export const SURPLUS_COMPARISON_TOLERANCE_GRAMS = 1;

/** Tolerance for customer-error peer comparison (customers). */
export const CUSTOMER_ERROR_COMPARISON_TOLERANCE = 1;

export function buildActualVsEstimatedSurplusInsight(
  actualSurplusGrams: number,
  estimatedSurplusGrams: number,
): string | null {
  const delta = estimatedSurplusGrams - actualSurplusGrams;

  if (Math.abs(delta) <= SURPLUS_COMPARISON_TOLERANCE_GRAMS) {
    return 'Your production plan would have resulted in approximately the same surplus as the kitchen recorded.';
  }

  if (delta < 0) {
    return `Your production plan would have resulted in about ${formatGrams(Math.abs(delta))} less surplus than the kitchen recorded.`;
  }

  return `Your production plan would have resulted in about ${formatGrams(delta)} more surplus than the kitchen recorded.`;
}

export type CustomerEstimateDirection = 'high' | 'low' | 'on-target';

export function getCustomerEstimateDirection(
  forecastCustomers: number,
  actualCustomers: number,
): CustomerEstimateDirection {
  if (forecastCustomers > actualCustomers) return 'high';
  if (forecastCustomers < actualCustomers) return 'low';
  return 'on-target';
}

export function buildCustomerEstimateDifferenceLabel(
  forecastCustomers: number,
  actualCustomers: number,
): { primary: string; secondary: string | null } {
  const difference = forecastCustomers - actualCustomers;
  if (difference === 0) {
    return { primary: 'On target', secondary: null };
  }
  const magnitude = Math.abs(difference);
  if (difference > 0) {
    return { primary: `+${magnitude}`, secondary: 'customers high' };
  }
  return { primary: `-${magnitude}`, secondary: 'customers low' };
}

export type CategoryOutcomeKind = 'surplus' | 'shortage' | 'on-target';

export function getCategoryOutcomeKind(
  simulatedOverproductionGrams: number,
  simulatedShortageGrams: number,
): CategoryOutcomeKind {
  if (simulatedShortageGrams > 0) return 'shortage';
  if (simulatedOverproductionGrams > 0) return 'surplus';
  return 'on-target';
}

export function formatCategoryOutcomeLabel(
  kind: CategoryOutcomeKind,
  grams: number,
): string {
  if (kind === 'on-target') return 'On target';
  if (kind === 'shortage') return `${formatGrams(grams)} estimated shortage`;
  return `${formatGrams(grams)} estimated surplus`;
}

export function buildCategoryAriaLabel(
  categoryName: string,
  kind: CategoryOutcomeKind,
  grams: number,
): string {
  if (kind === 'on-target') return `${categoryName}: on target`;
  const rounded = Math.round(grams);
  if (kind === 'shortage') return `${categoryName}: estimated shortage ${rounded} grams`;
  return `${categoryName}: estimated surplus ${rounded} grams`;
}

export const FORECAST_INPUT_SEPARATION_NOTE =
  'Your customer estimate and your menu-item quantities are evaluated separately.';

export function buildPeerCustomerComparisonMessage(
  participantError: number,
  peerMedianError: number,
): string {
  const delta = participantError - peerMedianError;
  if (Math.abs(delta) <= CUSTOMER_ERROR_COMPARISON_TOLERANCE) {
    return 'Your customer estimate was similar in accuracy to the other-staff median.';
  }
  if (delta < 0) {
    return 'Your customer estimate was closer to actual attendance than the other-staff median.';
  }
  return 'Your customer estimate was further from actual attendance than the other-staff median.';
}

export function buildPeerCustomerComparisonDetail(
  participantError: number,
  peerMedianError: number,
): string | null {
  const delta = participantError - peerMedianError;
  if (Math.abs(delta) <= CUSTOMER_ERROR_COMPARISON_TOLERANCE) {
    return null;
  }
  return `Your customer estimate was ${participantError.toFixed(0)} customers off, compared with a median error of ${peerMedianError.toFixed(0)} customers for other staff.`;
}
