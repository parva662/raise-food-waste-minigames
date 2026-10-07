# Kitchen Skills Challenge — implementation guidance

**Documentation role:** Explanation — architectural constraints and remaining GameBus-admin work.
**Not** living implementation status. For what ships on `main`, see [`../../current-state/IMPLEMENTATION_STATUS.md`](../../current-state/IMPLEMENTATION_STATUS.md).

> Public hashes remain `#/kitchen-day*`. Legacy Trim Smart v1 remains at `#/waste/trim-smart`.
> Slug authority: [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md).
> Routes / TASK: [`../../contracts/KITCHEN_SKILLS_CHALLENGE_ROUTES.md`](../../contracts/KITCHEN_SKILLS_CHALLENGE_ROUTES.md), [`../../contracts/KITCHEN_SKILLS_CHALLENGE_TASK.md`](../../contracts/KITCHEN_SKILLS_CHALLENGE_TASK.md).

## 1. Target model (product constraints)

| Module | Activity | Cardinality |
|--------|----------|-------------|
| Trim Smart | `trimSmart` | 1..n **different** recipe ingredients per session |
| Rescue & Reuse | `rescueAndReuse` | 0..1 per `sessionId` + `ingredientId` |
| Portion Precision | `portionPrecision` | 0..n recipes/components |
| Tutor assessment | `wastePracticeReview` | 0..1 per `sessionId` + `reviewedGame` (module) |
| Session Review / Student Progress / Tutor dashboard | — | read-only |

## 2. Architecture constraints (keep)

- One student session per locked Helsinki `sessionDate`; student activity nav is Portion / Trim / Reuse only.
- Same `ingredientId` once per student session. Trim ingredients come from the saved Portion recipe. Reuse joins `sessionId` + `ingredientId` (no `sourceActivityId`).
- Reuse stores only reusable amount + free-text destination.
- Analytics calculated on read — never stored as activity properties.
- One Portion activity per recipe; actuals in `recipeComposition`. Recipe targets come from the generated workbook extract, not a hand-maintained stub.
- One tutor assessment per **completed module** (`reviewedGame`), not one score for the whole session.
- Student challenge / Session Review / Progress: `kitchenGroupInputSelf.activities`. Trainer feedback: `kitchenSkillsTrainerInput.activities`. Do not attach raw group Kitchen Skills activities to student Progress; peer comparison waits for a privacy-safe aggregate. Keep `kitchenGroupInput` for forecast/closeout only.
- Property names only from the slug contract.
- Platform reads: `src/platform/gamebus/groupActivities.ts`. Session identity helpers live in `src/products/kitchen-skills-challenge/`.

## 3. Remaining open work (not duplicated status)

**GameBus admin / live verification (Phase 0 follow-ups):** confirm live templates still match the slug contract (Trim technique slug, Rescue `reuseDestination`, Portion `recipeComposition`, review `reviewedGame`). Exact property lists: [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md). Admin checklist style for forecast exists separately; Kitchen Skills admin changes stay manual on foodtracker.

**Live E2E:** repository Vitest covers silent flow, finish summary, and EXIT. End-to-end foodtracker posting / mission complete remains a manual check — see [`../../current-state/IMPLEMENTATION_STATUS.md`](../../current-state/IMPLEMENTATION_STATUS.md).

Completed product slices (shell, Trim, Reuse, Portion, Review/Progress/trainer, repo tests) are recorded only in current-state — do not re-list “done on main” phases here.

## 4. What still blocks posting (admin / config, not retrieval)

| Admin gap | Blocks |
|-----------|--------|
| Trim schema/link fixes | Target Trim posts |
| Rescue `reuseDestination` + unlink extras | Rescue posts |
| `recipeComposition` + unlink Portion per-line props | Portion posts |
| Module review property set (`reviewedGame` required) | Review posts |
| Left-menu routes | Embedded student / progress / tutor pages |

Retrieval of activities that already exist is **not** blocked by those admin gaps.

## 5. Risks

Invented slugs; posting `ingredientCategory` on Kitchen Skills Trim; per-line Portion activities; `sourceActivityId`; per-ingredient tutor scores; storing calculated analytics; inventing a Kitchen Skills retrieval REST API; inventing a GameBus anonymous-aggregate endpoint; inventing tutor-on-behalf fields beyond RAISE `actors` on `wastePracticeReview`.
