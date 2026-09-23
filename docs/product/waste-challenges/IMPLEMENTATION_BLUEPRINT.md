# Kitchen Day — implementation blueprint

> **APPROVED PRODUCT TARGET**. No application code in this freeze.
>
> Slug authority: [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md).

## 1. Target model

| Module | Activity | Cardinality |
|--------|----------|-------------|
| Trim Smart | `trimSmart` | 1..n **different** ingredients per session |
| Rescue & Reuse | `rescueAndReuse` | 0..1 per `sessionId` + `ingredientId` |
| Portion Precision | `portionPrecision` | 0..n recipes |
| Chef review | `wastePracticeReview` | 0..1 per session |
| Dashboards | — | read-only |

## 2. CURRENT IMPLEMENTATION vs target

`src/trimSmart/` on `main` is Ingredient → Practice → Measure (`practice`, `participantWasteGrams`, old categories). Reuse, Portion, dashboards, and session review do not exist.

Reusable as-is: `sessionIdentity.ts`, `sessionLock.ts`, `ingredientId.ts`, `src/gamebus/groupActivities.ts`.

High-impact later: `mapTrimSmart.ts`, `types.ts`, `validation.ts`, `useTrimSmart.ts`, `buildSubmission.ts`, `categoryLabels.ts`, Practice → technique step, Measure → estimate/timer/actual.

## 3. Decisions

- One Kitchen Day session; UI labels are sections.
- Same `ingredientId` once per student session.
- Reuse joins `sessionId` + `ingredientId`. No `sourceActivityId`.
- Reuse stores only reusable amount + free-text destination.
- Analytics calculated on read.
- One Portion activity per recipe; actuals in `recipeComposition`.
- One chef review per session; modules are evidence.
- Retrieve via existing `groupActivities.ts`.
- Property names only from the slug contract.

## 4. Implementation order

**Phase 0** — GameBus admin alignment (exact list in the slug contract).

**Phase 1** — Kitchen Day shared session / shell.

**Phase 2** — Trim Smart target migration (keep v1 readable).

**Phase 3** — Rescue & Reuse.

**Phase 4** — Portion Precision (stub recipe JSON + `recipeComposition`).

**Phase 5** — Student/chef dashboards + session-level chef review.

**Phase 6** — Tests / build / deploy verification.

## 5. What blocks posting (not retrieval)

| Admin | Blocks |
|-------|--------|
| Trim schema/link fixes | Target Trim posts |
| Rescue `reuseDestination` + unlink extras | Rescue posts |
| `recipeComposition` + unlink Portion per-line props | Portion posts |
| Session-level review property set | Review posts |

Retrieval is not blocked.

## 6. Risks

Invented slugs; posted category labels; per-line Portion activities; `sourceActivityId`; per-ingredient chef scores; storing calculated analytics; new retrieval API.
