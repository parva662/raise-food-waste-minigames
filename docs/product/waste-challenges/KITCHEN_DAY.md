# Kitchen Day — Connected practical workflow

> **Documentation status:** **APPROVED PRODUCT TARGET** (2026-09-23)
>
> Supersedes the assumption that Trim Smart, Rescue & Reuse, and Portion Precision are three independent standalone games.
>
> **CURRENT IMPLEMENTATION:** `main` still has Trim Smart v1 only (`#/waste/trim-smart`: Ingredient → Practice → Measure; posts `practice` / `participantWasteGrams` / old category values). That is not this target.

**Slug authority:** [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md).

UI may label sections “Trim Smart”, “Rescue & Reuse”, “Portion Precision”, and “My day”. The product model is one **kitchen day / student session**.

## 1. Purpose

Students record practical kitchen work on one operational day (Europe/Helsinki). Waste, reuse suggestions, and portioning are reviewed together.

## 2. Product model

```text
Kitchen day (student actor + sessionId + sessionDate)
  ├── Ingredient preparation entry (1..n different ingredients)  → trimSmart
  │     └── Reuse suggestion (0..1 per ingredient)               → rescueAndReuse
  ├── Portion Precision entry (0..n recipes)                     → portionPrecision
  ├── Student dashboard (read-only)
  └── One chef review at end of session                          → wastePracticeReview
```

| Module | Activity |
|--------|----------|
| Trim Smart | `trimSmart` |
| Rescue & Reuse | `rescueAndReuse` |
| Portion Precision | `portionPrecision` |
| End-of-session chef review | `wastePracticeReview` |
| Student / chef dashboards | read-only — no extra activity |

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

Stored: `sessionId`, `sessionDate`, `submittedAt`, `ingredientId`, `ingredientName`, `ingredientCategory`, `ingredientWeightGrams`, `trimTechniques`, `estimatedWasteGrams`, `actualWasteGrams`, `duration`.

`ingredientCategory` is locked: `root` \| `leafy` \| `fruit` \| `stem` \| `herbs` \| `other` (UI labels only). Decision **closed**.

Waste %, estimate error, reference comparison, and percentile are **calculated on read**.

## 4. Rescue & Reuse

See [`RESCUE_AND_REUSE.md`](RESCUE_AND_REUSE.md).

Stored: `sessionId`, `sessionDate`, `ingredientId`, `reusableWasteGrams`, `reuseDestination`, `submittedAt`.

Join: **`sessionId` + `ingredientId`**. Do not use `sourceActivityId` or `preparationEntryId`.

Do not duplicate `ingredientName`, `ingredientCategory`, or `ingredientWeightGrams`.

`reuseDestination` is free text. No status workflow, later confirmation, or inventory. Discarded waste = Trim `actualWasteGrams − reusableWasteGrams` (not stored).

## 5. Portion Precision

See [`PORTION_PRECISION.md`](PORTION_PRECISION.md).

One activity per prepared recipe. Stored: `sessionId`, `sessionDate`, `submittedAt`, `recipeId`, `recipeName`, `recipeComposition`, `finalRecipeWeightGrams`.

Required amounts come from the recipe dataset (stub JSON now). Not copied into GameBus. `ingredientCategory` is not used.

## 6. Dashboards

Read-only aggregates of the student's completed Kitchen Day. Loaded with the existing `kitchenGroupInput` / `GET /groups/activities` client. **Not** a retrieval blocker.

## 7. Chef review

See [`CHEF_REVIEW.md`](CHEF_REVIEW.md). **One** session-level review: `timeEfficiencyScore`, `preparationQualityScore`, optional `chefFeedback`. Modules are evidence only. No per-activity or per-ingredient chef scores.

## 8. Kitchen reference (analytics)

Initially chef-seeded data keyed by `ingredientId`. Later accumulated Trim Smart data for that ingredient, falling back to seed when history is inadequate. Do not store averages, waste %, or percentiles. Percentile / ranking stays off until a sufficient-data rule is agreed (**@pending** analytics decision).

## 9. Non-goals

- Three independent standalone games
- Same ingredient twice in one student's session
- `sourceActivityId` / `preparationEntryId`
- Reuse status / later confirmation
- One Portion activity per ingredient line
- One chef review or score per activity / ingredient
- Storing calculated analytics
- Inventing a Kitchen Day retrieval endpoint

## 10. Related

[`TRIM_SMART.md`](TRIM_SMART.md) · [`TRIM_SMART_DATA_MODEL.md`](TRIM_SMART_DATA_MODEL.md) · [`RESCUE_AND_REUSE.md`](RESCUE_AND_REUSE.md) · [`PORTION_PRECISION.md`](PORTION_PRECISION.md) · [`CHEF_REVIEW.md`](CHEF_REVIEW.md) · [`UX_FLOW.md`](UX_FLOW.md) · [`IMPLEMENTATION_BLUEPRINT.md`](IMPLEMENTATION_BLUEPRINT.md) · [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md) · [`../../../features/waste-challenges/`](../../../features/waste-challenges/)
