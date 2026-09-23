# Kitchen Day — GameBus slug contract

**Status:** Locked property vocabulary — **APPROVED PRODUCT TARGET**
**Live environment:** `https://foodtracker.gamebus.eu`

Exact activity + property **slugs** for client mappers. Not a product brief.
Payload shape: each property posts `{ "value": … }` (plus `unit` where the schema requires it, e.g. `duration`).

`sessionId` is an opaque application identity. In embedded Kitchen Day it is generated deterministically as `kitchen-day:<taskId>:<actorId>:<sessionDate>` from the TASK, authenticated `inputCollectionPari.me`, and the locked Helsinki session date. It uniquely identifies one student Kitchen Day. Do **not** add `studentId` / `participantId` / actor id as Kitchen Day activity properties.

**Rule:** no Kitchen Day code, spec, or Gherkin may use a property name that is not listed here as a locked slug.

---

## Activities

| Module | Activity slug |
|--------|---------------|
| Ingredient preparation (Trim Smart) | `trimSmart` |
| Rescue & Reuse | `rescueAndReuse` |
| Portion Precision | `portionPrecision` |
| End-of-session chef review | `wastePracticeReview` |

---

## `trimSmart` — one ingredient preparation entry

Within one Kitchen Day session, a student does **not** create more than one Trim Smart entry for the same `ingredientId`. Multiple **different** ingredients are expected.

| Slug | Required | Notes |
|------|----------|-------|
| `sessionId` | yes | Kitchen Day session |
| `sessionDate` | yes | `format: date`, Europe/Helsinki operational date |
| `submittedAt` | yes | `format: date-time` |
| `ingredientId` | yes | non-empty string; keys reuse join and kitchen-reference lookup |
| `ingredientName` | yes | non-empty string |
| `ingredientCategory` | yes | locked enum: `root` \| `leafy` \| `fruit` \| `stem` \| `herbs` \| `other` |
| `ingredientWeightGrams` | yes | number > 0 (`exclusiveMinimum: 0`) — starting weight before preparation |
| `trimTechniques` | yes | live plural slug; one selected technique. **Do not** rename to `trimTechnique`. |
| `estimatedWasteGrams` | yes | number ≥ 0 |
| `actualWasteGrams` | yes | number ≥ 0 |
| `duration` | yes | number + `unit` (default `minutes`) |

Live `trimTechniques` enum: `peeling`, `trimming`, `julienne`, `batonnet`, `mince`, `dice`, `brunoise`, `slice`, `chiffonade`, `other`.

**CURRENT IMPLEMENTATION / DEPRECATED for new target posts:** `practice`, `participantWasteGrams`.

**Do not post:** `sourceActivityId`, `preparationEntryId`, calculated waste %, estimate error, kitchen average, percentile.

---

## `rescueAndReuse` — reuse suggestion for one Trim Smart entry

