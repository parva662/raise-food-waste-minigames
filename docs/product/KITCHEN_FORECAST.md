# Kitchen Forecast

**Documentation role:** Canonical product navigation page.
**Does not invent new product rules** — organizes existing documentation.

---

## Purpose

Authorized kitchen staff declare an expected lunch forecast for an upcoming service (`chefForecast` ACTIVITY). Used for research and operational comparison with student declarations and service closeout.

---

## Authoritative documents

| Role | Path | Status |
|------|------|--------|
| **GameBus contract** | [`../contracts/KITCHEN_FORECAST_GAMEBUS.md`](../contracts/KITCHEN_FORECAST_GAMEBUS.md) | **EXTERNAL / GAMEBUS CONTRACT** |
| **Admin / template setup** | [`../contracts/KITCHEN_FORECAST_ADMIN_SETUP.md`](../contracts/KITCHEN_FORECAST_ADMIN_SETUP.md) | Operational checklist |
| **Implementation status** | [`../current-state/IMPLEMENTATION_STATUS.md`](../current-state/IMPLEMENTATION_STATUS.md) | **CURRENT IMPLEMENTATION** |
| **Study / system plan** | [`RAISE_BARLAUREA_MASTER_PLAN.md`](RAISE_BARLAUREA_MASTER_PLAN.md) | Mixed study + product |
| **Legacy mixed spec** | [`../archive/SPEC_LEGACY.md`](../archive/SPEC_LEGACY.md) §9 | **HISTORICAL** |
| **Roadmap** | [`../current-state/ROADMAP.md`](../current-state/ROADMAP.md) | Integration steps |

No approved kitchen `.feature` file exists yet under `features/kitchen/`.

---

## Relevant source and route

| Item | Location |
|------|----------|
| Route | `#/chef` |
| App | `src/chef/` |
| Service date helpers | `src/services/operationalServiceCalendar.ts`, chef eligibility policies |
| ACTIVITY mapping | `src/gamebus/` chef forecast builders / mappers |

---

## Unresolved / pending (from existing docs)

- Detailed doc migration review still pending (see implementation status).
- Live GameBus template migration steps remain in the roadmap and admin setup guides.
- Do not invent new forecast business rules in this navigation page.
