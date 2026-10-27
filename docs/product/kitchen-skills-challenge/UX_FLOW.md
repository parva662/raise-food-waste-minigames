# Kitchen Skills Challenge — UX flow

> **Documentation role:** Explanation — student / tutor interaction flow.
> **APPROVED PRODUCT TARGET**. Trim Smart v1 remains a standalone CURRENT IMPLEMENTATION at `#/waste/trim-smart`.
>
> Visual language: [`../UI_STANDARD.md`](../UI_STANDARD.md). Routes: [`../../contracts/KITCHEN_SKILLS_CHALLENGE_ROUTES.md`](../../contracts/KITCHEN_SKILLS_CHALLENGE_ROUTES.md). Protocol: [`../../contracts/GAMEBUS.md`](../../contracts/GAMEBUS.md). Slugs: [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md).

## 1. Context

Working kitchen: wet hands, scale nearby, time pressure. Compact data-entry, units always visible, impossible values blocked at the input. Touch targets stay usable without turning each field into a large empty block. No internal IDs or debug copy.

Layout checks: ~320 / ~390 / ~768 / ~1200. Practice references for forms and accessibility are GOV.UK Design System and WCAG 2.2 — not a brand restyle.

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
- Progress: own history, Overview / Progress tabs, weighted Trim vs kitchen reference (results only). The Overview Trim card always shows Actual trim, Kitchen reference (or Reference unavailable), and Difference when the join succeeds. Peer cards stay “Not enough peer data yet” until a privacy-safe aggregate exists. No leaderboard or percentile copy.
- Tutor: staff list → sessions (To assess / Awaiting confirmation / Reviewed) → workspace with module tabs Portion → Trim → Rescue; evidence per module beside qualitative scores (0–5) for that module. System metrics support judgement; they do not set the scores.

## 3. Continuous student challenge (same iframe)

The student Kitchen Skills TASK stays open until **Finish challenge**. One attempt holds **exactly one** Portion recipe.

```text
OPEN CHALLENGE
       |
       v
PORTION PRECISION  (mandatory — select ONE recipe, measure, Save)
       |
       v
OPTIONAL TRIM SMART  (zero or more ingredients of that recipe)
       |
       v
RESCUE & REUSE  (required for each positive-waste Trim ingredient; 0 g reusable is valid)
       |
       v
CHALLENGE SUMMARY  (evidenced modules only, order Portion → Trim → Rescue)
       |
       v
FINISH CHALLENGE  → EXIT  → new open = new attempt
```

