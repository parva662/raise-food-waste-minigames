import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CLEAN_REFERENCE_RELATIVE_PATH,
  extractRecipesFromWorkbook,
  repoRootFromHere,
  writeRecipeExtractionOutputs,
} from './extractRecipes.ts';

const root = repoRootFromHere(fileURLToPath(import.meta.url));
const input = process.argv[2] ?? resolve(root, CLEAN_REFERENCE_RELATIVE_PATH);
const result = extractRecipesFromWorkbook(input, CLEAN_REFERENCE_RELATIVE_PATH);
const paths = writeRecipeExtractionOutputs(result, root);

console.log(`Source: ${input}`);
console.log(`Recipes imported: ${result.report.recipesImported}`);
console.log(`Ingredient rows imported: ${result.report.ingredientRowsImported}`);
console.log(`Excluded recipes: ${result.report.excludedRecipes}`);
console.log(`Excluded ingredient rows: ${result.report.excludedIngredientRows}`);
console.log(`Wrote ${paths.recipesPath}`);
console.log(`Wrote ${paths.reportPath}`);
console.log(`Wrote ${paths.runtimePath}`);
