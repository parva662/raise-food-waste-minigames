import type { ObservedServiceReality } from '@/products/forecast-results/types';
import { RESULT_CATEGORY_KEYS } from '@/products/forecast-results/types';

/** Sum of measured kitchen overproduction across all categories (grams). */
export function sumMeasuredOverproductionGrams(observed: ObservedServiceReality): number {
  return RESULT_CATEGORY_KEYS.reduce(
    (total, key) => total + observed[key].measuredOverproductionGrams,
    0,
  );
}
