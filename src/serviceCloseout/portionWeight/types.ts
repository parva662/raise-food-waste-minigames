import type { CloseoutCategoryKey } from '../types';

export interface PortionWeightProvider {
  getPortionWeightGrams(itemId: string, category: CloseoutCategoryKey): number;
}
