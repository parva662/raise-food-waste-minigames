# Trim Smart — ingredient preparation entry

> **Documentation role:** Explanation — module intent and flow.
> **APPROVED PRODUCT TARGET** — module of [`KITCHEN_SKILLS_CHALLENGE.md`](KITCHEN_SKILLS_CHALLENGE.md).
>
> **CURRENT IMPLEMENTATION:** `#/kitchen-day/trim`. `#/kitchen-day` lands on Portion Precision. Legacy Trim Smart v1 remains at `#/waste/trim-smart`.
> Locked properties: [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md). Field / join reference: [`TRIM_SMART_DATA_MODEL.md`](TRIM_SMART_DATA_MODEL.md).

## 1. Purpose

Estimate waste before preparation and measure actual waste after. Recipe-ingredient Hävikki is kept as internal kitchen reference for chef feedback and later progress — it is **not** shown to the student. System comparison is **not** a tutor assessment.

## 2. Place in the session

One `trimSmart` activity = one ingredient preparation entry for the attempt’s saved recipe. A student may record **multiple different eligible ingredients of that one recipe**. Uniqueness is `sessionId` + `recipeId` + `ingredientId`. Trim cannot start until Portion Precision has saved the attempt’s recipe; UI work is scoped to that recipe. Trim is **optional** — Finish is available without any Trim activity, including when the recipe has no eligible ingredients.

Reuse (0..1) joins this entry by `sessionId` + `recipeId` + `ingredientId`. Historical sessions may still hold Trim under more than one Portion recipe; readers keep those associations.

## 3. LEGACY IMPLEMENTATION (v1 at `#/waste/trim-smart`)

Standalone route, no estimate step, no timer, no reference comparison. Posts `practice` and `participantWasteGrams`. **DEPRECATED** for new target posts.

## 4. Target flow

1. Choose a remaining unused recipe ingredient (`ingredientId` + name from the attempt’s saved Portion recipe) whose kitchen Hävikki (`referenceWastePercent`) is greater than 0. 0% lines are not offered. If the recipe has none, Trim shows that there are no Trim Smart ingredients and Finish remains available. New Trim posts include `recipeId`.
2. Technique → live plural slug `trimTechniques` (ten locked one-tap values). Layout: [`../UI_STANDARD.md`](../UI_STANDARD.md).
3. Starting weight, estimated waste, and actual waste use the same compact **g / kg** selector as Portion. Canonical storage and bounds stay in grams (`0 ≤ estimate/actual ≤ starting weight`). 1 kg = 1000 g. No kg properties.
4. Estimate → actual waste after timed preparation (`duration` from the existing timer — student does not type minutes; internal timer states are never shown).
5. See recorded measurements with g/kg formatting (no waste % or Hävikki comparison on the student result). Challenge summary lists each ingredient compactly: name, actual waste, preparation duration (e.g. `Banaani` / `260 g waste · 1 min 24 sec`).
6. **Save ingredient** posts `SILENT_ACTIVITY`. **Another ingredient** stays on Trim for another unused recipe ingredient. **Record reuse** opens Reuse when there is reusable waste. Empty Trim activities are never required to enable Finish.

Exact property list and types: slug contract. Worked example numbers belong in acceptance examples / tests, not as a second schema.

## 5. Calculated (never stored)

Waste % and comparison to the **recipe-ingredient** Hävikki / JAMIX reference (0% is valid) are derived on read from generated recipe data + recorded grams. New Trim activities carry `recipeId` and use that recipe’s ingredient reference. Legacy Trim rows without `recipeId` join only when exactly one saved Portion recipe contains the ingredient; otherwise reference comparison is unavailable. They are shown on tutor Trim evidence and Student Progress only. They are not shown on the student Trim result, challenge summary, or Session Review, and are not posted to GameBus. Discarded waste after reuse is calculated for the Reuse form.

Percentile / ranking messaging is **@pending** until a sufficient-data rule is agreed.

## 6. Tutor assessment

This module is **evidence** for one optional `wastePracticeReview` when Trim was recorded (`reviewedGame: trimSmart` + that recipe’s `recipeId`). No Trim evidence means no Trim review. See [`CHEF_REVIEW.md`](CHEF_REVIEW.md).

## 7. Non-goals

One ingredient only per day; same ingredient twice under the same recipe; free-text ingredient names; tutor score from waste %; storing analytics; renaming `trimTechniques`.
