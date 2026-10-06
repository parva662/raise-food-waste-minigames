# Waste challenges / Kitchen Skills Challenge (practical kitchen)

**Documentation role:** Explanation — family overview / navigation hub.
**APPROVED PRODUCT TARGET** for product logic. Property names: slug contract. **Implemented on `main`** at `#/kitchen-day*` (legacy-stable hashes). Legacy Trim Smart v1 remains at `#/waste/trim-smart`.

Canonical orchestration: [`kitchen-skills-challenge/KITCHEN_SKILLS_CHALLENGE.md`](kitchen-skills-challenge/KITCHEN_SKILLS_CHALLENGE.md).
Property slugs: [`kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md`](kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md).
Routes: [`../contracts/KITCHEN_SKILLS_CHALLENGE_ROUTES.md`](../contracts/KITCHEN_SKILLS_CHALLENGE_ROUTES.md).

---

## Family

| Module | On `main` | Where to read |
|--------|-----------|---------------|
| Kitchen Skills Challenge | Connected student workflow at `#/kitchen-day*` | [`kitchen-skills-challenge/KITCHEN_SKILLS_CHALLENGE.md`](kitchen-skills-challenge/KITCHEN_SKILLS_CHALLENGE.md) |
| Trim Smart (current) | `#/kitchen-day/trim` | [`kitchen-skills-challenge/TRIM_SMART.md`](kitchen-skills-challenge/TRIM_SMART.md) |
| Rescue & Reuse | `#/kitchen-day/reuse` | [`kitchen-skills-challenge/RESCUE_AND_REUSE.md`](kitchen-skills-challenge/RESCUE_AND_REUSE.md) |
| Portion Precision | `#/kitchen-day` (`#/kitchen-day/portion`) | [`kitchen-skills-challenge/PORTION_PRECISION.md`](kitchen-skills-challenge/PORTION_PRECISION.md) |
| Session Review / Progress / trainer assessment | `#/kitchen-day/review`, `#/kitchen-day-progress`, `#/kitchen-day-tutor` | [`kitchen-skills-challenge/CHEF_REVIEW.md`](kitchen-skills-challenge/CHEF_REVIEW.md) |
| Legacy Trim Smart v1 | `#/waste/trim-smart` (deprecated) | `src/legacy/trim-smart-v1/` |

Acceptance: [`../../features/kitchen-skills-challenge/`](../../features/kitchen-skills-challenge/).

---

## Design boundaries

| Concern | Owner |
|---------|--------|
| Estimate / actual waste / system vs kitchen reference | Trim Smart |
| Reuse suggestion (`sessionId` + `ingredientId`) | Rescue & Reuse |
| `recipeComposition` + final recipe weight + derived accuracy | Portion Precision |
| Session Review, Student Progress, per-module trainer assessment | [`CHEF_REVIEW.md`](kitchen-skills-challenge/CHEF_REVIEW.md) |

**@pending:** percentile / ranking sufficient-data rule.

Do-not-use names: see the slug contract.
