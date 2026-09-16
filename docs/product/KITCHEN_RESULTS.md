# Kitchen Results (staff and management dashboards)

**Documentation role:** Canonical product navigation page for results views.
**Does not invent new product rules** — organizes existing documentation.

---

## Purpose

Read-only (in-app) feedback and research views over kitchen / participant forecast and related service data.

Two surfaces exist in the current repository:

1. **Kitchen Staff Dashboard / Chef Results (participant)** — participant-safe forecast feedback.
2. **Kitchen Management Dashboard (admin / research)** — broader staff/research view; route access and production authorization remain operational concerns.

---

## Authoritative documents

| Role | Path | Status |
|------|------|--------|
| **Implementation status** | [`../current-state/IMPLEMENTATION_STATUS.md`](../current-state/IMPLEMENTATION_STATUS.md) | **CURRENT IMPLEMENTATION** |
| **Study / system plan** | [`RAISE_BARLAUREA_MASTER_PLAN.md`](RAISE_BARLAUREA_MASTER_PLAN.md) | Mixed study + product |
| **Legacy mixed spec** | [`../archive/SPEC_LEGACY.md`](../archive/SPEC_LEGACY.md) §11 | **HISTORICAL** |
| **Forecast contract (upstream data)** | [`../contracts/KITCHEN_FORECAST_GAMEBUS.md`](../contracts/KITCHEN_FORECAST_GAMEBUS.md) | **EXTERNAL / GAMEBUS CONTRACT** |
| **Roadmap** | [`../current-state/ROADMAP.md`](../current-state/ROADMAP.md) | Integration / follow-ups |

| **Participant Gherkin** | [`../../features/kitchen/kitchen-results-participant.feature`](../../features/kitchen/kitchen-results-participant.feature) | **APPROVED PRODUCT TARGET** |
| **Admin Gherkin** | [`../../features/kitchen/kitchen-results-admin.feature`](../../features/kitchen/kitchen-results-admin.feature) | **APPROVED PRODUCT TARGET** |
| **Participant coverage** | [`../testing/KITCHEN_RESULTS_PARTICIPANT_ACCEPTANCE_COVERAGE.md`](../testing/KITCHEN_RESULTS_PARTICIPANT_ACCEPTANCE_COVERAGE.md) | Traceability |
| **Admin coverage** | [`../testing/KITCHEN_RESULTS_ADMIN_ACCEPTANCE_COVERAGE.md`](../testing/KITCHEN_RESULTS_ADMIN_ACCEPTANCE_COVERAGE.md) | Traceability |

### Locked product rules (this audit)

- Historical Progress is independent of the current service waiting / no-forecast state.
- Progress chart: 0 observations → empty; 1 → show data (no trend claim); 2+ → chart + trend.
- Other-staff comparison from **one** peer onward; label "Other staff" (1) / "Other staff median" (2+).
- Missing forecast is omitted from aggregation (not zero performance).
- Closeout without personal forecast still shows actual kitchen outcome.
- Forecast without closeout preserves dashboard structure and may show submitted forecast; metrics pending.
- Admin partial data must not collapse to a single empty paragraph.
- No composite score, ranking, or winner language.
- Shared calculation engine for participant and admin for the same actor + targetDate.

---

## Relevant source and routes

| Surface | Route | Source area |
|---------|-------|-------------|
| Staff / participant results | `#/chef-results` | `src/chefResults/` |
| Management / admin results | `#/chef-results-admin` | `src/chefResults/` (management views) |

Describe behaviour only from current source and existing docs. Detailed migration review is still pending per implementation status.

---

## Unresolved / pending (from existing docs)

- Production authorization for the management route.
- Doc migration review pending.
- Some calculation/data paths remain fixture-backed where noted in existing documentation and source.
