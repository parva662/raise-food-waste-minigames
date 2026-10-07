# Trim Smart — ingredient preparation entry

> **Documentation role:** Explanation — module intent and flow.
> **APPROVED PRODUCT TARGET** — module of [`KITCHEN_SKILLS_CHALLENGE.md`](KITCHEN_SKILLS_CHALLENGE.md).
>
> **CURRENT IMPLEMENTATION:** `#/kitchen-day/trim`. `#/kitchen-day` lands on Portion Precision. Legacy Trim Smart v1 remains at `#/waste/trim-smart`.
> Locked properties: [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md). Field / join reference: [`TRIM_SMART_DATA_MODEL.md`](TRIM_SMART_DATA_MODEL.md).

## 1. Purpose

Estimate waste before preparation and measure actual waste after. Recipe-ingredient Hävikki is kept as internal kitchen reference for chef feedback and later progress — it is **not** shown to the student. System comparison is **not** a tutor assessment.

## 2. Place in the session

One `trimSmart` activity = one ingredient preparation entry. A student records **multiple different ingredients from the session recipe**. The **same ingredient is not recorded twice** in that session. Trim cannot start until Portion Precision has saved that recipe.

Reuse (0..1) joins this entry by `sessionId` + `ingredientId`.

## 3. LEGACY IMPLEMENTATION (v1 at `#/waste/trim-smart`)

Standalone route, no estimate step, no timer, no reference comparison. Posts `practice` and `participantWasteGrams`. **DEPRECATED** for new target posts.

## 4. Target flow

1. Choose a remaining unused recipe ingredient (`ingredientId` + name from the Portion recipe) whose kitchen Hävikki (`referenceWastePercent`) is greater than 0. 0% lines are not offered. If the recipe has none, Trim shows that there are no Trim Smart ingredients and the session can complete without fake Trim/Reuse posts.
2. Technique → live plural slug `trimTechniques` (ten locked one-tap values). Layout: [`../UI_STANDARD.md`](../UI_STANDARD.md).
3. Estimate → actual waste after timed preparation (`duration` from the timer — student does not type minutes).
4. See recorded gram measurements (no waste % or Hävikki comparison on the student result).
5. **Save ingredient** posts `SILENT_ACTIVITY` and continues to Reuse in the same iframe. **Add more ingredients** posts the same entry and stays on Trim for another unused recipe ingredient.

Exact property list and types: slug contract. Worked example numbers belong in acceptance examples / tests, not as a second schema.

## 5. Calculated (never stored)

Waste % and comparison to the **recipe-ingredient** Hävikki / JAMIX reference (0% is valid) are derived on read from saved Portion `recipeId` + generated recipe data + recorded grams. They are shown on tutor Trim evidence and Student Progress only. They are not shown on the student Trim result, challenge summary, or Session Review, and are not posted to GameBus. Discarded waste after reuse is calculated for the Reuse form.

Percentile / ranking messaging is **@pending** until a sufficient-data rule is agreed.

## 6. Tutor assessment

This module is **evidence** for one optional `wastePracticeReview` with `reviewedGame: trimSmart`. It is not a separate automatic score and not one review for the whole session. See [`CHEF_REVIEW.md`](CHEF_REVIEW.md).

## 7. Non-goals

One ingredient only per day; same ingredient twice per session; free-text ingredient names; tutor score from waste %; storing analytics; renaming `trimTechniques`.
