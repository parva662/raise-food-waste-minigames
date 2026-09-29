# RAISE food-waste minigames

React/Vite application that provides **GameBus Custom Embed Pages** for the RAISE / BarLaurea canteen research pilot.

This is **one npm package**, **one SPA**, and **one GitHub Pages deployment**. Product areas are hash routes, not Git branches.

**Repository:** [parva662/raise-food-waste-minigames](https://github.com/parva662/raise-food-waste-minigames)

## What this system is

Embeddable web surfaces that:

- collect structured lunch, forecast, closeout, and practical-kitchen data
- post GameBus `ACTIVITY` messages (Kitchen Skills student Trim / Reuse / Portion use `SILENT_ACTIVITY`; Finish challenge posts `EXIT`)
- read `TASK` and `INPUT_COLLECTIONS` from the GameBus parent iframe

They are research/pilot tools, not a restaurant ERP.

## User groups

| Group | Uses |
|-------|------|
| Canteen participant | Lunch Declaration (default route). Source still says “student” in places; that terminology is not renamed here. |
| Kitchen staff | Kitchen Forecast, Service Closeout, Forecast Results, Kitchen Skills Challenge |
| Chef / trainer | Kitchen Skills Challenge trainer surface (assessment posting is disabled until GameBus on-behalf-of-student is confirmed) |
| Admin viewer | Forecast Results admin dashboard (`#/chef-results-admin`; platform visibility, no frontend auth) |

Roles determine access. They do **not** determine the source-tree layout.

## Product catalogue and public routes

| Product | Public hash (stable) | Kind |
|---------|----------------------|------|
| Lunch Declaration | default / empty hash | data entry |
| Kitchen Forecast | `#/chef` | data entry (`chefForecast`) |
| Service Closeout | `#/service-closeout` | operational (`wasteMeasurement`) |
| Forecast Results (participant) | `#/chef-results` | read / analytics |
| Forecast Results (admin) | `#/chef-results-admin` | read / management |
| Kitchen Skills Challenge | `#/kitchen-day` (+ `/reuse`, `/portion`, `/review`) | practical session |
| Kitchen Skills Challenge progress | `#/kitchen-day-progress` | read |
| Kitchen Skills Challenge trainer | `#/kitchen-day-tutor` | supervisory |
| Legacy Trim Smart v1 | `#/waste/trim-smart` | deprecated; keep until live GameBus URLs are confirmed unused |

`#/kitchen-day*` and the session-id prefix `kitchen-day:` are **legacy-stable technical identifiers**. The product name is Kitchen Skills Challenge.

## Architecture (overview)

See [`docs/architecture/README.md`](docs/architecture/README.md).

Dependency direction:

```
GameBus parent
  → src/platform/gamebus (transport)
    → product GameBus adapter
      → product domain logic
        → product surface
```

`src/shared/` (Helsinki time, operational calendar, menu) may be used by several products. The GameBus platform must not import products.

**GameBus may close the iframe after ACTIVITY.** No workflow may assume in-memory React state survives submission.

## Local development

```sh
npm install
npm run dev
```

Vite serves at the default local URL. GameBus Custom Embed Pages point at this origin plus a hash route (for example `/#/chef`).

Production `base` is `/raise-food-waste-minigames/` (GitHub Pages).

## Testing and checks

```sh
npm run typecheck
npm run lint
npm run test:run
npm run build
npm run check          # typecheck + lint + test:run + build
```

Tests live next to the code they cover (`*.test.ts` / `*.test.tsx`). Shared fixtures are under `src/test/`.

## Generated data

| Pipeline | Command | Source | Runtime output |
|----------|---------|--------|----------------|
| Menu | `npm run menu:convert` / `npm run menu:check` | `reference/` workbooks | `src/data/generated/` menu JSON |
| Kitchen Skills recipes | `npm run kitchen-skills:recipes` | `reference/kitchen-skills/` | `src/data/generated/` recipe JSON |

`npm run kitchen-day:recipes` is a temporary alias for `npm run kitchen-skills:recipes`.

Do not edit generated JSON by hand.

## Deployment

Push to `main` runs CI (`typecheck`, `lint`, tests, production build) and GitHub Pages from `dist/`.

Do not deploy from feature/refactor branches unless explicitly intended.

## Secrets

Do not commit `.env.local`, passwords, or GameBus admin tokens. `*.local` is gitignored.

## Documentation

Start at [`docs/README.md`](docs/README.md).

| Layer | Role |
|-------|------|
| [`PROJECT_RULES.md`](PROJECT_RULES.md) | Engineering rules |
| [`PROJECT_CHARTER.md`](PROJECT_CHARTER.md) | Purpose and scope |
| `features/` | Approved acceptance behaviour (Gherkin) |
| `docs/product/` | Human-readable product intent |
| `docs/contracts/` | GameBus / external contracts |
| `docs/architecture/` | Source architecture |
| `docs/current-state/` | What the code does today |
| `docs/testing/` | Gherkin ↔ test coverage maps |
| `docs/archive/` | Historical only |

## Git workflow

- **`main`** is the only production branch.
- Use short-lived `feature/*`, `fix/*`, `refactor/*` branches.
- Product areas are folders, not long-lived branches.

See [`docs/architecture/README.md`](docs/architecture/README.md) for worktree notes.
