# Waste challenges / Kitchen Day (practical kitchen)

**APPROVED PRODUCT TARGET** for product logic and property names. Not implemented as Kitchen Day on `main`. Encoded on `feature/kitchen-day-v1`.

**CURRENT IMPLEMENTATION on `main`:** Trim Smart v1 only (Ingredient → Practice → Measure).

Canonical orchestration: [`waste-challenges/KITCHEN_DAY.md`](waste-challenges/KITCHEN_DAY.md).
Property slugs: [`waste-challenges/GAMEBUS_SLUG_CONTRACT.md`](waste-challenges/GAMEBUS_SLUG_CONTRACT.md).

---

## Family

| Module | On `main` | On `feature/kitchen-day-v1` | Where to read |
|--------|-----------|-----------------------------|---------------|
| Kitchen Day | Trim Smart v1 only | Connected student workflow | [`waste-challenges/KITCHEN_DAY.md`](waste-challenges/KITCHEN_DAY.md) |
| Trim Smart | v1 standalone | Target flow | [`waste-challenges/TRIM_SMART.md`](waste-challenges/TRIM_SMART.md) |
| Rescue & Reuse | none | Implemented | [`waste-challenges/RESCUE_AND_REUSE.md`](waste-challenges/RESCUE_AND_REUSE.md) |
| Portion Precision | none | Professional recipe extract + derived metrics | [`waste-challenges/PORTION_PRECISION.md`](waste-challenges/PORTION_PRECISION.md) |
| Session Review / Progress / tutor assessment | none | Implemented | [`waste-challenges/CHEF_REVIEW.md`](waste-challenges/CHEF_REVIEW.md) |

Acceptance: [`../../features/waste-challenges/`](../../features/waste-challenges/).

---

## Design boundaries

| Concern | Owner |
|---------|--------|
| Estimate / actual waste / system vs kitchen reference | Trim Smart |
| Reuse suggestion (`sessionId` + `ingredientId`) | Rescue & Reuse |
| `recipeComposition` + final recipe weight + derived accuracy | Portion Precision |
| Session Review, Student Progress, one session tutor assessment | [`CHEF_REVIEW.md`](waste-challenges/CHEF_REVIEW.md) |

**@pending:** percentile / ranking sufficient-data rule.

Do-not-use names: see the slug contract.
