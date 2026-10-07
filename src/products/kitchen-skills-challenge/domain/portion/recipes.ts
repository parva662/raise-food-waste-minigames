import generatedRecipes from '@/data/generated/kitchen-skills-recipes.json';
import type { PortionUnit } from '@/products/kitchen-skills-challenge/domain/types';

export interface RecipeReferenceLine {
  ingredientId: string;
  ingredientName: string;
  requiredAmount: number;
  unit: PortionUnit;
  /** Recipe-ingredient Hävikki from the kitchen reference. Internal; not student-facing. 0 is valid. */
  referenceWastePercent?: number;
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
  referenceWastePercent?: number;
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
    lines: recipe.ingredients.map((ingredient) => {
      const line: RecipeReferenceLine = {
        ingredientId: ingredient.ingredientId,
        ingredientName: ingredient.ingredientName,
        requiredAmount: ingredient.targetWeightGrams,
        unit: 'g',
      };
      if (ingredient.referenceWastePercent != null) {
        line.referenceWastePercent = ingredient.referenceWastePercent;
      }
      return line;
    }),
  };
}

const recipeReferences: RecipeReference[] = generatedRecipes.recipes.map(toRecipeReference);

export function listRecipeReferences(): RecipeReference[] {
  return recipeReferences;
}

export function getRecipeReference(recipeId: string): RecipeReference | null {
  return recipeReferences.find((recipe) => recipe.recipeId === recipeId) ?? null;
}
