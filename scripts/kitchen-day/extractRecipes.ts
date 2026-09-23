import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import XLSX from 'xlsx';
import { slugFromMenuItemName } from '../menu/normalize.ts';

export const CLEAN_REFERENCE_RELATIVE_PATH =
  'reference/kitchen-day/kitchen_day_recipe_reference_clean.xlsx';

export interface ExtractedIngredient {
  ingredientId: string;
  ingredientName: string;
  targetWeightGrams: number;
}

export interface ExtractedRecipe {
  recipeId: string;
  recipeName: string;
  expectedFinalWeightGrams: number;
  ingredients: ExtractedIngredient[];
}

export interface ExtractionExclusion {
  reason: string;
  recipeId?: string;
  recipeName?: string;
  ingredientName?: string;
}

export interface RecipeExtractionResult {
  recipes: ExtractedRecipe[];
  report: {
    sourceWorkbook: string;
    summaryRows: number;
    ingredientRows: number;
    recipesImported: number;
    ingredientRowsImported: number;
    excludedRecipes: number;
    excludedIngredientRows: number;
    exclusions: ExtractionExclusion[];
  };
}

export interface RecipeSummaryRow {
  recipe_id?: unknown;
  recipe_name?: unknown;
  expected_final_weight_g?: unknown;
}

export interface RecipeIngredientRow {
  recipe_id?: unknown;
  recipe_name?: unknown;
  expected_final_weight_g?: unknown;
  ingredient_order?: unknown;
  ingredient_name?: unknown;
  target_weight_g?: unknown;
}

export function readPositiveNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const number = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(number) || number <= 0) return null;
  return number;
}

export function readRequiredText(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text.length > 0 ? text : null;
}

export function readRecipeId(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function uniqueIngredientId(name: string, used: Set<string>, order: number): string {
  const base = slugFromMenuItemName(name);
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  const fallback = `${base}-${order}`;
  used.add(fallback);
  return fallback;
}

export function extractRecipesFromRows(
  summaryRows: readonly RecipeSummaryRow[],
  ingredientRows: readonly RecipeIngredientRow[],
  sourceWorkbook = CLEAN_REFERENCE_RELATIVE_PATH,
): RecipeExtractionResult {
  const exclusions: ExtractionExclusion[] = [];
  const ingredientsByRecipe = new Map<string, RecipeIngredientRow[]>();

  for (const row of ingredientRows) {
    const recipeId = readRecipeId(row.recipe_id);
    if (!recipeId) {
      exclusions.push({
        reason: 'missing_ingredient_recipe_id',
        ingredientName: readRequiredText(row.ingredient_name) ?? undefined,
      });
      continue;
    }
    const list = ingredientsByRecipe.get(recipeId) ?? [];
    list.push(row);
    ingredientsByRecipe.set(recipeId, list);
  }

  const seenRecipeIds = new Set<string>();
  const recipes: ExtractedRecipe[] = [];

  for (const row of summaryRows) {
    const recipeId = readRecipeId(row.recipe_id);
    const recipeName = readRequiredText(row.recipe_name);
    const expectedFinalWeightGrams = readPositiveNumber(row.expected_final_weight_g);

    if (!recipeId) {
      exclusions.push({ reason: 'missing_recipe_id', recipeName: recipeName ?? undefined });
      continue;
    }
    if (seenRecipeIds.has(recipeId)) {
      exclusions.push({ reason: 'duplicate_recipe_id', recipeId, recipeName: recipeName ?? undefined });
      continue;
    }
    seenRecipeIds.add(recipeId);
    if (!recipeName) {
      exclusions.push({ reason: 'missing_recipe_name', recipeId });
      continue;
    }
    if (expectedFinalWeightGrams == null) {
      exclusions.push({ reason: 'invalid_expected_final_weight', recipeId, recipeName });
      continue;
    }

    const sourceIngredients = ingredientsByRecipe.get(recipeId) ?? [];
    const usedIds = new Set<string>();
    const ingredients: ExtractedIngredient[] = [];
    const ordered = [...sourceIngredients].sort((left, right) => {
      const leftOrder = Number(left.ingredient_order);
      const rightOrder = Number(right.ingredient_order);
      const leftSafe = Number.isFinite(leftOrder) ? leftOrder : Number.MAX_SAFE_INTEGER;
      const rightSafe = Number.isFinite(rightOrder) ? rightOrder : Number.MAX_SAFE_INTEGER;
      if (leftSafe !== rightSafe) return leftSafe - rightSafe;
      return String(left.ingredient_name ?? '').localeCompare(String(right.ingredient_name ?? ''));
    });

    for (const ingredient of ordered) {
      const ingredientName = readRequiredText(ingredient.ingredient_name);
      const targetWeightGrams = readPositiveNumber(ingredient.target_weight_g);
      if (!ingredientName) {
        exclusions.push({ reason: 'missing_ingredient_name', recipeId, recipeName });
        continue;
      }
      if (targetWeightGrams == null) {
        exclusions.push({ reason: 'invalid_target_weight', recipeId, recipeName, ingredientName });
        continue;
      }
      const order = Number(ingredient.ingredient_order);
      ingredients.push({
        ingredientId: uniqueIngredientId(
          ingredientName,
          usedIds,
          Number.isFinite(order) ? order : ingredients.length + 1,
        ),
        ingredientName,
        targetWeightGrams,
      });
    }

    if (ingredients.length === 0) {
      exclusions.push({ reason: 'no_valid_ingredients', recipeId, recipeName });
      continue;
    }

    recipes.push({
      recipeId,
      recipeName,
      expectedFinalWeightGrams,
      ingredients,
    });
  }

  for (const [recipeId, rows] of ingredientsByRecipe) {
    if (seenRecipeIds.has(recipeId)) continue;
    for (const row of rows) {
      exclusions.push({
        reason: 'orphan_ingredient_row',
        recipeId,
        recipeName: readRequiredText(row.recipe_name) ?? undefined,
        ingredientName: readRequiredText(row.ingredient_name) ?? undefined,
      });
    }
  }

  recipes.sort((left, right) => {
    const leftNumber = Number(left.recipeId);
    const rightNumber = Number(right.recipeId);
    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber !== rightNumber) {
      return leftNumber - rightNumber;
    }
    return left.recipeId.localeCompare(right.recipeId);
  });

  const excludedIngredientReasons = new Set([
    'missing_ingredient_recipe_id',
    'missing_ingredient_name',
    'invalid_target_weight',
    'orphan_ingredient_row',
  ]);
  const excludedRecipeReasons = new Set([
    'missing_recipe_id',
    'duplicate_recipe_id',
    'missing_recipe_name',
    'invalid_expected_final_weight',
    'no_valid_ingredients',
  ]);

  return {
    recipes,
    report: {
      sourceWorkbook,
      summaryRows: summaryRows.length,
      ingredientRows: ingredientRows.length,
      recipesImported: recipes.length,
      ingredientRowsImported: recipes.reduce((sum, recipe) => sum + recipe.ingredients.length, 0),
      excludedRecipes: exclusions.filter((item) => excludedRecipeReasons.has(item.reason)).length,
      excludedIngredientRows: exclusions.filter((item) => excludedIngredientReasons.has(item.reason)).length,
      exclusions,
    },
  };
}

