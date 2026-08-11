import type { ServiceCloseout } from '../serviceCloseout/types';
import { gramsToKilograms } from '../serviceCloseout/units';

/** Required property references for wasteMeasurement ACTIVITY (service closeout). */
export const WASTE_MEASUREMENT_REQUIRED_REFS = [
  'serviceDate',
  'actualCustomers',
  'mainItemId',
  'mainQuantity',
  'vegetarianItemId',
  'vegetarianQuantity',
  'soupItemId',
  'soupQuantity',
  'dessertItemId',
  'dessertQuantity',
  'overproductionMeatKg',
  'overproductionVegetarianKg',
  'overproductionSoupKg',
  'overproductionDessertKg',
  'submittedAt',
] as const;

export type WasteMeasurementRequiredRef = (typeof WASTE_MEASUREMENT_REQUIRED_REFS)[number];

export type WasteMeasurementValueMap = {
  serviceDate: { value: string };
  actualCustomers: { value: number };
  mainItemId: { value: string };
  mainQuantity: { value: number };
  vegetarianItemId: { value: string };
  vegetarianQuantity: { value: number };
  soupItemId: { value: string };
  soupQuantity: { value: number };
  dessertItemId: { value: string };
  dessertQuantity: { value: number };
  overproductionMeatKg: { value: number };
  overproductionVegetarianKg: { value: number };
  overproductionSoupKg: { value: number };
  overproductionDessertKg: { value: number };
  submittedAt: { value: string };
};

export function orderedWasteMeasurementRequiredPropertyRefs(): readonly WasteMeasurementRequiredRef[] {
  return WASTE_MEASUREMENT_REQUIRED_REFS;
}

/** Maps a finalized ServiceCloseout to wasteMeasurement property values. */
export function mapWasteMeasurement(closeout: ServiceCloseout): WasteMeasurementValueMap {
  return {
    serviceDate: { value: closeout.targetDate },
    actualCustomers: { value: closeout.actualCustomers },
    mainItemId: { value: closeout.main.itemId },
    mainQuantity: { value: closeout.main.preparedQuantity },
    vegetarianItemId: { value: closeout.vegetarian.itemId },
    vegetarianQuantity: { value: closeout.vegetarian.preparedQuantity },
    soupItemId: { value: closeout.soup.itemId },
    soupQuantity: { value: closeout.soup.preparedQuantity },
    dessertItemId: { value: closeout.dessert.itemId },
    dessertQuantity: { value: closeout.dessert.preparedQuantity },
    overproductionMeatKg: { value: gramsToKilograms(closeout.main.overproductionGrams) },
    overproductionVegetarianKg: {
      value: gramsToKilograms(closeout.vegetarian.overproductionGrams),
    },
    overproductionSoupKg: { value: gramsToKilograms(closeout.soup.overproductionGrams) },
    overproductionDessertKg: { value: gramsToKilograms(closeout.dessert.overproductionGrams) },
    submittedAt: { value: closeout.submittedAt },
  };
}
