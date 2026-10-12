# How-to: diagnose Forecast Results (`#/chef-results`)

**Documentation role:** How-to guide — diagnose empty / wrong participant results, Progress, or status chips.
**Does not** change product rules, application code, or GameBus configuration.

Separate these layers on every diagnosis:

| Layer | Where truth lives |
|-------|-------------------|
| **Intended product behaviour** | [`../../features/kitchen/kitchen-results-participant.feature`](../../features/kitchen/kitchen-results-participant.feature), [`../product/KITCHEN_RESULTS.md`](../product/KITCHEN_RESULTS.md) |
| **Current implementation** | `src/products/forecast-results/` + [`../current-state/IMPLEMENTATION_STATUS.md`](../current-state/IMPLEMENTATION_STATUS.md) |
| **Live GameBus data / config** | foodtracker Input Collections, templates, and which activities the embed actually delivers |
| **Europe/Helsinki date / eligibility** | Forecast windows + closeout eligibility (below) |

Related coverage notes: [`../testing/KITCHEN_RESULTS_PARTICIPANT_ACCEPTANCE_COVERAGE.md`](../testing/KITCHEN_RESULTS_PARTICIPANT_ACCEPTANCE_COVERAGE.md). Input Collection inspection: [`verify-input-collections.md`](verify-input-collections.md).

---

## 1. Confirm the surface and identity

1. Route is `#/chef-results` (participant), not `#/chef-results-admin`.
2. Embed received `INPUT_COLLECTIONS` and `inputCollectionPari.me` parses to the expected GameBus user (`id`, names).
3. Optional on this route only: open `#/chef-results?gamebusDebug=1` and check the browser console for `[gamebus] authenticated user` (id / name). The participant page does **not** render an on-page Input Collections debug panel. Wider console logging: [`verify-input-collections.md`](verify-input-collections.md).

If `me.id` does not match the `actorId` on the person’s `chefForecast` activities, Progress and own-day metrics stay empty even when closeout exists — that is identity mismatch, not “waiting for closeout”.

---

## 2. Europe/Helsinki dashboard date (product vs forecast windows)

**Intended / implemented:** participant dashboard date = **current Europe/Helsinki calendar day**, rolling at **midnight**, not at Kitchen Forecast **08:30**.

| Observation | Interpretation |
|-------------|----------------|
| Weekend / explicit closure | Header **No service today**; Progress remains available |
| Missing menu on an open weekday | Still an operational service day; do not treat as non-service |
| Header **Waiting for service closeout** | Operational day, no finalized closeout yet; Progress history must not clear |
| Header / overview **No forecast for this service** | See §3 — closeout exists; personal eligible forecast does not |

Forecast **submission** windows (08:00–08:29 today / 08:30+ next service) are Kitchen Forecast rules — they do **not** redefine the results dashboard date. Contracts: [`../contracts/KITCHEN_FORECAST_GAMEBUS.md`](../contracts/KITCHEN_FORECAST_GAMEBUS.md).

---

## 3. Diagnose “No forecast for this service”

Exact UI copy (header chip and overview message): **No forecast for this service**.

### Intended product behaviour

- Missing forecast is omitted from aggregation (not treated as zero performance).
- Closeout without a personal forecast still shows the **actual kitchen outcome**.
- Personal simulated comparison is unavailable until the participant has a valid eligible forecast for that service date.
- Progress history is independent of this overview state.

### Current implementation (`#/chef-results`)

Status selection in `ForecastResultsParticipantApp` (simplified):

1. Not an operational service day → **No service today**
2. Else if the participant has a complete own daily result → **Result ready**
3. Else if a closeout exists for the dashboard service date → **No forecast for this service** (`no-forecast`)
4. Else → **Waiting for service closeout**

Overview current-service status shows **No forecast for this service** when `hasCloseout && !ownResult`. Personal simulated comparison for that date is unavailable. The actual kitchen outcome for that date may still appear. An earlier completed personal result stays visible as **Latest forecast result** and is not replaced by another chef or by the group.

`ownResult` requires an eligible `chefForecast` for the authenticated user on that Helsinki service date that participates in the shared daily calculation (closeout + eligible forecasts from `kitchenGroupInput`).

### Diagnostic sequence (do not change eligibility)

Work top-down; stop when the layer that fails is clear.

