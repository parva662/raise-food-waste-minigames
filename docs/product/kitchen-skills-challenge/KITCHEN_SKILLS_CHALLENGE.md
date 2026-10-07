# Kitchen Skills Challenge — connected practical workflow

> **Documentation role:** Explanation — product intent and boundaries.
> **Product name:** Kitchen Skills Challenge.
> **Public hashes:** `#/kitchen-day*` remain the GameBus Custom Embed contract (legacy-stable).
> **CURRENT IMPLEMENTATION:** on `main` at those hashes. Legacy Trim Smart v1 stays at `#/waste/trim-smart`.

**Authoritative reference (do not duplicate here):**

| Concern | Path |
|---------|------|
| Locked activity / property slugs | [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md) |
| Routes / embeds | [`../../contracts/KITCHEN_SKILLS_CHALLENGE_ROUTES.md`](../../contracts/KITCHEN_SKILLS_CHALLENGE_ROUTES.md) |
| TASK / SILENT / EXIT | [`../../contracts/KITCHEN_SKILLS_CHALLENGE_TASK.md`](../../contracts/KITCHEN_SKILLS_CHALLENGE_TASK.md) |
| Acceptance behaviour | [`../../../features/kitchen-skills-challenge/`](../../../features/kitchen-skills-challenge/) |
| What ships on `main` | [`../../current-state/IMPLEMENTATION_STATUS.md`](../../current-state/IMPLEMENTATION_STATUS.md) |

UI/UX language: [`../UI_STANDARD.md`](../UI_STANDARD.md).

## 1. Purpose

Students record practical kitchen work on one operational day (Europe/Helsinki). Waste, reuse suggestions, and portioning are reviewed together.

## 2. Product model

```text
Kitchen Skills session (student actor + sessionId + sessionDate)
  ├── Portion Precision entry (0..n recipes/components)          → portionPrecision
  ├── Ingredient preparation entry (1..n different recipe ingredients)  → trimSmart
  │     └── Reuse suggestion (0..1 per ingredient)               → rescueAndReuse
  ├── Session Review (current session only, read-only)
  ├── Student Progress (own history, separate page)
  └── Tutor assessment per completed module (reviewedGame)       → wastePracticeReview
```

| Identifier | Role |
|------------|------|
| GameBus actor | The student |
| `sessionId` | Opaque key for one student session (`kitchen-day:…` prefix in embed) |
| `sessionDate` | Europe/Helsinki operational date |
| `ingredientId` | Unique Trim entry within a session; reuse join; taken from the session recipe |
| `recipeId` | The one Portion Precision recipe for the session |

**Same ingredient once:** a student does not create more than one Trim Smart entry for the same `ingredientId` in the same session. Many **different** ingredients are expected.

Exact stored properties: slug contract. Module intent: [`TRIM_SMART.md`](TRIM_SMART.md), [`RESCUE_AND_REUSE.md`](RESCUE_AND_REUSE.md), [`PORTION_PRECISION.md`](PORTION_PRECISION.md). Review / Progress / tutor: [`CHEF_REVIEW.md`](CHEF_REVIEW.md).

## 3. Surfaces and feeds (product rules)

| Surface | Product rule | Feed (reference) |
|---------|--------------|------------------|
| Student challenge + Session Review + Progress | Show Trim / Reuse / Portion before any tutor review | `kitchenGroupInputSelf` → `GET /api/me/activities` |
| Tutor dashboard | Staff → sessions → modules; one optional assessment per completed module | `kitchenSkillsTrainerInput` (Kitchen Skills templates only) |
| Forecast / closeout | Out of scope for this product | `kitchenGroupInput` — **do not** reuse for Kitchen Skills |

Session Review is the current locked session only. Progress is own history. Tutor posts use RAISE `actors` (see [`../../contracts/GAMEBUS.md`](../../contracts/GAMEBUS.md)).

## 4. Kitchen reference (analytics)

Each generated recipe ingredient keeps its source `Hävikki` as `referenceWastePercent` on that **recipe ingredient entry** (not a generic ingredient norm). `0` is a valid reference and is not treated as missing. This value is internal for chef feedback and later progress/dashboard benchmarking. It is not shown on the student Trim result, challenge summary, or Session Review. Do not store averages, waste %, or percentiles on GameBus activities. Percentile / ranking stays off until a sufficient-data rule is agreed (**@pending** analytics decision).

## 5. Non-goals

- Three independent standalone games
- Same ingredient twice in one student's session
- `sourceActivityId` / `preparationEntryId`
- Reuse status / later confirmation
- One Portion activity per ingredient line
- One tutor assessment or score per activity / ingredient (assessments are per **module**)
- Storing calculated analytics
- Inventing a Kitchen Skills retrieval endpoint (use configured INPUT_COLLECTIONS)

## 6. Related

[`TRIM_SMART.md`](TRIM_SMART.md) · [`TRIM_SMART_DATA_MODEL.md`](TRIM_SMART_DATA_MODEL.md) · [`RESCUE_AND_REUSE.md`](RESCUE_AND_REUSE.md) · [`PORTION_PRECISION.md`](PORTION_PRECISION.md) · [`CHEF_REVIEW.md`](CHEF_REVIEW.md) · [`UX_FLOW.md`](UX_FLOW.md) · [`IMPLEMENTATION_BLUEPRINT.md`](IMPLEMENTATION_BLUEPRINT.md) · [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md) · [`../../contracts/GAMEBUS.md`](../../contracts/GAMEBUS.md) · [`../../../features/kitchen-skills-challenge/`](../../../features/kitchen-skills-challenge/)