export function extractRecipesFromWorkbook(
  workbookPath: string,
  sourceWorkbook = CLEAN_REFERENCE_RELATIVE_PATH,
): RecipeExtractionResult {
  const workbook = XLSX.readFile(workbookPath);
  const summary = XLSX.utils.sheet_to_json<RecipeSummaryRow>(workbook.Sheets.Recipe_summary ?? {}, {
    defval: null,
    raw: true,
  });
  const ingredients = XLSX.utils.sheet_to_json<RecipeIngredientRow>(
    workbook.Sheets.Recipe_ingredients ?? {},
    { defval: null, raw: true },
  );
  return extractRecipesFromRows(summary, ingredients, sourceWorkbook);
}

export function serializeRecipesDataset(recipes: readonly ExtractedRecipe[]): string {
  return `${JSON.stringify({ recipes }, null, 2)}\n`;
}

export function serializeExtractionReport(result: RecipeExtractionResult): string {
  return `${JSON.stringify(result.report, null, 2)}\n`;
}

export function writeRecipeExtractionOutputs(
  result: RecipeExtractionResult,
  repoRoot: string,
): { recipesPath: string; reportPath: string; runtimePath: string } {
  const recipesJson = serializeRecipesDataset(result.recipes);
  const reportJson = serializeExtractionReport(result);
  const recipesPath = resolve(repoRoot, 'generated-data/kitchen-day/recipes.json');
  const reportPath = resolve(repoRoot, 'generated-data/kitchen-day/extraction-report.json');
  const runtimePath = resolve(repoRoot, 'src/data/generated/kitchen-day-recipes.json');
  mkdirSync(dirname(recipesPath), { recursive: true });
  mkdirSync(dirname(reportPath), { recursive: true });
  mkdirSync(dirname(runtimePath), { recursive: true });
  writeFileSync(recipesPath, recipesJson);
  writeFileSync(reportPath, reportJson);
  writeFileSync(runtimePath, recipesJson);
  return { recipesPath, reportPath, runtimePath };
}

export function repoRootFromHere(modulePath: string): string {
  return resolve(dirname(modulePath), '../..');
}
