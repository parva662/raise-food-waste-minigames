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
| Tutor assessment | One end-of-session review: `timeEfficiencyScore`, `preparationQualityScore`, optional `chefFeedback` |

System comparison never pre-fills tutor scores. Analytics are never stored as activity properties. There is no automatic combined Portion score.

## 2. Student surfaces

| Surface | Route | Scope |
|---------|-------|-------|
| Session Review | `#/kitchen-day/review` | Current locked Kitchen Day only; read-only |
| Student Progress | `#/kitchen-day-progress` | Own history; Overview / Progress; no leaderboard |

Neither posts measurement activities. Progress does not invent ranking.

## 3. Tutor dashboard — one assessment per session

The tutor opens a student's completed Kitchen Day on `#/kitchen-day-tutor`, inspects Trim / reuse / Portion as **evidence**, enters the two 0–5 scores and optional feedback, and submits **one** `wastePracticeReview` as `SILENT_ACTIVITY` with `actors: [selectedStudentActorId]`. The tutor iframe stays open so the chef can review another student.

Not one review per activity. Not one score per ingredient. Trim, reuse, and Portion do not receive separate first-release tutor scores.

Stored properties: `sessionId`, `sessionDate`, `submittedAt`, `timeEfficiencyScore`, `preparationQualityScore`, optional `chefFeedback`. Do **not** add `studentId`. The selected student is `actors: [selectedStudentActorId]` on the activity message.

`0` is a valid score and must stay distinct from "not yet scored".

**DEPRECATED:** `reviewedActivityId`, `reviewedGame`, `reasonCode`, `freeTextNote`, `unusualEvent`, `serviceDate`.

## 4. Retrieval

- Student Session Review / challenge / Student Progress: `kitchenGroupInputSelf.activities` → `GET /api/me/activities`. Progress shows Trim / Reuse / Portion before tutor review exists.
- Tutor dashboard: `kitchenSkillsTrainerInput.activities` → `GET /api/groups/activities` filtered to Kitchen Skills templates (`src/platform/gamebus/groupActivities.ts` `getRawKitchenSkillsTrainerActivitiesInput`), grouped by actor. Do not reuse `kitchenGroupInput`.

This phase does **not** use a group-members Input Collection. Students with zero Kitchen Skills activity are not listed.

**Not** a platform blocker. **Not** a new API.

## 5. Non-goals

Automatic score from waste % or Portion metrics; competitive leaderboard; per-module review pages; reuse verification.
