# Kitchen Day acceptance coverage

Approved Gherkin: `features/waste-challenges/*.feature`  
Implementation: `feature/kitchen-day-v1` (`#/kitchen-day`)

**LIVE E2E BLOCKED BY GAMEBUS ADMIN ALIGNMENT.** Repository tests cover domain, UI, and mapper contracts only.

| Area | Covered in repo | Notes |
|------|-----------------|-------|
| Participant-specific sessionId / Helsinki sessionDate | `src/kitchenDay/session/*.test.ts`, `KitchenDaySessionContext.test.tsx` | Two students on the same TASK/date get different ids; same student stays stable; session locked across midnight |
| Multiple different ingredients | `ingredientUniqueness.test.ts`, flow | |
| Duplicate same ingredient blocked | uniqueness + flow | |
| Trim categories / weight / estimate / technique / actual | `trim/validation.test.ts` | |
| Timer start/finish/duration | `trim/timer.test.ts` | |
| Waste % and seeded/historical/fallback comparison | `trim/derived.test.ts`, `trim/reference.test.ts` | No percentile copy |
| Rescue join + reusable bounds + destination + discarded | `rescue/validation.test.ts`, flow | |
| Portion recipe stub, composition, deviations, final weight | `portion/deviations.test.ts`, flow | |
| Mapper exact property sets | `src/gamebus/mapKitchenDay*.test.ts`, `mapRescueAndReuse.test.ts`, `mapPortionPrecision.test.ts`, `mapWastePracticeReview.test.ts` | |
| Embed waits for TASK / session locked once | `KitchenDaySessionContext.test.tsx` | |
| Multi-template TASK validation | `kitchenDayTask.test.ts` | |
| Persist hydration / reload / duplicate after reload | `kitchenDayReadModel.test.ts`, `KitchenDaySessionContext.test.tsx` | Participant reads fail closed on missing/mismatched actor |
| Student / tutor dashboards | `kitchenDay.dashboard.test.tsx`, `kitchenDay.pages.test.tsx` | Activity nav excludes tutor/progress; `#/kitchen-day-progress` and `#/kitchen-day-tutor` |
| Chef review UI / wastePracticeReview | `kitchenDay.review.test.tsx`, `mapWastePracticeReview.test.ts`, `review/scores.test.ts` | Session-level scores 0–5; one review per session; live post still blocked |
| Percentile / ranking | `@pending` | Sufficient-data rule not agreed |