1. **Portion Precision** — searchable recipe combobox (ordered options on open; typing filters; touch scroll must not select — tap selects). Mass fields use a compact **g / kg** selector next to the input; the initial unit follows the recipe target scale (above 1000 g → kg, otherwise g). Canonical storage remains grams; 1 kg = 1000 g; switching units converts the displayed number so the quantity is unchanged. Volume units stay as recorded (dL / L). Every ingredient actual + final recipe weight → **Save recipe**. Posts `SILENT_ACTIVITY` (`portionPrecision`), navigates to Trim when the recipe has eligible ingredients. The saved recipe is the attempt’s only recipe. There is no “Start another recipe” and no second Portion save in this attempt. Does **not** send `EXIT`. Forward tabs stay locked until the first save.
2. **Trim Smart** — optional until saved. The selected recipe stays visible. Remaining unused ingredients of **that** recipe with `referenceWastePercent > 0` appear when the combobox opens. Starting weight prefills from the Portion actual mass for that ingredient when available (editable; volume units require manual entry). Estimated waste and actual waste use the same g/kg selector (default g); calculations stay in grams (`0 ≤ estimate/actual ≤ starting weight`). Steps: ingredient → (starting weight only when Portion mass is unavailable) → technique (with editable prefilled starting weight when skipped) → estimate → timed prepare → actual waste → **Save ingredient**. After save: compact recorded list (ingredient · actual waste · preparation duration) plus **Another ingredient** and **Record reuse** when there is reusable waste. A recipe with no eligible Trim ingredients is not a dead end — Finish stays available and no empty Trim activity is created. Does **not** send `EXIT`.
3. **Rescue & Reuse** — required for every saved Trim ingredient with actual waste above 0 g. Compact reusable mass (default g; kg selectable) + **Preparation method and reuse destination** (`reuseDestination`; one free-text field; example: “Wash the peel, dry it, then use it in cake.”). `0 g` reusable with an explanation is a valid decision. Discarded remainder is calculated with clear spacing from the input. Saving Rescue A must leave Rescue B selectable and must not force Finish. New saves post `recipeId`. The student can return to Trim to add another ingredient. Does **not** send `EXIT`.
4. **Challenge complete** summary: recipe name; modules with recorded evidence only, in order Portion → Trim → Rescue. Trim lines show waste and duration (e.g. `Banaani` / `260 g waste · 1 min 24 sec`). Short destinations read `400 g to cake`; longer preparation text is not parsed for a destination — quantity + preview, full text in details. Do **not** show a student-facing GameBus sync warning merely because locally dispatched activities are not yet in the `INPUT_COLLECTIONS` snapshot — that lag is normal after `SILENT_ACTIVITY`. Verified save/archive failures still surface as errors. Developer diagnostics for local dispatches stay under **Show details**. Primary action **Finish challenge**. Secondary **Keep working**. No “Start another recipe”.
5. **Finish challenge** archives dispatched local evidence, clears the active attempt, then posts `{ type: 'EXIT' }` via `postKitchenSkillsChallengeExit`. That is the only EXIT, and it is sent only after that local archive/clear succeeds. If archive storage fails, Finish stays on the summary with an error, EXIT is not sent, and reload resumes the same attempt. Unsaved Trim/Rescue drafts confirm before they are abandoned. After a successful Finish, reopening the task is a **new** attempt with a new `sessionId`.

Do not send EXIT after Portion, Trim, Reuse, Keep working, or Another ingredient. Tutor review posts one `SILENT_ACTIVITY` per evidenced module (`recipeId` + `reviewedGame`) with RAISE `actors` and keeps the tutor iframe open. Protocol details: [`../../contracts/GAMEBUS.md`](../../contracts/GAMEBUS.md) and TASK contract.

## 4. Module journeys (UI)

**Trim Smart:** Choose a remaining recipe ingredient (searchable list shown on open) → starting weight prefilled from Portion actual mass when available (otherwise enter g/kg) → technique (ten fixed one-tap choices; prefilled weight stays editable here) → estimate (g/kg) → timed prepare → actual waste (g/kg) → **Save ingredient** → compact result (waste + duration) and **Another ingredient** or **Record reuse**. Back is available before save. No category step. No waste % or kitchen reference on the student result. Timer copy never shows `idle` / `running` / `finished`.

**Reuse:** Compact reusable mass (g default; kg selectable) + preparation method and reuse destination; discarded remainder calculated with spacing from the control. Saving one ingredient leaves any remaining ingredients available. Finish stays blocked until every positive-waste Trim has a decision.

**Portion Precision:** Searchable recipe combobox → Ingredient | Target | Actual | Result table with g/kg on mass actuals and final weight → **Save recipe** → Trim Smart (or Finish if the recipe has no eligible Trim ingredients). Review / Progress / Tutor show ingredient accuracy and final-weight deviation as separate derived figures (not one combined score). Summaries format masses above 1000 g as kg (1000 g stays grams; 1001 g → 1.001 kg).

## 5. Retrieval (product rules)

- **Student challenge / Progress:** `kitchenGroupInputSelf`. Progress requires `activity.actor.id ===` authenticated `me.id` (fail closed if identity is missing or actor is foreign/absent). Progress does not wait for tutor review.
- **Student Progress peers:** blocked until a privacy-safe anonymous aggregate exists. Do not attach trainer-style `GET /api/groups/activities`. Until then: “Not enough peer data yet”.
- **Trainer feedback:** `kitchenSkillsTrainerInput` — do not reuse `kitchenGroupInput`.
- After a silent post, local session state is enough for the next step; later self activities merge and dedupe with local records.
