# Session Review, Student Progress, and tutor assessment

> **APPROVED PRODUCT TARGET**. Implemented on `main` at `#/kitchen-day/review`, `#/kitchen-day-progress`, and `#/kitchen-day-tutor`. Trainer `wastePracticeReview` posts `SILENT_ACTIVITY` with `actors: [selectedStudentActorId]`.
>
> Filename is historical. Product wording is **Tutor** / **Tutor assessment**. The GameBus activity slug remains `wastePracticeReview`.
>
> [`KITCHEN_SKILLS_CHALLENGE.md`](KITCHEN_SKILLS_CHALLENGE.md) · [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md).

## 1. Two feedback layers

| Layer | Content |
|-------|---------|
| System performance | Calculated waste % vs seeded kitchen reference, later vs historical Trim data by `ingredientId`; Portion ingredient accuracy and final-weight deviation from the current recipe reference. Percentile / ranking **@pending** a sufficient-data rule. |
| Tutor assessment | One review per completed module (`reviewedGame`): `timeEfficiencyScore`, `preparationQualityScore`, optional `chefFeedback` |

System comparison never pre-fills tutor scores. Analytics are never stored as activity properties. There is no automatic combined Portion score or overall tutor score.

## 2. Student surfaces

| Surface | Route | Scope |
|---------|-------|-------|
| Session Review | `#/kitchen-day/review` | Current locked Kitchen Day only; read-only; per-module tutor readbacks |
| Student Progress | `#/kitchen-day-progress` | Own history; Overview / Progress; Progress uses module tabs (Trim / Rescue / Portion) with compact trends, session history, and per-module tutor assessment history; no leaderboard |

Neither posts measurement activities. Progress does not invent ranking or an overall tutor score.

## 3. Tutor dashboard — one assessment per module

The trainer opens `#/kitchen-day-tutor` in three levels: **staff list** (name search, modules awaiting assessment) → **staff sessions** split into **Needs assessment** / **Reviewed** tabs (evidence modules without a matching `wastePracticeReview` keep a session in Needs assessment, including partial reviews; modules without evidence do not block Reviewed) → **session detail** with module tabs (Trim Smart / Rescue & Reuse / Portion Precision). Session cards show module-level status or compact score summaries; ordering is newest first.

A compact sticky header keeps a secondary **Close** control visible while scrolling.

Each module tab has an **independent** assessment form. Switching modules remounts / clears draft inputs so Trim scores do not leak into Rescue or Portion. Score fields accept only empty or a single digit **0–5**; Submit stays disabled until both scores parse (`parseKitchenSkillsReviewScore`).

For each module that has evidence, the tutor inspects that module’s evidence and submits one `wastePracticeReview` as `SILENT_ACTIVITY` with `actors: [selectedStudentActorId]` and `reviewedGame` set to the module slug (`trimSmart`, `rescueAndReuse`, or `portionPrecision`). Modules without evidence show a message and no form. The tutor iframe stays open so the chef can review another student or module.

A secondary **Close** control posts `{ type: 'EXIT' }` via `postKitchenSkillsChallengeExit` and **does not** post a review. If the active module form has a dirty draft (time, quality, or feedback non-empty and not yet submitted), Close asks for confirmation first.

Not one score per ingredient. Duplicate posts for the same `sessionId` + `reviewedGame` are rejected.

Stored properties: `sessionId`, `sessionDate`, `submittedAt`, `reviewedGame`, `timeEfficiencyScore`, `preparationQualityScore`, optional `chefFeedback`. Do **not** add `studentId`. The selected student is `actors: [selectedStudentActorId]` on the activity message.

`0` is a valid score and must stay distinct from "not yet scored".

**DEPRECATED:** `reviewedActivityId`, `reasonCode`, `freeTextNote`, `unusualEvent`, `serviceDate`.

## 4. Retrieval

- Student Session Review / challenge / Student Progress: `kitchenGroupInputSelf.activities` → `GET /api/me/activities`. Progress shows Trim / Reuse / Portion before tutor review exists. When attaching `wastePracticeReview` onto Progress sessions, match by `sessionId` + `reviewedGame` (do not require `activity.actor.id` equality — self evidence may use a fallback actor id while the review carries the real actor, or vice versa). A review may create a session shell when evidence for that `sessionId` is absent. With `?gamebusDebug=1` (or DEV), Progress logs a compact self-feed review summary (`kitchen-skills-progress.self-feed-reviews`) so missing tutor assessments can be diagnosed without changing data sources.
- Tutor dashboard: `kitchenSkillsTrainerInput.activities` → `GET /api/groups/activities` filtered to Kitchen Skills templates (`src/platform/gamebus/groupActivities.ts` `getRawKitchenSkillsTrainerActivitiesInput`), grouped by actor (actor match required when attaching reviews). Do not reuse `kitchenGroupInput`.
- Session Review in the student embed hydrates reviews from **both** self and trainer input collections (deduped by `persistId` or `sessionId` + `reviewedGame`).

This phase does **not** use a group-members Input Collection. Students with zero Kitchen Skills activity are not listed.

**Not** a platform blocker. **Not** a new API.

## 5. Non-goals

Automatic score from waste % or Portion metrics; competitive leaderboard; reuse verification; inventing an overall tutor score across modules.
