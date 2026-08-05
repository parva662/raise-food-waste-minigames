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
| Whole-canteen actual portions served, production, waste | Client/API or import (later phase) | Operational comparison |

**Chef forecast is compared with whole-canteen operational data**, not with student declarations.

There is **no kitchen-operation game** in this phase. Actual operational and waste data arrive from the client/API or another import process.

---

## 4. GameBus activities (this repository)

| Route | Expected activity | Status in repo |
|-------|-------------------|----------------|
| `/` (default) | `studentLunchCheckin` | Implemented |
| `#/chef` | `chefForecast` | Implemented (v1) |

Do **not** create `chefForecastV2` or `studentLunchCheckinV2`.

---

## 5. Future result and badge boundary (not implemented)

1. Chef submits `chefForecast`.
2. Service happens.
3. Client/API provides whole-canteen actual data.
4. A small backend process compares each forecast property with its matching actual value (expected customers vs actual customers; each menu forecast vs actual quantity for that category). Waste is handled separately.
5. The backend creates a derived **result** for the same target date and chef.
6. GameBus awards an **individual badge** or achievement.

**Join keys** for the future result (schema not frozen in code):

- `targetDate`
- authenticated chef / activity owner (GameBus user)
- restaurant or service identifier (if later required)
- menu item IDs where available

Result is based on **actual canteen operational data**, not student declarations.

---

## 6. Technical boundaries (this phase)

**In scope (implemented):**

- Student lunch declaration (unchanged workflow).
- Chef kitchen forecast minigame (`#/chef`).
- Shared Excel→JSON menu pipeline and placeholder images.
- GameBus ACTIVITY mappers for `studentLunchCheckin` and `chefForecast`.

**Out of scope (later phases):**

- Actual-waste import.
- Forecast-result calculations in this app.
- Badges, leaderboards, dashboards.
- Live GameBus admin changes (manual migration plans documented separately).
- Commit, push, deploy (per phase instructions).

---

## 7. References

- [`SPEC.md`](./SPEC.md) — product specification.
- [`GAMEBUS_LUNCH_CONTRACT.md`](./GAMEBUS_LUNCH_CONTRACT.md) — student activity contract.
- [`GAMEBUS_CHEF_FORECAST_CONTRACT.md`](./GAMEBUS_CHEF_FORECAST_CONTRACT.md) — chef activity contract and admin migration.
- [`NEXT_STEPS.md`](./NEXT_STEPS.md) — ordered roadmap.
