# How-to: diagnose Forecast Results (`#/chef-results`)

**Documentation role:** How-to guide — diagnose empty / wrong participant results or Progress.
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
3. Optional: open with `?gamebusDebug=1` and confirm identity debug matches the account under test.

If `me.id` does not match the `actorId` on the person’s `chefForecast` activities, Progress and own-day metrics stay empty even when closeout exists — that is identity mismatch, not “waiting for closeout”.

---

## 2. Europe/Helsinki dashboard date (product vs forecast windows)

**Intended / implemented:** participant dashboard date = **current Europe/Helsinki calendar day**, rolling at **midnight**, not at Kitchen Forecast **08:30**.

| Observation | Interpretation |
|-------------|----------------|
| Weekend / explicit closure | Header **No service today**; Progress must remain available |
| Missing menu on an open weekday | Still an operational service day; do not treat as non-service |
| Waiting for today’s closeout | Overview may wait; **Progress history must not clear** |

Forecast **submission** windows (08:00–08:29 today / 08:30+ next service) are Kitchen Forecast rules — they do **not** redefine the results dashboard date. Contracts: [`../contracts/KITCHEN_FORECAST_GAMEBUS.md`](../contracts/KITCHEN_FORECAST_GAMEBUS.md).

---

## 3. Eligibility checks for a completed Progress day

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

## 4. Progress UI structure (do not misread empty tabs)

On current `main`, Progress has **Recent** (last 8 completed services), **Trends** (Week / Month / Year), and **History** (filtered / paged).

| Symptom | Likely cause |
|---------|----------------|
| All Progress empty while header waits for today | No historical eligible forecast + closeout pair for this actor in the delivered payload |
| Trends Month empty, Year has points | Calendar period filter — not waiting logic |
| Recent empty, History has rows | Fewer than needed completed services in the Recent window, or filtering |
| Chart shows one point, no trend claim | Expected for a single chartable bucket |

---

## 5. Decision tree (product vs implementation vs live)

1. **Product:** Is waiting-without-clearing-Progress, midnight dashboard date, and eligibility/actor matching the approved behaviour? If yes, do not “fix” product by inventing fallbacks.
2. **Implementation:** Repro under Vitest / fixtures (`participantProgressSection`, `groupCalculationSource`, eligibility tests). Fix only if code disagrees with approved Gherkin.
3. **Live GameBus:** Inspect whether `kitchenGroupInput.activities` (or the embed’s group kitchen feed) actually contains the historical `chefForecast` / `wasteMeasurement` rows for this actor and dates. Payload slice limits are **platform**, not minigame pagination.

Never collapse these three layers into one conclusion.
