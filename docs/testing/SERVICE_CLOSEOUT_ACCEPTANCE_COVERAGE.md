# Service Closeout acceptance coverage

Maps approved Gherkin in
[`../../features/kitchen/service-closeout.feature`](../../features/kitchen/service-closeout.feature)
to Vitest coverage. This is not a second specification.

Route: `#/service-closeout`. Outbound ACTIVITY: `wasteMeasurement`. Timezone: `Europe/Helsinki`.

**Counts:** 36 Scenario / Scenario Outline entries. 7 remain `@pending` product/platform questions.

| Gherkin Rule / Scenario | Tags | Automated coverage | Status |
|---|---|---|---|
| Closeout captures whole-canteen actuals | `@happy-path @domain` | `serviceCloseoutUx.test.tsx`; route/app shell | COVERED |
| Unrelated templates unused | `@domain @separation` | `mapWasteMeasurement.test.ts` (forbidden refs); contract tests | COVERED |
| Service date Europe/Helsinki | `@calendar @timezone` | `closeoutServiceDate.test.ts` | COVERED |
| Weekend cannot finalize | `@calendar @weekend` | Menu/calendar + UX unavailable paths | PARTIALLY COVERED |
| Explicit closure blocks Finalize | `@calendar @closure` | Menu resolver + finalize disabled when menu not available | COVERED |
| Missing menu keeps date, blocks Finalize | `@calendar @menu` | `useServiceCloseout` `menuReady`; menu resolver tests | COVERED |
| Dev date override | `@demo @calendar` | `closeoutServiceDate.test.ts` | COVERED |
| Open-page midnight rollover | `@pending @calendar @midnight` | — | `@pending` PRODUCT DECISION |
| Recorded-by read-only / no head chef selector | `@security @identity` | `serviceCloseoutUx.test.tsx`; identity display | COVERED |
| No chefId / headChefUserId posted | `@security @identity @data` | `mapWasteMeasurement.test.ts` | COVERED |
| Unauthorized must not finalize | `@security @authorization` | `accessPolicy` abstraction + finalize panel | PARTIALLY COVERED |
| Live authorization mechanism | `@pending @authorization @platform` | development policy only | `@pending` / EXTERNAL |
| Actual customers validation | `@inputs @customers` | `serviceCloseoutDomain.test.ts`; UX integer tests | COVERED |
| Prepared quantity validation | `@inputs @prepared` | `serviceCloseoutDomain.test.ts`; UX | COVERED |
| Waste grams validation | `@inputs @waste` | `serviceCloseoutDomain.test.ts`; UX | COVERED |
| Forecast never auto-copied | `@inputs @independence` | draft starts empty; mapper excludes forecast fields | COVERED |
| Overproduction ≤ prepared weight | `@validation @waste @physical` | `serviceCloseoutDomain.test.ts` (`validateOverproductionAgainstPrepared`) | COVERED |
| Portion weights not posted | `@units @portion-weights` | `mapWasteMeasurement.test.ts` | COVERED |
| Invalid portion-weight handling | `@pending @portion-weights` | fixtures always positive defaults | `@pending` PRODUCT DECISION |
| Item IDs from menu slots | `@menu @identity` | meal-slot + mapper tests; closeout normalize | COVERED |
| Forecast item-ID mismatch | `@pending @identity @forecast` | — | `@pending` PRODUCT DECISION |
| Eligible forecast read-only context | `@forecast @retrieval` | `selectCloseoutForecast.test.ts`; `resolveCloseoutChefForecast*.test.ts` | COVERED |
| Missing forecast does not block closeout | `@forecast @availability` | `serviceCloseoutForecast.test.tsx`; finalize without forecast | COVERED |
| Own vs all-staff forecast display | `@pending @forecast @display` | impl = authenticated user only | `@pending` PRODUCT DECISION |
| Synthetic fallback labelled / not posted | `@demo @forecast @synthetic` | `resolveCloseoutChefForecast.fallback.test.ts`; config still `true` | COVERED (pilot) / EXTERNAL risk |
| Successful Finalize one ACTIVITY | `@submit @happy-path` | `mapWasteMeasurement.test.ts` (`tryPostCloseoutActivity`) | COVERED |
| Standalone no ACTIVITY | `@submit @standalone` | bridge/post path embed-only | COVERED |
| Failed post preserves draft | `@submit @failure` | finalize error path in `useServiceCloseout` | PARTIALLY COVERED |
| Task not ready blocks Finalize | `@submit @guard` | `isFinalizeDisabled` when `!taskReady` | COVERED |
| Double-click no duplicate | `@submit @guard` | `tryPostCloseoutActivity` / `hasPosted` guards | COVERED |
| One closeout per date (intent) | `@domain @uniqueness` | documented product intent | COVERED (intent) |
| Cross-session uniqueness | `@pending @uniqueness @platform` | — | `@pending` / EXTERNAL |
| Duplicate wasteMeasurement consumer rule | `@pending @duplicates` | code currently latest-by-submittedAt | `@pending` PRODUCT DECISION |
| Exact 15 properties | `@data @contract` | `mapWasteMeasurement.test.ts`; builder | COVERED |
| grams → kg | `@units @contract` | `units` + mapper tests | COVERED |
| Forbidden fields absent | `@security @contract` | mapper tests | COVERED |

## Known live / config notes

- `SERVICE_CLOSEOUT_CONFIG.syntheticForecastFallbackEnabled` is currently **true** (pilot). Must be **false** before production data collection.
- GameBus dessert overproduction label misdisplay remains EXTERNAL display/config.
- Production authorization is not frontend-complete; GameBus/platform must enforce access.
