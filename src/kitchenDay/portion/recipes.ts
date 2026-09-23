import generatedRecipes from '../../data/generated/kitchen-day-recipes.json';
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
  expectedFinalWeightGrams: number;
  lines: RecipeReferenceLine[];
}

interface GeneratedIngredient {
  ingredientId: string;
  ingredientName: string;
  targetWeightGrams: number;
}

interface GeneratedRecipe {
  recipeId: string;
  recipeName: string;
  expectedFinalWeightGrams: number;
  ingredients: GeneratedIngredient[];
}

function toRecipeReference(recipe: GeneratedRecipe): RecipeReference {
  return {
    recipeId: recipe.recipeId,
    recipeName: recipe.recipeName,
    expectedFinalWeightGrams: recipe.expectedFinalWeightGrams,
    lines: recipe.ingredients.map((ingredient) => ({
      ingredientId: ingredient.ingredientId,
      ingredientName: ingredient.ingredientName,
      requiredAmount: ingredient.targetWeightGrams,
      unit: 'g',
    })),
  };
}

const recipeReferences: RecipeReference[] = generatedRecipes.recipes.map(toRecipeReference);

export function listRecipeReferences(): RecipeReference[] {
  return recipeReferences;
}

export function getRecipeReference(recipeId: string): RecipeReference | null {
  return recipeReferences.find((recipe) => recipe.recipeId === recipeId) ?? null;
}
