# Kitchen Day — implementation blueprint

> **APPROVED PRODUCT TARGET**. Application code for Phases 1–6 (except live Phase 0) lives on `feature/kitchen-day-v1` (`#/kitchen-day`). Not merged to `main`. Live posting remains blocked until Phase 0.
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

`src/trimSmart/` on `main` is Ingredient → Practice → Measure (`practice`, `participantWasteGrams`, old categories). Reuse, Portion, Session Review, Progress, and tutor assessment do not exist on `main`.

On `feature/kitchen-day-v1`, the connected target lives under `src/kitchenDay/` at `#/kitchen-day`, `#/kitchen-day-progress`, and `#/kitchen-day-tutor`.

Reusable as-is: `sessionIdentity.ts`, `sessionLock.ts`, `ingredientId.ts`, `src/gamebus/groupActivities.ts`.

v1 Trim Smart remains readable at `#/waste/trim-smart`.

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

**Phase 0** — GameBus admin alignment (exact list in the slug contract). **Open.**

**Phase 1** — Kitchen Day shared session / shell. **Done on `feature/kitchen-day-v1`.**

**Phase 2** — Trim Smart target migration (keep v1 readable). **Done on `feature/kitchen-day-v1`.**

**Phase 3** — Rescue & Reuse. **Done on `feature/kitchen-day-v1`.**

**Phase 4** — Portion Precision (generated recipe reference + `recipeComposition` + derived metrics). **Done on `feature/kitchen-day-v1`.**

**Phase 5** — Session Review, Student Progress, Tutor dashboard + session-level `wastePracticeReview`. **Done on `feature/kitchen-day-v1`.**

**Phase 6** — Repository tests / build verification. **Done on `feature/kitchen-day-v1`.** Live E2E remains blocked.

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

Invented slugs; posted category labels; per-line Portion activities; `sourceActivityId`; per-ingredient tutor scores; storing calculated analytics; new retrieval API; inventing tutor-on-behalf-of-student behaviour.
