# Kitchen Results (staff and management dashboards)

**Documentation role:** Explanation — product navigation page for results views.
**Does not invent new product rules** — organizes existing documentation. Acceptance SoT: approved `.feature` files; implementation: `src/products/forecast-results/` + `docs/current-state/`.

---

## Purpose

Read-only (in-app) feedback and research views over kitchen / participant forecast and related service data.

Two surfaces exist in the current repository:

1. **Kitchen Staff Dashboard / Chef Results (participant)** — participant-safe forecast feedback.
2. **Kitchen Management Dashboard (Chef / admin / research)** — unified read-only management view at `#/chef-results-admin` with two main areas: **Forecast & Service** (Overview / Staff / Trends / History) and **Kitchen Skills** (Overview / Participants / Sessions / Assessments). Initial service date prefers **Europe/Helsinki today** when that date has data, else the most recent past date, else the nearest future date (labelled upcoming). Production authorization is GameBus page/menu + Input Collections (not SPA hard-coding); operators: [`../how-to/configure-chef-management-dashboard-access.md`](../how-to/configure-chef-management-dashboard-access.md).

---

## Authoritative documents

| Role | Path | Status |
|------|------|--------|
| **Implementation status** | [`../current-state/IMPLEMENTATION_STATUS.md`](../current-state/IMPLEMENTATION_STATUS.md) | **CURRENT IMPLEMENTATION** |
| **Study / system explanation** | [`RAISE_BARLAUREA_MASTER_PLAN.md`](RAISE_BARLAUREA_MASTER_PLAN.md) | Explanation only — not product SoT |
| **Legacy mixed spec** | [`../archive/SPEC_LEGACY.md`](../archive/SPEC_LEGACY.md) §11 | **HISTORICAL** |
| **Forecast contract (upstream data)** | [`../contracts/KITCHEN_FORECAST_GAMEBUS.md`](../contracts/KITCHEN_FORECAST_GAMEBUS.md) | **EXTERNAL / GAMEBUS CONTRACT** |
| **Roadmap** | [`../current-state/ROADMAP.md`](../current-state/ROADMAP.md) | Integration / follow-ups |

| **Participant Gherkin** | [`../../features/kitchen/kitchen-results-participant.feature`](../../features/kitchen/kitchen-results-participant.feature) | **APPROVED PRODUCT TARGET** |
| **Admin Gherkin** | [`../../features/kitchen/kitchen-results-admin.feature`](../../features/kitchen/kitchen-results-admin.feature) | **APPROVED PRODUCT TARGET** |
| **Participant coverage** | [`../testing/KITCHEN_RESULTS_PARTICIPANT_ACCEPTANCE_COVERAGE.md`](../testing/KITCHEN_RESULTS_PARTICIPANT_ACCEPTANCE_COVERAGE.md) | Traceability |
| **Admin coverage** | [`../testing/KITCHEN_RESULTS_ADMIN_ACCEPTANCE_COVERAGE.md`](../testing/KITCHEN_RESULTS_ADMIN_ACCEPTANCE_COVERAGE.md) | Traceability |

### Locked product rules (this audit)

- Participant dashboard date = current Europe/Helsinki calendar day; rolls at **midnight**, not at Kitchen Forecast 08:30.
- Weekend / explicitly closed weekday → header shows that calendar date with status **No service today**; Progress remains available.
- Missing menu does not make an operational weekday a non-service day.
- Historical Progress is independent of the current service waiting / no-forecast / no-service state.
- Participant Overview (`#/chef-results`): compact current-service status in the header (**Results pending** / **Result ready** / **No forecast for this service**), the authenticated chef’s latest completed result (simulated surplus and shortage in g/customer, customer forecast error), then You vs Team for that same service in the same units. **Results pending** does not hide an earlier completed personal result; never show **Results pending** without a personal forecast.
- Personal history is only a service where that chef has an eligible `chefForecast` and a matching closeout. Join is `activity.actor.id` to `inputCollectionPari.me.id` on `kitchenGroupInput.activities`. A chef with no own forecast has no personal history. Group results never fill Recent, Trends, or History.
- Participant Progress: **Recent** (last 8 own services), **Trends** (Week / Month / Year), and **History**. Recent is a compact newest-first list without repeated summary cards or charts. Trends owns period KPIs, one bounded chart and previous-period comparison. History is a date-filtered, paginated archive. No team footer appears in Progress.
- Progress chart: 0 observations → empty; 1 → show data (no trend claim); 2+ → chart + trend.
- You vs Team from **one** other staff member onward. Label is "Team". One other staff member is not called a median; two or more use an anonymous median that excludes the participant.
- Missing forecast is omitted from aggregation (not zero performance).
- Closeout without a personal forecast for that service still shows the actual kitchen outcome for that service, and does not invent personal metrics.
- Forecast without closeout preserves dashboard structure and may show submitted forecast; metrics pending.
- Admin partial data must not collapse to a single empty paragraph; Forecast & Service secondary tabs remain available.
- Admin History includes complete, forecast-only, and closeout-only services without converting missing values to zero.
- Admin Kitchen Skills uses `kitchenSkillsTrainerInput` (group feed), never `kitchenGroupInputSelf`.
- Admin Forecast & Service keeps its historical service-date selector (not a "today dashboard"). Kitchen Skills does not use that selector; it shows an independent reporting period defaulting to all recorded sessions.
- Staff, participant, and session details open in a contextual drawer so the main dashboard stays compact.
- Kitchen Skills Overview reports mean time-efficiency and preparation-quality scores separately per module from recorded `wastePracticeReview` assessments only; unassessed modules are shown as not assessed (not zero).
- No composite score, ranking, or winner language.
- Shared calculation engine for participant and admin for the same actor + targetDate.
- Management dashboard is read-only (no forecast, closeout, or tutor assessment submission).

Diagnosis: [`../how-to/diagnose-chef-results.md`](../how-to/diagnose-chef-results.md) · Input Collections: [`../how-to/verify-input-collections.md`](../how-to/verify-input-collections.md).

---

## Relevant source and routes

| Surface | Route | Source area |
|---------|-------|-------------|
| Staff / participant results | `#/chef-results` | `src/products/forecast-results/` |
| Management / admin results | `#/chef-results-admin` | `src/products/forecast-results/` (management views) |

Describe behaviour only from current source and existing docs. Detailed migration review is still pending per implementation status.

---

## Unresolved / pending (from existing docs)

- GameBus left-menu item + `isGloballyAvailable=false` for `/admindashboard` so only authorized Chef/admin groups see the management page ([`../how-to/configure-chef-management-dashboard-access.md`](../how-to/configure-chef-management-dashboard-access.md)). Input Collections on the page are already attached.
- Doc migration review pending.
- Some calculation/data paths remain fixture-backed where noted in existing documentation and source.
