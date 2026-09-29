# Kitchen Skills Challenge — implementation blueprint

> Implemented on `main` at `#/kitchen-day*`. Legacy Trim Smart v1 remains at `#/waste/trim-smart`.
>
> Slug authority: [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md).

## 1. Target model

| Module | Activity | Cardinality |
|--------|----------|-------------|
| Trim Smart | `trimSmart` | 1..n **different** ingredients per session |
| Rescue & Reuse | `rescueAndReuse` | 0..1 per `sessionId` + `ingredientId` |
| Portion Precision | `portionPrecision` | 0..n recipes/components |
| Tutor assessment | `wastePracticeReview` | 0..1 per session |
| Session Review / Student Progress / Tutor dashboard | — | read-only |

## 2. CURRENT IMPLEMENTATION vs target

Kitchen Skills Challenge is on `main` under `src/products/kitchen-skills-challenge/` at `#/kitchen-day`, `#/kitchen-day-progress`, and `#/kitchen-day-tutor`.

Legacy Trim Smart v1 remains under `src/legacy/trim-smart-v1/` at `#/waste/trim-smart` (`practice`, `participantWasteGrams`, old categories). Do not use it for new Kitchen Skills Challenge work.

Reusable platform read: `src/platform/gamebus/groupActivities.ts`. Session identity helpers live in the Kitchen Skills Challenge product.

## 3. Decisions

- One Kitchen Day session; student activity nav is Trim / Reuse / Portion only.
- Same `ingredientId` once per student session.
- Reuse joins `sessionId` + `ingredientId`. No `sourceActivityId`.
- Reuse stores only reusable amount + free-text destination.
- Analytics calculated on read.
- One Portion activity per recipe; actuals in `recipeComposition`.
- Recipe targets come from the generated extract of the clean professional workbook, not a hand-maintained stub.
- One tutor assessment per session; modules are evidence.
- Retrieve via existing `groupActivities.ts`.
- Property names only from the slug contract.

## 4. Implementation order

**Phase 0** — GameBus admin alignment (exact list in the slug contract). **Open** for remaining live verification.

**Phase 1** — Kitchen Skills Challenge shared session / shell. **Done on `main`.**

**Phase 2** — Trim Smart target migration (keep v1 readable). **Done on `main`.**

**Phase 3** — Rescue & Reuse. **Done on `main`.** Known Trim → Reuse reopen defect is recorded, not fixed in the architecture refactor.

**Phase 4** — Portion Precision (generated recipe reference + `recipeComposition` + derived metrics). **Done on `main`.**

**Phase 5** — Session Review, Student Progress, trainer dashboard + session-level `wastePracticeReview`. **Done on `main`.** Trainer live posting remains disabled.

**Phase 6** — Repository tests / build verification. **Done on `main`.** Live GameBus E2E remains the next debugging step.

## 5. What blocks posting (not retrieval)

| Admin | Blocks |
|-------|--------|
| Trim schema/link fixes | Target Trim posts |
| Rescue `reuseDestination` + unlink extras | Rescue posts |
| `recipeComposition` + unlink Portion per-line props | Portion posts |
| Session-level review property set | Review posts |
| Left-menu routes | Embedded student / progress / tutor pages |

Retrieval is not blocked.

## 6. Risks

Invented slugs; posting `ingredientCategory` on Kitchen Skills Trim; per-line Portion activities; `sourceActivityId`; per-ingredient tutor scores; storing calculated analytics; new retrieval API; inventing tutor-on-behalf-of-student behaviour.
