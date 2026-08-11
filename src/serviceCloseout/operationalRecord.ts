import type { ServiceCloseout } from './types';
import { gramsToKilograms } from './units';

export type CloseoutCategoryWithKg = ServiceCloseout['main'] & {
  /** Overproduction waste in kilograms (source-dataset unit). */
  overproductionKg: number;
};

/**
 * Application closeout with overproduction normalized to kilograms.
 * Independent from GameBus property-template naming.
 */
export type NormalizedServiceCloseout = {
  targetDate: string;
  headChefUserId: string;
  actualCustomers: number;
  main: CloseoutCategoryWithKg;
  vegetarian: CloseoutCategoryWithKg;
  soup: CloseoutCategoryWithKg;
  dessert: CloseoutCategoryWithKg;
  submittedAt: string;
};

function withKg(category: ServiceCloseout['main']): CloseoutCategoryWithKg {
  return {
    ...category,
    overproductionKg: gramsToKilograms(category.overproductionGrams),
  };
}

/** Add kilogram overproduction values to a finalized ServiceCloseout. */
export function normalizeCloseoutKg(closeout: ServiceCloseout): NormalizedServiceCloseout {
  return {
    targetDate: closeout.targetDate,
    headChefUserId: closeout.headChefUserId,
    actualCustomers: closeout.actualCustomers,
    main: withKg(closeout.main),
    vegetarian: withKg(closeout.vegetarian),
    soup: withKg(closeout.soup),
    dessert: withKg(closeout.dessert),
    submittedAt: closeout.submittedAt,
  };
}