| Step | Check | If missing / mismatched |
|------|--------|-------------------------|
| 1. Service date | Header service date = Europe/Helsinki **calendar day** for the scenario under test | Wrong day / timezone assumption — not eligibility |
| 2. Closeout present | Finalized `wasteMeasurement` for that `targetDate` / service date in the group kitchen feed | You should see **Waiting for service closeout**, not this chip |
| 3. Relevant Input Collection | `kitchenGroupInput.activities` delivered to the embed (not Kitchen Skills self/trainer feeds) | Live GameBus menu / payload slice — see [`verify-input-collections.md`](verify-input-collections.md) |
| 4. Own forecast present | A `chefForecast` with exact `targetDate` = that service date appears in the same feed | Live data: user never submitted, or feed omitted the activity |
| 5. Actor / user-id matching | Forecast `actorId` === authenticated `inputCollectionPari.me.id` | Identity mismatch — closeout can show; personal result stays empty |
| 6. Europe/Helsinki eligibility | For actor + exact `targetDate = D`, `submittedAt` must fall in one of the **unchanged** windows: previous operational day `P` **08:30:00–23:59:59**, or day `D` **08:00:00–08:29:59**; latest eligible wins | Forecast exists but is **ineligible** — product/retrieval rule, not a parser invention |

Eligibility detail and “latest eligible” rules: [`../contracts/KITCHEN_FORECAST_GAMEBUS.md`](../contracts/KITCHEN_FORECAST_GAMEBUS.md). Implementation anchors: `selectForecastsForDate` / `chefForecastEligibilityPolicy`, `groupCalculationSource`, `DashboardHeader` (`no-forecast`).

### Live GameBus vs product vs code

| Layer | Typical conclusion |
|-------|-------------------|
| Live data | Closeout in feed, no `chefForecast` for this actor/date, or truncated group activities |
| Product / eligibility | Forecast outside Helsinki windows or actor mismatch — do **not** invent fallbacks |
| Implementation bug | Only if code disagrees with approved Gherkin for the same inputs |

---

## 4. Eligibility checks for a completed Progress day

A Progress service point requires **both**:

1. An **eligible** `chefForecast` for that `targetDate` owned by the authenticated actor.
2. A finalized `wasteMeasurement` closeout for that same service date.

**Eligibility (shared with closeout / forecast retrieval):** for actor + exact `targetDate = D`, keep only forecasts whose `submittedAt` falls in Europe/Helsinki:

1. previous operational service day `P`, **08:30:00–23:59:59**; or
2. day `D`, **08:00:00–08:29:59**.

Then take the **latest eligible** `submittedAt`. A later **ineligible** activity must never replace an earlier eligible one. Never fall back to another `targetDate`.

Progress also filters `serviceDate <= asOfServiceDate` (Helsinki dashboard day).

Code anchors: `chefForecastEligibilityPolicy` / `selectCloseoutForecast`, `groupCalculationSource`, `participantProgressData`.

---

## 5. Progress UI structure (do not misread empty tabs)

Progress has **Recent** (last 8 completed services for this actor only), **Trends** (Week / Month / Year), and **History** (filtered / paged). Team comparison appears only in Overview, for the latest personal service. No team summary is appended to any Progress view.

| Symptom | Likely cause |
|---------|----------------|
| All Progress empty while header waits for today | No historical eligible forecast + closeout pair for this actor in the delivered payload |
| Trends Month empty, Year has points | Calendar period filter — not waiting logic |
| Recent empty, History has rows | Fewer than needed completed services in the Recent window, or filtering |
| Chart shows one point, no trend claim | Expected for a single chartable bucket |

---

## 6. Decision tree (product vs implementation vs live)

1. **Product:** Is waiting-without-clearing-Progress, midnight dashboard date, `no-forecast` vs waiting, and eligibility/actor matching the approved behaviour? If yes, do not “fix” product by inventing fallbacks.
2. **Implementation:** Repro under Vitest / fixtures (`participantProgressSection`, `groupCalculationSource`, eligibility tests, dashboard status tests). Fix only if code disagrees with approved Gherkin.
3. **Live GameBus:** Inspect whether `kitchenGroupInput.activities` actually contains the historical `chefForecast` / `wasteMeasurement` rows for this actor and dates. Payload slice limits are **platform**, not minigame pagination.

Never collapse these three layers into one conclusion.


