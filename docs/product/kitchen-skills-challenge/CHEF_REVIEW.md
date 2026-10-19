# Session Review, Student Progress, and tutor assessment

> **Documentation role:** Explanation — feedback surfaces and tutor workflow.
> **APPROVED PRODUCT TARGET**. Implemented on `main` at `#/kitchen-day/review`, `#/kitchen-day-progress`, and `#/kitchen-day-tutor`.
>
> Filename is historical. Product wording is **Tutor** / **Tutor assessment**. The GameBus activity slug remains `wastePracticeReview`.
>
> Slugs / properties: [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md). Routes: [`../../contracts/KITCHEN_SKILLS_CHALLENGE_ROUTES.md`](../../contracts/KITCHEN_SKILLS_CHALLENGE_ROUTES.md). Protocol: [`../../contracts/GAMEBUS.md`](../../contracts/GAMEBUS.md).

## 1. Two feedback layers

| Layer | Content |
|-------|---------|
| Objective Trim vs JAMIX | Recipe-ingredient Hävikki (`referenceWastePercent`) compared with recorded starting weight and removed grams. Not a tutor score. Not shown on the student Trim game. |
| Tutor assessment | One review per **recipe and evidenced module** (`sessionId` + `recipeId` + `reviewedGame`): Time efficiency 0–5, Preparation quality 0–5, optional feedback |
| Anonymous peer context | Progress-only. Group median of Trim **delta vs each person's own JAMIX**, and like-for-like tutor score medians. Never a new overall score. |

Objective Trim math (shared read-model): actual % = removed / starting × 100; reference grams = starting × JAMIX % / 100; delta pp = actual % − JAMIX %. Session totals weight by starting grams (Σ removed / Σ starting; Σ expected reference grams / Σ starting). Neutral copy: above / below / at reference — not “better”. Missing join → **Reference unavailable** (never guessed). 0% Hävikki is a valid reference.

System comparison never pre-fills tutor scores. Analytics are never stored as activity properties. There is no automatic combined Portion score or overall tutor score.

## 2. Student surfaces

| Surface | Route | Scope |
|---------|-------|-------|
| Session Review | `#/kitchen-day/review` | Current locked session only; read-only; per-module tutor readbacks; no student-facing waste % or Hävikki |
| Student Progress | `#/kitchen-day-progress` | Own history; Overview / Progress; Overview Trim card always shows Actual trim, Kitchen reference (or Reference unavailable), and Difference; module tabs default to **Recent** (last 8 sessions + span, Recent-only charts) with **History** archive (filters, ~10 rows/page); weighted Trim vs kitchen reference on results only; peer cards stay “Not enough peer data yet” until a privacy-safe anonymous aggregate exists; no leaderboard |

Neither posts measurement activities. Progress does not invent ranking or an overall tutor score.

## 3. Tutor dashboard — one assessment per recipe and evidenced module

`#/kitchen-day-tutor`: **staff list** → **Needs assessment** / **Reviewed** session tabs → **session detail** → **recipe selection** → module tabs (Trim / Rescue / Portion).

- Session status uses **evidenced recipe–module pairs**. Each saved Portion recipe needs its own Portion assessment; Trim/Reuse assessments are required only when that recipe has Trim/Reuse evidence. Every evidenced pair reviewed → **Reviewed**; some but not all → Partially reviewed; none reviewed → Needs assessment. Modules without evidence for a recipe create **no** review requirement.
- When a session has one recipe, it is selected automatically. Selecting another recipe shows only that recipe’s evidence and its independent assessment form (no score leakage).
- Trim evidence (when Portion `recipeId` joins) shows starting weight, actual removed g/%, JAMIX % and expected grams, and delta in percentage points. Tutor score controls stay unchanged.
- Independent draft per student + `sessionId` + `recipeId` + module; scores **0–5** (empty ≠ `0`).
- Submit one `wastePracticeReview` per recipe–module pair with evidence as `SILENT_ACTIVITY` + RAISE `actors: [selectedStudentActorId]`, with `recipeId` and `reviewedGame`. Exact properties: slug contract.
- **Close** posts `{ type: 'EXIT' }` only (no review). Confirm if the active draft is dirty.
- Duplicate posts for the same `sessionId` + `recipeId` + `reviewedGame` are rejected.
- **Historical compatibility:** older `wastePracticeReview` rows without `recipeId` remain readable as **Historical session-level assessment**. They do not invent a recipe association, do not mark every recipe reviewed, and do not block new recipe-specific reviews.

**DEPRECATED property names:** see slug contract (`reviewedActivityId`, `reasonCode`, `freeTextNote`, `unusualEvent`, `serviceDate`, …).

## 4. Retrieval (product rules)

| Who | Product rule | Feed |
|-----|--------------|------|
| Student | Progress shows Trim / Reuse / Portion before tutor review exists; keep only activities whose `actor.id` matches the authenticated user; attach reviews by `sessionId` + `recipeId` + `reviewedGame` (legacy rows without `recipeId` stay session-level) for that same actor | `kitchenGroupInputSelf` |
| Student Progress peers | Anonymous aggregate only. Raw peer activities, identities, reviews, and chef feedback must never reach the participant client. Blocked until a verified privacy-safe GameBus projection exists; UI shows “Not enough peer data yet”. Do not attach trainer-style `GET /api/groups/activities` | none |
| Tutor | Group by actor; actor match when attaching reviews | `kitchenSkillsTrainerInput` |
| Session Review | May hydrate reviews from both self and trainer feeds (dedupe) | both |

Do **not** reuse `kitchenGroupInput`. Do **not** invent child REST pagination — UX windowing consumes whatever INPUT_COLLECTIONS delivers. Students with zero Kitchen Skills activity are not listed (no group-members collection in this phase). Peer cards never show names, actor ids, or raw peer activities.

Debug: with `?gamebusDebug=1` (or DEV), Progress can log `kitchen-skills-progress.self-feed-reviews`.

## 5. Non-goals

Automatic score from waste % or Portion metrics; competitive leaderboard; reuse verification; inventing an overall tutor score across modules.
