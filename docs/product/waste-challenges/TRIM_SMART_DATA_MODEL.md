# Trim Smart — Data Model Specification

> **CURRENT IMPLEMENTATION** — §2 (v1 on `main`).
> **APPROVED PRODUCT TARGET** — §3 onward.

**Slug authority:** [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md).

## 1. Goals

1. Multiple **different** `trimSmart` activities per student Kitchen Day.
2. Same `ingredientId` is **not** posted twice in one session.
3. Store only §3 facts; calculate analytics on read.
4. Chef judgement is one session-level `wastePracticeReview`, not per Trim entry.
5. v1 activities stay readable; do not rewrite them in place.

### 1.1 Calculated (never stored)

Waste % = `actualWasteGrams / ingredientWeightGrams × 100`. Estimate error = `estimatedWasteGrams − actualWasteGrams`. Kitchen reference / later historical average keyed by `ingredientId`. Percentile only after an agreed sufficient-data rule. Discarded after reuse = Trim `actualWasteGrams − reusableWasteGrams`.

## 2. CURRENT IMPLEMENTATION (`main`, superseded)

`sessionId`, `sessionDate`, `ingredientCategory`, `ingredientId`, `ingredientName`, `ingredientWeightGrams`, `participantWasteGrams`, `practice`, `submittedAt`.

Current code categories (`vegetables`, `fruit`, `meat`, …) are **not** the locked GameBus enum.

Pointers: `src/gamebus/mapTrimSmart.ts`, `src/trimSmart/`.

## 3. Target property set

`sessionId`, `sessionDate`, `submittedAt`, `ingredientId` (non-empty), `ingredientName` (non-empty), `ingredientCategory` (`root` \| `leafy` \| `fruit` \| `stem` \| `herbs` \| `other`), `ingredientWeightGrams`, `trimTechniques`, `estimatedWasteGrams`, `actualWasteGrams`, `duration`.

**DEPRECATED for new posts:** `practice`, `participantWasteGrams`, `trimTechnique`, `preparationMethod`, `preparationApproach`, `measurementMethod`, `finalUsableWeightGrams`.

## 4. Relationships

| Relationship | Key |
|--------------|-----|
| `trimSmart` → `rescueAndReuse` | `sessionId` + `ingredientId` |
| Session chef review | same `sessionId` + `sessionDate` + actor |
| Dashboards / history | existing `GET /groups/activities` via `kitchenGroupInput` |

Do **not** use `sourceActivityId` or `preparationEntryId`.

## 5. Migration notes (implementation)

Replace Practice with `trimTechniques`; add estimate, timer, `actualWasteGrams`; post `duration`; align category labels; derive analytics in the app; keep a read adapter for v1 (`practice` + `participantWasteGrams`).