Join to Trim Smart with **`sessionId` + `ingredientId`** (unique within one student's session).

| Slug | Required | Notes |
|------|----------|-------|
| `sessionId` | yes | same Kitchen Day as the Trim entry |
| `sessionDate` | yes | `format: date` |
| `ingredientId` | yes | same id as the Trim entry |
| `reusableWasteGrams` | yes | number ≥ 0; ≤ that Trim entry's `actualWasteGrams` (client-side) |
| `reuseDestination` | yes | free text |
| `submittedAt` | yes | `format: date-time` |

**Do not store** on this activity: `ingredientName`, `ingredientCategory`, `ingredientWeightGrams` (read from the matching Trim activity).

**Do not create:** `sourceActivityId`, `preparationEntryId`.

**DEPRECATED / unlink:** `reuseMethod`.

---

## `portionPrecision` — one prepared recipe/component

One activity = one prepared recipe. Not one activity per ingredient line.

| Slug | Required | Notes |
|------|----------|-------|
| `sessionId` | yes | |
| `sessionDate` | yes | |
| `submittedAt` | yes | |
| `recipeId` | yes | |
| `recipeName` | yes | |
| `recipeComposition` | yes | one structured property — actuals for **all** ingredients |
| `finalRecipeWeightGrams` | yes | number ≥ 0 |

### `recipeComposition` nested shape

`recipeComposition` posts `{ "value": [ …entries ] }`. Each entry:

| Nested field | Meaning |
|--------------|---------|
| `ingredientId` | Ingredient identity |
| `ingredientName` | Display name |
| `actualAmount` | Actual amount used (nested — **not** a GameBus property) |
| `unit` | Unit from the recipe dataset |

Required recipe amounts are **not** copied into GameBus. They come from the recipe source dataset (stub JSON now; real BarLaurea source later).

This activity does **not** use `ingredientCategory`.

**DEPRECATED / unlink (top-level):** `ingredientId`, `ingredientName`, `ingredientCategory`, `ingredientWeightGrams`, `actualIngredientWeightGrams`, `recipeIngredientLines`, `menuItemId`, `menuItemName`, `finalProductWeightGrams`.

---

## `wastePracticeReview` — one end-of-session chef review

One review per student Kitchen Day / session. Not one judgement per activity or ingredient.

| Slug | Required | Notes |
|------|----------|-------|
| `sessionId` | yes | reviewed student's session |
| `sessionDate` | yes | |
| `submittedAt` | yes | |
| `timeEfficiencyScore` | yes | integer 0–5 |
| `preparationQualityScore` | yes | integer 0–5 |
| `chefFeedback` | no | optional free text |

**DEPRECATED / unlink or stop requiring:** `reviewedActivityId`, `reviewedGame`, `reasonCode`, `freeTextNote`, `unusualEvent`, `serviceDate`.

---

## Retrieval

Reuse the existing kitchen group-activities path (`kitchenGroupInput.activities` → `GET /groups/activities`, `src/gamebus/groupActivities.ts`). Filter to Kitchen Day templates. Group client-side by actor, template, `sessionId`, `sessionDate`, `ingredientId`, `recipeId`.

**TASK:** one Custom Embed task lists `trimSmart`, `rescueAndReuse`, and `portionPrecision`. Evidence and client rules: [`../../contracts/KITCHEN_DAY_TASK.md`](../../contracts/KITCHEN_DAY_TASK.md).

This is **not** a platform blocker and is **not** a new API.

---

## GameBus admin actions (exact)

### Trim Smart

- Fix `ingredientId` schema to non-empty string
- Fix `ingredientName` schema to non-empty string
- Keep `ingredientCategory` enum: `root`, `leafy`, `fruit`, `stem`, `herbs`, `other`
- Keep `trimTechniques`
- Link `duration`
- Ensure `estimatedWasteGrams` and `actualWasteGrams` are linked
- Set `ingredientWeightGrams` to `exclusiveMinimum: 0` (starting weight > 0; waste fields stay `minimum: 0`)
- Do not use `practice` or `participantWasteGrams` for new target posts

### Rescue & Reuse

- Keep/link `sessionId`
- Keep/link `sessionDate`
- Keep/link `ingredientId`
- Keep/link `reusableWasteGrams`
- Create/link `reuseDestination`
- Keep/link `submittedAt`
- Unlink `reuseMethod`
- Unlink duplicated `ingredientName`, `ingredientCategory`, `ingredientWeightGrams`
- **Do not** create `sourceActivityId`

### Portion Precision

- Create/link `recipeComposition`
- Confirm `recipeId`
- Confirm `recipeName`
- Confirm `finalRecipeWeightGrams`
- Unlink obsolete top-level: `ingredientId`, `ingredientName`, `ingredientCategory`, `ingredientWeightGrams`

### Chef review

- Make `wastePracticeReview` session-level
- Keep: `sessionId`, `sessionDate`, `submittedAt`, `timeEfficiencyScore`, `preparationQualityScore`, `chefFeedback`
- `chefFeedback` optional
- Unlink / stop requiring: `reviewedActivityId`, `reviewedGame`, `reasonCode`, `freeTextNote`, `unusualEvent`, `serviceDate`

---

## Do-not-use list

| Name | Reason |
|------|--------|
| `sourceActivityId`, `preparationEntryId` | Cancelled. Join reuse with `sessionId` + `ingredientId` |
| `practice`, `wastePractice` | **CURRENT IMPLEMENTATION / DEPRECATED** — use `trimTechniques` |
| `participantWasteGrams` | **CURRENT IMPLEMENTATION / DEPRECATED** — use `actualWasteGrams` |
| `trimTechnique` (singular) | Live slug is `trimTechniques` |
| `preparationMethod`, `preparationApproach` | Replaced by `trimTechniques` |
| `measurementMethod`, `finalUsableWeightGrams` | Not in this product |
| `reuseMethod` | Replaced by `reuseDestination` |
| `discardedWasteGrams` | Calculated on read |
| `wastePercentage`, kitchen averages, percentiles | Calculated analytics — never stored |
| `recipeIngredientLines` | Required amounts live outside GameBus |
| `actualIngredientWeightGrams` | Nested as `recipeComposition[].actualAmount` |
| `menuItemId`, `menuItemName` | Use `recipeId` / `recipeName` |
| `finalProductWeightGrams` | Use `finalRecipeWeightGrams` |
| top-level ingredient fields on `portionPrecision` | Nested inside `recipeComposition` |
| `ingredientName` / `ingredientCategory` / `ingredientWeightGrams` on reuse | Read from Trim |
| `reviewedActivityId`, `reviewedGame` | Review targets the session |
| `vegetables`, `roots`, `fruits` as category values | Locked enum is `root` / `leafy` / `fruit` / `stem` / `herbs` / `other` |
| `studentId`, `participantId` | GameBus actor identifies the student |
