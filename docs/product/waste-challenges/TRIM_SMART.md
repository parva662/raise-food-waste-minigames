# Trim Smart — ingredient preparation entry

> **APPROVED PRODUCT TARGET** — module of [`KITCHEN_DAY.md`](KITCHEN_DAY.md).
>
> **CURRENT IMPLEMENTATION:** `#/waste/trim-smart` on `main` is Ingredient → Practice → Measure (`practice`, `participantWasteGrams`, old category values). That is not this target.

**Slug authority:** [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md).

## 1. Purpose

Estimate waste before preparation, measure actual waste after, and compare to kitchen reference data. System comparison is **not** a chef score.

## 2. Place in Kitchen Day

One `trimSmart` activity = one ingredient preparation entry. A student records **multiple different ingredients** in one session. The **same ingredient is not recorded twice** in that session.

Reuse (0..1) joins this entry by `sessionId` + `ingredientId`.

## 3. CURRENT IMPLEMENTATION (v1 on `main`)

Standalone route, no estimate step, no timer, no reference comparison. Posts `practice` and `participantWasteGrams`. **DEPRECATED** for new target posts.

## 4. Target flow

1. Category (`ingredientCategory`) + name → `ingredientId` + starting weight (`ingredientWeightGrams`).
2. Technique → `trimTechniques` (plural live slug).
3. Estimate → `estimatedWasteGrams`.
4. Timed preparation → `duration` (student does not type minutes).
5. Actual waste → `actualWasteGrams`.
6. See calculated waste % and reference comparison.
7. Optional reuse for this ingredient, another **different** ingredient, or the dashboard.

Worked example (stored facts): Carrot / `root` / 5000 g / `trimming` / estimate 600 g / actual 450 g / timed `duration`. Waste % 9% and the reference comparison are calculated, not stored.

## 5. Categories (closed)

| Posted | UI label |
|--------|----------|
| `root` | Root vegetables |
| `leafy` | Leafy vegetables |
| `fruit` | Fruit vegetables |
| `stem` | Stem vegetables |
| `herbs` | Herbs |
| `other` | Other |

Do not post `vegetables`, `roots`, or `fruits`.

## 6. Calculated (never stored)

Waste %; estimate error; comparison to chef-seeded then historical data by `ingredientId`; discarded waste after reuse.

Percentile / ranking messaging is **@pending** until a sufficient-data rule is agreed.

## 7. Chef review

One end-of-session review for the whole Kitchen Day. This module is evidence, not a separate chef score.

## 8. Non-goals

One ingredient only per day; same ingredient twice per session; chef score from waste %; storing analytics; renaming `trimTechniques`.
