# Reference materials

## `Example_menu.xlsx`

Controlled example menu source for the planned menu-import implementation. It documents the expected workbook shape and sample data for that work.

This file is **not** connected to runtime menu loading today. The app still uses the in-repo menu configuration under `src/`.

## Kitchen Day recipe reference

Source workbook (provenance only):

`reference/kitchen-day/reseptit_data_v3.xlsx`

Canonical application reference (clean derivative):

`reference/kitchen-day/kitchen_day_recipe_reference_clean.xlsx`

The clean workbook is the only Excel file used to generate Portion Precision targets. Application code must consume the deterministic extracted dataset, not parse XLSX in the browser.

Regenerate with:

`npm run kitchen-day:recipes`

Outputs:

- `generated-data/kitchen-day/recipes.json`
- `generated-data/kitchen-day/extraction-report.json`
- `src/data/generated/kitchen-day-recipes.json` (runtime copy of the compact dataset)

Field mapping:

- expected final recipe weight = `expected_final_weight_g` from `Kypsä_kokonaispaino`
- target ingredient weight = `target_weight_g` from `Määrä`
- `Saanto` is retained in the source/clean workbooks for reference and is **not** the v1 final-weight target

A recipe is imported only when it has an id, a name, an expected final weight greater than 0, and at least one valid ingredient. An ingredient is imported only when it has a usable name and a target weight greater than 0. Invalid rows are excluded and counted in the extraction report; missing weights are not invented.

Historical Session Review, Progress, and Tutor figures are recalculated from persisted `recipeComposition` + `finalRecipeWeightGrams` and the **current** generated reference. If recipe-reference versioning becomes necessary, document the extract version rather than adding GameBus properties.

A future BarLaurea API can replace the generated JSON behind the same `RecipeReference` adapter.

## `gamebus-minigame-demo-main/` (local only)

A local copy of the external GameBus minigame / embed protocol demo, kept on disk for protocol reference during integration.

**Do not commit** this folder into this repository. It is listed in `.gitignore`. Use the upstream demo project or your own clone outside this repo if you need a full copy in version control.
