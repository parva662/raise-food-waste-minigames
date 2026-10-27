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

**New attempts (approved 21 October 2026):** one challenge attempt = exactly one Portion Precision recipe. Trim is optional until a Trim activity is saved. Each saved Trim ingredient with **positive actual waste** needs exactly one Rescue decision before Finish (`0 g reusable` plus an explanation in `reuseDestination` is valid). Zero-waste Trim needs no Rescue. A second Portion recipe requires **Finish challenge** and a **new attempt**.

**Historical compatibility:** older GameBus sessions may contain several Portion recipes under one day-scoped `sessionId`. Readers keep those sessions fully readable. They are not rewritten.

```text
Kitchen Skills attempt (student actor + unique sessionId + sessionDate)
  ├── One recipe (portionPrecision) — required; once per attempt
  │     ├── Ingredient 1 (trimSmart) — optional; sessionId + recipeId + ingredientId
  │     │     └── Reuse (rescueAndReuse) — required when that Trim has waste > 0 g; same key
  │     └── Ingredient 2 (trimSmart) — optional; more ingredients of the SAME recipe
  ├── Session Review (current attempt only, read-only)
  ├── Student Progress (own history, separate page; same-day attempts stay separate)
  └── Tutor assessment per evidenced module                     → wastePracticeReview
      (sessionId + recipeId + reviewedGame)
```

| Identifier | Role |
|------------|------|
| GameBus actor | The student |
| `sessionId` | Opaque key for **one challenge attempt**. New embedded posts: `kitchen-day:{taskId}:{actorId}:{sessionDate}:{attemptId}`. Historical rows may omit `:{attemptId}`. Readers group by the full string and never parse it. Internal IDs are not shown in the UI. |
| `sessionDate` | Europe/Helsinki operational date of the attempt (an unfinished attempt that crosses midnight keeps its original date) |
| `recipeId` | Recipe identity from the dataset; **new** attempts post exactly one Portion activity; carried on new Trim / Reuse posts |
| `ingredientId` | Ingredient identity within a recipe; Trim / Reuse uniqueness is `sessionId` + `recipeId` + `ingredientId` |
| Active recipe | The single saved Portion recipe of this attempt |

**Uniqueness (new attempts):** one Portion recipe per `sessionId`. Multiple **different** Trim ingredients of that recipe are allowed. Same ingredient twice under one recipe is blocked. Finish is available after Portion when no positive-waste Trim still lacks a Rescue decision. Empty Trim/Rescue activities are never fabricated. Unsaved Trim/Rescue drafts warn before they are abandoned. Fresh mass inputs default to **g**; the student can select **kg**. Switching the unit converts the displayed number without changing the stored quantity (canonical storage stays grams). Trim starting weight prefills from the Portion actual mass for that ingredient when available.

**Attempt identity:** generated once when the challenge opens, stored in a non-authoritative local attempt record (`ks-attempt:v1:{taskId}:{actorId}`), and reused across reload / TASK replay / INPUT_COLLECTIONS until Finish. Finish archives dispatched local evidence (`ks-attempt-archive:v1:{sessionId}`), clears the active key, and then posts `{ type: 'EXIT' }`. If that local archive/clear fails, Finish does not send EXIT, does not mark the attempt finished, and keeps the active record so reload can resume it. The archive is never auto-posted and is not GameBus proof. Reopening after a successful Finish starts a new `attemptId`. A successful `postMessage` is not GameBus persistence; recovered local rows stay unconfirmed until they appear in the self-feed. Local storage is never proof that GameBus stored the activity. The Challenge complete screen must not alarm students about that normal confirmation lag; developer notes may still list local dispatches awaiting history confirmation.

Exact stored properties: slug contract. Module intent: [`TRIM_SMART.md`](TRIM_SMART.md), [`RESCUE_AND_REUSE.md`](RESCUE_AND_REUSE.md), [`PORTION_PRECISION.md`](PORTION_PRECISION.md). Review / Progress / tutor: [`CHEF_REVIEW.md`](CHEF_REVIEW.md).

## 3. Surfaces and feeds (product rules)

| Surface | Product rule | Feed (reference) |
|---------|--------------|------------------|
| Student challenge + Session Review + Progress | Show Trim / Reuse / Portion before any tutor review; Progress keeps only `actor.id ===` authenticated `me.id` | `kitchenGroupInputSelf` → `GET /api/me/activities` |
| Student Progress anonymous peers | Anonymous aggregate only; never raw peer activities. Blocked until a verified privacy-safe GameBus projection exists | none (do not attach trainer-style `/api/groups/activities`) |
| Tutor dashboard | Staff → sessions → modules; one optional assessment per completed module | `kitchenSkillsTrainerInput` (Kitchen Skills templates only) |
| Forecast / closeout | Out of scope for this product | `kitchenGroupInput` — **do not** reuse for Kitchen Skills |

Session Review is the current locked session only. Progress is own history. Tutor posts use RAISE `actors` (see [`../../contracts/GAMEBUS.md`](../../contracts/GAMEBUS.md)).

## 4. Kitchen reference (analytics)

Each generated recipe ingredient keeps its source `Hävikki` as `referenceWastePercent` on that **recipe ingredient entry** (not a generic ingredient norm). `0` is a valid reference and is not treated as missing. Tutor Trim evidence and Student Progress derive actual % vs this recipe-specific JAMIX value using the Trim activity’s explicit `recipeId` when present; legacy Trim rows without `recipeId` join only when exactly one saved Portion recipe contains that `ingredientId`. When membership is ambiguous, show reference unavailable rather than inventing a join. It is not shown on the student Trim result, challenge summary, or Session Review. Do not store averages, waste %, or percentiles on GameBus activities. Percentile / ranking stays off until a sufficient-data rule is agreed (**@pending** analytics decision). Anonymous Progress peer medians are blocked until a verified privacy-safe GameBus aggregate exists; when unblocked they would compare Trim **delta vs each person's own JAMIX**, not raw waste % across ingredients. Do not attach `GET /api/groups/activities` to the participant Progress page.

## 5. Non-goals

- Three independent standalone games
- A second Portion recipe inside the same challenge attempt
- Same ingredient twice under the same recipe in one student's attempt
- `sourceActivityId` / `preparationEntryId`
- Reuse status / later confirmation
- One Portion activity per ingredient line
- One tutor assessment or score per activity / ingredient (assessments are per **module**)
- Storing calculated analytics
- Inventing a Kitchen Skills retrieval endpoint (use configured INPUT_COLLECTIONS)

## 6. Related

[`TRIM_SMART.md`](TRIM_SMART.md) · [`TRIM_SMART_DATA_MODEL.md`](TRIM_SMART_DATA_MODEL.md) · [`RESCUE_AND_REUSE.md`](RESCUE_AND_REUSE.md) · [`PORTION_PRECISION.md`](PORTION_PRECISION.md) · [`CHEF_REVIEW.md`](CHEF_REVIEW.md) · [`UX_FLOW.md`](UX_FLOW.md) · [`IMPLEMENTATION_BLUEPRINT.md`](IMPLEMENTATION_BLUEPRINT.md) · [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md) · [`../../contracts/GAMEBUS.md`](../../contracts/GAMEBUS.md) · [`../../../features/kitchen-skills-challenge/`](../../../features/kitchen-skills-challenge/)
