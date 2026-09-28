import type { CloseoutCategoryKey } from '@/products/service-closeout/types';

export interface PortionWeightProvider {
  getPortionWeightGrams(itemId: string, category: CloseoutCategoryKey): number;
}
