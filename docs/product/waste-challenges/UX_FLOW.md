# Kitchen Day — UX flow

> **APPROVED PRODUCT TARGET**. Trim Smart v1 remains a standalone CURRENT IMPLEMENTATION at `#/waste/trim-smart`.
>
> Visual language: [`../UI_STANDARD.md`](../UI_STANDARD.md). GameBus menu URLs: [`../../contracts/KITCHEN_DAY_ROUTES.md`](../../contracts/KITCHEN_DAY_ROUTES.md).

**Slug authority:** [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md).

## 1. Context

Working kitchen: wet hands, scale nearby, time pressure. Minimal typing, large tap targets, units always visible, impossible values blocked. No internal IDs or debug copy.

## 2. Pages

```text
Student activity   #/kitchen-day
  [ Trim Smart ]  [ Reuse ]  [ Portion Precision ]
  Session review  (current Kitchen Day only)

Student progress   #/kitchen-day-progress   (separate left-menu page)
Tutor dashboard    #/kitchen-day-tutor      (separate left-menu page)
```

- Activity page: practical work only. No Progress tab. No tutor functions.
- Session review: current locked session, read-only summaries, tutor assessment if already submitted.
- Progress: own history, Overview / Progress tabs, approved comparisons only. No leaderboard or percentile copy.
- Tutor: student/session list, evidence, then qualitative scores (0–5). System metrics support judgement; they do not set the scores.

## 3. Trim Smart

Ingredient (locked category labels) → Technique (ten fixed one-tap choices; compact grid on small screens) → Estimate → Timed prepare → Actual waste → formatted comparison → reuse / another ingredient / Session Review.

Timer: instruction + Start; “Preparation in progress” + elapsed time + Finish; formatted duration + Continue. Never show `idle` / `running` / `finished`.

## 4. Reuse

Ingredient, actual waste, reusable amount, destination, discarded remainder. Saved record is a success/read-only state.

## 5. Portion Precision

Recipe → each line: name, Target, Actual + unit in the control, human result (Exact / *n.n*% over / *n.n*% under, plus gram difference) → expected final weight from the recipe reference → recorded final recipe weight → save.

Review, Progress, and Tutor show ingredient accuracy and final-weight deviation as separate derived figures. They do not combine into one score and do not set tutor scores.

## 6. Retrieval

Existing `kitchenGroupInput.activities` path. No new API.
