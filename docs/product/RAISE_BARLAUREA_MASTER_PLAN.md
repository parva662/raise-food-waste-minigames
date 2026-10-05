# RAISE BarLaurea — study and system explanation

> **Diátaxis:** Explanation only (study / system narrative).
> **Not** an authoritative product, contract, route, schema, or implementation source of truth.
> Prefer: [`../README.md`](../README.md) map · approved `.feature` files · [`../contracts/`](../contracts/) · current `src/` · [`../current-state/`](../current-state/).
> Aging or mixed statements in this plan **do not** override those sources.

**Repository:** `parva662/raise-food-waste-minigames`
**Status:** Study / system explanation only.

---

## 1. Study purpose

This project studies whether **gamification** improves:

- research participation;
- repeated engagement;
- data completeness;
- timely data submission;
- **FAIR** research-data collection.

It is **not** a restaurant prediction or optimization system. Analysis remains simple and descriptive.

---

## 2. Participant workflows (study framing)

### 2.1 Students (research sample)

The student challenge has **two steps**:

1. **Lunch declaration** — meal choice for the next operational lunch service via `studentLunchCheckin` (this repository, default route). Product rules: [`STUDENT_LUNCH.md`](STUDENT_LUNCH.md) and [`../../features/student/student-lunch.feature`](../../features/student/student-lunch.feature).
2. **Before/after plate photos and weights** — separate GameBus task (outside this minigame UI).

Student declarations are a **research sample**. They are **not** the operational baseline for chef forecast accuracy.

### 2.2 Kitchen professionals (chefs)

- Approximately **three** kitchen professionals rotate.
- Normally **one chef** is responsible per service day.
- The chef on duty logs in with their **personal GameBus account**.
- That chef submits **one forecast** for the service day.
- **No shared kitchen account.**
- **No** multiple competing forecasts per service day as the intended study workflow.
- **No** `chefId` in the activity payload — GameBus authenticated-user association identifies the submitting chef.

Product and contract detail for forecast timing, quantities, and eligibility live in [`KITCHEN_FORECAST.md`](KITCHEN_FORECAST.md), the approved Gherkin, and [`../contracts/KITCHEN_FORECAST_GAMEBUS.md`](../contracts/KITCHEN_FORECAST_GAMEBUS.md) — not in this narrative.

### 2.3 BarLaurea kitchen operations (closeout framing)

- **One restaurant** (BarLaurea), **one lunch service per `targetDate`**.
- Kitchen staff **rotate** across days. The authenticated GameBus user who finalizes closeout is identified by GameBus `activity.actor`. There is **no** separate head-chef selector on the closeout ACTIVITY.
- **One shared service closeout** per `targetDate` records actual customers, prepared portions, and overproduction waste (UI grams → GameBus kg).
- Main, Vegetarian, Soup, and Dessert remain **independent** categories.
- Future individual daily results link **user + `targetDate`**; weekly results aggregate finalized daily results. **No team model.**

Canonical closeout rules: [`SERVICE_CLOSEOUT.md`](SERVICE_CLOSEOUT.md) and its Gherkin / contract.

---

## 3. Data flows and comparisons (study intent)

| Data | Source | Used for |
|------|--------|----------|
| Student lunch declaration | `studentLunchCheckin` | Research sample engagement |
| Chef kitchen forecast | `chefForecast` | Chef engagement + forecast record |
| Whole-canteen actuals | Service closeout (`wasteMeasurement`) | Operational comparison |

**Chef forecast is compared with whole-canteen operational data**, not with student declarations.

There is **no** composite score, ranking, or winner language in the results surfaces. Participant-safe results: `#/chef-results`. Management/research: `#/chef-results-admin` (authorization remains an operational concern). Product navigation: [`KITCHEN_RESULTS.md`](KITCHEN_RESULTS.md).

---

## 4. Activities in this repository (index only)

| Route | Expected activity | Where truth lives |
|-------|-------------------|-------------------|
| `/` (default) | `studentLunchCheckin` | Gherkin + lunch contract + current-state |
| `#/chef` | `chefForecast` | Gherkin + forecast contract + current-state |
| `#/service-closeout` | `wasteMeasurement` | Gherkin + closeout contract + current-state |
| `#/chef-results` | _(read-only)_ | Results Gherkin + current-state |
| `#/chef-results-admin` | _(read-only)_ | Results admin Gherkin + current-state |
| `#/kitchen-day*` | Kitchen Skills activities | Kitchen Skills features + slug contract + current-state |

Do **not** create `chefForecastV2` or `studentLunchCheckinV2`.

---

## 5. Future result and badge boundary (not implemented)

Study intent for a later phase:

1. Chef submits `chefForecast`.
2. Service happens.
3. Authorized staff finalize service closeout.
4. A derived **result** per user + `targetDate` is calculated from forecast vs shared actuals.
5. GameBus may award an individual badge (future).

Result is based on **actual canteen operational data**, not student declarations. Schema is **not** frozen in this document.

---

## 6. Technical boundaries (pointers)

What is implemented, blocked on GameBus, or still `@pending` belongs in:

- [`../current-state/IMPLEMENTATION_STATUS.md`](../current-state/IMPLEMENTATION_STATUS.md)
- [`../current-state/ROADMAP.md`](../current-state/ROADMAP.md)

**Out of scope for the study framing here:** composite scores, leaderboards, winner ranking, inventing live GameBus admin changes from this narrative.

**Student mission architecture (agreed direction):**

1. Lunch declaration → `studentLunchCheckin` (this repository).
2. Lunch observation/logging → future GameBus-native Activity task (schema not finalized in code).

---

## 7. References

- [`../archive/SPEC_LEGACY.md`](../archive/SPEC_LEGACY.md) — **HISTORICAL**
- Contracts under [`../contracts/`](../contracts/)
- Product navigation under [`./`](./)
- Docs map: [`../README.md`](../README.md)
