import type { NormalizedServiceCloseout } from '../../serviceCloseout/operationalRecord';
import type { CloseoutForCalculation } from '../types';

export function closeoutToCalculationInput(
  closeout: NormalizedServiceCloseout,
): CloseoutForCalculation {
  return {
    targetDate: closeout.targetDate,
    actualCustomers: closeout.actualCustomers,
    main: {
      itemId: closeout.main.itemId,
      preparedQuantity: closeout.main.preparedQuantity,
      portionWeightGrams: closeout.main.portionWeightGrams,
      overproductionGrams: closeout.main.overproductionGrams,
    },
    vegetarian: {
      itemId: closeout.vegetarian.itemId,
      preparedQuantity: closeout.vegetarian.preparedQuantity,
      portionWeightGrams: closeout.vegetarian.portionWeightGrams,
      overproductionGrams: closeout.vegetarian.overproductionGrams,
    },
    soup: {
      itemId: closeout.soup.itemId,
      preparedQuantity: closeout.soup.preparedQuantity,
      portionWeightGrams: closeout.soup.portionWeightGrams,
      overproductionGrams: closeout.soup.overproductionGrams,
    },
    dessert: {
      itemId: closeout.dessert.itemId,
      preparedQuantity: closeout.dessert.preparedQuantity,
      portionWeightGrams: closeout.dessert.portionWeightGrams,
      overproductionGrams: closeout.dessert.overproductionGrams,
    },
  };
}
