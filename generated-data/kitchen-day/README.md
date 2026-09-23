# Generated Kitchen Day recipe data

Produced by `npm run kitchen-day:recipes` from `reference/kitchen-day/kitchen_day_recipe_reference_clean.xlsx`.

**Do not edit these JSON files manually.** Re-run the extract after workbook changes.

- `recipes.json` — compact runtime dataset (recipe id/name, expected final weight, ingredient targets)
- `extraction-report.json` — import and exclusion counts

The frontend adapter reads `src/data/generated/kitchen-day-recipes.json` and maps it to `RecipeReference`. The browser never parses the Excel workbooks.
