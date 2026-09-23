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

## 4. Recipe data outside GameBus

Required amounts, ids, names, and units come from the recipe source (local stub JSON keyed by `recipeId` now; real BarLaurea source later). They are **not** copied into the activity. Students cannot edit required amounts. Comparison is exact required vs actual; no tolerance band.

## 5. Example

Recipe dataset: yogurt 1000 g, lemon juice 100 g, salt 8 g, pepper 2 g.

Posted: one activity with `recipeComposition` actuals and `finalRecipeWeightGrams` 1850.

## 6. Journey

Select recipe → see required lines → enter `actualAmount` per line → enter final recipe weight → submit one activity.

## 7. Chef review

Evidence only. No separate chef score.

## 8. GameBus admin

Create/link `recipeComposition`. Confirm `recipeId`, `recipeName`, `finalRecipeWeightGrams`. Unlink top-level `ingredientId`, `ingredientName`, `ingredientCategory`, `ingredientWeightGrams`.

## 9. Deprecated names

`actualIngredientWeightGrams`, `recipeIngredientLines`, `menuItemId`, `menuItemName`, `finalProductWeightGrams`, one-activity-per-line model.
