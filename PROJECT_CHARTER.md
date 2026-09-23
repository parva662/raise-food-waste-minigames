# Project charter — RAISE / BarLaurea food-waste minigames

**Repository:** [parva662/raise-food-waste-minigames](https://github.com/parva662/raise-food-waste-minigames)

**Local path:** `C:\Users\20184558\gamebus-lunch-dnd-v2`

**Engineering rules:** [`PROJECT_RULES.md`](./PROJECT_RULES.md)

**Documentation entry point:** [`docs/README.md`](./docs/README.md)

---

## Context

This repository supports the **RAISE** research context and **BarLaurea** canteen pilot: interactive **GameBus Custom Embed Page** minigames that collect structured data about lunch choices, kitchen forecasting, service closeout, and practical kitchen learning activities.

The goal is **research participation and FAIR data collection** through usable digital tasks—not a full restaurant optimization or ERP system. Analysis stays descriptive; gamification supports engagement and completeness where agreed.

---

## Why this repository exists

- Provide **embeddable web games** that post **GameBus ACTIVITY** messages with agreed property schemas.
- Support **operational kitchen workflows** (forecast, closeout, staff-facing feedback) and **student research workflows** (declarations, later observation tasks).
- Support **practical teaching** scenarios in the kitchen (waste-aware preparation challenges).
- Keep **integration contracts** and **product intent** documented alongside the React/TypeScript implementation.

Games run in an iframe; GameBus supplies **TASK** data and **INPUT_COLLECTIONS** (including authenticated user identity where configured).

---

## Main user groups

| Group | Role in this repo |
|-------|-------------------|
| **Students** | Lunch declaration; future plate observation mission; future progress/gamification as agreed outside current scope |
| **Kitchen staff / chefs** | Kitchen forecast; service closeout; participant results views |
| **Chef / authorized kitchen staff** | Same operational games plus management/research dashboard views where enabled |
| **Teachers / practical kitchen participants** | Kitchen Day practical modules (Trim & Waste / Reuse / Portioning) |

---

## Product families (high level)

### Operational games (canteen research & kitchen operations)

- **Student Lunch declaration** — next operational lunch service intent; `studentLunchCheckin`.
- **Kitchen Forecast** — chef forecast for upcoming service; `chefForecast`.
- **Service Closeout** — end-of-service actuals and overproduction waste; `wasteMeasurement`.
- **Kitchen Staff Dashboard (Chef Results)** — participant-safe forecast feedback; read-only in app.
- **Kitchen Management Dashboard** — broader staff/research view; route hidden pending production auth.

### Practical kitchen day (teaching lab) — connected modules, not three games

Orchestration: [`docs/product/waste-challenges/KITCHEN_DAY.md`](./docs/product/waste-challenges/KITCHEN_DAY.md) (**APPROVED PRODUCT TARGET**). Slugs: [`docs/product/waste-challenges/GAMEBUS_SLUG_CONTRACT.md`](./docs/product/waste-challenges/GAMEBUS_SLUG_CONTRACT.md).

- **Trim Smart** — **CURRENT IMPLEMENTATION** v1 on `main` (`#/waste/trim-smart`, Ingredient → Practice → Measure). Target on `feature/kitchen-day-v1`: estimate → timed prep → actual waste; locked category enum; multiple **different** ingredients per session (same ingredient once).
- **Rescue & Reuse** — encoded on `feature/kitchen-day-v1`; not on `main`; join `sessionId` + `ingredientId`; reusable amount + free-text destination.
- **Portion Precision** — encoded on `feature/kitchen-day-v1`; not on `main`; one activity per recipe; `recipeComposition`; required amounts and expected final weight from the generated professional recipe reference.
- **Session Review / Student Progress / tutor assessment** — encoded on `feature/kitchen-day-v1`; not on `main`; read-only evidence; one end-of-session `wastePracticeReview` (two 0–5 scores + optional feedback); existing `GET /groups/activities`.

### Student missions (broader study)

1. Lunch declaration (this repo).
2. Plate photo/weight observation — **separate GameBus task**, not this UI.
3. Future student progress/gamification — **product direction only**, not defined as shipped features here.

---

## Research and product goals (summary)

- Improve participation, timeliness, and completeness of research data.
- Separate **student declarations** (sample) from **chef forecasts** and **whole-canteen operational** closeout data.
- Avoid composite “winner” scoring or leaderboards unless explicitly approved for a later phase.
- Keep **scientific metrics** distinct from **GameBus gamification** mechanics when they differ.

---

## System boundaries

- **In scope:** Custom embed UIs, client-side validation, mapping to GameBus ACTIVITY payloads, standalone demo modes, GitHub Pages deployment, automated unit/integration tests (Vitest).
- **Out of scope (unless explicitly added):** GameBus server administration, live template editing, badge/result engines. Kitchen Day connected modules are encoded on `feature/kitchen-day-v1` and are **not** on `main`. Retrieval uses the existing `kitchenGroupInput` / `GET /groups/activities` client already in this repo.
- **Authority:** [`PROJECT_RULES.md`](./PROJECT_RULES.md) for engineering process; **approved** `.feature` files for product targets; **source on `main`** for production-built games, and `feature/kitchen-day-v1` for the Kitchen Day target until merge; GameBus contracts under [`docs/contracts/`](./docs/contracts/); product pages under [`docs/product/`](./docs/product/).

---

## Charter maintenance

Keep this document short. Detailed specifications belong in product docs, contracts, and feature files—not here.
