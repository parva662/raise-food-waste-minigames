# Portion Precision

> **APPROVED PRODUCT TARGET**. Not implemented on `main`.
>
> Module of [`KITCHEN_DAY.md`](KITCHEN_DAY.md). Slug authority: [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md).

## 1. Purpose

Record how accurately a student measures the ingredients of a prepared recipe/component, and the final weight of what they produced.

## 2. Unit of work

**One `portionPrecision` activity = one prepared recipe/component.**

All actual measurements live in **one** property: `recipeComposition`. No per-ingredient activity. No top-level `ingredientId` / `ingredientName` / `ingredientCategory`.

## 3. Stored properties

`sessionId`, `sessionDate`, `submittedAt`, `recipeId`, `recipeName`, `recipeComposition`, `finalRecipeWeightGrams`.

Each `recipeComposition` entry: `ingredientId`, `ingredientName`, `actualAmount`, `unit`. `actualAmount` is nested, not a GameBus property.

Accuracy, error, and final-weight deviation are **derived at display time**. They are not stored on the activity.

## 4. Recipe data outside GameBus

Required amounts, recipe identity, and expected final weight come from the current recipe reference (professional clean workbook extract now; a future BarLaurea source can use the same adapter). They are **not** copied into the activity. Students cannot edit required amounts.

Expected final weight comes from the recipe reference (`Kypsä_kokonaispaino` in the source workbook). Do not infer it from the sum of ingredient targets. Yield (`Saanto`) is retained in the source materials for reference only.

If the recipe reference later needs versioning, document the version used for recalculation. Do not invent new GameBus properties for derived metrics.

## 5. Derived comparison

Comparison is exact required vs actual; no tolerance band.

Ingredient signed deviation (when target > 0):

`((actual − target) / target) × 100`

Shown as Exact, or *n.n*% over / under. Absolute gram difference is also shown where useful.

Whole-recipe ingredient error is **weighted** by target mass:

`sum(|actual − target|) / sum(target) × 100`

Ingredient accuracy is `max(0, 100 − that error)`. Tiny ingredients do not dominate the recipe result.

Final-weight deviation uses the recipe reference expected final weight:

`|recorded final weight − expected final weight| / expected final weight × 100`

These two recipe metrics stay separate. There is **no** automatic combined score and **no** automatic tutor score.

## 6. Journey

Select recipe → see required lines → enter `actualAmount` per line → enter final recipe weight → submit one activity.

## 7. Chef review

Evidence only: ingredient accuracy, final-weight deviation, and line-level deviations support judgement. The tutor still enters `timeEfficiencyScore` and `preparationQualityScore`. No separate automatic chef score.

## 8. GameBus admin

Create/link `recipeComposition`. Confirm `sessionId`, `sessionDate`, `submittedAt`, `recipeId`, `recipeName`, `finalRecipeWeightGrams`. Unlink top-level `ingredientId`, `ingredientName`, `ingredientCategory`, `ingredientWeightGrams`. Do not add derived metric properties.

## 9. Deprecated names

`actualIngredientWeightGrams`, `recipeIngredientLines`, `menuItemId`, `menuItemName`, `finalProductWeightGrams`, one-activity-per-line model.
