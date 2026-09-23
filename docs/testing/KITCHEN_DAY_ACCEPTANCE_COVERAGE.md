# Kitchen Day acceptance coverage

Approved Gherkin: `features/waste-challenges/*.feature`  
Implementation: `feature/kitchen-day-v1` (`#/kitchen-day`, `#/kitchen-day-progress`, `#/kitchen-day-tutor`)

**LIVE E2E BLOCKED BY GAMEBUS ADMIN ALIGNMENT.** Repository tests cover domain, UI, and mapper contracts only. There is no browser/live GameBus E2E suite.

| Area | Covered in repo | Notes |
|------|-----------------|-------|
| Participant-specific session identity | `src/kitchenDay/session/*.test.ts`, `KitchenDaySessionContext.test.tsx` | `kitchen-day:<taskId>:<actorId>:<sessionDate>`; two students on the same TASK/date differ |
| TASK wait / session locked once | `KitchenDaySessionContext.test.tsx`, `kitchenDayTask.test.ts` | Embedded wait for TASK + `inputCollectionPari.me`; later refresh cannot replace the lock |
| Europe/Helsinki session date lock | `src/kitchenDay/session/*.test.ts`, `KitchenDaySessionContext.test.tsx` | Locked across midnight for the page session |
| Reload hydration / actor isolation | `read/kitchenDayReadModel.test.ts`, `KitchenDaySessionContext.test.tsx` | Fail closed on missing/mismatched actor; other students excluded |
| Duplicate ingredient prevention | `session/ingredientUniqueness.test.ts`, `kitchenDay.flow.test.tsx` | Same `ingredientId` once; different ingredients allowed |
| All six categories | `trim/validation.test.ts` | Labels map to `root` / `leafy` / `fruit` / `stem` / `herbs` / `other` |
| All ten trim techniques | `trim/techniques.ts`, `trim/techniqueSelection.test.tsx` | Locked enum; compact one-tap buttons, no dropdown |
| Compact technique selection | `trim/techniqueSelection.test.tsx` | Technique-specific grid modifier; category grid unchanged |
| Timer | `trim/timer.test.ts`, flow | Start/finish records duration; student does not type minutes |
| Trim validation | `trim/validation.test.ts`, flow | Weight, estimate, actual bounds |
| Kitchen reference comparison | `trim/derived.test.ts`, `trim/reference.test.ts` | Seeded then historical; not stored; no percentile copy |
| Rescue validation / join | `rescue/validation.test.ts`, flow | `sessionId` + `ingredientId`; discarded calculated |
| Recipe reference extract | `scripts/kitchen-day/extractRecipes.test.ts`, `portion/recipes.test.ts` | Clean workbook → generated JSON; invalid rows excluded; no browser XLSX |
| Ingredient deviation | `portion/metrics.test.ts`, `portion/copy.test.ts`, `portion/deviations.test.ts` | Exact / over / under; percent copy + gram difference |
| Weighted ingredient accuracy | `portion/metrics.test.ts` | Tiny ingredients do not dominate |
| Final-weight deviation | `portion/metrics.test.ts`, `portion/copy.test.ts` | From `Kypsä_kokonaispaino` / `expectedFinalWeightGrams`, not ingredient sum |
| Session Review | `sessionReview.test.tsx`, `kitchenDay.flow.test.tsx` | Current session only; labelled rows; `sessionId` hidden |
| Student Progress | `progress/progressModel.test.ts`, `kitchenDay.pages.test.tsx` | Own history; derived accuracy / final-weight trends |
| Tutor evidence | `kitchenDay.dashboard.test.tsx`, `kitchenDay.pages.test.tsx` | Read-only measurements; actor isolation |
| Tutor assessment | `kitchenDay.review.test.tsx`, `review/scores.test.ts` | Scores 0–5; 0 ≠ unanswered; one `wastePracticeReview` per session; not pre-filled |
| Exact GameBus mapper contracts | `src/gamebus/mapKitchenDayTrimSmart.test.ts`, `mapRescueAndReuse.test.ts`, `mapPortionPrecision.test.ts`, `mapWastePracticeReview.test.ts` | No derived metrics posted |
| Live-integration guard | `src/kitchenDay/liveIntegration.test.ts` | `KITCHEN_DAY_LIVE_INTEGRATION_READY=false` |
| Percentile / ranking | `@pending` | Sufficient-data rule not agreed |

Gherkin filenames `chef-review.feature` / `CHEF_REVIEW.md` are historical. Product wording is Tutor / Tutor assessment. The activity slug remains `wastePracticeReview`.
