# Kitchen Day acceptance specs

All files below are **APPROVED PRODUCT TARGET**. They are **not** the Trim Smart v1 CURRENT IMPLEMENTATION on `main`.

| File | Topic |
|------|--------|
| [`kitchen-day.feature`](kitchen-day.feature) | Connected session, uniqueness, Session Review / Tutor evidence |
| [`trim-smart.feature`](trim-smart.feature) | Ingredient preparation |
| [`rescue-and-reuse.feature`](rescue-and-reuse.feature) | Reuse joined by `sessionId` + `ingredientId` |
| [`portion-precision.feature`](portion-precision.feature) | Recipe-level `recipeComposition` + derived metrics |
| [`chef-review.feature`](chef-review.feature) | Session Review, Progress, one session-level tutor assessment (`wastePracticeReview`) |

Slug contract: [`../../docs/product/waste-challenges/GAMEBUS_SLUG_CONTRACT.md`](../../docs/product/waste-challenges/GAMEBUS_SLUG_CONTRACT.md)

Intentional `@pending`: percentile / ranking sufficient-data rule (analytics).
