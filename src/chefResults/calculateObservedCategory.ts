import type { CloseoutCategoryForCalculation, ObservedCategoryReality } from './types';

export function calculateActualPreparedWeightGrams(
  preparedQuantity: number,
  portionWeightGrams: number,
): number {
  return preparedQuantity * portionWeightGrams;
}

export function calculateObservedDemandWeightGrams(
  actualPreparedWeightGrams: number,
  measuredOverproductionGrams: number,
): number {
  return actualPreparedWeightGrams - measuredOverproductionGrams;
}

export function calculateObservedCategory(
  category: CloseoutCategoryForCalculation,
): ObservedCategoryReality {
  const actualPreparedWeightGrams = calculateActualPreparedWeightGrams(
    category.preparedQuantity,
    category.portionWeightGrams,
  );
  return {
    itemId: category.itemId,
    actualPreparedQuantity: category.preparedQuantity,
    portionWeightGrams: category.portionWeightGrams,
    actualPreparedWeightGrams,
    measuredOverproductionGrams: category.overproductionGrams,
    observedDemandWeightGrams: calculateObservedDemandWeightGrams(
      actualPreparedWeightGrams,
      category.overproductionGrams,
    ),
  };
}
