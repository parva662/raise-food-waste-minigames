# Kitchen Day acceptance specs

All files below are **APPROVED PRODUCT TARGET**. They are **not** the Trim Smart v1 CURRENT IMPLEMENTATION on `main`.

| File | Topic |
|------|--------|
| [`kitchen-day.feature`](kitchen-day.feature) | Connected session, uniqueness, read-only dashboards |
| [`trim-smart.feature`](trim-smart.feature) | Ingredient preparation |
| [`rescue-and-reuse.feature`](rescue-and-reuse.feature) | Reuse joined by `sessionId` + `ingredientId` |
| [`portion-precision.feature`](portion-precision.feature) | Recipe-level `recipeComposition` |
| [`chef-review.feature`](chef-review.feature) | Read-only overviews + one session-level chef review |

Slug contract: [`../../docs/product/waste-challenges/GAMEBUS_SLUG_CONTRACT.md`](../../docs/product/waste-challenges/GAMEBUS_SLUG_CONTRACT.md)

Intentional `@pending`: percentile / ranking sufficient-data rule (analytics).
