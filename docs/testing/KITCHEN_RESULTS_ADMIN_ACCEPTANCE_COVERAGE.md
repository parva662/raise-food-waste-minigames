# Kitchen Results — admin acceptance coverage

Maps approved Gherkin in
[`../../features/kitchen/kitchen-results-admin.feature`](../../features/kitchen/kitchen-results-admin.feature)
to Vitest coverage. This is not a second specification.

Route: `#/chef-results-admin`. Timezone: `Europe/Helsinki`.

**Product decisions locked in this audit:**

1. Admin must not collapse to a single empty paragraph when partial data exists.
2. Closeout-only → service actuals + explain no eligible staff forecasts.
3. Forecast-only → available forecast state + explain closeout pending; full Forecast navigation remains.
4. Same calculation engine / shared closeout reality as participant for actor + targetDate.
5. Malformed individual records must not destroy otherwise valid service data.
6. No composite score / ranking / winner language.
7. Unified areas: Forecast & Service and Kitchen Skills.
8. Kitchen Skills uses `kitchenSkillsTrainerInput` only (never self feed).
9. Management dashboard remains read-only.
10. Forecast service-date selector is Forecast & Service only; Kitchen Skills uses an independent reporting period (all recorded sessions by default).
11. Staff / participant / session details open in a contextual drawer (right-side desktop, full-width mobile); stale details reset when selection or data changes.
12. Kitchen Skills Overview shows separate mean time-efficiency and preparation-quality scores per module from recorded assessments only (missing ≠ zero).

| Area | Key scenarios | Automated coverage | Status |
|---|---|---|---|
| Unified area navigation | Forecast & Service / Kitchen Skills tabs | `forecastResultsManagementDashboard.test.tsx`; `forecastResultsUnifiedDashboard.test.tsx` | COVERED |
| Forecast-only date selector | Service date control hidden in Kitchen Skills | `forecastResultsUnifiedDashboard.test.tsx` | COVERED |
| Kitchen Skills reporting period | Independent of Forecast date; defaults to all sessions | `forecastResultsUnifiedDashboard.test.tsx` | COVERED |
| Detail drawers | Open / close / Escape; actor association; reset on date change | `forecastResultsManagementDashboard.test.tsx`; `forecastResultsUnifiedDashboard.test.tsx` | COVERED |
| Complete service results | Shared engine staff table + overview | `forecastResultsManagementDashboard.test.tsx`; calculation tests | COVERED |
| Partial closeout-only | Actuals + explanation + tabs remain | `resolveAdminServicePartialState` + OverviewSection | COVERED (path) |
| Partial forecast-only | Forecast list + pending closeout + Staff/Trends/History | `forecastResultsUnifiedDashboard.test.tsx` (8 Oct fixture) | COVERED |
| History incomplete services | Forecast-only / complete rows | `forecastResultsUnifiedDashboard.test.tsx` | COVERED |
| Empty service | Clear empty state | `kitchenResultsProgressIndependence.test.ts` (empty kind) | COVERED |
| Trends chart 0/1/2+ | Single-point chart allowed; independent of incomplete selected day | `forecastResultsManagementDashboard.test.tsx`; `ManagementTrendsSection` | COVERED |
| Kitchen Skills summaries | Participants / sessions / assessments attribution | `forecastResultsUnifiedDashboard.test.tsx`; trainer session tests | COVERED |
| Assessment means | Per-module / per-dimension means; missing not zero | `forecastResultsUnifiedDashboard.test.tsx` | COVERED |
| Mobile secondary tabs | Horizontally scrollable tab strip class | `forecastResultsUnifiedDashboard.test.tsx` | COVERED |
| Missing Kitchen Skills collection | Unavailable-data state; Forecast still works | `forecastResultsUnifiedDashboard.test.tsx` | COVERED |
| Authorization | Platform-enforced admin access | — | `@pending` EXTERNAL |
| Live GameBus Admin page Input Collections | Confirm `kitchenSkillsTrainerInput` attached to Admin Dashboard page | Live check 2026-10-15 on `/admindashboard` (network: Kitchen Skills group activities 200) | EXTERNAL / PLATFORM — **CONNECTED** (UI deploy of PR #5 still pending) |

Admin authorization remains a GameBus/platform concern until a reliable permission signal exists
in the INPUT_COLLECTIONS contract. Hiding `#/chef-results-admin` is not sufficient authorization
for identifiable Kitchen Skills data.
