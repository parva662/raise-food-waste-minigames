# Rescue & Reuse — reuse suggestion

> **Documentation role:** Explanation — module intent and rules.
> **APPROVED PRODUCT TARGET**. Implemented on `main` at `#/kitchen-day/reuse`.
>
> Module of [`KITCHEN_SKILLS_CHALLENGE.md`](KITCHEN_SKILLS_CHALLENGE.md). Locked properties: [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md).

## 1. Purpose

After a Trim Smart entry records actual waste, the student records how much of **that ingredient's** waste can be reused and where.

Not a scored mini-game. The tutor may still submit a module assessment for Rescue when evidence exists (`reviewedGame: rescueAndReuse`); system metrics do not set those scores.

## 2. Connection

Because a student does not record the same ingredient twice in one session, the Trim source is unique as:

**`sessionId` + `ingredientId`**

Do **not** create `sourceActivityId` or `preparationEntryId`.

| Concept | Where it lives |
|---------|----------------|
| Waste, name, starting weight | Matching `trimSmart` |
| Reusable amount + destination | `rescueAndReuse` |
| Discarded | Calculated — never stored |

Exact stored properties: slug contract. Do **not** duplicate `ingredientName` or `ingredientWeightGrams` on Reuse.

## 3. Rules

1. `reuseDestination` is free text.
2. No reuse status, later confirmation, inventory, or "was it used?" tracking.
3. `reusableWasteGrams` is 0 … that Trim entry's `actualWasteGrams`.
4. Each Trim ingredient may have at most one reuse suggestion.
5. No reuse points; no automatic reuse tutor score.

## 4. Journey

Complete Trim through actual waste → compact reuse form → see calculated discarded remainder → save (`SILENT_ACTIVITY`) → continue to Portion in the same iframe. Layout: [`../UI_STANDARD.md`](../UI_STANDARD.md).

## 5. Removed (historical naming)

| Removed | Replacement |
|---------|-------------|
| Standalone Rescue game | Kitchen Skills Challenge module |
| `sourceActivityId` / `preparationEntryId` | `sessionId` + `ingredientId` |
| Duplicated ingredient name/weight | Read from Trim |
| `reuseMethod` | `reuseDestination` |
| Stored `discardedWasteGrams` | Calculated |

## 6. GameBus admin

See slug contract for the live property set. Create/link `reuseDestination`; unlink `reuseMethod` and duplicated ingredient fields. Do not create `sourceActivityId`.
