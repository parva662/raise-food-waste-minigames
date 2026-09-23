# Session Review, Student Progress, and tutor assessment

> **APPROVED PRODUCT TARGET**. Not implemented on `main`. Encoded on `feature/kitchen-day-v1`.
>
> Filename is historical. Product wording is **Tutor** / **Tutor assessment**. The GameBus activity slug remains `wastePracticeReview`.
>
> [`KITCHEN_DAY.md`](KITCHEN_DAY.md) · [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md).

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

The tutor opens a student's completed Kitchen Day on `#/kitchen-day-tutor`, inspects Trim / reuse / Portion as **evidence**, enters the two 0–5 scores and optional feedback, and submits **one** `wastePracticeReview`.

Not one review per activity. Not one score per ingredient. Trim, reuse, and Portion do not receive separate first-release tutor scores.

Stored: `sessionId`, `sessionDate`, `submittedAt`, `timeEfficiencyScore`, `preparationQualityScore`, optional `chefFeedback`.

`0` is a valid score and must stay distinct from "not yet scored".

**DEPRECATED:** `reviewedActivityId`, `reviewedGame`, `reasonCode`, `freeTextNote`, `unusualEvent`, `serviceDate`.

Tutor “on behalf of student” GameBus registration is unresolved until the live tutor mechanism is inspected. Do not invent it.

## 4. Retrieval

`src/gamebus/groupActivities.ts` — `kitchenGroupInput.activities` → `GET /groups/activities`.

**Not** a platform blocker. **Not** a new API.

## 5. Non-goals

Automatic score from waste % or Portion metrics; competitive leaderboard; per-module review pages; reuse verification.
