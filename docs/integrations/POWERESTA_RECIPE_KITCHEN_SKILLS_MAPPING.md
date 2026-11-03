# PoweResta recipes ↔ Kitchen Skills (design only)

**Documentation role:** Explanation / mapping note. **No Kitchen Skills calculations or GameBus schemas change here.**

## Current Kitchen Skills identity

| RAISE field | Source today | Notes |
|-------------|--------------|-------|
| `recipeId` | JAMIX-derived numeric string in `kitchen-skills-recipes.json` | Posted on Portion / Trim / Reuse / tutor review |
| `ingredientId` | Slugified ingredient name | Uniqueness with `sessionId` + `recipeId` |
| `referenceWastePercent` | JAMIX `Hävikki N` | Objective Trim comparison |
| Portion targets | `target_weight_g`, `expected_final_weight_g` | Grams in generated dataset |

These IDs are **not** the Excel lunch menu item slugs, and they are **not** proven equal to PoweResta UUIDs.

## Documented PoweResta recipe fields of interest

| PoweResta field | Possible Kitchen Skills relevance | Caution |
|-----------------|-----------------------------------|---------|
| `id` (UUID) | Future external `recipeId` | Would require GameBus/history crosswalk |
| `code` | Human/stable business code | Confirm uniqueness per site |
| `rows[].quantity` + `quantityUnitOfMeasurementId` | Ingredient amounts for Portion / Trim | Quantity is a **string** in docs; units via separate UoM endpoint |
| `rows[].lossPreparation` | Candidate trim/prep loss input | **Units unknown — do not assume %** |
| `lossCooking`, `lossServing` | Cooking / serving loss | **Units unknown — do not assume %** |
| `rows[].translated[].method` | Preparation method text | Not a structured technique enum |
| `sizePortion*`, `sizeBatch*`, `numberPortion`, `numberBatch` | Batch/portion scaling | Unit semantics unverified |
| `rows[].itemNames` / `tradeItemNames` | Ingredient display names | Need language + ID strategy |

## Mapping posture until live confirmation

1. Treat public **menu** rows and **recipe** entities as separate until a join key is proven.
2. Do not feed PoweResta loss fields into Trim / Portion / Rescue formulas.
3. Do not replace JAMIX `referenceWastePercent` with `lossPreparation` without provider validation and product approval.
4. Keep confidential recipe detail out of public GitHub Pages JSON if synchronization is ever enabled.

## Questions for Teemu

1. Meaning and units of `lossPreparation`, `lossCooking`, `lossServing` (percent vs mass vs other).
2. Whether published menu dishes can be joined to `/recipe/{id}` and how.
3. Which language ID the pilot should use for recipe names/methods.
4. Whether recipe detail may be stored only server-side (not published to Pages).
