# Trim Smart — ingredient preparation entry

> **APPROVED PRODUCT TARGET** — module of [`KITCHEN_SKILLS_CHALLENGE.md`](KITCHEN_SKILLS_CHALLENGE.md).
>
> **CURRENT IMPLEMENTATION:** Kitchen Skills Challenge Trim is on `main` at `#/kitchen-day`. Legacy Trim Smart v1 remains at `#/waste/trim-smart` (`practice` / `participantWasteGrams`).

**Slug authority:** [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md).

## 1. Purpose

Estimate waste before preparation, measure actual waste after, and compare to kitchen reference data. System comparison is **not** a tutor assessment.

## 2. Place in Kitchen Day

One `trimSmart` activity = one ingredient preparation entry. A student records **multiple different ingredients** in one session. The **same ingredient is not recorded twice** in that session.

Reuse (0..1) joins this entry by `sessionId` + `ingredientId`.

## 3. LEGACY IMPLEMENTATION (v1 at `#/waste/trim-smart`)

Standalone route, no estimate step, no timer, no reference comparison. Posts `practice` and `participantWasteGrams`. **DEPRECATED** for new target posts.

## 4. Target flow

1. Name → `ingredientId` + starting weight (`ingredientWeightGrams`).
2. Technique → `trimTechniques` (plural live slug; the ten locked values are one-tap buttons, compact on small screens).
3. Estimate → `estimatedWasteGrams`.
4. Timed preparation → `duration` (student does not type minutes).
5. Actual waste → `actualWasteGrams`.
6. See calculated waste % and reference comparison.
7. **Save ingredient** posts `SILENT_ACTIVITY` and continues to Reuse in the same iframe.

Worked example (stored facts): Carrot / 5000 g / `trimming` / estimate 600 g / actual 450 g / timed `duration`. Waste % 9% and the reference comparison are calculated, not stored.

## 5. Calculated (never stored)

Waste %; estimate error; comparison to seeded then historical kitchen reference data by `ingredientId`; discarded waste after reuse.

Percentile / ranking messaging is **@pending** until a sufficient-data rule is agreed.

## 6. Tutor assessment

One end-of-session `wastePracticeReview` for the whole Kitchen Day. This module is evidence, not a separate tutor score.

## 7. Non-goals

One ingredient only per day; same ingredient twice per session; tutor score from waste %; storing analytics; renaming `trimTechniques`.
