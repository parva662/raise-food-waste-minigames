# Kitchen Skills Challenge — GameBus left-menu route contract

**Product name:** Kitchen Skills Challenge.
**Public hashes:** `#/kitchen-day*` (legacy-stable). Do not rename the hashes.
**Status:** Implemented on `main`. Ready for production GitHub Pages Custom Embed URLs.
**Active GameBus environment:** `https://foodtracker.gamebus.eu`
**Student posting:** Enabled for Trim / Rescue / Portion after manual schema verification.
**Tutor posting:** Enabled. `wastePracticeReview` is `SILENT_ACTIVITY` with `actors: [selectedStudentActorId]`.

Each row is a separate GameBus left-menu Custom Embed (or equivalent). Do not combine them into one student activity navigation.

| Page | Stable URL | Role | Posts | Required TASK templates | Required inputs |
|------|------------|------|-------|-------------------------|-----------------|
| Student Kitchen Day | `#/kitchen-day` (modules: `#/kitchen-day/trim`, `#/kitchen-day/reuse`, `#/kitchen-day/portion`, `#/kitchen-day/review`) | Student | `SILENT_ACTIVITY` for `trimSmart`, `rescueAndReuse`, `portionPrecision`; `{ type: 'EXIT' }` on Finish challenge | Those three templates on one TASK | `inputCollectionPari.me`; `kitchenGroupInputSelf.activities` (`GET /api/me/activities`) |
| Student Kitchen Day Progress | `#/kitchen-day-progress` (Overview / Progress; Progress Recent + History per module; Trim vs kitchen reference; peer cards gated) | Student | none | none | `inputCollectionPari.me`; `kitchenGroupInputSelf.activities` (`GET /api/me/activities`) only. Do **not** attach `GET /api/groups/activities` Kitchen Skills templates. |
| Tutor Kitchen Day Dashboard | `#/kitchen-day-tutor` (staff list → sessions → modules; selected: `?actorId=` + `?sessionId=`) | Tutor | `SILENT_ACTIVITY` `wastePracticeReview` with `actors: [selectedStudentActorId]` and required `reviewedGame`; `{ type: 'EXIT' }` on Close (no review post) | `wastePracticeReview` on the tutor TASK | `kitchenSkillsTrainerInput.activities` (`GET /api/groups/activities` filtered to Kitchen Skills templates) grouped by actor |
| Tutor Combined Assessment | `#/kitchen-day-tutor-combined` (same staff/session selection; selected: `?actorId=` + `?sessionId=`) | Tutor | One `SILENT_ACTIVITY` `wastePracticeReview` per recipe with module-specific score properties (`portion*` / `trim*` / `rescue*`); `{ type: 'EXIT' }` on Close | `wastePracticeReview` on the tutor TASK with combined property links | Same trainer feed; combined rows expand to per-module read models |

Notes:

- Embedded student activity locks `sessionId` (including attempt id) after TASK + authenticated user. Later TASK / INPUT_COLLECTIONS replay cannot mint a new attempt. Student work stays in one iframe: silent posts, then EXIT only from Finish challenge. Reopening after Finish is a new attempt.
- Progress and tutor pages do not appear on the student Kitchen Day module nav.
- Production GitHub Pages URLs:
  - `https://parva662.github.io/raise-food-waste-minigames/#/kitchen-day`
  - `https://parva662.github.io/raise-food-waste-minigames/#/kitchen-day-progress`
  - `https://parva662.github.io/raise-food-waste-minigames/#/kitchen-day-tutor`
  - `https://parva662.github.io/raise-food-waste-minigames/#/kitchen-day-tutor-combined`
- Legacy tutor UX (`#/kitchen-day-tutor`) is staff → **To assess** / **Awaiting confirmation** / **Reviewed** session tabs → session workspace (recipe chips only for multi-recipe sessions, module tabs Portion → Trim → Rescue, two-column evidence/assessment layout that stacks in narrow iframes). Combined tutor UX (`#/kitchen-day-tutor-combined`) uses **To assess** / **Submitted** tabs (Submitted = awaiting + reviewed) without list counters, then the compact combined workspace; after successful dispatch a completion dialog offers **Assess another assignment** or **Close** (`EXIT`). Status persistence remains three-state per evidenced recipe–module pair; modules without evidence create no requirement. See [CHEF_REVIEW.md](../product/kitchen-skills-challenge/CHEF_REVIEW.md) §3 / §3b. Legacy each evidenced recipe–module pair gets its own `wastePracticeReview` (`recipeId` + `reviewedGame`) with independent draft state; combined posts one activity per recipe with module-specific score properties. Score selectors are 0–5 only (unselected ≠ 0). No `studentId` property. Sticky **Back** / **Close**; Close posts `EXIT` (confirm if draft dirty). Trainer listing does not use a group-members collection in this phase.
- `#/waste/trim-smart` remains Trim Smart v1 and is unchanged.
