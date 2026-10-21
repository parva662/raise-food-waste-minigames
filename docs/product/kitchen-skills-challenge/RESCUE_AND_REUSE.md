# Rescue & Reuse — reuse suggestion

> **Documentation role:** Explanation — module intent and rules.
> **APPROVED PRODUCT TARGET**. Implemented on `main` at `#/kitchen-day/reuse`.
>
> Module of [`KITCHEN_SKILLS_CHALLENGE.md`](KITCHEN_SKILLS_CHALLENGE.md). Locked properties: [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md).

## 1. Purpose

After a Trim Smart entry records actual waste, the student records how much of **that ingredient's** waste can be reused and how they would prepare / use it.

Rescue is **optional**. It is offered only when Trim waste exists. Students are never required to create an empty Rescue activity to Finish.

Not a scored mini-game. The tutor submits a Rescue assessment only when evidence exists for that recipe (`recipeId` + `reviewedGame: rescueAndReuse`); system metrics do not set those scores.

## 2. Connection

The Trim source is unique as:

**`sessionId` + `recipeId` + `ingredientId`**

New Reuse posts include `recipeId` so Reuse for the same ingredient under Recipe B cannot attach to Recipe A’s Trim. Legacy activities without `recipeId` still hydrate for history.

Do **not** create `sourceActivityId` or `preparationEntryId`.

| Concept | Where it lives |
|---------|----------------|
| Waste, name, starting weight | Matching `trimSmart` |
| Reusable amount + destination | `rescueAndReuse` |
| Discarded | Calculated — never stored |

Exact stored properties: slug contract. Do **not** duplicate `ingredientName` or `ingredientWeightGrams` on Reuse.

## 3. Rules

1. Keep **one** free-text GameBus property: `reuseDestination`. The field label is **Preparation method and reuse destination** (example: “Wash the peel, dry it, then use it in cake.”). Do **not** create `reuseMethod` or change the live GameBus configuration.
2. No reuse status, later confirmation, inventory, or "was it used?" tracking.
3. `reusableWasteGrams` is 0 … that Trim entry's `actualWasteGrams`. The reusable amount uses the same g/kg mass input as Portion / Trim; canonical storage stays grams.
4. Each Trim ingredient under a given recipe may have at most one reuse suggestion.
5. No reuse points; no automatic reuse tutor score.
6. Discarded remainder is calculated (never stored) and shown with clear spacing from the reusable-amount control.
7. Summaries: a short destination-only phrase may read `Appelsiini · 400 g to cake`. Longer preparation text is **not** parsed for a destination — show the reusable quantity, a concise preview, and the full submitted text in the detailed view.

## 4. Journey

Complete Trim through actual waste → compact reuse form (reusable mass g/kg, preparation method and reuse destination, discarded remainder with spacing) → save (`SILENT_ACTIVITY`). The student can return to Trim for another ingredient. **Finish challenge** is available as soon as Portion is saved and is not gated on Rescue. Layout: [`../UI_STANDARD.md`](../UI_STANDARD.md).

## 5. Removed (historical naming)

| Removed | Replacement |
|---------|-------------|
| Standalone Rescue game | Kitchen Skills Challenge module |
| `sourceActivityId` / `preparationEntryId` | `sessionId` + `recipeId` + `ingredientId` |
| Duplicated ingredient name/weight | Read from Trim |
| `reuseMethod` | `reuseDestination` |
| Stored `discardedWasteGrams` | Calculated |

## 6. GameBus admin

See slug contract for the live property set. Create/link `reuseDestination`; unlink `reuseMethod` and duplicated ingredient fields. Do not create `sourceActivityId`.
