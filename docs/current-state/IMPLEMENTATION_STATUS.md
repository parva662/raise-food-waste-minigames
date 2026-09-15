# Implementation status (initial)

**Baseline commit:** `019ce6637c2b75319b0c86a6a099b0645ec9ae4f` (`main`)

**Purpose:** Short distinction between **approved product targets**, **current code**, and **proposed** docs. Not a full gap analysis.

---

## Student Lunch

### Approved product target

Canonical contract: [`../../features/student/student-lunch.feature`](../../features/student/student-lunch.feature) (**APPROVED PRODUCT TARGET**).

Explicitly approved (among other rules in that file):

- **Next operational lunch service** as the declaration target (not simply calendar tomorrow; weekends and explicitly closed service days skipped; valid menu required).
- **23:59:00 Europe/Helsinki** cutoff (open before 23:59:00; closed exactly at 23:59:00; already-open page must respect the cutoff).

### Current implementation

- Route (standalone): default app at `/` (hash empty)
- GameBus activity: `studentLunchCheckin`
- Target date: Helsinki **calendar tomorrow** via `getTomorrowIsoDate()` in `useLunchSelection.ts`
- Deadline: **23:00:00** Europe/Helsinki in `CANTEEN_CONFIG` / `submissionWindow.ts`

### Known gaps

- Current target-date behaviour **differs** from the approved next-operational-service rule.
- Current cutoff behaviour **differs** from the approved 23:59 rule.
- **Detailed implementation gap analysis has not yet been completed** beyond the points above.

---

## Kitchen Forecast

| | |
|--|--|
| **Status** | **Implemented** on `main` (`#/chef`, `chefForecast` ACTIVITY) |
| **Migration / doc review** | Pending ([`../contracts/KITCHEN_FORECAST_GAMEBUS.md`](../contracts/KITCHEN_FORECAST_GAMEBUS.md), [`../archive/SPEC_LEGACY.md`](../archive/SPEC_LEGACY.md) §9) |

---

## Service Closeout

| | |
|--|--|
| **Status** | **Implemented** on `main` (`#/service-closeout`, `wasteMeasurement` ACTIVITY) |
| **Migration / doc review** | Pending ([`../contracts/SERVICE_CLOSEOUT_GAMEBUS.md`](../contracts/SERVICE_CLOSEOUT_GAMEBUS.md), [`../archive/SPEC_LEGACY.md`](../archive/SPEC_LEGACY.md) §10) |

---

## Kitchen Staff Dashboard / Chef Results (participant)

| | |
|--|--|
| **Status** | **Implemented** on `main` (`#/chef-results`; read-only UI, fixture-backed calculation engine) |
| **Migration / doc review** | Pending ([`../archive/SPEC_LEGACY.md`](../archive/SPEC_LEGACY.md) §11; [`../product/KITCHEN_RESULTS.md`](../product/KITCHEN_RESULTS.md)) |

---

## Kitchen Management Dashboard (admin / research)

| | |
|--|--|
| **Status** | **Implemented** on `main` (`#/chef-results-admin`; hidden route, authorization TBD) |
| **Migration / doc review** | Pending |

---

## Trim Smart (practical kitchen)

| | |
|--|--|
| **Status** | **Implemented** on `main` (`#/waste/trim-smart`, `trimSmart` ACTIVITY, multi-ingredient session per ingredient) |
| **Current v1** | Participant flow: Ingredient → Practice → Measure; see `src/trimSmart/` |
| **Proposed target docs** | [`../product/waste-challenges/`](../product/waste-challenges/) (**WORKING / PROPOSED**; not v1) |
| **Current vs target review** | Pending |

---

## Improving Portion Control

| | |
|--|--|
| **Status** | **No route or application module** found on `main` at baseline commit (not in `appMode.ts`). |
| **Evidence** | Only mentioned in proposed Trim Smart / future-work documentation, not as shipped game code. |

---

## Rescue & Reuse

| | |
|--|--|
| **Status** | **No route or application module** found on `main` at baseline commit. |
| **Evidence** | Described as a **separate future game** in [`../product/waste-challenges/TRIM_SMART.md`](../product/waste-challenges/TRIM_SMART.md) (proposed); not implemented in this repository. |

---

## How to update this file

When a product decision is approved or implementation changes, update the relevant section and point to source paths or contracts. Do not mark gaps as closed without verification against both contract and code.
