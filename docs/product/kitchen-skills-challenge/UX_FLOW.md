# Kitchen Day — UX flow

> **APPROVED PRODUCT TARGET**. Trim Smart v1 remains a standalone CURRENT IMPLEMENTATION at `#/waste/trim-smart`.
>
> Visual language: [`../UI_STANDARD.md`](../UI_STANDARD.md). GameBus menu URLs: [`../../contracts/KITCHEN_SKILLS_CHALLENGE_ROUTES.md`](../../contracts/KITCHEN_SKILLS_CHALLENGE_ROUTES.md). Student GameBus protocol: [`../../contracts/GAMEBUS.md`](../../contracts/GAMEBUS.md).

**Slug authority:** [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md).

## 1. Context

Working kitchen: wet hands, scale nearby, time pressure. Minimal typing, large tap targets, units always visible, impossible values blocked at the input. No internal IDs or debug copy.

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

## 3. Continuous student challenge (same iframe)

The student Kitchen Day TASK stays open until **Finish challenge**.

1. **Trim Smart** — save posts `SILENT_ACTIVITY` (`trimSmart`), keeps the entry in local session state, navigates to `#/kitchen-day/reuse`.
2. **Reuse** — save posts `SILENT_ACTIVITY` (`rescueAndReuse`), retains local state, navigates to `#/kitchen-day/portion`.
3. **Portion Precision** — save posts `SILENT_ACTIVITY` (`portionPrecision`), retains local state, opens the **Challenge complete** summary. Does **not** send `EXIT`.
4. Summary shows compact Trim / Reuse / Portion headlines. Detail sections are collapsed. Portion’s ingredient table is behind **View recipe details**.
5. **Finish challenge** (always visible at the bottom) posts `{ type: 'EXIT' }` via `postKitchenSkillsChallengeExit`. That is the only EXIT in this flow.

Do not send EXIT after Trim, Reuse, or immediately after Portion. Tutor review posting is unchanged (`ACTIVITY`).

## 4. Trim Smart

Ingredient → Starting weight → Technique (ten fixed one-tap choices; compact grid on small screens) → Estimate → Timed prepare → Actual waste → **Save ingredient** (then Reuse, above). There is no category step.

Gram fields accept digits and one decimal only (no letters, no negatives).

Timer: instruction + Start; “Preparation in progress” + elapsed time + Finish; formatted duration + Continue. Never show `idle` / `running` / `finished`.

## 5. Reuse

Ingredient, actual waste, reusable amount, destination, discarded remainder. Saved record is a success/read-only state, then Portion.

## 6. Portion Precision

Searchable recipe combobox (type to filter anywhere in the name; exact list selection required; keyboard arrows/Enter). Not a native `<select>` of the full Finnish recipe list.

Each line: name, Target, Actual + unit in the control (same gram sanitizer), human result (Exact / *n.n*% over / *n.n*% under, plus gram difference) → expected final weight from the recipe reference → recorded final recipe weight → **Save recipe** → summary (section 3).

Review, Progress, and Tutor show ingredient accuracy and final-weight deviation as separate derived figures. They do not combine into one score and do not set tutor scores.

## 7. Retrieval

- **Student challenge hydration:** `kitchenGroupInputSelf.activities` (`GET /api/me/activities`). Self-scoped; do not filter on `activity.actor.id === inputCollectionPari.me.id`.
- **Trainer / group / progress history that needs the kitchen group:** `kitchenGroupInput.activities` (`GET /groups/activities`). Do not globally repurpose that collection.
- After a silent post, local session state is enough for the next step. When self activities later arrive, local and persisted records are merged and deduplicated.
