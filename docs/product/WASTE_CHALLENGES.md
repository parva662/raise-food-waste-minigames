# Waste challenges / Kitchen Day (practical kitchen)

**APPROVED PRODUCT TARGET** for product logic and property names. Not implemented as Kitchen Day on `main`.

**CURRENT IMPLEMENTATION:** Trim Smart v1 only (Ingredient → Practice → Measure).

Canonical orchestration: [`waste-challenges/KITCHEN_DAY.md`](waste-challenges/KITCHEN_DAY.md).
Property slugs: [`waste-challenges/GAMEBUS_SLUG_CONTRACT.md`](waste-challenges/GAMEBUS_SLUG_CONTRACT.md).

---

## Family

| Module | Status | Where to read |
|--------|--------|---------------|
| Kitchen Day | **APPROVED PRODUCT TARGET** | [`waste-challenges/KITCHEN_DAY.md`](waste-challenges/KITCHEN_DAY.md) |
| Trim Smart | **CURRENT IMPLEMENTATION** v1; target approved | [`waste-challenges/TRIM_SMART.md`](waste-challenges/TRIM_SMART.md) |
| Rescue & Reuse | Not implemented | [`waste-challenges/RESCUE_AND_REUSE.md`](waste-challenges/RESCUE_AND_REUSE.md) |
| Portion Precision | Not implemented | [`waste-challenges/PORTION_PRECISION.md`](waste-challenges/PORTION_PRECISION.md) |
| Dashboards + chef review | Not implemented | [`waste-challenges/CHEF_REVIEW.md`](waste-challenges/CHEF_REVIEW.md) |

Acceptance: [`../../features/waste-challenges/`](../../features/waste-challenges/).

---

## Design boundaries

| Concern | Owner |
|---------|--------|
| Estimate / actual waste / system vs reference | Trim Smart |
| Reuse suggestion (`sessionId` + `ingredientId`) | Rescue & Reuse |
| `recipeComposition` + final recipe weight | Portion Precision |
| Read-only overviews + one session chef review | Dashboards / chef review |

**@pending:** percentile / ranking sufficient-data rule.

Do-not-use names: see the slug contract.
