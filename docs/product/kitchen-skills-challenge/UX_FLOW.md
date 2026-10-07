# Kitchen Skills Challenge — UX flow

> **Documentation role:** Explanation — student / tutor interaction flow.
> **APPROVED PRODUCT TARGET**. Trim Smart v1 remains a standalone CURRENT IMPLEMENTATION at `#/waste/trim-smart`.
>
> Visual language: [`../UI_STANDARD.md`](../UI_STANDARD.md). Routes: [`../../contracts/KITCHEN_SKILLS_CHALLENGE_ROUTES.md`](../../contracts/KITCHEN_SKILLS_CHALLENGE_ROUTES.md). Protocol: [`../../contracts/GAMEBUS.md`](../../contracts/GAMEBUS.md). Slugs: [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md).

## 1. Context

Working kitchen: wet hands, scale nearby, time pressure. Compact data-entry, units always visible, impossible values blocked at the input. Touch targets stay usable without turning each field into a large empty block. No internal IDs or debug copy.

Layout checks: ~390 / ~768 / ~1200. Practice references for forms and accessibility are GOV.UK Design System and WCAG 2.2 — not a brand restyle.

## 2. Pages

```text
Student activity   #/kitchen-day
  [ Portion Precision ]  [ Trim Smart ]  [ Reuse ]
  Session review  (current session only)

Student progress   #/kitchen-day-progress   (separate left-menu page)
Tutor dashboard    #/kitchen-day-tutor      (separate left-menu page)
```

- Activity page: practical work only. No Progress tab. No tutor functions.
- Session review: current locked session, read-only summaries, per-module tutor readbacks if already submitted.
- Progress: own history, Overview / Progress tabs, approved comparisons only. No leaderboard or percentile copy.
- Tutor: staff list → sessions → module tabs; evidence per module, then qualitative scores (0–5) for that module. System metrics support judgement; they do not set the scores.

## 3. Continuous student challenge (same iframe)

The student Kitchen Skills TASK stays open until **Finish challenge**.

1. **Portion Precision** — searchable recipe combobox that lists ordered recipes when opened (typing filters), every ingredient actual, final recipe weight, **Save recipe**. Posts `SILENT_ACTIVITY` (`portionPrecision`), keeps local state, navigates to `#/kitchen-day/trim`. Does **not** send `EXIT`. Forward tabs stay locked until that save; the student can still edit the form before saving.
2. **Trim Smart** — selected recipe stays visible. Searchable remaining unused recipe ingredients with `referenceWastePercent > 0` appear when the combobox opens; typing filters. Then the existing steps (weight → technique → estimate → timed prepare → actual waste → **Save ingredient**), with **Back** to correct earlier values before save. After save, **Another ingredient** and **Record reuse** when there is reusable waste (Record reuse must open Reuse). A recipe with no eligible Trim ingredients shows that clearly and can complete without fake Trim/Reuse posts. Grams only on the result — no waste % or Hävikki comparison. Does **not** send `EXIT`.
3. **Reuse** — compact reusable grams + destination; discarded remainder calculated. The student can return to Trim to add another ingredient. **Save reuse** opens the **Challenge complete** summary. Does **not** send `EXIT`.
4. Summary shows compact Trim / Reuse / Portion headlines (grams, not waste %). Detail sections are collapsed. Portion’s ingredient table is behind **View recipe details**. **Add another ingredient** returns to Trim and hides Finish until that work is saved.
5. **Finish challenge** is only on that summary when there is no unfinished Trim/Reuse work, and posts `{ type: 'EXIT' }` via `postKitchenSkillsChallengeExit`. That is the only EXIT in this flow.

Do not send EXIT after Portion, Trim, Reuse, or Add more ingredients. Tutor review posts one `SILENT_ACTIVITY` per completed module (`reviewedGame`) with RAISE `actors` and keeps the tutor iframe open. Protocol details: [`../../contracts/GAMEBUS.md`](../../contracts/GAMEBUS.md) and TASK contract.

## 4. Module journeys (UI)

**Trim Smart:** Choose a remaining recipe ingredient (searchable list shown on open) → starting weight → technique (ten fixed one-tap choices) → estimate → timed prepare → actual waste → **Save ingredient** → result with grams and **Another ingredient** or **Record reuse**. Back is available before save. No category step. No waste % or kitchen reference on the student result. Gram fields content-width; Continue/Save sticky on small screens. Timer copy never shows `idle` / `running` / `finished`.

**Reuse:** Compact reusable grams + destination; discarded remainder calculated; then the challenge complete summary.

**Portion Precision:** Searchable recipe combobox → Ingredient | Target | Actual | Result table → final weight → **Save recipe** → Trim Smart. Review / Progress / Tutor show ingredient accuracy and final-weight deviation as separate derived figures (not one combined score).

## 5. Retrieval (product rules)

- **Student challenge / Progress:** `kitchenGroupInputSelf` — self-scoped; do not require `activity.actor.id === me.id`. Progress does not wait for tutor review.
- **Trainer feedback:** `kitchenSkillsTrainerInput` — do not reuse `kitchenGroupInput`.
- After a silent post, local session state is enough for the next step; later self activities merge and dedupe with local records.
