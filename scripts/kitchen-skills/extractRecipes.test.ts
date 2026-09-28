import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { resolve } from 'node:path';
import {
  CLEAN_REFERENCE_RELATIVE_PATH,
  extractRecipesFromRows,
  extractRecipesFromWorkbook,
  serializeRecipesDataset,
  writeRecipeExtractionOutputs,
} from './extractRecipes.ts';

describe('Kitchen Day recipe extraction', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'kitchen-day-recipes-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('imports a valid recipe and expected final weight from the clean columns', () => {
    const result = extractRecipesFromRows(
      [
        {
          recipe_id: 10,
          recipe_name: 'Test sauce',
          expected_final_weight_g: 1850,
        },
      ],
      [
        {
          recipe_id: 10,
          ingredient_order: 2,
          ingredient_name: 'Salt',
          target_weight_g: 8,
        },
        {
          recipe_id: 10,
          ingredient_order: 1,
          ingredient_name: 'Yogurt',
          target_weight_g: 1000,
        },
      ],
    );

    expect(result.recipes).toEqual([
      {
        recipeId: '10',
        recipeName: 'Test sauce',
        expectedFinalWeightGrams: 1850,
        ingredients: [
          { ingredientId: 'yogurt', ingredientName: 'Yogurt', targetWeightGrams: 1000 },
          { ingredientId: 'salt', ingredientName: 'Salt', targetWeightGrams: 8 },
        ],
      },
    ]);
    expect(result.report.recipesImported).toBe(1);
    expect(result.report.ingredientRowsImported).toBe(2);
    expect(result.report.excludedRecipes).toBe(0);
  });

  it('excludes invalid recipes and ingredient rows without inventing weights', () => {
    const result = extractRecipesFromRows(
      [
        { recipe_id: null, recipe_name: 'Nameless id', expected_final_weight_g: 100 },
        { recipe_id: 2, recipe_name: '', expected_final_weight_g: 100 },
        { recipe_id: 3, recipe_name: 'Zero final', expected_final_weight_g: 0 },
        { recipe_id: 4, recipe_name: 'No usable lines', expected_final_weight_g: 200 },
        { recipe_id: 5, recipe_name: 'Kept', expected_final_weight_g: 300 },
      ],
      [
        { recipe_id: 4, ingredient_name: '', target_weight_g: 10 },
        { recipe_id: 4, ingredient_name: 'Pepper', target_weight_g: 0 },
        { recipe_id: 5, ingredient_name: 'Oil', target_weight_g: 40 },
        { recipe_id: 5, ingredient_name: 'Missing grams', target_weight_g: null },
        { recipe_id: 99, ingredient_name: 'Orphan', target_weight_g: 5 },
      ],
    );

    expect(result.recipes.map((recipe) => recipe.recipeId)).toEqual(['5']);
    expect(result.recipes[0]?.ingredients).toEqual([
      { ingredientId: 'oil', ingredientName: 'Oil', targetWeightGrams: 40 },
    ]);
    expect(result.report.excludedRecipes).toBe(4);
    expect(result.report.excludedIngredientRows).toBe(4);
    expect(result.report.exclusions.map((item) => item.reason)).toEqual(
      expect.arrayContaining([
        'missing_recipe_id',
        'missing_recipe_name',
        'invalid_expected_final_weight',
        'no_valid_ingredients',
        'missing_ingredient_name',
        'invalid_target_weight',
        'orphan_ingredient_row',
      ]),
    );
  });

  it('writes a deterministic compact dataset and report', () => {
    const result = extractRecipesFromRows(
      [{ recipe_id: 1, recipe_name: 'A', expected_final_weight_g: 10 }],
      [{ recipe_id: 1, ingredient_order: 1, ingredient_name: 'Water', target_weight_g: 10 }],
    );
    expect(serializeRecipesDataset(result.recipes)).toBe(
      `${JSON.stringify(
        {
          recipes: [
            {
              recipeId: '1',
              recipeName: 'A',
              expectedFinalWeightGrams: 10,
              ingredients: [
                { ingredientId: 'water', ingredientName: 'Water', targetWeightGrams: 10 },
              ],
            },
          ],
        },
        null,
        2,
      )}\n`,
    );

    const paths = writeRecipeExtractionOutputs(result, tempDir);
    expect(JSON.parse(readFileSync(paths.recipesPath, 'utf8'))).toEqual(
      JSON.parse(readFileSync(paths.runtimePath, 'utf8')),
    );
    expect(JSON.parse(readFileSync(paths.reportPath, 'utf8')).recipesImported).toBe(1);
  });

  it('reads the clean workbook sheets', () => {
    const workbookPath = join(tempDir, 'clean.xlsx');
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        { recipe_id: 7, recipe_name: 'Broth', expected_final_weight_g: 500 },
      ]),
      'Recipe_summary',
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        { recipe_id: 7, ingredient_order: 1, ingredient_name: 'Stock', target_weight_g: 400 },
      ]),
      'Recipe_ingredients',
    );
    XLSX.writeFile(workbook, workbookPath);

    const result = extractRecipesFromWorkbook(workbookPath);
    expect(result.recipes[0]).toMatchObject({
      recipeId: '7',
      recipeName: 'Broth',
      expectedFinalWeightGrams: 500,
    });
    expect(result.recipes[0]?.ingredients[0]).toMatchObject({
      ingredientName: 'Stock',
      targetWeightGrams: 400,
    });
  });

  it('reports counts from the clean professional workbook', () => {
    const result = extractRecipesFromWorkbook(resolve(process.cwd(), CLEAN_REFERENCE_RELATIVE_PATH));
    expect(result.report.summaryRows).toBe(191);
    expect(result.report.ingredientRows).toBe(1763);
    expect(result.report.recipesImported).toBe(190);
    expect(result.report.ingredientRowsImported).toBe(1741);
    expect(result.report.excludedRecipes).toBe(1);
    expect(result.report.excludedIngredientRows).toBe(13);
    expect(result.recipes.find((recipe) => recipe.recipeId === '54')).toBeUndefined();
    expect(result.recipes.find((recipe) => recipe.recipeId === '1')?.expectedFinalWeightGrams).toBe(13500);
  });
});
