import type { ObservedServiceReality } from './types';
import { RESULT_CATEGORY_KEYS } from './types';

/** Sum of measured kitchen overproduction across all categories (grams). */
export function sumMeasuredOverproductionGrams(observed: ObservedServiceReality): number {
  return RESULT_CATEGORY_KEYS.reduce(
    (total, key) => total + observed[key].measuredOverproductionGrams,
    0,
  );
}
