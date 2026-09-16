# Kitchen Results — admin acceptance coverage

Maps approved Gherkin in
[`../../features/kitchen/kitchen-results-admin.feature`](../../features/kitchen/kitchen-results-admin.feature)
to Vitest coverage. This is not a second specification.

Route: `#/chef-results-admin`. Timezone: `Europe/Helsinki`.

**Product decisions locked in this audit:**

1. Admin must not collapse to a single empty paragraph when partial data exists.
2. Closeout-only → service actuals + explain no eligible staff forecasts.
3. Forecast-only → available forecast state + explain closeout pending.
4. Same calculation engine / shared closeout reality as participant for actor + targetDate.
5. Malformed individual records must not destroy otherwise valid service data.
6. No composite score / ranking / winner language.

| Area | Key scenarios | Automated coverage | Status |
|---|---|---|---|
| Complete service results | Shared engine staff table + overview | `chefResultsManagementDashboard.test.tsx`; calculation tests | COVERED |
| Partial closeout-only | Actuals + explanation | `resolveAdminServicePartialState` + `ChefResultsAdminApp` | COVERED (path) |
| Partial forecast-only | Forecast list + pending closeout | Same | COVERED (path) |
| Empty service | Clear empty state | `kitchenResultsProgressIndependence.test.ts` (empty kind) | COVERED |
| Trends chart 0/1/2+ | Single-point chart allowed | `chefResultsManagementDashboard.test.tsx`; `ManagementTrendsSection` | COVERED |
| Authorization | Platform-enforced admin access | — | `@pending` EXTERNAL |
| Live GameBus payload | Historical / partial activities in INPUT_COLLECTIONS | — | EXTERNAL / PLATFORM |

Admin authorization remains a GameBus/platform concern until a reliable permission signal exists
in the INPUT_COLLECTIONS contract.
