# Service Closeout

**Documentation role:** Canonical product navigation page.
**Does not invent new product rules** — organizes existing documentation.

---

## Purpose

End-of-service recording of actuals and overproduction waste for the canteen service day (`wasteMeasurement` ACTIVITY). Complements Kitchen Forecast and student declaration data.

---

## Authoritative documents

| Role | Path | Status |
|------|------|--------|
| **GameBus contract** | [`../contracts/SERVICE_CLOSEOUT_GAMEBUS.md`](../contracts/SERVICE_CLOSEOUT_GAMEBUS.md) | **EXTERNAL / GAMEBUS CONTRACT** |
| **Implementation status** | [`../current-state/IMPLEMENTATION_STATUS.md`](../current-state/IMPLEMENTATION_STATUS.md) | **CURRENT IMPLEMENTATION** |
| **Study / system plan** | [`RAISE_BARLAUREA_MASTER_PLAN.md`](RAISE_BARLAUREA_MASTER_PLAN.md) | Mixed study + product |
| **Legacy mixed spec** | [`../archive/SPEC_LEGACY.md`](../archive/SPEC_LEGACY.md) §10 | **HISTORICAL** |
| **Related forecast contract** | [`../contracts/KITCHEN_FORECAST_GAMEBUS.md`](../contracts/KITCHEN_FORECAST_GAMEBUS.md) | Inbound forecast context |
| **Roadmap** | [`../current-state/ROADMAP.md`](../current-state/ROADMAP.md) | Integration steps |

No approved closeout `.feature` under `features/kitchen/` yet.

---

## Relevant source and route

| Item | Location |
|------|----------|
| Route | `#/service-closeout` |
| App | `src/serviceCloseout/` |
| ACTIVITY mapping | `src/gamebus/` waste-measurement builders / mappers |

---

## Unresolved / pending (from existing docs)

- Detailed migration/status review pending (implementation status).
- Live GameBus template/admin steps: see roadmap and closeout contract.
