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
| Tutor assessment | One review per **student session** (`sessionId`): Time efficiency 0–5, Preparation quality 0–5, optional feedback |
| Anonymous peer context | Progress-only. Group median of Trim **delta vs each person's own JAMIX**, and like-for-like tutor score medians. Never a new overall score. |

Objective Trim math (shared read-model): actual % = removed / starting × 100; reference grams = starting × JAMIX % / 100; delta pp = actual % − JAMIX %. Session totals weight by starting grams (Σ removed / Σ starting; Σ expected reference grams / Σ starting). Neutral copy: above / below / at reference — not “better”. Missing join → **Reference unavailable** (never guessed). 0% Hävikki is a valid reference.

System comparison never pre-fills tutor scores. Analytics are never stored as activity properties. There is no automatic combined Portion score or overall tutor score.

## 2. Student surfaces

| Surface | Route | Scope |
|---------|-------|-------|
| Session Review | `#/kitchen-day/review` | Current locked session only; read-only; session tutor assessment + historical per-module readbacks; no student-facing waste % or Hävikki |
| Student Progress | `#/kitchen-day-progress` | Own history; Overview / Progress; Overview Trim card always shows Actual trim, Kitchen reference (or Reference unavailable), and Difference; module tabs default to **Recent** (last 8 sessions + span, Recent-only charts) with **History** archive (filters, ~10 rows/page); weighted Trim vs kitchen reference on results only; peer cards stay “Not enough peer data yet” until a privacy-safe anonymous aggregate exists; no leaderboard |

Neither posts measurement activities. Progress does not invent ranking or an overall tutor score. Student games are unchanged by the Tutor session-level restore.

## 3. Tutor dashboard — one assessment per student session

`#/kitchen-day-tutor`: **staff list** → session tabs → **session workspace** with all recorded Portion / Trim / Rescue evidence visible and **one** Tutor assessment form.

- Tutor enters Time efficiency, Preparation quality, and optional feedback, then **one Submit**.
- Submit dispatches exactly **one** `wastePracticeReview` `SILENT_ACTIVITY` with RAISE `actors: [selectedStudentActorId]` for that `sessionId`.
- New posts omit `reviewedGame` and `recipeId` (do not fabricate a module value for an overall assessment).
- No multi-module local draft queue, no awaiting-confirmation screen, and no manual resubmission workflow for the restored path.
- Duplicate protection: one session assessment per `sessionId` (attempt key + dispatch marker + in-memory row).
- Session status is **Needs assessment** until a session-level assessment exists; then **Reviewed**. Historical per-module `wastePracticeReview` rows remain readable and must **not** alone mark the session reviewed.
- **Close** posts `{ type: 'EXIT' }` only (no review). Confirm if the active draft is dirty.
- Outbound payload does **not** include `selectedTaskOfMission`.

**GameBus admin (release blocker):** on the trainer task’s `wastePracticeReview` template, `reviewedGame` and `recipeId` must be optional or unlinked before deploy. Exact steps: slug contract.

**Historical compatibility:** keep reading existing per-module assessments (`reviewedGame` ± `recipeId`). Do not delete or rewrite previous Tutor scores. Do not treat one historical module assessment as proof the whole session was assessed.

**DEPRECATED property names:** see slug contract (`reviewedGame`, `recipeId` for new posts; `reviewedActivityId`, `reasonCode`, `freeTextNote`, `unusualEvent`, `serviceDate`, …).

## 4. Retrieval (product rules)

| Who | Product rule | Feed |
|-----|--------------|------|
| Student | Progress shows Trim / Reuse / Portion before tutor review exists; keep only activities whose `actor.id` matches the authenticated user; attach reviews by `sessionId` (session-level) and still surface historical `sessionId` + `recipeId` + `reviewedGame` rows | `kitchenGroupInputSelf` |
| Student Progress peers | Anonymous aggregate only. Raw peer activities, identities, reviews, and chef feedback must never reach the participant client. Blocked until a verified privacy-safe GameBus projection exists; UI shows “Not enough peer data yet”. Do not attach trainer-style `GET /api/groups/activities` | none |
| Tutor | Group by actor; actor match when attaching reviews | `kitchenSkillsTrainerInput` |
| Session Review | May hydrate reviews from both self and trainer feeds (dedupe) | both |

Do **not** reuse `kitchenGroupInput`. Do **not** invent child REST pagination — UX windowing consumes whatever INPUT_COLLECTIONS delivers. Students with zero Kitchen Skills activity are not listed (no group-members collection in this phase). Peer cards never show names, actor ids, or raw peer activities.

## 5. Non-goals

Automatic score from waste % or Portion metrics; competitive leaderboard; reuse verification; inventing an overall tutor score across modules; three independent module submissions for new assessments.
