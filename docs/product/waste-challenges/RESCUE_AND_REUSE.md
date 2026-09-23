# Rescue & Reuse — reuse suggestion

> **APPROVED PRODUCT TARGET**. Not implemented on `main`.
>
> Module of [`KITCHEN_DAY.md`](KITCHEN_DAY.md). Slug authority: [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md).

## 1. Purpose

After a Trim Smart entry records `actualWasteGrams`, the student records how much of **that ingredient's** waste can be reused and where.

Not a scored mini-game. First-release chef review does not score this module separately.

## 2. Connection

Because a student does not record the same ingredient twice in one session, the Trim source is unique as:

**`sessionId` + `ingredientId`**

Do **not** create `sourceActivityId` or `preparationEntryId`.

```text
Trim actualWasteGrams:     1000 g
reusableWasteGrams:         500 g
Discarded (calculated):     500 g
reuseDestination:           "Carrot soup tomorrow"
```

| Concept | Where it lives |
|---------|----------------|
| Waste, name, category, starting weight | Matching `trimSmart` |
| Reusable amount + destination | `rescueAndReuse` |
| Discarded | Calculated — never stored |

## 3. Stored properties

`sessionId`, `sessionDate`, `ingredientId`, `reusableWasteGrams`, `reuseDestination`, `submittedAt`.

Do **not** duplicate `ingredientName`, `ingredientCategory`, or `ingredientWeightGrams`.

## 4. Rules

1. `reuseDestination` is free text (e.g. "Carrot soup tomorrow", "Use in today's vegetable stock").
2. No reuse status, later confirmation, inventory, or "was it used?" tracking.
3. `reusableWasteGrams` is 0 … that Trim entry's `actualWasteGrams`.
4. Each Trim ingredient may have at most one reuse suggestion.
5. No reuse points or reuse chef score.

## 5. Journey

Complete Trim through `actualWasteGrams` → enter reusable amount and destination → see calculated discarded remainder → save.

## 6. Removed

| Removed | Replacement |
|---------|-------------|
| Standalone Rescue game | Kitchen Day module |
| `sourceActivityId` / `preparationEntryId` | `sessionId` + `ingredientId` |
| Duplicated ingredient name/category/weight | Read from Trim |
| `reuseMethod` | `reuseDestination` |
| Stored `discardedWasteGrams` | Calculated |
| Separate chef score | Evidence only |

## 7. GameBus admin

Keep/link session, date, `ingredientId`, `reusableWasteGrams`, `submittedAt`. Create/link `reuseDestination`. Unlink `reuseMethod` and duplicated ingredient fields. Do not create `sourceActivityId`.
