import type { CategoryForecastInput, ObservedCategoryReality, StaffCategorySimulation } from './types';
import {
  calculateActualPreparedWeightGrams,
  calculateObservedDemandWeightGrams,
} from './calculateObservedCategory';

export function calculateForecastProductionWeightGrams(
  forecastQuantity: number,
  portionWeightGrams: number,
): number {
  return forecastQuantity * portionWeightGrams;
}

export function calculateDeltaGrams(
  forecastProductionWeightGrams: number,
  observedDemandWeightGrams: number,
): number {
  return forecastProductionWeightGrams - observedDemandWeightGrams;
}

export function calculateSimulatedOverproductionGrams(deltaGrams: number): number {
  return Math.max(deltaGrams, 0);
}

export function calculateSimulatedShortageGrams(deltaGrams: number): number {
  return Math.max(-deltaGrams, 0);
}

export function calculateStaffCategorySimulation(
  observed: ObservedCategoryReality,
  forecast: CategoryForecastInput,
): StaffCategorySimulation {
  const forecastProductionWeightGrams = calculateForecastProductionWeightGrams(
    forecast.forecastQuantity,
    forecast.portionWeightGrams,
  );
  const deltaGrams = calculateDeltaGrams(
    forecastProductionWeightGrams,
    observed.observedDemandWeightGrams,
  );

  return {
    itemId: forecast.itemId,
    forecastQuantity: forecast.forecastQuantity,
    portionWeightGrams: forecast.portionWeightGrams,
    forecastProductionWeightGrams,
    actualPreparedQuantity: observed.actualPreparedQuantity,
    actualPreparedWeightGrams: observed.actualPreparedWeightGrams,
    measuredOverproductionGrams: observed.measuredOverproductionGrams,
    observedDemandWeightGrams: observed.observedDemandWeightGrams,
    simulatedOverproductionGrams: calculateSimulatedOverproductionGrams(deltaGrams),
    simulatedShortageGrams: calculateSimulatedShortageGrams(deltaGrams),
  };
}

/** Convenience for tests — derive observed demand from prepared quantity inputs. */
export function simulateFromQuantities(
  preparedQuantity: number,
  portionWeightGrams: number,
  measuredOverproductionGrams: number,
  forecastQuantity: number,
  itemId = 'item',
): StaffCategorySimulation {
  const actualPreparedWeightGrams = calculateActualPreparedWeightGrams(
    preparedQuantity,
    portionWeightGrams,
  );
  const observed: ObservedCategoryReality = {
    itemId,
    actualPreparedQuantity: preparedQuantity,
    portionWeightGrams,
    actualPreparedWeightGrams,
    measuredOverproductionGrams,
    observedDemandWeightGrams: calculateObservedDemandWeightGrams(
      actualPreparedWeightGrams,
      measuredOverproductionGrams,
    ),
  };
  return calculateStaffCategorySimulation(observed, {
    itemId,
    forecastQuantity,
    portionWeightGrams,
  });
}
