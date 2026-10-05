# Kitchen Skills Challenge acceptance coverage

Approved Gherkin: `features/kitchen-skills-challenge/*.feature`
Implementation: `main` (`#/kitchen-day`, `#/kitchen-day-progress`, `#/kitchen-day-tutor`). Those hashes are legacy-stable.

**LIVE E2E BLOCKED BY GAMEBUS ADMIN ALIGNMENT.** Repository tests cover domain, UI, mapper contracts, silent student posts, self-activity hydration, finish summary, and EXIT. There is no browser/live GameBus E2E suite.

| Area | Covered in repo | Notes |
|------|-----------------|-------|
| Participant-specific session identity | `src/products/kitchen-skills-challenge/domain/session/*.test.ts`, `KitchenSkillsSessionContext.test.tsx` | `kitchen-day:<taskId>:<actorId>:<sessionDate>`; two students on the same TASK/date differ |
| TASK wait / session locked once | `KitchenSkillsSessionContext.test.tsx`, `gamebus/taskTemplates.test.ts` | Embedded wait for TASK + `inputCollectionPari.me`; later refresh cannot replace the lock |
| Europe/Helsinki session date lock | `src/products/kitchen-skills-challenge/domain/session/*.test.ts`, `KitchenSkillsSessionContext.test.tsx` | Locked across midnight for the page session |
| Reload hydration / actor isolation | `read/kitchenSkillsReadModel.test.ts`, `KitchenSkillsSessionContext.test.tsx`, `kitchenSkills.pages.test.tsx` | Student reads `kitchenGroupInputSelf.activities` without actor-id equality; group-only records do not leak into the student session or Progress |
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
| Student Progress | `read/progressModel.test.ts`, `read/studentProgressSessions.test.ts`, `kitchenSkills.pages.test.tsx` | Own history from `kitchenGroupInputSelf`; Trim/Reuse/Portion before tutor review; tutor reviews attach by `sessionId`+`reviewedGame` without requiring actor match; derived accuracy / final-weight trends |
| Tutor evidence | `kitchenSkills.dashboard.test.tsx`, `kitchenSkills.review.test.tsx`, `read/trainerSessions.test.ts`, `groupActivities.test.ts` | Staff → sessions → module tabs; reads `kitchenSkillsTrainerInput` only; per-module `wastePracticeReview` with `reviewedGame`; independent module form state |
| Tutor assessment | `kitchenSkills.review.test.tsx`, `domain/assessment/scores.test.ts`, `liveIntegration.test.ts`, `read/trainerSessions.test.ts` | Scores 0–5 (input rejects 6/decimals; Submit disabled until both parse); 0 ≠ unanswered; one `wastePracticeReview` per `sessionId` + `reviewedGame` (modules independent); Needs assessment vs Reviewed session tabs (partial stays pending; no-evidence modules do not block Reviewed); `SILENT_ACTIVITY` + `actors`; iframe stays open; sticky **Close** posts `EXIT` (confirm if dirty draft; no review post) |
| Exact GameBus mapper contracts | `src/products/kitchen-skills-challenge/gamebus/mapKitchenSkillsTrimSmart.test.ts`, `mapRescueAndReuse.test.ts`, `mapPortionPrecision.test.ts`, `mapWastePracticeReview.test.ts`, `liveIntegration.test.ts` | Student Trim/Reuse/Portion `SILENT_ACTIVITY`; tutor review `SILENT_ACTIVITY` with `actors: [selectedStudentActorId]`; no derived metrics posted |
| Recipe combobox / gram inputs / finish summary | `KitchenSkillsRecipeCombobox.test.tsx`, `gramsInput.test.ts`, `kitchenSkills.flow.test.tsx`, `postExit.test.ts` | Searchable recipe picker; digit-only grams; summary then `{ type: 'EXIT' }` on Finish challenge |
| Compact Trim / Reuse / Portion layout | `kitchenSkills.layout.test.tsx`, `sessionReview.test.tsx` | Content-width grams; Portion table (Ingredient \| Target \| Actual \| Result); sticky actions; review recipe details collapsed |
| Live-integration guard | `src/products/kitchen-skills-challenge/gamebus/liveIntegration.test.ts` | Student live enabled; trainer live enabled (`KITCHEN_SKILLS_TRAINER_LIVE_INTEGRATION_READY=true`) |
| Percentile / ranking | `@pending` | Sufficient-data rule not agreed |

Gherkin filenames `chef-review.feature` / `CHEF_REVIEW.md` are historical. Product wording is Tutor / Tutor assessment. The activity slug remains `wastePracticeReview`.
