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
| Student Kitchen Day | `#/kitchen-day` (modules: `#/kitchen-day/reuse`, `#/kitchen-day/portion`, `#/kitchen-day/review`) | Student | `SILENT_ACTIVITY` for `trimSmart`, `rescueAndReuse`, `portionPrecision`; `{ type: 'EXIT' }` on Finish challenge | Those three templates on one TASK | `inputCollectionPari.me`; `kitchenGroupInputSelf.activities` (`GET /api/me/activities`) |
| Student Kitchen Day Progress | `#/kitchen-day-progress` | Student | none | none | `inputCollectionPari.me`; `kitchenGroupInputSelf.activities` (`GET /api/me/activities`) |
| Tutor Kitchen Day Dashboard | `#/kitchen-day-tutor` (staff list → sessions → modules; selected: `?actorId=` + `?sessionId=`) | Tutor | `SILENT_ACTIVITY` `wastePracticeReview` with `actors: [selectedStudentActorId]` and required `reviewedGame`; `{ type: 'EXIT' }` on Close (no review post) | `wastePracticeReview` on the tutor TASK | `kitchenSkillsTrainerInput.activities` (`GET /api/groups/activities` filtered to Kitchen Skills templates) grouped by actor |

Notes:

- Embedded student activity locks `sessionId` after TASK + authenticated user. Student work stays in one iframe: silent posts, then EXIT only from Finish challenge.
- Progress and tutor pages do not appear on the student Kitchen Day module nav.
- Production GitHub Pages URLs:
  - `https://parva662.github.io/raise-food-waste-minigames/#/kitchen-day`
  - `https://parva662.github.io/raise-food-waste-minigames/#/kitchen-day-progress`
  - `https://parva662.github.io/raise-food-waste-minigames/#/kitchen-day-tutor`
- Tutor UX is staff → sessions → module tabs. Each completed module gets its own `wastePracticeReview` (`reviewedGame`) with an independent form state (no cross-tab draft leakage). Score inputs are 0–5 only. No `studentId` property. The tutor iframe stays open after submit. **Close** posts `EXIT` (confirm if draft dirty). Trainer listing does not use a group-members collection in this phase.
- `#/waste/trim-smart` remains Trim Smart v1 and is unchanged.
