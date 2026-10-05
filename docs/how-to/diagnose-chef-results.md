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

Overview body (`ParticipantOverviewSection`) shows the same **No forecast for this service** message when `hasCloseout && !ownResult`, with hint that personal simulated comparison is unavailable while the actual kitchen outcome may still appear.

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

On current `main`, Progress has **Recent** (last 8 completed services), **Trends** (Week / Month / Year), and **History** (filtered / paged).

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
