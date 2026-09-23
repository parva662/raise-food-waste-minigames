# Kitchen Day — UX flow

> **APPROVED PRODUCT TARGET**. Trim Smart v1 remains a standalone CURRENT IMPLEMENTATION at `#/waste/trim-smart`.

**Slug authority:** [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md).

## 1. Context

Working kitchen: wet hands, scale nearby, time pressure. Minimal typing, large tap targets, units always visible, impossible values blocked.

## 2. Shell

```text
[ Trim Smart ]  [ Reuse ]  [ Portion Precision ]  [ My day ]
```

Shared `sessionId` + `sessionDate` (Europe/Helsinki). Exact route/hash structure is an implementation choice.

- Many **different** Trim ingredients; the same ingredient is not entered twice.
- Reuse opens from a Trim entry that has `actualWasteGrams` and joins by `sessionId` + `ingredientId`.
- Portion Precision: one submit per recipe.
- "My day" is read-only.

## 3. Trim Smart

Ingredient (locked category labels) → Technique (`trimTechniques`) → Estimate → Timed prepare (`duration`) → Actual waste → system comparison → reuse / another ingredient / My day.

Category UI labels: Root vegetables, Leafy vegetables, Fruit vegetables, Stem vegetables, Herbs, Other. Posted values stay `root` / `leafy` / `fruit` / `stem` / `herbs` / `other`.

Validation: starting weight > 0; estimate and actual in 0 … starting weight; zero estimate/actual allowed.

Initially compare to chef-seeded reference by `ingredientId`. Later use historical Trim data when adequate, else seed. No percentile copy until the sufficient-data rule is agreed.

## 4. Reuse

How much of this ingredient's waste can be reused? Where (free text)? Show calculated discarded remainder. Save. No status question. No duplicated ingredient name/category/weight fields.

## 5. Portion Precision

Select recipe → required lines from recipe dataset (read-only) → actuals into `recipeComposition` → required `finalRecipeWeightGrams` → one submit. No category question.

## 6. Dashboards

Student "My day" and chef session view are **read-only** evidence surfaces. Chef adds one pair of 0–5 scores and optional feedback at end of session.

Load via existing group-activities client.

## 7. UX non-goals

Separate apps; reuse follow-up; skipping final recipe weight; storing calculated analytics as facts; per-ingredient chef scores; same ingredient twice in one session.
