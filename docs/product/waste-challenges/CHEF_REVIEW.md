# Student dashboard and chef review

> **APPROVED PRODUCT TARGET**. Not implemented on `main`.
>
> [`KITCHEN_DAY.md`](KITCHEN_DAY.md) · [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md).

## 1. Two feedback layers

| Layer | Content |
|-------|---------|
| System performance | Calculated waste % vs chef-seeded reference, later vs historical Trim data by `ingredientId`. Percentile / ranking **@pending** a sufficient-data rule. |
| Chef qualitative | One end-of-session review: `timeEfficiencyScore`, `preparationQualityScore`, optional `chefFeedback` |

System comparison never pre-fills chef scores. Analytics are never stored as activity properties.

## 2. Student dashboard

Read-only list of that student's completed Kitchen Day (`sessionId` / `sessionDate`). No activity posted.

## 3. Chef review — one per session

The chef opens a student's completed Kitchen Day, inspects Trim / reuse / Portion as **evidence**, enters the two 0–5 scores and optional feedback, and submits **one** `wastePracticeReview`.

Not one review per activity. Not one score per ingredient. Trim, reuse, and Portion do not receive separate first-release chef scores.

Stored: `sessionId`, `sessionDate`, `submittedAt`, `timeEfficiencyScore`, `preparationQualityScore`, optional `chefFeedback`.

`0` is a valid score and must stay distinct from "not yet scored".

**DEPRECATED:** `reviewedActivityId`, `reviewedGame`, `reasonCode`, `freeTextNote`, `unusualEvent`, `serviceDate`.

Student progress is `#/kitchen-day-progress`. Tutor review is `#/kitchen-day-tutor`. Session review on the activity page is current Kitchen Day only.

## 4. Retrieval

`src/gamebus/groupActivities.ts` — `kitchenGroupInput.activities` → `GET /groups/activities`.

**Not** a platform blocker. **Not** a new API.

## 5. Non-goals

Automatic score from waste %; competitive leaderboard; per-module review pages; reuse verification.
