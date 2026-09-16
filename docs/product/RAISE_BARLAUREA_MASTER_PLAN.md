# RAISE BarLaurea — study and system master plan

> Location: `docs/product/RAISE_BARLAUREA_MASTER_PLAN.md` (moved from repository root).
> Prefer product navigation pages under `docs/product/` and approved `.feature` files for acceptance rules. Mixed historical statements in this plan do not override approved contracts or current source.

**Repository:** `gamebus-lunch-dnd-v2` (GitHub Pages: `raise-food-waste-minigames`)
**Status:** Living document — authoritative for study purpose and product boundaries.

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

## 2. Participant workflows

### 2.1 Students (research sample)

The student challenge has **two steps**:

1. **Lunch declaration** — meal choice for the next operational lunch service via `studentLunchCheckin` (this repository, default route).
2. **Before/after plate photos and weights** — separate GameBus task (outside this minigame UI).

Student declarations are a **research sample**. They are **not** the operational baseline for chef forecast accuracy.

### 2.2 Kitchen professionals (chefs)

- Approximately **three** kitchen professionals rotate.
- Normally **one chef** is responsible per service day.
- The chef on duty logs in with their **personal GameBus account**.
- That chef submits **one forecast** for the service day.
- **No shared kitchen account.**
- **No** multiple competing forecasts per service day as the intended workflow.
- **No** `chefId` in the activity payload — GameBus authenticated-user association identifies the submitting chef.

Chef forecast UI: hash route `#/chef` → `https://parva662.github.io/raise-food-waste-minigames/#/chef`

Chef form UX (repository): all five numeric fields start **blank** (unanswered); explicit **0** is intentional; all five are required before submit; confidence uses five visible labels mapped to the existing 0–1 schema; the app does **not** auto-distribute or recommend portion forecasts. Expected customers is a headcount forecast; each menu quantity is an independent category forecast. One customer may correspond to multiple prepared portions or menu items. The interface does not compare or force equality between them.

---

## 3. Data flows and comparisons

| Data | Source | Used for |
|------|--------|----------|
| Student lunch declaration | `studentLunchCheckin` ACTIVITY | Research sample engagement |
| Chef kitchen forecast | `chefForecast` ACTIVITY | Chef engagement + forecast record |
| Whole-canteen actual portions served, production, waste | Service closeout UI (`#/service-closeout`) | Operational comparison (future) |

**Chef forecast is compared with whole-canteen operational data**, not with student declarations.

There is **no kitchen scoring or results dashboard with composite scores** in this phase. Service closeout posts one `wasteMeasurement` ACTIVITY in embed mode. **`#/chef-results`** is the participant-safe results view (own data + other-staff comparison; no ranking; Helsinki midnight dashboard date). **`#/chef-results-admin`** is the management/research view (hidden; route-level authorization still required). Embedded results read group kitchen activities from `kitchenGroupInput` when available.

### 2.3 BarLaurea kitchen operations (closeout)

- **One restaurant** (BarLaurea), **one lunch service per `targetDate`**.
- Kitchen staff **rotate** across days. The authenticated GameBus user who finalizes closeout is identified by GameBus `activity.actor`. There is **no** separate `headChefUserId` / head-chef selector on the closeout ACTIVITY.
- All participating staff use the same **`#/chef`** forecast game; each submits a personal forecast when participating.
- **One shared service closeout** per `targetDate` records actual customers, prepared portions, standard portion weights (app reference only), and overproduction waste. UI entry for overproduction is **grams**; GameBus stores **kg**.
- **Submitted forecast (read-only):** closeout reads `chefForecast` activities via `kitchenGroupInput.activities`. Current implementation shows the authenticated user's eligible forecast for the exact `targetDate` (display of all staff vs own remains `@pending`). Forecast is never copied into actual fields.
- **Finalize (embed):** one `wasteMeasurement` ACTIVITY per Finalize; iframe closes via normal GameBus behaviour. Quantity properties are actual prepared portions. Portion weights are not persisted on the activity.
- Main, Vegetarian, Soup, and Dessert remain **independent** categories.
- Future individual daily results link **`userId` + `targetDate`**; weekly results aggregate finalized daily results (staff may participate on different days). **No team model.**

---

## 4. GameBus activities (this repository)

| Route | Expected activity | Status in repo |
|-------|-------------------|----------------|
| `/` (default) | `studentLunchCheckin` | Implemented |
| `#/chef` | `chefForecast` | Implemented (v1) |
| `#/service-closeout` | `wasteMeasurement` | **Complete** (manually verified end-to-end) |
| `#/chef-results` | _(none — read-only page)_ | **Implemented** (participant-safe; embedded group data + standalone fixtures) |
| `#/chef-results-admin` | _(none — read-only page)_ | **Implemented** (admin/research; hidden; auth TBD) |

Do **not** create `chefForecastV2` or `studentLunchCheckinV2`.

---

## 5. Future result and badge boundary (not implemented)

