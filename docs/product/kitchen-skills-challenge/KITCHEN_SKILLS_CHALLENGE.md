# Kitchen Skills Challenge — connected practical workflow

> **Product name:** Kitchen Skills Challenge.
> **Public hashes:** `#/kitchen-day*` remain the GameBus Custom Embed contract.
>
> **CURRENT IMPLEMENTATION:** on `main` at those hashes. Legacy Trim Smart v1 stays at `#/waste/trim-smart` (`practice` / `participantWasteGrams`).

**Slug authority:** [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md).

UI pages: student activity `#/kitchen-day`, session review `#/kitchen-day/review`, progress `#/kitchen-day-progress`, tutor `#/kitchen-day-tutor`. Visual standard: [`../UI_STANDARD.md`](../UI_STANDARD.md). Route contract: [`../../contracts/KITCHEN_SKILLS_CHALLENGE_ROUTES.md`](../../contracts/KITCHEN_SKILLS_CHALLENGE_ROUTES.md). The product model is one **kitchen day / student session**.

## 1. Purpose

Students record practical kitchen work on one operational day (Europe/Helsinki). Waste, reuse suggestions, and portioning are reviewed together.

## 2. Product model

```text
Kitchen day (student actor + sessionId + sessionDate)
  ├── Ingredient preparation entry (1..n different ingredients)  → trimSmart
  │     └── Reuse suggestion (0..1 per ingredient)               → rescueAndReuse
  ├── Portion Precision entry (0..n recipes/components)          → portionPrecision
  ├── Session Review (current Kitchen Day only, read-only)
  ├── Student Progress (own history, separate page)
  └── One tutor assessment at end of session                     → wastePracticeReview
```

| Module | Activity |
|--------|----------|
| Trim Smart | `trimSmart` |
| Rescue & Reuse | `rescueAndReuse` |
| Portion Precision | `portionPrecision` |
| Tutor assessment | `wastePracticeReview` (GameBus slug; UI wording is Tutor) |
| Session Review / Student Progress / Tutor dashboard | read-only evidence — no extra measurement activity |

| Identifier | Role |
|------------|------|
| GameBus actor | The student |
| `sessionId` | Opaque key for one student Kitchen Day. Embedded form: task + authenticated participant + locked session date |
| `sessionDate` | Europe/Helsinki operational date |
| `ingredientId` | Unique Trim entry within a session; reuse join; kitchen-reference key |
| `recipeId` | One Portion Precision recipe |

**Same ingredient once:** a student does not create more than one Trim Smart entry for the same `ingredientId` in the same session. Many **different** ingredients are expected.

## 3. Trim Smart

See [`TRIM_SMART.md`](TRIM_SMART.md).

Stored: `sessionId`, `sessionDate`, `submittedAt`, `ingredientId`, `ingredientName`, `ingredientWeightGrams`, `trimTechniques`, `estimatedWasteGrams`, `actualWasteGrams`, `duration`.

Waste %, estimate error, reference comparison, and percentile are **calculated on read**.

## 4. Rescue & Reuse

See [`RESCUE_AND_REUSE.md`](RESCUE_AND_REUSE.md).

Stored: `sessionId`, `sessionDate`, `ingredientId`, `reusableWasteGrams`, `reuseDestination`, `submittedAt`.

Join: **`sessionId` + `ingredientId`**. Do not use `sourceActivityId` or `preparationEntryId`.

Do not duplicate `ingredientName` or `ingredientWeightGrams`.

`reuseDestination` is free text. No status workflow, later confirmation, or inventory. Discarded waste = Trim `actualWasteGrams − reusableWasteGrams` (not stored).

## 5. Portion Precision

See [`PORTION_PRECISION.md`](PORTION_PRECISION.md).

One activity per prepared recipe. Stored: `sessionId`, `sessionDate`, `submittedAt`, `recipeId`, `recipeName`, `recipeComposition`, `finalRecipeWeightGrams`.

Required amounts and expected final weight come from the generated recipe reference (`npm run kitchen-skills:recipes` from `reference/kitchen-skills/kitchen_day_recipe_reference_clean.xlsx`). They are not copied into GameBus. Expected final weight is `Kypsä_kokonaispaino`, not `Saanto` and not the sum of ingredient targets. Ingredient accuracy and final-weight deviation are derived on read. A future BarLaurea source can use the same adapter.

## 6. Session Review, Student Progress, Tutor dashboard

Read-only surfaces over completed Kitchen Day records.

- **Student session / Session Review** hydrate Trim, Reuse, and Portion from `kitchenGroupInputSelf.activities` (`GET /api/me/activities`). That collection is already self-scoped.
- **Tutor dashboard and group history** still use `kitchenGroupInput.activities` (`GET /groups/activities`). Do not remove or repurpose that collection.

**Not** a retrieval blocker and **not** a new REST API invented in this app. GameBus fills INPUT_COLLECTIONS from those endpoints.

- Session Review (`#/kitchen-day/review`) is the current locked session only.
- Student Progress (`#/kitchen-day-progress`) is own history.
- Tutor dashboard (`#/kitchen-day-tutor`) is evidence plus one optional tutor assessment.

## 7. Tutor assessment

See [`CHEF_REVIEW.md`](CHEF_REVIEW.md). **One** session-level `wastePracticeReview`: `timeEfficiencyScore`, `preparationQualityScore`, optional `chefFeedback`. Modules are evidence only. System metrics do not set those scores. No per-activity or per-ingredient tutor scores.

## 8. Kitchen reference (analytics)

Initially seeded kitchen reference data keyed by `ingredientId`. Later accumulated Trim Smart data for that ingredient, falling back to seed when history is inadequate. Do not store averages, waste %, or percentiles. Percentile / ranking stays off until a sufficient-data rule is agreed (**@pending** analytics decision).

## 9. Non-goals

- Three independent standalone games
- Same ingredient twice in one student's session
- `sourceActivityId` / `preparationEntryId`
- Reuse status / later confirmation
- One Portion activity per ingredient line
- One tutor assessment or score per activity / ingredient
- Storing calculated analytics
- Inventing a Kitchen Day retrieval endpoint (use configured INPUT_COLLECTIONS: `kitchenGroupInputSelf` for the student, `kitchenGroupInput` for group/trainer)

## 10. Related

[`TRIM_SMART.md`](TRIM_SMART.md) · [`TRIM_SMART_DATA_MODEL.md`](TRIM_SMART_DATA_MODEL.md) · [`RESCUE_AND_REUSE.md`](RESCUE_AND_REUSE.md) · [`PORTION_PRECISION.md`](PORTION_PRECISION.md) · [`CHEF_REVIEW.md`](CHEF_REVIEW.md) · [`UX_FLOW.md`](UX_FLOW.md) · [`IMPLEMENTATION_BLUEPRINT.md`](IMPLEMENTATION_BLUEPRINT.md) · [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md) · [`../../contracts/GAMEBUS.md`](../../contracts/GAMEBUS.md) · [`../../../features/kitchen-skills-challenge/`](../../../features/kitchen-skills-challenge/)
