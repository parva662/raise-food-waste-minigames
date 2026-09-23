import type { PortionUnit } from '../types';

export interface RecipeReferenceLine {
  ingredientId: string;
  ingredientName: string;
  requiredAmount: number;
  unit: PortionUnit;
}

export interface RecipeReference {
  recipeId: string;
  recipeName: string;
  lines: RecipeReferenceLine[];
}

export const KITCHEN_DAY_RECIPE_STUBS: RecipeReference[] = [
  {
    recipeId: 'mayonnaise',
    recipeName: 'Mayonnaise',
    lines: [
      { ingredientId: 'yogurt', ingredientName: 'Yogurt', requiredAmount: 1000, unit: 'g' },
      { ingredientId: 'lemon-juice', ingredientName: 'Lemon juice', requiredAmount: 100, unit: 'g' },
      { ingredientId: 'salt', ingredientName: 'Salt', requiredAmount: 8, unit: 'g' },
      { ingredientId: 'pepper', ingredientName: 'Pepper', requiredAmount: 2, unit: 'g' },
    ],
  },
  {
    recipeId: 'herb-oil',
    recipeName: 'Herb oil',
    lines: [
      { ingredientId: 'rapeseed-oil', ingredientName: 'Rapeseed oil', requiredAmount: 2, unit: 'dL' },
      { ingredientId: 'parsley', ingredientName: 'Parsley', requiredAmount: 40, unit: 'g' },
      { ingredientId: 'garlic', ingredientName: 'Garlic', requiredAmount: 10, unit: 'g' },
    ],
  },
];

export function listRecipeReferences(): RecipeReference[] {
  return KITCHEN_DAY_RECIPE_STUBS;
}

export function getRecipeReference(recipeId: string): RecipeReference | null {
  return KITCHEN_DAY_RECIPE_STUBS.find((recipe) => recipe.recipeId === recipeId) ?? null;
}
