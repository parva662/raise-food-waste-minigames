import { getPortionWeightGrams } from '../../serviceCloseout/portionWeight';
import type { CloseoutCategoryKey } from '../../serviceCloseout/types';
import type { CloseoutForCalculation } from '../types';
import type { GameBusWasteMeasurement } from './parseGameBusWasteMeasurement';

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
