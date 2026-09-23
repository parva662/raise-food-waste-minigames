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

### Contract documentation

- [`../contracts/STUDENT_LUNCH_GAMEBUS.md`](../contracts/STUDENT_LUNCH_GAMEBUS.md) now separates approved product semantics, the canonical ACTIVITY contract, current implementation, and pending manual admin work. It documents the next-operational-service target (not calendar tomorrow), the 7 always-required + up to 4 conditional item-ID properties (maximum 11 links), and that Student Lunch has no `timingStatus` property and never sends `studentId`.
- No live GameBus configuration was changed, and no live ingest has been verified from this repository.

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
| **Product specification** | **Approved** — [`../../features/kitchen/kitchen-forecast.feature`](../../features/kitchen/kitchen-forecast.feature) |
| **Repository implementation** | **Complete for the pilot target**, except the deferred `@pending @rollover` scenario |
| **Repository contracts / docs** | **Reviewed and aligned** ([`../contracts/KITCHEN_FORECAST_GAMEBUS.md`](../contracts/KITCHEN_FORECAST_GAMEBUS.md), [`../contracts/KITCHEN_FORECAST_ADMIN_SETUP.md`](../contracts/KITCHEN_FORECAST_ADMIN_SETUP.md)); [`../archive/SPEC_LEGACY.md`](../archive/SPEC_LEGACY.md) §9 stays **HISTORICAL** |
| **Live GameBus setup** | **Pending** — manual admin template/link configuration and embedded end-to-end verification |
| **Acceptance coverage** | Repository Gherkin → Vitest map: [`../testing/KITCHEN_FORECAST_ACCEPTANCE_COVERAGE.md`](../testing/KITCHEN_FORECAST_ACCEPTANCE_COVERAGE.md) |

### Approved timing model — implemented

- **Operational calendar is independent of menu availability.** `isOperationalServiceDay` = weekday AND not explicitly closed (`isExplicitlyClosedServiceDate`, which reads closure configuration only). Next/previous operational service resolution skips weekends and explicit closures, never a date whose menu content is merely missing. Student Lunch now shares this single definition; its approved behaviour is unchanged.
- Helsinki time alone resolves one target: closed before 08:00, today's service 08:00:00–08:29:59, next operational service 08:30:00–23:59:59. No target-date picker.
- Before 08:00 the page keeps today as the target and stays closed instead of jumping ahead to the next service.
- Non-operational days (weekends, explicitly closed days) have no open window.
- Retrieval eligibility for target date `D`: submitted on the previous operational service day 08:30:00–23:59:59, or on `D` 08:00:00–08:29:59. Everything else is ignored, exact `targetDate` matching only, and a later ineligible activity never replaces an earlier eligible one.
- Window copy and countdown follow the active window: `08:30 today` during the grace window, midnight during the advance window.

### Still `@pending` in Gherkin (not silently invented)

- Open-page service-date rollover across a window boundary (deferred for the pilot).

### Contract documentation

- [`../contracts/KITCHEN_FORECAST_GAMEBUS.md`](../contracts/KITCHEN_FORECAST_GAMEBUS.md) §A.1 now documents the target-resolution table, the eligible retrieval windows, and the pilot latest-eligible rule; the stale "tomorrow's published menu" wording is gone. The `late` enum is retained for schema compatibility and documented as never produced.
- [`../contracts/KITCHEN_FORECAST_ADMIN_SETUP.md`](../contracts/KITCHEN_FORECAST_ADMIN_SETUP.md) states that 0–1000 is the business range and that the wider legacy schema maximum is an admin/compatibility detail; tightening live schemas remains a separate manual admin decision.
- No live GameBus configuration was changed.

---

## Service Closeout

| | |
|--|--|
| **Status** | **Implemented** on `main` (`#/service-closeout`, `wasteMeasurement` ACTIVITY) |
| **Gherkin** | [`../../features/kitchen/service-closeout.feature`](../../features/kitchen/service-closeout.feature) |
| **Coverage** | [`../testing/SERVICE_CLOSEOUT_ACCEPTANCE_COVERAGE.md`](../testing/SERVICE_CLOSEOUT_ACCEPTANCE_COVERAGE.md) |
| **Contract** | [`../contracts/SERVICE_CLOSEOUT_GAMEBUS.md`](../contracts/SERVICE_CLOSEOUT_GAMEBUS.md) |
| **Notes** | Synthetic forecast fallback still enabled for pilot; production authorization remains platform-dependent |

---

## Kitchen Staff Dashboard / Chef Results (participant)

