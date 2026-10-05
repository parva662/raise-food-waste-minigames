# Portion Precision

> **Documentation role:** Explanation — module intent, derived metrics, and journey.
> **APPROVED PRODUCT TARGET**. Implemented on `main` at `#/kitchen-day/portion`.
>
> Module of [`KITCHEN_SKILLS_CHALLENGE.md`](KITCHEN_SKILLS_CHALLENGE.md). Locked properties: [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md).

## 1. Purpose

Record how accurately a student measures the ingredients of a prepared recipe/component, and the final weight of what they produced.

## 2. Unit of work

**One `portionPrecision` activity = one prepared recipe/component.**

All actual measurements live in **one** property: `recipeComposition`. No per-ingredient activity. No top-level `ingredientId` / `ingredientName` / `ingredientCategory`.

Exact stored properties and composition shape: slug contract. Accuracy, error, and final-weight deviation are **derived at display time** — never stored on the activity.

**New posts require linked `recipeComposition`.** Live GameBus may still store `recipeId` as a number. The reader may hydrate listing (recipe name and final weight) without composition for older rows; ingredient accuracy stays blank until composition is stored.

## 3. Recipe data outside GameBus

Required amounts, recipe identity, and expected final weight come from the current recipe reference (professional clean workbook extract via `npm run kitchen-skills:recipes`; a future BarLaurea source can use the same adapter). They are **not** copied into the activity. Students cannot edit required amounts.

Expected final weight comes from the recipe reference (`Kypsä_kokonaispaino` in the source workbook). Do not infer it from the sum of ingredient targets. Yield (`Saanto`) is retained in source materials for reference only.

If the recipe reference later needs versioning, document the version used for recalculation. Do not invent new GameBus properties for derived metrics.

## 4. Derived comparison (product rules)

Comparison is exact required vs actual; no tolerance band.

Ingredient signed deviation (when target > 0): `((actual − target) / target) × 100` — shown as Exact, or *n.n*% over / under.

Whole-recipe ingredient error is **weighted** by target mass: `sum(|actual − target|) / sum(target) × 100`. Ingredient accuracy is `max(0, 100 − that error)`.

Final-weight deviation: `|recorded − expected| / expected × 100` using the recipe reference expected final weight.

These two recipe metrics stay separate. There is **no** automatic combined score and **no** automatic tutor score.

## 5. Journey

Searchable recipe combobox → compact Ingredient | Target | Actual | Result table → final recipe weight → one `SILENT_ACTIVITY` → challenge summary (EXIT only on Finish challenge). Layout: [`../UI_STANDARD.md`](../UI_STANDARD.md).

## 6. Tutor assessment

Evidence only. The tutor still enters time / quality scores for `reviewedGame: portionPrecision`. See [`CHEF_REVIEW.md`](CHEF_REVIEW.md).

## 7. GameBus admin / deprecated names

Create/link `recipeComposition`; confirm the locked property set in the slug contract. Unlink top-level per-line ingredient props. Deprecated names and the one-activity-per-line model: slug contract.
