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

- Provide **embeddable web games** that post GameBus `ACTIVITY` or, for Kitchen Skills student checkpoints, `SILENT_ACTIVITY` messages with agreed property schemas.
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
| **Teachers / practical kitchen participants** | Kitchen Skills Challenge (Trim / Reuse / Portion; hashes `#/kitchen-day*`) |

---

## Product families (high level)

### Operational games (canteen research & kitchen operations)

- **Student Lunch declaration** — next operational lunch service intent; `studentLunchCheckin`.
- **Kitchen Forecast** — chef forecast for upcoming service; `chefForecast`.
- **Service Closeout** — end-of-service actuals and overproduction waste; `wasteMeasurement`.
- **Kitchen Staff Dashboard (Chef Results)** — participant-safe forecast feedback; read-only in app.
- **Kitchen Management Dashboard** — broader staff/research view; route hidden pending production auth.

### Kitchen Skills Challenge (teaching lab) — connected modules, not three games

Orchestration: [`docs/product/kitchen-skills-challenge/KITCHEN_SKILLS_CHALLENGE.md`](./docs/product/kitchen-skills-challenge/KITCHEN_SKILLS_CHALLENGE.md). Slugs: [`docs/product/kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md`](./docs/product/kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md).

- **Trim Smart (Kitchen Skills Challenge)** — estimate → timed prep → actual waste at `#/kitchen-day`. Legacy v1 remains at `#/waste/trim-smart`.
- **Rescue & Reuse** — `#/kitchen-day/reuse`; join `sessionId` + `ingredientId`.
- **Portion Precision** — `#/kitchen-day/portion`; professional recipe reference extract.
- **Session Review / Progress / trainer assessment** — `#/kitchen-day/review`, `#/kitchen-day-progress`, `#/kitchen-day-tutor`. Trainer `wastePracticeReview` posts `SILENT_ACTIVITY` with `actors: [selectedStudentActorId]`.

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
- **Out of scope (unless explicitly added):** GameBus server administration, live template editing, badge/result engines. Kitchen Skills Challenge is on `main` at `#/kitchen-day*`. Student retrieval uses `kitchenGroupInputSelf` / `/api/me/activities`; trainer/chef feedback uses dedicated `kitchenSkillsTrainerInput`. Forecast/closeout keep `kitchenGroupInput`.
- **Authority:** [`PROJECT_RULES.md`](./PROJECT_RULES.md) for engineering process; **approved** `.feature` files for product targets; **source on `main`** for production-built games; GameBus contracts under [`docs/contracts/`](./docs/contracts/); product pages under [`docs/product/`](./docs/product/).

---

## Charter maintenance

Keep this document short. Detailed specifications belong in product docs, contracts, and feature files—not here.
