# Implementation status (initial)

**Baseline commit (pre-implementation docs):** `87748b36c3e02208c3cc33766a4003d33ef81819` (`main`)

**Purpose:** Distinguish **approved product targets**, **current code**, and **pending** decisions.

---

## Student Lunch

### Approved product contract

Canonical: [`../../features/student/student-lunch.feature`](../../features/student/student-lunch.feature) (**APPROVED PRODUCT TARGET**).

Confirmed highlights:

- Next operational lunch service (skip weekends + explicitly closed/non-service days)
- Do **not** redefine the service date by skipping a day only because menu data is missing
- Cutoff **23:59:00 Europe/Helsinki** (open at 23:58:59; closed at exactly 23:59:00); open page updates without reload
- Mutual Regular / Soup / No lunch packages; whole-number steppers 0…max; no blank-vs-zero UX
- Distinct review before final confirm; one-shot submit; failure/retry preserves draft

### Current implementation (this branch)

| Area | Status |
|------|--------|
| Route | Default / empty hash → student mode |
| Service date | `src/services/studentLunchServiceDate.ts` — next operational service; session-locked (midnight rollover still `@pending`) |
| Cutoff | `CANTEEN_CONFIG` 23:59:00; `submissionWindow` closes with `now >= deadline` |
| Review / confirm | Edit → Review → Confirm in `useLunchSelection` / `SelectionPanel` |
| Submit states | `idle` / `sending` / `failed` / `success` with retry on failure |
| Activity | `studentLunchCheckin` via `mapStudentLunchCheckin` / `tryPostActivity` |

### Remaining LIVE GameBus verification only

Cannot be closed from this repo’s Vitest stack (no browser E2E):

- Student A/B login → mission open → submit → GameBus persistence / mission complete
- Cross-account isolation and task reopen rules
- Parent ACK after `postMessage` ACTIVITY

### Still `@pending` in Gherkin (not silently invented)

- Final business maximum quantity value (configured max remains in use)
- All-zero attending meal package validity (current code still requires ≥1 positive component on Regular/Soup)
- Open-page behaviour across Helsinki midnight (service date is locked for the page session until product decides)
- Future student dashboard / gamification (out of scope)

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
| **Status** | **No route or application module** found on `main` at baseline (not in `appMode.ts`). |
| **Evidence** | Only mentioned in proposed Trim Smart / future-work documentation, not as shipped game code. |

---

## Rescue & Reuse

| | |
|--|--|
| **Status** | **No route or application module** found on `main` at baseline. |
| **Evidence** | Described as a **separate future game** in [`../product/waste-challenges/TRIM_SMART.md`](../product/waste-challenges/TRIM_SMART.md) (proposed); not implemented in this repository. |

---

## How to update this file

When a product decision is approved or implementation changes, update the relevant section and point to source paths or contracts. Do not mark gaps as closed without verification against both contract and code.
