# My Food Journey — acceptance coverage

Maps [`../../features/student/student-journey.feature`](../../features/student/student-journey.feature) to Vitest.

| Scenario (summary) | Tests |
|--------------------|-------|
| Overview participation counts | `src/products/student-journey/studentJourneyUx.test.tsx`, `read/studentJourneyModel.test.ts` |
| One row per service date + No lunch | `read/parseStudentLunchCheckin.test.ts`, `studentJourneyUx.test.tsx` |
| Actor isolation | `studentJourneyIdentity.test.tsx`, `read/parseStudentLunchCheckin.test.ts` |
| Streak/badge unavailable (no fabrication) | `studentJourneyUx.test.tsx` |
| Plate measurements unavailable | `studentJourneyUx.test.tsx` |
| Route is Custom Page, no ACTIVITY | `src/app/routes.test.ts`, `src/app/documentTitle.test.ts` |
| Live GameBus menu (`@pending`) | Manual — [`../how-to/configure-student-food-journey-access.md`](../how-to/configure-student-food-journey-access.md) |
