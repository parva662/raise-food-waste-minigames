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
| Tutor assessment | One review per completed module (`reviewedGame`): Time efficiency 0–5, Preparation quality 0–5, optional feedback |
| Anonymous peer context | Progress-only. Group median of Trim **delta vs each person's own JAMIX**, and like-for-like tutor score medians. Never a new overall score. |

Objective Trim math (shared read-model): actual % = removed / starting × 100; reference grams = starting × JAMIX % / 100; delta pp = actual % − JAMIX %. Session totals weight by starting grams (Σ removed / Σ starting; Σ expected reference grams / Σ starting). Neutral copy: above / below / at reference — not “better”. Missing join → **Reference unavailable** (never guessed). 0% Hävikki is a valid reference.

System comparison never pre-fills tutor scores. Analytics are never stored as activity properties. There is no automatic combined Portion score or overall tutor score.

## 2. Student surfaces

| Surface | Route | Scope |
|---------|-------|-------|
| Session Review | `#/kitchen-day/review` | Current locked session only; read-only; per-module tutor readbacks; no student-facing waste % or Hävikki |
| Student Progress | `#/kitchen-day-progress` | Own history; Overview / Progress; module tabs default to **Recent** (last 8 sessions + span, Recent-only charts) with **History** archive (filters, ~10 rows/page); weighted Trim vs kitchen reference on results only; peer cards stay “Not enough peer data yet” until a privacy-safe anonymous aggregate exists; no leaderboard |

Neither posts measurement activities. Progress does not invent ranking or an overall tutor score.

## 3. Tutor dashboard — one assessment per module

`#/kitchen-day-tutor`: **staff list** → **Needs assessment** / **Reviewed** session tabs → **session detail** with module tabs (Trim / Rescue / Portion).

- Session status uses **only modules with participant evidence**. Evidence + no review → Needs assessment; every evidenced module reviewed → **Reviewed**; some but not all evidenced modules reviewed → Partially reviewed. Modules with no participant evidence create **no** review requirement, are not “Not applicable”, and do not appear as “Trim needs review” / “Rescue needs review” or inflate awaiting counts. Portion-only + Portion reviewed is Reviewed.
- Trim evidence (when the session Portion recipe joins) shows starting weight, actual removed g/%, JAMIX % and expected grams, and delta in percentage points. Tutor score controls stay unchanged.
- Independent draft per module tab; scores **0–5** (empty ≠ `0`).
- Submit one `wastePracticeReview` per module with evidence as `SILENT_ACTIVITY` + RAISE `actors: [selectedStudentActorId]` and `reviewedGame` set to that module slug. Exact properties: slug contract.
- **Close** posts `{ type: 'EXIT' }` only (no review). Confirm if the active draft is dirty.
- Duplicate posts for the same `sessionId` + `reviewedGame` are rejected.

**DEPRECATED property names:** see slug contract (`reviewedActivityId`, `reasonCode`, `freeTextNote`, `unusualEvent`, `serviceDate`, …).

## 4. Retrieval (product rules)

| Who | Product rule | Feed |
|-----|--------------|------|
| Student | Progress shows Trim / Reuse / Portion before tutor review exists; attach reviews by `sessionId` + `reviewedGame` (no actor-id equality required) | `kitchenGroupInputSelf` |
| Student Progress peers | Anonymous aggregate only. Raw peer activities, identities, reviews, and chef feedback must never reach the participant client. Blocked until a verified privacy-safe GameBus projection exists; UI shows “Not enough peer data yet”. Do not attach trainer-style `GET /api/groups/activities` | none |
| Tutor | Group by actor; actor match when attaching reviews | `kitchenSkillsTrainerInput` |
| Session Review | May hydrate reviews from both self and trainer feeds (dedupe) | both |

Do **not** reuse `kitchenGroupInput`. Do **not** invent child REST pagination — UX windowing consumes whatever INPUT_COLLECTIONS delivers. Students with zero Kitchen Skills activity are not listed (no group-members collection in this phase). Peer cards never show names, actor ids, or raw peer activities.

Debug: with `?gamebusDebug=1` (or DEV), Progress can log `kitchen-skills-progress.self-feed-reviews`.

## 5. Non-goals

Automatic score from waste % or Portion metrics; competitive leaderboard; reuse verification; inventing an overall tutor score across modules.
