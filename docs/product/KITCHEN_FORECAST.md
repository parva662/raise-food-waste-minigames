# Kitchen Forecast

**Documentation role:** Canonical product navigation page.
**Does not invent new product rules** — organizes existing documentation.

---

## Purpose

Authorized kitchen staff declare an expected lunch forecast for an operational lunch service (`chefForecast` ACTIVITY). Each participant's own forecast is compared with the same shared whole-canteen Service Closeout for that service date. Kitchen Forecast is **not** compared against Student Lunch declarations.

---

## Authoritative documents

| Role | Path | Status |
|------|------|--------|
| **Acceptance rules** | [`../../features/kitchen/kitchen-forecast.feature`](../../features/kitchen/kitchen-forecast.feature) | **APPROVED PRODUCT TARGET** |
| **GameBus contract** | [`../contracts/KITCHEN_FORECAST_GAMEBUS.md`](../contracts/KITCHEN_FORECAST_GAMEBUS.md) | **EXTERNAL / GAMEBUS CONTRACT** |
| **Admin / template setup** | [`../contracts/KITCHEN_FORECAST_ADMIN_SETUP.md`](../contracts/KITCHEN_FORECAST_ADMIN_SETUP.md) | Operational checklist |
| **Implementation status** | [`../current-state/IMPLEMENTATION_STATUS.md`](../current-state/IMPLEMENTATION_STATUS.md) | **CURRENT IMPLEMENTATION** |
| **Study / system plan** | [`RAISE_BARLAUREA_MASTER_PLAN.md`](RAISE_BARLAUREA_MASTER_PLAN.md) | Mixed study + product |
| **Legacy mixed spec** | [`../archive/SPEC_LEGACY.md`](../archive/SPEC_LEGACY.md) §9 | **HISTORICAL** |
| **Roadmap** | [`../current-state/ROADMAP.md`](../current-state/ROADMAP.md) | Integration steps |

[`features/kitchen/kitchen-forecast.feature`](../../features/kitchen/kitchen-forecast.feature) is the approved acceptance specification. The timing/target-date model below is implemented on `main`; the only `@pending` scenario left is the open-page rollover edge case.

The GameBus contract carries the same timing model in [§A.1](../contracts/KITCHEN_FORECAST_GAMEBUS.md) (the earlier "tomorrow's published menu" wording was stale and has been corrected). No live GameBus configuration was changed.

---

## Approved product rules (see the Gherkin for full scenarios)

- **Identity:** personal authenticated GameBus account only; no shared kitchen account; no `chefId` in the payload.
- **Multiple staff:** several staff may forecast the same service date; each forecast is personal and isolated from the others.
- **One successful submission** per authenticated staff member per `targetDate`; a successful forecast is **final** (no replacement, correction, or “latest wins”). A **failed** submission created nothing and may be retried.
- **One automatically resolved target.** On an operational service day, Helsinki time alone decides the target — there is never a choice between two dates and no target-date picker:

  | Helsinki time | Target | Entry |
  |---|---|---|
  | 00:00:00–07:59:59 | none | **closed** |
  | 08:00:00–08:29:59 | **today** (same-day grace window) | open |
  | 08:30:00–23:59:59 | **next operational service** after today | open |

  Before 08:00 the page does **not** jump ahead to the next service merely because one exists. The **grace window** is deliberate: the kitchen professional responsible for that service may only know the operational situation and menu requirements on arriving that morning — Monday being the typical case. The next operational service skips weekends and explicitly closed days, and is **not** changed merely because menu data is unavailable.
- **No late forecasts:** once a service date's windows close, it can no longer be forecast. Normal successful forecasts are `on-time`; the schema may retain a `late` value only for compatibility.
- **Explicit target date:** every forecast carries `targetDate = D`. The service date is never inferred from `submittedAt`, and another service date is never substituted.
- **Quantities:** whole numbers **0–1000 inclusive**; negative, fractional, and >1000 are invalid. Blank = unanswered; explicit `0` = deliberate forecast; required editable fields must be answered.
- **Headcount vs portions:** independent forecasts; they need not sum, and a mismatch is never an error.
- **Soup menu:** soup and dessert are **one** forecast entered once; `forecastSoup` and `forecastDessert` carry the same quantity; dessert is not separately editable.
- **Optional context:** confidence and notes are optional and are **omitted** from the payload when unanswered (never `null` or empty string).
- **Missing menu:** operational service days and menu availability are **separate** concepts. A weekday that is not explicitly closed is an operational service day even when its menu data is missing; the resolved date is unchanged and only the menu-dependent form is blocked, with a clear unavailable/configuration message.
- **No review screen:** staff complete the form and submit directly; the Student Lunch review flow does not apply.
- **All-zero forecast:** valid, but requires explicit confirmation. Cancel creates nothing and keeps the form editable; confirm submits normally.
- **Forbidden on the payload:** `chefId`, `actors`, `provider`, `result`, `accuracy`, `waste`, `points`, `badge`.
- **Completion:** uses `ACTIVITY` (not `SILENT_ACTIVITY`) so the embedded task can complete and close.

---

## Pilot / GameBus test configuration (not product behaviour)

GameBus is currently configured to allow the embedded task to be played **up to 3 times** so the integration can be retested during the pilot.

This is **temporary operational test configuration**. It does not redefine Kitchen Forecast as a three-submission product, must not be encoded in the Gherkin, and must not be hard-coded in application logic. Intended production behaviour remains **one successful submission per staff member per `targetDate`**.

Replay availability is governed by the **GameBus task/play configuration**, not by the minigame. The minigame does not need to retrieve and display an earlier forecast on a fresh page purely to enforce production finality, and **no edit/replace workflow** exists.

Because the pilot can leave several activities behind, **retrieval must be robust**. An activity for exact `targetDate = D` is **eligible** only when `submittedAt` falls in one of these Europe/Helsinki windows:

1. on the immediately previous operational service day `P`, **08:30:00–23:59:59**; or
2. on `D` itself, **08:00:00–08:29:59**.

For a given authenticated actor + `targetDate`:

1. collect `chefForecast` activities carrying that exact `targetDate`;
2. remove activities outside the two windows above;
3. if several eligible activities remain, use the one with the **latest** `submittedAt`;
4. a later **ineligible** activity must never replace an earlier eligible one;
5. never fall back to a forecast for another `targetDate`.

"Latest eligible activity" exists to make pilot data deterministic. It is **not** permission for production users to submit multiple forecasts, and the current replay count must not be hard-coded into product logic.

---

## Relevant source and route

| Item | Location |
|------|----------|
| Route | `#/chef` |
| App | `src/chef/` |
| Window boundaries | `src/config/chef.ts`, `src/services/chefForecastWindow.ts` |
| Target-date resolution | `src/services/operationalServiceCalendar.ts` |
| Retrieval eligibility | `src/services/chefForecastEligibilityPolicy.ts`, `src/serviceCloseout/forecast/selectCloseoutForecast.ts` |
| ACTIVITY mapping | `src/gamebus/` chef forecast builders / mappers |

---

## Unresolved / pending

One open product decision remains, kept as a `@pending` scenario in the approved acceptance specification:

- **Open-page service-date rollover.** What happens to a page left open across a window boundary is deliberately deferred for the pilot.

Also still outstanding:

- Live GameBus template migration and embedded end-to-end verification remain manual work; see the roadmap and admin setup guides.
- Do not invent new forecast business rules in this navigation page.