1. Chef submits `chefForecast` (per participating user).
2. Service happens.
3. Authorized staff **finalize service closeout** (`#/service-closeout`) — one record per `targetDate`.
4. **Finalize service** triggers (future) daily calculation: each user's forecast vs shared actuals; waste handled separately.
5. The backend creates a derived **result** per `userId` + `targetDate`.
6. GameBus awards an **individual badge** or achievement (future).

**Join keys** for the future result (schema not frozen in code):

- `targetDate`
- authenticated chef / activity owner (GameBus user)
- restaurant or service identifier (if later required)
- menu item IDs where available

Result is based on **actual canteen operational data**, not student declarations.

---

## 6. Technical boundaries

**Completed in repository:**

- Student lunch declaration (`studentLunchCheckin`).
- Chef kitchen forecast minigame (`#/chef` → `chefForecast`).
- **Service closeout** (`#/service-closeout`):
  - reads `chefForecast` via `kitchenGroupInput.activities`;
  - writes one `wasteMeasurement` ACTIVITY per Finalize;
  - manually verified: real menu date, all item IDs, prepared quantities, kg waste conversion, `submittedAt`, authenticated actor, iframe close.
- **Chef results** — participant view `#/chef-results` (GameBus menu target; own results + other-staff comparison; Helsinki midnight date) and admin view `#/chef-results-admin` (research; authorization TBD). Shared calculation engine; embedded group activities when available; fixtures in standalone; no composite score. Authenticated GameBus identity from `inputCollectionPari.me`.
- GameBus ACTIVITY mappers for `studentLunchCheckin`, `chefForecast`, and `wasteMeasurement`.
- Contract: `docs/contracts/SERVICE_CLOSEOUT_GAMEBUS.md`.
- Acceptance Gherkin: `features/kitchen/service-closeout.feature`.

**Known non-blocking GameBus issue:** My Activities may display `overproductionDessertKg` with the wrong label (“Overproduction meat (kg)”) while persisting the correct dessert value. GameBus display/configuration investigation — not an application defect.

**Next major phase (in progress):** MULTI-USER / GAMEBUS PARTICIPANT ORGANIZATION AND VISIBILITY TESTING — authenticated identity via `inputCollectionPari.me` is **confirmed** on Custom Embed Pages (`#/chef-results`); next: Raoul's cross-user endpoint for kitchen staff forecasts, then replace fixture inputs and connect calculation lookup to authenticated `user.id`; add admin route authorization.

**Confirmed (GameBus identity):**

- Custom Embed Pages receive `INPUT_COLLECTIONS`.
- `inputCollectionPari.me` provides authenticated account (`id`, `firstName`, `lastName`, `picture`, etc.).
- Current-user identity resolves in-app; not yet used for chef-results calculation lookup.

**Blocked / waiting for GameBus:**

- Cross-user activity retrieval (Raoul endpoint in progress).
- Retrieving all kitchen staff `chefForecast` activities.
- Replacing fixture calculation users with real GameBus actors.
- Participant anonymous group comparison using real users.

**Student mission architecture (agreed):**

1. Lunch declaration → `studentLunchCheckin` (this repository).
2. Lunch observation/logging → future GameBus-native Activity task.

Task 2 availability should preferably use `studentLunchCheckin.mealType` (`no_lunch` vs lunch) via planned GameBus task availability — not a synthetic activity. Observation activity property schema not finalized in code.

**Unresolved production decisions (chef results):**

**Out of scope (later phases):**

- Composite score, points, weights, penalties, leaderboards, winner ranking.
- Forecast-result badge awards.
- Live GameBus admin changes (manual migration plans documented separately).

---

## 7. References

- [`../archive/SPEC_LEGACY.md`](../archive/SPEC_LEGACY.md) — legacy mixed specification (**HISTORICAL**).
- [`../contracts/STUDENT_LUNCH_GAMEBUS.md`](../contracts/STUDENT_LUNCH_GAMEBUS.md) — student activity contract.
- [`../contracts/KITCHEN_FORECAST_GAMEBUS.md`](../contracts/KITCHEN_FORECAST_GAMEBUS.md) — chef activity contract and admin migration.
- [`../contracts/SERVICE_CLOSEOUT_GAMEBUS.md`](../contracts/SERVICE_CLOSEOUT_GAMEBUS.md) — service closeout `wasteMeasurement` contract.
- [`../current-state/ROADMAP.md`](../current-state/ROADMAP.md) — ordered roadmap.
- Product navigation: [`STUDENT_LUNCH.md`](STUDENT_LUNCH.md), [`KITCHEN_FORECAST.md`](KITCHEN_FORECAST.md), [`SERVICE_CLOSEOUT.md`](SERVICE_CLOSEOUT.md), [`KITCHEN_RESULTS.md`](KITCHEN_RESULTS.md), [`WASTE_CHALLENGES.md`](WASTE_CHALLENGES.md).