| | |
|--|--|
| **Status** | **Implemented** on `main` (`#/chef-results`; Helsinki midnight dashboard date; shared calculation engine; GameBus group INPUT_COLLECTIONS when embedded; fixtures in standalone) |
| **Gherkin** | [`../../features/kitchen/kitchen-results-participant.feature`](../../features/kitchen/kitchen-results-participant.feature) |
| **Coverage** | [`../testing/KITCHEN_RESULTS_PARTICIPANT_ACCEPTANCE_COVERAGE.md`](../testing/KITCHEN_RESULTS_PARTICIPANT_ACCEPTANCE_COVERAGE.md) |
| **Migration / doc review** | Legacy §11 is historical only; canonical product rules are in Gherkin + [`../product/KITCHEN_RESULTS.md`](../product/KITCHEN_RESULTS.md) |

---

## Kitchen Management Dashboard (admin / research)

| | |
|--|--|
| **Status** | **Implemented** on `main` (`#/chef-results-admin`; hidden route; partial closeout/forecast states supported; authorization TBD) |
| **Gherkin** | [`../../features/kitchen/kitchen-results-admin.feature`](../../features/kitchen/kitchen-results-admin.feature) |
| **Coverage** | [`../testing/KITCHEN_RESULTS_ADMIN_ACCEPTANCE_COVERAGE.md`](../testing/KITCHEN_RESULTS_ADMIN_ACCEPTANCE_COVERAGE.md) |
| **Migration / doc review** | Authorization remains platform-enforced / `@pending` |

---

## Kitchen Day / practical kitchen

Canonical: [`../product/waste-challenges/KITCHEN_DAY.md`](../product/waste-challenges/KITCHEN_DAY.md) and [`GAMEBUS_SLUG_CONTRACT.md`](../product/waste-challenges/GAMEBUS_SLUG_CONTRACT.md) — **APPROVED PRODUCT TARGET**.

**CURRENT IMPLEMENTATION on `main`:** Trim Smart v1 only (`#/waste/trim-smart`, Ingredient → Practice → Measure, `practice` / `participantWasteGrams` / old categories).

**CURRENT IMPLEMENTATION on `feature/kitchen-day-v1`:** Phases 1–5 at `#/kitchen-day`: participant-specific session lock (TASK + `inputCollectionPari.me`), student/chef dashboards, session-level `wastePracticeReview`. One TASK must list `trimSmart` + `rescueAndReuse` + `portionPrecision` (see [`KITCHEN_DAY_TASK.md`](../contracts/KITCHEN_DAY_TASK.md)); review posts require `wastePracticeReview` on the current TASK. `#/waste/trim-smart` remains v1. Live posting is guarded: **LIVE E2E BLOCKED BY GAMEBUS ADMIN ALIGNMENT**.

**v1 product-review baseline:** The current Kitchen Day student/tutor UX, including the vertical Session Review at `#/kitchen-day/review`, is the approved product-review checkpoint for v1. This is a product-review baseline, not a production release.

**APPROVED TARGET:** connected Kitchen Day (Trim Smart + Rescue & Reuse + Portion Precision + one session-level chef review).

Gherkin: [`../../features/waste-challenges/`](../../features/waste-challenges/) — all **APPROVED PRODUCT TARGET**. Intentional `@pending`: percentile / ranking sufficient-data rule.

Implementation order: Phase 0 GameBus admin → 1 session/shell → 2 Trim target → 3 Rescue → 4 Portion → 5 dashboards + session review → 6 tests/build/deploy.

| Module | On `main` | On `feature/kitchen-day-v1` | Target |
|--------|-----------|-----------------------------|--------|
| Trim Smart | v1 standalone | Target flow at `#/kitchen-day`; v1 kept at `#/waste/trim-smart` | Estimate → timed prep → actual; locked category enum; unique `ingredientId` per session |
| Rescue & Reuse | none | `#/kitchen-day/reuse` | Join `sessionId` + `ingredientId`; `reusableWasteGrams` + free-text `reuseDestination` |
| Portion Precision | none | `#/kitchen-day/portion` | Professional recipe reference extract; derived ingredient accuracy + final-weight deviation; [`PORTION_PRECISION.md`](../product/waste-challenges/PORTION_PRECISION.md) |
| Dashboards + tutor review | none | `#/kitchen-day/review`, `#/kitchen-day-progress`, `#/kitchen-day-tutor` | Current-session review; student history; tutor evidence + `wastePracticeReview` |

---

## How to update this file

When a product decision is approved or implementation changes, update the relevant section and point to source paths or contracts. Do not mark gaps as closed without verification against both contract and code.
