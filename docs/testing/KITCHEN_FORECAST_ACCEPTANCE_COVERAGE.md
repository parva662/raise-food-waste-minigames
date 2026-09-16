# Kitchen Forecast acceptance coverage

This document maps the **approved** Kitchen Forecast Gherkin to repository automated tests.

- **Product source of truth:** [`../../features/kitchen/kitchen-forecast.feature`](../../features/kitchen/kitchen-forecast.feature)
- This file is **not** a second specification. It only records which Vitest tests prove each approved scenario.
- Route under test: `#/chef`. Operational timezone: `Europe/Helsinki`.
- Live GameBus ingest is **not** proven here. Repository tests mock the parent bridge.

**Counts:** 82 approved Scenario / Scenario Outline entries. 1 Gherkin scenario remains `@pending @rollover` and is **not** a test gap.

| Gherkin Rule / Scenario | Tags | Automated coverage | Status |
|---|---|---|---|
| **Rule: The forecast belongs to the authenticated kitchen-staff account** | | | |
| Kitchen staff open the forecast from their own GameBus account | `@happy-path @platform` | `src/chef/chefRoute.test.tsx` (`chef route loads chef forecast UI`); `src/chef/chefForecastSubmissionLifecycle.test.tsx` (`offers no owner, staff, or service-date selection control`) | COVERED |
| No shared kitchen account is used | `@security @identity` | Same lifecycle identity test: no staff/owner control; ownership is the GameBus session, not a typed identifier | COVERED |
| A kitchen-staff member cannot forecast on behalf of someone else | `@security @identity` | `chefForecastSubmissionLifecycle.test.tsx` (`offers no owner, staff, or service-date selection control`) | COVERED |
| No separate kitchen identifier is stored on the forecast record | `@security @identity` | `src/gamebus/mapChefForecast.test.ts` (`omits confidence and notes when not answered` — asserts no `chefId`); `chefForecastSubmissionLifecycle.test.tsx` (`records a complete ACTIVITY with on-time status and no forbidden properties`) | COVERED |
| **Rule: Several staff members may each forecast the same service date independently** | | | |
| Two kitchen-staff members forecast the same service date | `@multi-account` | `src/serviceCloseout/forecast/selectCloseoutForecast.test.ts` (`keeps two different actors for the same service date`) | COVERED |
| One staff member cannot see or change another's forecast | `@multi-account @security` | `selectCloseoutForecast.test.ts` (`returns only the matching authenticated actor`, `does not invent a forecast from another participant when the authenticated actor has none`); Kitchen Forecast UI never loads another actor's draft | COVERED |
| Each participant is compared against the shared service outcome | `@multi-account @research` | Independent per-actor records for the same `targetDate` in `selectForecastsForDate`; `chefForecast` mapper never includes Student Lunch properties | COVERED |
| **Rule: The forecast targets one automatically resolved operational lunch service** | | | |
| The target service date is resolved by the product, not chosen | `@calendar` | `src/chef/chefForecastServiceDate.test.ts`; `chefForecastSubmissionLifecycle.test.tsx` (`offers no owner, staff, or service-date selection control` — no date picker); header `dateTime` in timing UX tests | COVERED |
| Weekends are never offered as a forecast target | `@calendar @weekend` | `src/chef/chefForecastWindowMatrix.test.ts` (`%s never opens entry and never becomes a target` for Saturday and Sunday); `operationalServiceCalendar.test.ts` (`treats weekends as non-service`) | COVERED |
| An explicitly closed day is skipped | `@calendar @closure` | `chefForecastWindowMatrix.test.ts` (`skips an explicitly closed Monday from the Friday advance window`); `chefForecastServiceDate.test.ts` (`targets Tuesday when Monday is explicitly closed`) | COVERED |
| No usable service date can be resolved | `@calendar @unavailable` | `src/chef/chefAvailability.test.tsx` (`renders calendar error banner instead of a blank page when service date resolution fails`) | COVERED |
| Device timezone does not change the target service date | `@timezone` | `chefForecastWindowMatrix.test.ts` (`uses Helsinki wall-clock even when other device timezones still show a different time of day` — Amsterdam / UTC / New York / Tokyo wall clocks of one instant) | COVERED |
| **Rule: Missing menu data blocks entry without changing the resolved service date** | | | |
| The published menu for the target service is visible | `@menu` | `chefForecastSubmissionLifecycle.test.tsx` (`shows the target service date menu as read-only content`); `chefRoute.test.tsx` (`known available date shows four menu forecast cards`) | COVERED |
| Missing menu data blocks the form and keeps the resolved service date | `@menu @technical` | `chefAvailability.test.tsx` (`keeps the resolved target date when its menu data is unavailable`, `missing date disables forecast submission`); `chefForecastServiceDate.test.ts` (`keeps a weekday target whose menu data is unavailable`) | COVERED |
| A closed canteen day cannot be forecast | `@menu @closure` | `chefAvailability.test.tsx` (`CLOSED day disables forecast submission`); `chefForecastWindowMatrix.test.ts` (`leaves an explicitly closed Monday without any forecast window of its own`) | COVERED |
| Kitchen staff cannot change the published menu | `@menu @security` | `chefForecastSubmissionLifecycle.test.tsx` (`shows the target service date menu as read-only content` — dessert disabled, no add/rename/remove/replace) | COVERED |
| **Rule: The time of day determines exactly one target service date** | | | |
| Entry is closed before 08:00 on an operational day | `@cutoff @target @boundary` | `chefForecastWindowMatrix.test.ts` (`Monday 07:59:59`, `does not open the next service before 08:00 merely because one exists`); `chefForecastTimingUx.test.tsx` (`keeps today as the target and stays closed before 08:00`); `chefSubmissionWindow.test.ts` (`is closed before the grace window opens`) | COVERED |
| The grace window opens at exactly 08:00:00 and targets today | `@cutoff @grace-window @boundary` | `chefForecastWindowMatrix.test.ts` (`Monday 08:00:00`); `chefForecastTimingUx.test.tsx` (`opens the same-day window at 08:00 with today as the target`) | COVERED |
| The grace window still targets today at 08:29:59 | `@cutoff @grace-window @boundary` | `chefForecastWindowMatrix.test.ts` (`Monday 08:29:59`); `chefForecastServiceDate.test.ts` (`targets Monday when opened Monday at 08:29:59`) | COVERED |
| At exactly 08:30:00 today closes and the target switches to the next service | `@cutoff @grace-window @advance-window @boundary` | `chefForecastWindowMatrix.test.ts` (`Monday 08:30:00`); `chefForecastServiceDate.test.ts` (`targets Tuesday when opened Monday exactly at 08:30:00`) | COVERED |
| After 08:30 the target is the next operational service | `@cutoff @advance-window @boundary` | `chefForecastWindowMatrix.test.ts` (`Monday 08:30:01`) | COVERED |
| The advance window stays open until the end of the operational day | `@cutoff @advance-window @boundary` | `chefForecastWindowMatrix.test.ts` (`Monday 23:59:59`); `chefForecastTimingUx.test.tsx` (`targets Monday from the Friday advance window`) | COVERED |
| Friday at 08:29:59 targets Friday's own service | `@cutoff @grace-window @friday` | `chefForecastWindowMatrix.test.ts` (`Friday 08:29:59`) | COVERED |
| Friday at 08:30:00 targets Monday | `@cutoff @advance-window @friday` | `chefForecastWindowMatrix.test.ts` (`Friday 08:30:00`) | COVERED |
| Friday at 23:59:59 still targets Monday | `@cutoff @advance-window @friday` | `chefForecastWindowMatrix.test.ts` (`Friday 23:59:59`) | COVERED |
| Friday's advance window skips an explicitly closed Monday | `@cutoff @advance-window @closure` | `chefForecastWindowMatrix.test.ts` (`skips an explicitly closed Monday from the Friday advance window`; also `continues past consecutive explicit closures`) | COVERED |
| No forecast window is open on a weekend | `@cutoff @weekend` | `chefForecastWindowMatrix.test.ts` (Saturday **and** Sunday); `chefForecastTimingUx.test.tsx` (`shows no open window on a weekend day`, `shows no open window on Sunday either`) | COVERED |
| Target and windows are evaluated in Helsinki time rather than device-local time | `@cutoff @timezone` | `chefForecastWindowMatrix.test.ts` (`uses Helsinki wall-clock even when other device timezones still show a different time of day`; Amsterdam 07:30 vs Helsinki 08:30 of the same instant) | COVERED |
| The window cannot be bypassed from an already-open page | `@cutoff @validation` | `chefForecastSubmissionLifecycle.test.tsx` (`records nothing when the window closes before the completed form is sent` — form complete at 08:29:59, submit at 08:30:00, no ACTIVITY for today). Open-page **UX** for entered values remains `@pending @rollover` | COVERED |
| **Rule: Late forecasts are not accepted** | | | |
| Today's service cannot be forecast once its grace window has closed | `@cutoff @late` | `chefForecastWindowMatrix.test.ts` (`Monday 08:30:00` targets Tuesday); `chefSubmissionWindow.test.ts` (`closes the service date at exactly 08:30`, `refuses ACTIVITY creation outside an eligible window`) | COVERED |
| Normal successful forecasts are recorded as on-time | `@cutoff @late @data` | `chefSubmissionWindow.test.ts` (`creates submissions with on-time timingStatus inside a window`); `chefForecastSubmissionLifecycle.test.tsx` (`records a complete ACTIVITY with on-time status…`) | COVERED |
| **Rule: Every forecast explicitly carries its target service date** | | | |
| The target service date is recorded explicitly | `@data @target-date` | `src/gamebus/mapChefForecast.test.ts` (`submits correct targetDate, timingStatus and submittedAt`); lifecycle ACTIVITY `targetDate` assertion | COVERED |
| An advance submission still records the service date it targets | `@data @target-date` | `mapChefForecast.test.ts` (`records the service date being forecast, not the day the form was filled`) | COVERED |
| A forecast is never matched to a different service date | `@data @target-date` | `selectCloseoutForecast.test.ts` (`requires exact targetDate match`, `does not use tomorrow forecast for today closeout` in parse tests) | COVERED |
| **Rule: The forecast is expected customers plus the menu portion forecasts** | | | |
| The forecast inputs are presented | `@inputs` | `src/chef/chefUx.test.tsx` (`renders chef route with countdown and four categories`, `uses visible label for expected customers…`) | COVERED |
| All forecast values start unanswered | `@inputs @blank-vs-zero` | `chefUx.test.tsx` (`starts all five numeric fields blank`, `shows Not entered in forecast overview for unanswered values`) | COVERED |
| Blank and zero mean different things | `@inputs @blank-vs-zero` | `chefUx.test.tsx` (`distinguishes blank from explicit zero`, `preserves explicit zero and clearing returns overview to Not entered`) | COVERED |
| Every required editable forecast must be answered before submission | `@inputs @completeness` | `chefUx.test.tsx` (`disables submit while any required field is blank`, `shows disabled-submit explanation before form is complete`) | COVERED |
| **Rule: Soup and dessert are one soup-menu forecast** | | | |
| The soup-menu quantity is entered once | `@inputs @soup-menu` | `src/chef/chefSoupDessertSync.test.tsx` (`sets dessert to 50 when soup is 50`, `does not allow independent dessert editing`) | COVERED |
| Soup and dessert are recorded with the same quantity | `@inputs @soup-menu @data` | `chefSoupDessertSync.test.tsx` (`submits matching forecastSoup and forecastDessert values`); lifecycle payload `forecastSoup === forecastDessert` | COVERED |
| Clearing the soup-menu quantity clears the dessert forecast | `@inputs @soup-menu` | `chefSoupDessertSync.test.tsx` (`clears dessert when soup is cleared`) | COVERED |
| **Rule: Headcount and portion forecasts are independent** | | | |
| Main and vegetarian remain independent forecasts | `@inputs @independence` | `chefSoupDessertSync.test.tsx` (`keeps main and vegetarian independent from soup`, `keeps expected customers independent from soup`) | COVERED |
| Portions do not have to add up to expected customers | `@inputs @no-arithmetic` | `chefUx.test.tsx` (`accepts mismatched customer and menu forecasts without warning`, `does not render combined totals or arithmetic expressions`, `does not block submission when forecasts differ across categories`) | COVERED |
| **Rule: Confidence and notes are optional research context** | | | |
| Confidence is optional | `@inputs @optional` | `chefUx.test.tsx` (`renders confidence radio group without default selection`); `mapChefForecast.test.ts` (`omits unanswered confidence`) | COVERED |
| A note is optional | `@inputs @optional` | `chefUx.test.tsx` (`renders additional context section in review column`); `mapChefForecast.test.ts` (`omits empty notes`) | COVERED |
| **Rule: Forecast quantities are whole numbers from 0 through 1000 inclusive** | | | |
| Valid whole-number forecasts are accepted | `@validation` | `mapChefForecast.test.ts` (`accepts %s = %s` for Expected customers 0/120/1000, Main 0/1000, Vegetarian 30, Soup menu 40); `chefUx.test.tsx` (`accepts 0 and 1000 as valid whole-number forecasts`) | COVERED |
| Values above the maximum are rejected | `@validation @boundary` | `mapChefForecast.test.ts` (`rejects 1001 for %s…` for all four fields); `chefUx.test.tsx` (`rejects 1001 on every required editable forecast…`) | COVERED |
| Negative forecasts are rejected | `@validation` | `mapChefForecast.test.ts` (`rejects -1 for %s`); `chefUx.test.tsx` (`rejects negative values`) | COVERED |
| Fractional forecasts are rejected | `@validation` | `mapChefForecast.test.ts` (`rejects 12.5 for %s`); `chefUx.test.tsx` (`rejects decimal values`) | COVERED |
| **Rule: Staff submit directly from the form** | | | |
| There is no separate review screen | `@submit @no-review` | `chefForecastSubmissionLifecycle.test.tsx` (`submits directly from the form without a separate review screen`) | COVERED |
| Kitchen staff submit a complete forecast | `@submit @happy-path` | Same lifecycle submit test (one ACTIVITY, confirmation names the target date); `chefUx.test.tsx` (`enables submit when all five fields are valid`) | COVERED |
| **Rule: An all-zero forecast is valid but requires explicit confirmation** | | | |
| Submitting an all-zero forecast asks for confirmation | `@submit @all-zero` | `chefUx.test.tsx` (`shows zero confirmation for all-zero explicit forecast`) | COVERED |
| Cancelling the all-zero confirmation records nothing | `@submit @all-zero` | `chefForecastSubmissionLifecycle.test.tsx` (`records nothing when the all-zero confirmation is cancelled`) | COVERED |
| Confirming the all-zero forecast submits it normally | `@submit @all-zero` | `chefForecastSubmissionLifecycle.test.tsx` (`submits every deliberate zero as the number zero once confirmed`); `chefUx.test.tsx` (`allows confirmed zero forecast to proceed`) | COVERED |
| **Rule: A successful forecast is final for that staff member and service date** | | | |
| A successful forecast cannot be followed by a second one | `@submit @finality` | `chefForecastSubmissionLifecycle.test.tsx` (`does not create a second ACTIVITY after a successful forecast`) | COVERED |
| A successful forecast cannot be replaced or corrected | `@submit @finality` | Same test: submit disabled, no replace/edit dialog; `mapChefForecast.test.ts` (`double-click does not send two ACTIVITY messages`) | COVERED |
| Replay availability is governed by the GameBus task, not by the minigame | `@submit @finality @platform` | Minigame does not load a previous forecast to enforce finality; in-session duplicate block is `hasGameBusPostedChefForecastForDate` / `tryPostChefActivity` duplicate | COVERED |
| Pilot replay does not change the product rule | `@submit @finality @pilot` | `selectCloseoutForecast.test.ts` (`uses the latest eligible activity when the pilot left several behind`) | COVERED |
| Repeated submit attempts create at most one forecast | `@submit @duplicate` | `mapChefForecast.test.ts` (`double-click does not send two ACTIVITY messages`); lifecycle second-click test | COVERED |
| **Rule: A failed submission creates nothing and may be retried** | | | |
| A failed submission keeps the entered forecast on screen | `@network @retry` | `chefForecastSubmissionLifecycle.test.tsx` (`keeps the entered forecast on screen when the submission fails and allows one retry`) | COVERED |
| A failed submission is not treated as a successful forecast | `@network @state` | Same test: no submitted banner, zero ACTIVITYs after the failed attempt | COVERED |
| Retrying after a genuine failure creates exactly one forecast | `@network @retry @duplicate` | Same test: retry posts exactly one ACTIVITY | COVERED |
| Retry is no longer possible once the window closes | `@network @retry @cutoff` | `chefForecastSubmissionLifecycle.test.tsx` (`stops the retry once the eligible window for the target service date has closed`) | COVERED |
| Submission waits until the GameBus task is ready | `@platform` | `chefForecastSubmissionLifecycle.test.tsx` (`waits for the GameBus task before allowing submission`) | COVERED |
| **Rule: A recorded forecast preserves the facts needed for operations and research** | | | |
| The recorded forecast preserves the essential business facts | `@data` | `chefForecastSubmissionLifecycle.test.tsx` (`records a complete ACTIVITY with on-time status and no forbidden properties` — 12 required properties); `mapChefForecast.test.ts` (`builds chefForecast ACTIVITY with all required properties`) | COVERED |
| Optional context is recorded only when it was entered | `@data @optional` | `mapChefForecast.test.ts` (`includes confidence with number type from schema`, `includes trimmed notes`) | COVERED |
| Unanswered optional context is omitted rather than emptied | `@data @optional` | `mapChefForecast.test.ts` (`submits without confidence and notes when unanswered`, `omits unanswered confidence`, `omits empty notes`) | COVERED |
| Deliberate zero forecasts are recorded as zero | `@data` | `mapChefForecast.test.ts` (`includes zero forecast quantities`); lifecycle all-zero confirm test | COVERED |
| The submission time is recorded as an absolute instant | `@data @boundary` | `mapChefForecast.test.ts` (`submits correct targetDate…` — `submittedAt` is `…Z` ISO); lifecycle payload ISO assertion | COVERED |
| **Rule: Kitchen staff cannot manipulate identity, dates, menu, or outcome data** | | | |
| Kitchen staff cannot forecast for a past service | `@security @forbidden` | No date picker (`offers no owner, staff, or service-date selection control`); resolver never targets a past operational day | COVERED |
| Kitchen staff cannot choose an arbitrary service date | `@security @forbidden` | Same: no date control | COVERED |
| Kitchen staff cannot submit outside an eligible window | `@security @forbidden` | `chefSubmissionWindow.test.ts` (`refuses ACTIVITY creation outside an eligible window`); weekend/Sunday UX submit disabled; open-page bypass test | COVERED |
| The forecast record carries no identity, result, or reward data | `@security @forbidden @data` | `mapChefForecast.test.ts` (forbidden keys including `accuracy`); lifecycle ACTIVITY forbidden-property list | COVERED |
| Actual production and waste are not collected here | `@scope` | `chefForecastSubmissionLifecycle.test.tsx` (`collects no actual production, service, or waste data`) | COVERED |
| **Rule: Selecting a stored forecast for one participant and service date** | | | |
| Only forecasts explicitly carrying the requested service date are considered | `@retrieval @target-date` | `selectCloseoutForecast.test.ts` (`requires exact targetDate match`) | COVERED |
| An activity submitted in the previous day's advance window is eligible | `@retrieval @eligibility` | `selectCloseoutForecast.test.ts` (`keeps an activity submitted in the previous operational day advance window`); `chefForecastEligibilityPolicy.test.ts` / `chefForecastWindowMatrix.test.ts` (`previous operational day 08:30:00` / `16:00:00` / `23:59:59`) | COVERED |
| An activity submitted in the same-day grace window is eligible | `@retrieval @eligibility` | `chefForecastWindowMatrix.test.ts` (`target day 08:00:00` / `08:15:00` / `08:29:59`); `chefForecastEligibilityPolicy.test.ts` (`accepts submissions from exactly 08:00:00 through 08:29:59`) | COVERED |
| Activities submitted outside both windows are ineligible | `@retrieval @eligibility` | `chefForecastWindowMatrix.test.ts` stored-activity table (P 07:00 / 08:29:59; weekend Sat+Sun; D 07:59:59 / 08:30:00 / 12:00; earlier Thursday); `selectCloseoutForecast.test.ts` (`ignores activities submitted outside both eligible windows`, `ignores an activity from several operational days before the previous operational day`) | COVERED |
| The latest eligible activity is selected when the pilot left several behind | `@retrieval @pilot` | `selectCloseoutForecast.test.ts` (`uses the latest eligible activity when the pilot left several behind`, `compares submission instants chronologically rather than by ISO string layout`) | COVERED |
| A later ineligible activity does not replace an earlier eligible one | `@retrieval @pilot` | `selectCloseoutForecast.test.ts` (`never lets a later ineligible activity replace an earlier eligible one`) | COVERED |
| No eligible activity means no forecast for that participant | `@retrieval` | `selectCloseoutForecast.test.ts` (`returns no forecast when all submissions for an actor are after cutoff`, `does not invent a forecast from another participant…`) | COVERED |
| **Rule: A successful forecast completes the GameBus task** | | | |
| A successful forecast returns control to GameBus | `@gamebus @mission-chain` | `mapChefForecast.test.ts` (`message type is ACTIVITY not SILENT_ACTIVITY`); lifecycle posts `ACTIVITY` / `chefForecast` to `parent.postMessage` | COVERED |
| A misconfigured task does not produce a partial record | `@gamebus @configuration` | `mapChefForecast.test.ts` (`missing chefForecast TASK fails clearly`); `chefForecastSubmissionLifecycle.test.tsx` (`does not post a partial ACTIVITY when the GameBus task is missing chefForecast`) | COVERED |
| **Rule: Unresolved product questions must not be silently invented during implementation** | | | |
| Open-page service-date rollover is deferred for the pilot | `@pending @rollover` | Not acceptance-tested as defined behaviour | DEFERRED PRODUCT DECISION — deliberately not acceptance-tested as defined behaviour |

## Related automated suites (supporting, not a second spec)

| Area | Files |
|---|---|
| Target / window / eligibility matrix | `src/chef/chefForecastWindowMatrix.test.ts`, `src/chef/chefForecastServiceDate.test.ts`, `src/chef/chefSubmissionWindow.test.ts`, `src/services/chefForecastEligibilityPolicy.test.ts`, `src/services/operationalServiceCalendar.test.ts` |
| Page timing UX | `src/chef/chefForecastTimingUx.test.tsx` |
| Form / validation / soup-dessert | `src/chef/chefUx.test.tsx`, `src/chef/chefSoupDessertSync.test.tsx`, `src/chef/optionalFields.test.ts` |
| Submission lifecycle / GameBus bridge | `src/chef/chefForecastSubmissionLifecycle.test.tsx`, `src/gamebus/mapChefForecast.test.ts` |
| Retrieval | `src/serviceCloseout/forecast/selectCloseoutForecast.test.ts` |
| Menu vs calendar | `src/chef/chefAvailability.test.tsx`, `src/services/menuResolver.test.ts` |
