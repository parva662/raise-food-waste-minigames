# RAISE BarLaurea — study and system master plan

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

1. **Lunch declaration** — tomorrow’s meal choice via `studentLunchCheckin` (this repository, default route).
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

There is **no kitchen scoring or results dashboard with composite scores** in this phase. Service closeout posts one `wasteMeasurement` ACTIVITY in embed mode. **`#/chef-results`** is the participant-safe results view (own data + anonymous team comparison; no ranking). **`#/chef-results-admin`** preserves the full all-staff fixture research view (hidden; route-level authorization still required). Full multi-user GameBus-backed results are the next major phase.

### 2.3 BarLaurea kitchen operations (closeout)

- **One restaurant** (BarLaurea), **one lunch service per `targetDate`**.
- Kitchen staff **rotate** across days; **head chef rotates** and is recorded on closeout as `headChefUserId` (not on `chefForecast`).
- All participating staff use the same **`#/chef`** forecast game; the head chef also submits a personal forecast.
- **One shared service closeout** per `targetDate` records actual customers, prepared portions, standard portion weights, and overproduction waste. UI entry for overproduction is **grams**; normalized representation may use **kg**.
- **Submitted forecast (read-only):** closeout retrieves the authenticated user's `chefForecast` activities via GameBus Input Collection (`serviceCloseoutInput.chefForecasts`; legacy `serviceCloseoutInputs` accepted temporarily). `activity.actor` identifies the forecast owner. Forecast is matched by exact `targetDate` and shown read-only beside actual entry; actual production is entered separately.
- **Finalize (embed):** one `wasteMeasurement` ACTIVITY per Finalize; iframe closes via normal GameBus behaviour. Waste UI uses grams; GameBus stores kg. Quantity properties are actual prepared portions. Portion weights are not persisted on the activity.
- Main, Vegetarian, Soup, and Dessert remain **independent** categories.
- Future individual daily results link **`userId` + `targetDate`**; weekly results aggregate finalized daily results (staff may participate on different days). **No team model.**

---

## 4. GameBus activities (this repository)

| Route | Expected activity | Status in repo |
|-------|-------------------|----------------|
| `/` (default) | `studentLunchCheckin` | Implemented |
| `#/chef` | `chefForecast` | Implemented (v1) |
| `#/service-closeout` | `wasteMeasurement` | **Complete** (manually verified end-to-end) |
| `#/chef-results` | _(none — read-only page)_ | **Implemented** (participant-safe; fixture-backed) |
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
  - reads `chefForecast` via Input Collection `serviceCloseoutInput` (legacy `serviceCloseoutInputs` alias);
  - writes one `wasteMeasurement` ACTIVITY per Finalize;
  - manually verified: real menu date, all item IDs, prepared quantities, kg waste conversion, `submittedAt`, authenticated actor, iframe close.
- **Chef results** — participant view `#/chef-results` (GameBus menu target; own results + anonymous comparison) and admin view `#/chef-results-admin` (all-staff research; authorization TBD). Shared fixture-backed calculation engine; no composite score. Authenticated GameBus identity is read from `inputCollectionPari.me` (DEV diagnostic); fixture profiles still drive calculation UI until real actor linkage.
- GameBus ACTIVITY mappers for `studentLunchCheckin`, `chefForecast`, and `wasteMeasurement`.
- Contract: `GAMEBUS_SERVICE_CLOSEOUT_CONTRACT.md`.

**Known non-blocking GameBus issue:** My Activities may display `overproductionDessertKg` with the wrong label (“Overproduction meat (kg)”) while persisting the correct dessert value. GameBus display/configuration investigation — not an application defect.

**Next major phase (in progress):** MULTI-USER / GAMEBUS PARTICIPANT ORGANIZATION AND VISIBILITY TESTING — authenticated identity via `inputCollectionPari.me` is implemented on `#/chef-results`; next: replace fixture inputs with real GameBus multi-user data and connect calculation lookup to authenticated `user.id`; add admin route authorization.

**Unresolved production decisions (chef results):**

- Minimum staff count before anonymous team comparison range/position display.
- Authorization mechanism for `#/chef-results-admin`.
- Retrieval of other staff members' `chefForecast` activities.
- Group/campaign cross-user visibility.
- Replacing fixture calculation users with real GameBus actors.

**Out of scope (later phases):**

- Composite score, points, weights, penalties, leaderboards, winner ranking.
- Forecast-result badge awards.
- Live GameBus admin changes (manual migration plans documented separately).

---

## 7. References

- [`SPEC.md`](./SPEC.md) — product specification.
- [`GAMEBUS_LUNCH_CONTRACT.md`](./GAMEBUS_LUNCH_CONTRACT.md) — student activity contract.
- [`GAMEBUS_CHEF_FORECAST_CONTRACT.md`](./GAMEBUS_CHEF_FORECAST_CONTRACT.md) — chef activity contract and admin migration.
- [`GAMEBUS_SERVICE_CLOSEOUT_CONTRACT.md`](./GAMEBUS_SERVICE_CLOSEOUT_CONTRACT.md) — service closeout `wasteMeasurement` contract.
- [`NEXT_STEPS.md`](./NEXT_STEPS.md) — ordered roadmap.
