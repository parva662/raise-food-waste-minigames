/**
 * DEVELOPMENT FIXTURES ONLY — not study or operational data.
 * Replace with a real portion-weight reference source in production integration.
 */
import type { CloseoutCategoryKey } from '../types';
import type { PortionWeightProvider } from './types';

/** Default grams per category when no item-specific fixture exists. */
export const DEVELOPMENT_CATEGORY_PORTION_WEIGHT_GRAMS: Record<CloseoutCategoryKey, number> = {
  main: 120,
  vegetarian: 180,
  soup: 250,
  dessert: 90,
};

/**
 * Optional item-level overrides for development.
 * Keys are catalogue item IDs from the generated menu.
 */
export const DEVELOPMENT_ITEM_PORTION_WEIGHT_GRAMS: Partial<Record<string, number>> = {};

export function createDevelopmentPortionWeightProvider(): PortionWeightProvider {
  return {
    getPortionWeightGrams(itemId: string, category: CloseoutCategoryKey): number {
      const itemOverride = DEVELOPMENT_ITEM_PORTION_WEIGHT_GRAMS[itemId];
      if (itemOverride !== undefined) {
        return itemOverride;
      }
      return DEVELOPMENT_CATEGORY_PORTION_WEIGHT_GRAMS[category];
    },
  };
}

/** Singleton used by the closeout application until a real provider is wired. */
export const developmentPortionWeightProvider = createDevelopmentPortionWeightProvider();

export function getPortionWeightGrams(itemId: string, category: CloseoutCategoryKey): number {
  return developmentPortionWeightProvider.getPortionWeightGrams(itemId, category);
}
