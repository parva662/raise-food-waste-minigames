import { getPortionWeightGrams } from '@/products/service-closeout/portionWeight';
import type { CloseoutCategoryKey } from '@/products/service-closeout/types';
import type { CloseoutForCalculation } from '@/products/forecast-results/types';
import type { GameBusWasteMeasurement } from '@/products/forecast-results/adapters/parseGameBusWasteMeasurement';

const KG_TO_GRAMS = 1000;

function categoryFromMeasurement(
  key: CloseoutCategoryKey,
  itemId: string,
  preparedQuantity: number,
  overproductionKg: number,
): CloseoutForCalculation[CloseoutCategoryKey] {
  return {
    itemId,
    preparedQuantity,
    portionWeightGrams: getPortionWeightGrams(itemId, key),
    overproductionGrams: overproductionKg * KG_TO_GRAMS,
  };
}

export function gameBusWasteMeasurementToCalculationInput(
  measurement: GameBusWasteMeasurement,
): CloseoutForCalculation {
  return {
    targetDate: measurement.serviceDate,
    actualCustomers: measurement.actualCustomers,
    main: categoryFromMeasurement(
      'main',
      measurement.mainItemId,
      measurement.preparedMainQuantity,
      measurement.overproductionMeatKg,
    ),
    vegetarian: categoryFromMeasurement(
      'vegetarian',
      measurement.vegetarianItemId,
      measurement.preparedVegetarianQuantity,
      measurement.overproductionVegetarianKg,
    ),
    soup: categoryFromMeasurement(
      'soup',
      measurement.soupItemId,
      measurement.preparedSoupQuantity,
      measurement.overproductionSoupKg,
    ),
    dessert: categoryFromMeasurement(
      'dessert',
      measurement.dessertItemId,
      measurement.preparedDessertQuantity,
      measurement.overproductionDessertKg,
    ),
  };
}
