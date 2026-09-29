# Kitchen Skills Challenge acceptance coverage

Approved Gherkin: `features/kitchen-skills-challenge/*.feature`
Implementation: `main` (`#/kitchen-day`, `#/kitchen-day-progress`, `#/kitchen-day-tutor`). Those hashes are legacy-stable.

**LIVE E2E BLOCKED BY GAMEBUS ADMIN ALIGNMENT.** Repository tests cover domain, UI, and mapper contracts only. There is no browser/live GameBus E2E suite.

| Area | Covered in repo | Notes |
|------|-----------------|-------|
| Participant-specific session identity | `src/products/kitchen-skills-challenge/domain/session/*.test.ts`, `KitchenSkillsSessionContext.test.tsx` | `kitchen-day:<taskId>:<actorId>:<sessionDate>`; two students on the same TASK/date differ |
| TASK wait / session locked once | `KitchenSkillsSessionContext.test.tsx`, `gamebus/taskTemplates.test.ts` | Embedded wait for TASK + `inputCollectionPari.me`; later refresh cannot replace the lock |
| Europe/Helsinki session date lock | `src/products/kitchen-skills-challenge/domain/session/*.test.ts`, `KitchenSkillsSessionContext.test.tsx` | Locked across midnight for the page session |
| Reload hydration / actor isolation | `read/kitchenSkillsReadModel.test.ts`, `KitchenSkillsSessionContext.test.tsx` | Fail closed on missing/mismatched actor; other students excluded |
| Duplicate ingredient prevention | `domain/session/ingredientUniqueness.test.ts`, `kitchenSkills.flow.test.tsx` | Same `ingredientId` once; different ingredients allowed |
| No ingredient category | `trim/validation.test.ts`, `kitchenSkills.flow.test.tsx`, `read/kitchenSkillsReadModel.test.ts`, mapper/live tests | Trim has no `ingredientCategory`; flow starts at Ingredient; obsolete persisted values ignored |
| All ten trim techniques | `trim/techniques.ts`, `trim/techniqueSelection.test.tsx` | Locked enum; compact one-tap buttons, no dropdown |
| Compact technique selection | `trim/techniqueSelection.test.tsx` | Technique-specific grid; no category UI |
| Timer | `trim/timer.test.ts`, flow | Start/finish records duration; student does not type minutes |
| Trim validation | `trim/validation.test.ts`, flow | Weight, estimate, actual bounds |
| Kitchen reference comparison | `trim/derived.test.ts`, `trim/reference.test.ts` | Seeded then historical; not stored; no percentile copy |
| Rescue validation / join | `domain/reuse/validation.test.ts`, flow | `sessionId` + `ingredientId`; discarded calculated |
| Recipe reference extract | `scripts/kitchen-skills/extractRecipes.test.ts`, `portion/recipes.test.ts` | Clean workbook → generated JSON; invalid rows excluded; no browser XLSX |
| Ingredient deviation | `portion/metrics.test.ts`, `portion/copy.test.ts`, `portion/deviations.test.ts` | Exact / over / under; percent copy + gram difference |
| Weighted ingredient accuracy | `portion/metrics.test.ts` | Tiny ingredients do not dominate |
| Final-weight deviation | `portion/metrics.test.ts`, `portion/copy.test.ts` | From `Kypsä_kokonaispaino` / `expectedFinalWeightGrams`, not ingredient sum |
| Session Review | `surfaces/challenge/sessionReview.test.tsx`, `kitchenSkills.flow.test.tsx` | Current session only; labelled rows; `sessionId` hidden |
| Student Progress | `read/progressModel.test.ts`, `kitchenSkills.pages.test.tsx` | Own history; derived accuracy / final-weight trends |
| Tutor evidence | `kitchenSkills.dashboard.test.tsx`, `kitchenSkills.pages.test.tsx` | Read-only measurements; actor isolation |
| Tutor assessment | `kitchenSkills.review.test.tsx`, `domain/assessment/scores.test.ts` | Scores 0–5; 0 ≠ unanswered; one `wastePracticeReview` per session; not pre-filled |
| Exact GameBus mapper contracts | `src/products/kitchen-skills-challenge/gamebus/mapKitchenSkillsTrimSmart.test.ts`, `mapRescueAndReuse.test.ts`, `mapPortionPrecision.test.ts`, `mapWastePracticeReview.test.ts` | No derived metrics posted |
| Live-integration guard | `src/products/kitchen-skills-challenge/gamebus/liveIntegration.test.ts` | Student live enabled; trainer `KITCHEN_SKILLS_TRAINER_LIVE_INTEGRATION_READY=false` |
| Percentile / ranking | `@pending` | Sufficient-data rule not agreed |

Gherkin filenames `chef-review.feature` / `CHEF_REVIEW.md` are historical. Product wording is Tutor / Tutor assessment. The activity slug remains `wastePracticeReview`.
