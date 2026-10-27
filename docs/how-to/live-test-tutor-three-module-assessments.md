# How to: controlled live test of three Tutor module assessments

> **Diátaxis:** How-to guide — run only after the three-module Tutor restore is deployed to the GameBus embed URL.
>
> Local harness / Vitest prove that three `SILENT_ACTIVITY` messages leave React. They do **not** prove GameBus persistence.

## Goal

Confirm that one Tutor session can submit **three** independent `wastePracticeReview` activities (Portion, Trim, Rescue) and that **all three** appear in the GameBus database / Activities UI.

## Preconditions

1. Deployed SPA on the Tutor Custom Embed URL includes the three-module restore (not the single session-level assessment).
2. Live `wastePracticeReview` TASK still links `reviewedGame` and `recipeId` (required or optional — both acceptable as long as linked).
3. A student session exists with Portion + Trim + Rescue evidence for one recipe, and that session still needs assessment for all three modules.
4. Browser DevTools open on the **GameBus parent** page (not only the iframe), Network tab filtered to `activities`.

## Procedure

1. Open the Tutor embed for a student session that has all three modules evidenced.
2. In DevTools → Network, clear entries; enable “Preserve log”.
3. Optionally in the iframe console, wrap `window.parent.postMessage` to log Tutor outbound messages (or use the parent’s message listener if available).
4. Submit **Portion** assessment (scores + optional feedback). Do **not** close the task.
5. Switch to **Trim**, submit. Do **not** close the task.
6. Switch to **Rescue**, submit.
7. For each Submit, capture:
   - Outbound iframe message: `type: SILENT_ACTIVITY`, `data.template: wastePracticeReview`, `data.actors: [<studentId>]`, properties including `reviewedGame`, `recipeId`, `sessionId`, scores, feedback.
   - Parent `POST /api/me/activities` (or equivalent GameBus activity create) request body.
   - HTTP status / response body for that POST.
8. Open GameBus **Activities** (or admin activity list) for the student. Confirm **three** Waste reflection / `wastePracticeReview` rows for the same `sessionId` with:
   - `reviewedGame` = `portionPrecision`, `trimSmart`, `rescueAndReuse` (one each)
   - Matching `recipeId`, scores, and feedback
9. Reopen the Tutor task (fresh `INPUT_COLLECTIONS`). Confirm each module shows **Reviewed** / Assessment saved only when that row is in the trainer feed.

## Pass criteria

| Check | Pass |
|-------|------|
| Three `SILENT_ACTIVITY` left the iframe | Yes |
| Three distinct `reviewedGame` values | Yes |
| Three HTTP activity creates succeeded | Yes (record status codes) |
| Three persisted activities visible in GameBus | Yes |
| No fourth duplicate for the same module from one Submit | Yes |

## Fail criteria / what to record

If any Submit shows UI “submitted” but no matching GameBus activity:

- Note which `reviewedGame` is missing.
- Keep the Network HAR for that POST (or the missing POST).
- Note whether the parent received the `postMessage` but did not call the API.
- Do **not** merge further Tutor changes until the missing-submission cause is identified.

## Out of scope

- Changing GameBus admin configuration in this test.
- Student game flows.
- Claiming success from the local trainer harness alone.
