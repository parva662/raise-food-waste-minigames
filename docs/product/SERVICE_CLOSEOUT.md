# Service Closeout

**Documentation role:** Canonical product navigation page.
**Does not invent new product rules** — organizes existing documentation.

---

## Purpose

End-of-service recording of actuals and overproduction waste for the canteen service day (`wasteMeasurement` ACTIVITY). Complements Kitchen Forecast and student declaration data.

One shared whole-canteen closeout per service date. Authenticated GameBus `activity.actor` owns the ACTIVITY. There is no separate head-chef / recorder property.

---

## Authoritative documents

| Role | Path | Status |
|------|------|--------|
| **Approved Gherkin** | [`../../features/kitchen/service-closeout.feature`](../../features/kitchen/service-closeout.feature) | **APPROVED PRODUCT TARGET** |
| **Acceptance coverage** | [`../testing/SERVICE_CLOSEOUT_ACCEPTANCE_COVERAGE.md`](../testing/SERVICE_CLOSEOUT_ACCEPTANCE_COVERAGE.md) | Traceability |
| **GameBus contract** | [`../contracts/SERVICE_CLOSEOUT_GAMEBUS.md`](../contracts/SERVICE_CLOSEOUT_GAMEBUS.md) | **EXTERNAL / GAMEBUS CONTRACT** |
| **Implementation status** | [`../current-state/IMPLEMENTATION_STATUS.md`](../current-state/IMPLEMENTATION_STATUS.md) | **CURRENT IMPLEMENTATION** |
| **Study / system plan** | [`RAISE_BARLAUREA_MASTER_PLAN.md`](RAISE_BARLAUREA_MASTER_PLAN.md) | Mixed study + product (stale head-chef / IC wording corrected where verified) |
| **Legacy mixed spec** | [`../archive/SPEC_LEGACY.md`](../archive/SPEC_LEGACY.md) §10 | **HISTORICAL** |
| **Related forecast contract** | [`../contracts/KITCHEN_FORECAST_GAMEBUS.md`](../contracts/KITCHEN_FORECAST_GAMEBUS.md) | Inbound forecast eligibility |
| **Roadmap** | [`../current-state/ROADMAP.md`](../current-state/ROADMAP.md) | Integration steps |

---

## Relevant source and route

| Item | Location |
|------|----------|
| Route | `#/service-closeout` |
| App | `src/serviceCloseout/` |
| ACTIVITY mapping | `src/gamebus/mapWasteMeasurement.ts`, builders |
| Group activities read | `kitchenGroupInput.activities` |

---

## Locked product highlights

- Service date = Europe/Helsinki calendar day (not Kitchen Forecast 08:30).
- Missing menu does not change the service date; Finalize is blocked.
- Actual customers / prepared / waste: required whole integers; blank ≠ zero; 0 valid; max 1000 for quantities.
- Overproduction UI grams → GameBus kg once at mapper (`grams / 1000`).
- Overproduction cannot exceed prepared weight; zero prepared + positive waste is invalid.
- Forecast is read-only context; missing forecast does not block closeout.
- Synthetic forecast fallback is pilot/dev only; disable before production data collection.
- Exactly fifteen `wasteMeasurement` properties; no portion weights / headChefUserId / forecast fields posted.

---

## Unresolved / pending (see Gherkin `@pending`)

- Open-page midnight rollover for closeout service date.
- Own-forecast vs all-staff forecast display on the closeout UI.
- Invalid / missing portion-weight reference handling.
- Forecast item-ID mismatch with closeout menu item ID.
- Production authorization mechanism (platform).
- Cross-session one-closeout-per-date enforcement; duplicate `wasteMeasurement` consumer selection rule.
