import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import XLSX from 'xlsx';
import { slugFromMenuItemName } from '../menu/normalize.ts';

export const CLEAN_REFERENCE_RELATIVE_PATH =
  'reference/kitchen-skills/kitchen_day_recipe_reference_clean.xlsx';

export const SOURCE_REFERENCE_RELATIVE_PATH =
  'reference/kitchen-skills/reseptit_data_v3.xlsx';

export interface ExtractedIngredient {
  ingredientId: string;
  ingredientName: string;
  targetWeightGrams: number;
  referenceWastePercent?: number;
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
  reference_waste_percent?: unknown;
}

export function readPositiveNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const number = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  if (!Number.isFinite(number) || number <= 0) return null;
  return number;
}

export function readReferenceWastePercent(value: unknown): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) return null;
    return value;
  }
  const text = String(value).replace('%', '').replace(/\s+/g, '').replace(',', '.');
  const number = Number(text);
  if (!Number.isFinite(number) || number < 0) return null;
  return number;
}

export function sourceWastePercentKey(recipeId: string, ingredientOrder: number): string {
  return `${recipeId}:${ingredientOrder}`;
}

export function readSourceReferenceWastePercents(workbookPath: string): Map<string, number> {
  const workbook = XLSX.readFile(workbookPath);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets.Reseptit ?? {}, {
    defval: null,
    raw: true,
  });
  const percents = new Map<string, number>();
  for (const row of rows) {
    const recipeId = readRecipeId(row.Resepti_ID);
    if (!recipeId) continue;
    for (let slot = 1; slot <= 22; slot += 1) {
      const ingredientName = readRequiredText(row[`Nimi ${slot}`]);
      if (!ingredientName) continue;
      const percent = readReferenceWastePercent(row[`Hävikki ${slot}`]);
      if (percent == null) continue;
      percents.set(sourceWastePercentKey(recipeId, slot), percent);
    }
  }
  return percents;
}

export function applyReferenceWastePercents(
  ingredientRows: readonly RecipeIngredientRow[],
  percents: ReadonlyMap<string, number>,
): RecipeIngredientRow[] {
  return ingredientRows.map((row) => {
    const recipeId = readRecipeId(row.recipe_id);
    const order = Number(row.ingredient_order);
    if (!recipeId || !Number.isFinite(order)) return { ...row };
    const percent = percents.get(sourceWastePercentKey(recipeId, order));
    if (percent == null) return { ...row };
    return { ...row, reference_waste_percent: percent };
  });
}

export function writeEnrichedCleanWorkbook(
  cleanWorkbookPath: string,
  percents: ReadonlyMap<string, number>,
): void {
  const workbook = XLSX.readFile(cleanWorkbookPath);
  const ingredients = XLSX.utils.sheet_to_json<RecipeIngredientRow>(
    workbook.Sheets.Recipe_ingredients ?? {},
    { defval: null, raw: true },
  );
  workbook.Sheets.Recipe_ingredients = XLSX.utils.json_to_sheet(
    applyReferenceWastePercents(ingredients, percents),
  );
  XLSX.writeFile(workbook, cleanWorkbookPath);
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
      const referenceWastePercent = readReferenceWastePercent(ingredient.reference_waste_percent);
      const extracted: ExtractedIngredient = {
        ingredientId: uniqueIngredientId(
          ingredientName,
          usedIds,
          Number.isFinite(order) ? order : ingredients.length + 1,
        ),
        ingredientName,
        targetWeightGrams,
      };
      if (referenceWastePercent != null) extracted.referenceWastePercent = referenceWastePercent;
      ingredients.push(extracted);
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
  sourceHavikkiPath?: string,
): RecipeExtractionResult {
  const workbook = XLSX.readFile(workbookPath);
  const summary = XLSX.utils.sheet_to_json<RecipeSummaryRow>(workbook.Sheets.Recipe_summary ?? {}, {
    defval: null,
    raw: true,
  });
  let ingredients = XLSX.utils.sheet_to_json<RecipeIngredientRow>(
    workbook.Sheets.Recipe_ingredients ?? {},
    { defval: null, raw: true },
  );
  const havikkiPath = sourceHavikkiPath ?? resolve(process.cwd(), SOURCE_REFERENCE_RELATIVE_PATH);
  if (existsSync(havikkiPath)) {
    ingredients = applyReferenceWastePercents(ingredients, readSourceReferenceWastePercents(havikkiPath));
  }
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
  const recipesPath = resolve(repoRoot, 'generated-data/kitchen-skills/recipes.json');
  const reportPath = resolve(repoRoot, 'generated-data/kitchen-skills/extraction-report.json');
  const runtimePath = resolve(repoRoot, 'src/data/generated/kitchen-skills-recipes.json');
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
