# Kitchen Skills Challenge acceptance specs

All files below are **APPROVED PRODUCT TARGET**. Public hashes remain `#/kitchen-day*`. Legacy Trim Smart v1 is `#/waste/trim-smart`, not these features.

| File | Topic |
|------|--------|
| [`kitchen-skills-challenge.feature`](kitchen-skills-challenge.feature) | Connected session, uniqueness, Session Review / trainer evidence |
| [`trim-smart.feature`](trim-smart.feature) | Ingredient preparation |
| [`rescue-and-reuse.feature`](rescue-and-reuse.feature) | Reuse joined by `sessionId` + `ingredientId` |
| [`portion-precision.feature`](portion-precision.feature) | Recipe-level `recipeComposition` + derived metrics |
| [`chef-review.feature`](chef-review.feature) | Session Review, Progress, one session-level trainer assessment (`wastePracticeReview`) |

Slug contract: [`../../docs/product/kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md`](../../docs/product/kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md). GameBus protocol index: [`../../docs/contracts/GAMEBUS.md`](../../docs/contracts/GAMEBUS.md).

Intentional `@pending`: percentile / ranking sufficient-data rule (analytics).
