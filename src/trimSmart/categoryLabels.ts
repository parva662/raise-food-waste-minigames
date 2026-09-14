import type { TrimSmartIngredientCategory } from './types';

export function formatIngredientCategoryLabel(category: TrimSmartIngredientCategory): string {
  const labels: Record<TrimSmartIngredientCategory, string> = {
    vegetables: 'Vegetables',
    fruit: 'Fruit',
    meat: 'Meat',
    fish: 'Fish',
    dairy: 'Dairy',
    grains: 'Grains',
    legumes: 'Legumes',
    other: 'Other',
  };
  return labels[category];
}
