# Kitchen Results — participant acceptance coverage

Maps approved Gherkin in
[`../../features/kitchen/kitchen-results-participant.feature`](../../features/kitchen/kitchen-results-participant.feature)
to Vitest coverage. This is not a second specification.

Route: `#/chef-results`. Timezone: `Europe/Helsinki`.

**Product decisions locked in this audit:**

1. Participant dashboard date = current Europe/Helsinki calendar day; rolls at midnight (not Kitchen Forecast 08:30).
2. Weekend / explicit closure → "No service today"; Progress remains available.
3. Historical Progress is independent of the current waiting / no-forecast / no-service state.
4. Progress chart: 0 → empty; 1 → show data point (no trend claim); 2+ → chart + trend.
5. Other-staff comparison from **1** peer; label "Other staff" (1) / "Other staff median" (2+).
6. Missing forecast ≠ zero performance; omit from aggregation.
7. Closeout without personal forecast still shows actual kitchen outcome.
8. Forecast without closeout preserves structure + shows submitted forecast; metrics pending.
9. Shared calculation engine with admin for the same actor + targetDate.
10. No composite score / ranking / winner language.

| Area | Key scenarios | Automated coverage | Status |
|---|---|---|---|
| Identity / privacy | Own results only; no peer names/IDs | `chefResultsPrivacy.test.ts`; `chefResultsParticipantDashboard.test.tsx` | COVERED |
| Dashboard date / midnight | Helsinki calendar day; midnight rollover; ignores 08:30 | `chefResultsServiceDate.test.ts`; `chefResultsDashboardMidnight.test.tsx` | COVERED |
| Weekend / closed day | No service today; Progress remains | `chefResultsServiceDate.test.ts`; `chefResultsDashboardMidnight.test.tsx` | COVERED |
| Missing menu weekday | Still operational service day | `chefResultsServiceDate.test.ts` | COVERED |
| Calculation model | Observed demand, simulated over/shortage, customer abs error | `calculateDailyResults.test.ts`; calculation engine tests | COVERED |
| Eligible forecast selection | Exact actor + targetDate; latest eligible wins | `selectCloseoutForecast.test.ts` (shared KF rules) | COVERED |
| Waiting vs Progress | History remains when current service waits | `kitchenResultsProgressIndependence.test.ts`; `ChefResultsParticipantApp` progress path | COVERED |
| Progress chart 0/1/2+ | Single-point chart without trend claim | `participantProgressSection.test.tsx`; `participantProgressData.test.ts` | COVERED |
| Other-staff threshold | Compare at 1 peer; labels | `teamComparison.test.ts`; `chefResultsParticipantDashboard.test.tsx` | COVERED |
| Closeout, no personal forecast | Actual outcome + explanation | `ParticipantOverviewSection` + closeout-only path | COVERED (UI path) |
| Forecast, no closeout | Pending forecast summary + history | `ChefResultsParticipantApp` pendingForecast path | COVERED (UI path) |
| Dessert omitted in payload | Soup-menu fallback, not zero | `adapters/chefForecastAdapter.test.ts` | COVERED |
| No ranking | No leaderboard / winner language | `chefResultsPrivacy.test.ts`; dashboard UX tests | COVERED |
| Portion-weight / identity edges | Unspecified product edges | — | `@pending` in Gherkin |
| Live GameBus INPUT_COLLECTIONS slice | Whether historical activities are present in embed payload | — | EXTERNAL / PLATFORM |

## Embedded screenshot root-cause notes (Progress empty while header waits)

Verified data path:

`INPUT_COLLECTIONS` → parse chefForecast / wasteMeasurement → eligible forecast selection →
`getParticipantGroupResultServiceDates` → `buildGroupDailyServiceResults` →
`buildParticipantProgressServicePoints` → period view → Progress UI.

**Product/repo:** Waiting for current closeout does **not** clear Progress. Progress only includes
dates with both eligible forecast (actor match) and finalized closeout, filtered by
`serviceDate <= asOfServiceDate`.

**If Progress is globally empty while waiting:**

1. No historical `wasteMeasurement` + matching eligible `chefForecast` for the authenticated actor
   in the delivered `INPUT_COLLECTIONS` (payload/platform slice) — **most likely for live embed**.
2. Authenticated `user.id` does not match forecast `actorId` (identity mismatch).
3. Parser / eligibility rejection of historical forecasts.
4. Current calendar **Month** empty while **Year** has history is period filtering, not waiting.

Distinguish: product logic (fixed here) vs repository bugs (peer threshold, chart, dessert) vs
live GameBus payload instability.