## Handover verification (12 October 2026)

The Cursor worktree is C:/Users/20184558/gamebus-kitchen-day at 50de84c; the older main checkout is a different working tree. Standalone localhost selects a development fixture (default fixture-user-c), independent of any GameBus login elsewhere. Embedded results use inputCollectionPari.me.id and filter kitchenGroupInput.activities by chefForecast actor.id plus exact eligible targetDate and matching closeout serviceDate. No first-group-user fallback was found.

Mounted account-switch tests keep the same group feed while changing A to B, then an account with no activities and then missing identity. Personal dates clear correctly. The reproduced empty-state defect was a zero-valued Recent summary after personal data had cleared; the repeated group footer compounded the ambiguity. Neither result establishes the cause of the live GameBus incident. Verify the actual failing page's INPUT_COLLECTIONS and deployed build before attributing that incident to a specific account/configuration bug.

Live verification succeeded with two user-authorized accounts. Account A showed seven completed services (2 September through 6 October); its own Activities included the 6 October closeout with 300 customers and its forecast with 324 customers, consistent with the displayed 24-customer error. Account B showed "No activities yet" on its own Activities page, yet its Forecast Recent displayed the same seven dates and metrics, including 5.4 g/customer surplus, 0.0 shortage and 24-customer error for 6 October. The mismatch survived a full host-page reload. This reproduces the incident; it is not just a standalone fixture or a retained React tab.

The live iframe source was https://parva662.github.io/raise-food-waste-minigames/?v=07ea6dc#/chef-results?gamebusDebug=1 and its UI still used the older Kitchen Staff Dashboard presentation. The query value alone does not establish the deployed commit. The browser diagnostic log confirmed receipt of INPUT_COLLECTIONS but exposed nested values only as "Object". The actual delivered me.id and actor.id values have not been verified. Therefore a fixed/shared identity input, host caching, and a different deployed implementation remain hypotheses, not established causes. Obtain a redacted live inputCollectionPari.me/forecast actor-ID comparison and the admin Input Request configuration before claiming the root cause is fixed. No live configuration was changed. Repository tests cover the same seven-date/zero-account shape with synthetic identities; they do not substitute for the live payload check.

### Live deployed selector trace

The public asset actually observed by the browser, assets/index-DSi8HYOk.js, was inspected directly. Its participant component (`Z_` in that minified asset) uses parsed authenticated user ID in embedded mode. `q_` reads `pr(inputCollections)`, which parses `inputCollectionPari.me`. Forecast parsing reads `activity.actor.id`, not `createdBy.id`. The participant-date selector (`Hy`) includes only exact-date eligible forecasts with matching actorId. The Progress builder (`ik`) again finds a daily staff result with userId equal to that authenticated ID. Embedded detection compares window.parent with window; the fixture branch is used only outside an iframe. This rules out a first-staff/group-history fallback in these deployed selectors. It does not reveal the runtime ID values or establish whether the host identity request or activity attribution is wrong.

The existing debug flag is already enabled on the live iframe. The available browser log interface returns both authenticated-user and INPUT_COLLECTIONS objects only as the word Object; it cannot expand them. A local-only diagnostic would receive synthetic local inputs, not this cross-origin live host payload, unless the live embed configuration or deployed asset were changed. Neither was changed. The single next admin artifact needed is the `me` Input Request configuration in `inputCollectionPari` attached to `/staffdashboard`, showing request URL and how authentication is sourced (with credential values redacted).

### Editor configuration verified directly

Read-only inspection of the live GameBus editor confirmed `/staffdashboard` attaches `inputCollectionPari`, `kitchenGroupInput`, and `serviceCloseoutInputs`. The `me` request in `inputCollectionPari` points to `/api/me`. The `activities` request in `kitchenGroupInput` points to `/api/groups/activities` with the filter `{"activity":{"template":{"$in":["chefForecast","wasteMeasurement"]}}}`. Authentication is required for the page. No configuration values were changed. The editor request grid exposes endpoint/key and failure flags, but no response preview or authentication override was found. Direct browser navigation to the configured `/api/me` endpoint was blocked by the browser client, so this did not establish the actual delivered runtime me.id. The earlier request for a configuration screenshot is resolved; runtime ID evidence remains outstanding. The user reported the one-time console diagnostic did not work; its exact error/output is not yet known.
