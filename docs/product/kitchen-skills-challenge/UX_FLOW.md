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

1. **Portion Precision** — the student records every recipe ingredient actual and the final recipe weight, then **Save recipe**. That posts `SILENT_ACTIVITY` (`portionPrecision`), keeps the entry in local session state, locks that recipe for the session, and navigates to `#/kitchen-day/trim`. Does **not** send `EXIT`.
2. **Trim Smart** — the ingredient is chosen from that recipe. **Save ingredient** posts `SILENT_ACTIVITY` (`trimSmart`), keeps the entry in local session state, and navigates to `#/kitchen-day/reuse`. **Add more ingredients** saves the same entry and stays on Trim for another unused recipe ingredient.
3. **Reuse** — save posts `SILENT_ACTIVITY` (`rescueAndReuse`), retains local state, and opens the **Challenge complete** summary. Does **not** send `EXIT`.
4. Summary shows compact Trim / Reuse / Portion headlines. Detail sections are collapsed. Portion’s ingredient table is behind **View recipe details**.
5. **Add more ingredients** (beside Finish) dismisses the summary and returns to Trim. **Finish challenge** posts `{ type: 'EXIT' }` via `postKitchenSkillsChallengeExit`. That is the only EXIT in this flow. After the first reuse, Finish and Add more stay available until Finish is chosen.

Do not send EXIT after Portion, Trim, Reuse, or Add more ingredients. Tutor review posts one `SILENT_ACTIVITY` per completed module (`reviewedGame`) with RAISE `actors` and keeps the tutor iframe open. Protocol details: [`../../contracts/GAMEBUS.md`](../../contracts/GAMEBUS.md) and TASK contract.

## 4. Module journeys (UI)

**Trim Smart:** Choose a remaining recipe ingredient → starting weight → technique (ten fixed one-tap choices) → estimate → timed prepare → actual waste → **Save ingredient** (Reuse) or **Add more ingredients** (stay on Trim). No category step and no free-text name. Gram fields content-width; Continue/Save sticky on small screens. Timer copy never shows `idle` / `running` / `finished`.

**Reuse:** Compact reusable grams + destination; discarded remainder calculated; then the challenge complete summary.

**Portion Precision:** Searchable recipe combobox → Ingredient | Target | Actual | Result table → final weight → **Save recipe** → Trim Smart. One recipe per session. Review / Progress / Tutor show ingredient accuracy and final-weight deviation as separate derived figures (not one combined score).

## 5. Retrieval (product rules)

- **Student challenge / Progress:** `kitchenGroupInputSelf` — self-scoped; do not require `activity.actor.id === me.id`. Progress does not wait for tutor review.
- **Trainer feedback:** `kitchenSkillsTrainerInput` — do not reuse `kitchenGroupInput`.
- After a silent post, local session state is enough for the next step; later self activities merge and dedupe with local records.
