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
| System performance | Calculated waste % vs the recipe-ingredient Hävikki reference (internal; not shown on the student challenge). Portion ingredient accuracy and final-weight deviation. Percentile / ranking **@pending** a sufficient-data rule. |
| Tutor assessment | One review per completed module (`reviewedGame`): time / quality scores and optional feedback |

System comparison never pre-fills tutor scores. Analytics are never stored as activity properties. There is no automatic combined Portion score or overall tutor score.

## 2. Student surfaces

| Surface | Route | Scope |
|---------|-------|-------|
| Session Review | `#/kitchen-day/review` | Current locked session only; read-only; per-module tutor readbacks; no student-facing waste % or Hävikki |
| Student Progress | `#/kitchen-day-progress` | Own history; Overview / Progress; module tabs default to **Recent** (last 8 sessions + span, Recent-only charts) with **History** archive (filters, ~10 rows/page); no leaderboard |

Neither posts measurement activities. Progress does not invent ranking or an overall tutor score.

## 3. Tutor dashboard — one assessment per module

`#/kitchen-day-tutor`: **staff list** → **Needs assessment** / **Reviewed** session tabs → **session detail** with module tabs (Trim / Rescue / Portion).

- Evidence without a matching review keeps the session in Needs assessment (including partial reviews). Modules without evidence do not block Reviewed.
- Independent draft per module tab; scores **0–5** (empty ≠ `0`).
- Submit one `wastePracticeReview` per module with evidence as `SILENT_ACTIVITY` + RAISE `actors: [selectedStudentActorId]` and `reviewedGame` set to that module slug. Exact properties: slug contract.
- **Close** posts `{ type: 'EXIT' }` only (no review). Confirm if the active draft is dirty.
- Duplicate posts for the same `sessionId` + `reviewedGame` are rejected.

**DEPRECATED property names:** see slug contract (`reviewedActivityId`, `reasonCode`, `freeTextNote`, `unusualEvent`, `serviceDate`, …).

## 4. Retrieval (product rules)

| Who | Product rule | Feed |
|-----|--------------|------|
| Student | Progress shows Trim / Reuse / Portion before tutor review exists; attach reviews by `sessionId` + `reviewedGame` (no actor-id equality required) | `kitchenGroupInputSelf` |
| Tutor | Group by actor; actor match when attaching reviews | `kitchenSkillsTrainerInput` |
| Session Review | May hydrate reviews from both self and trainer feeds (dedupe) | both |

Do **not** reuse `kitchenGroupInput`. Do **not** invent child REST pagination — UX windowing consumes whatever INPUT_COLLECTIONS delivers. Students with zero Kitchen Skills activity are not listed (no group-members collection in this phase).

Debug: with `?gamebusDebug=1` (or DEV), Progress can log `kitchen-skills-progress.self-feed-reviews`.

## 5. Non-goals

Automatic score from waste % or Portion metrics; competitive leaderboard; reuse verification; inventing an overall tutor score across modules.
