# Kitchen Day acceptance coverage

Approved Gherkin: `features/waste-challenges/*.feature`  
Implementation: `feature/kitchen-day-v1` (`#/kitchen-day`)

**LIVE E2E BLOCKED BY GAMEBUS ADMIN ALIGNMENT.** Repository tests cover domain, UI, and mapper contracts only.

| Area | Covered in repo | Notes |
|------|-----------------|-------|
| Shared sessionId / Helsinki sessionDate | `src/kitchenDay/session/*.test.ts`, `kitchenDay.flow.test.tsx` | Locked session across midnight |
| Multiple different ingredients | `ingredientUniqueness.test.ts`, flow | |
| Duplicate same ingredient blocked | uniqueness + flow | |
| Trim categories / weight / estimate / technique / actual | `trim/validation.test.ts` | |
| Timer start/finish/duration | `trim/timer.test.ts` | |
| Waste % and seeded/historical/fallback comparison | `trim/derived.test.ts`, `trim/reference.test.ts` | No percentile copy |
| Rescue join + reusable bounds + destination + discarded | `rescue/validation.test.ts`, flow | |
| Portion recipe stub, composition, deviations, final weight | `portion/deviations.test.ts`, flow | |
| Mapper exact property sets | `src/gamebus/mapKitchenDay*.test.ts`, `mapRescueAndReuse.test.ts`, `mapPortionPrecision.test.ts` | |
| Chef review UI / wastePracticeReview | not in this branch | Phase 5 |
| Percentile / ranking | `@pending` | Sufficient-data rule not agreed |
