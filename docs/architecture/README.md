# Architecture

This repository is **one React 19 + Vite 6 + TypeScript SPA**, **one npm package**, and **one GitHub Pages deployment**. It exposes **multiple GameBus Custom Embed hash routes**. Product areas are source folders, not Git branches. Roles are not source-tree architecture.

## One-SPA layout

```
src/
  main.tsx
  app/                         application shell (router, titles, global CSS)
  platform/gamebus/            generic GameBus transport
  products/
    lunch-declaration/
    kitchen-forecast/
    service-closeout/
    forecast-results/
    kitchen-skills-challenge/
  shared/                      time, calendar, menu, ui
  legacy/trim-smart-v1/        deprecated Trim Smart
  data/generated/              runtime JSON from pipelines
  test/                        shared fixtures only
```

## Product slices

| Product | Public hash (stable) | Source |
|---------|----------------------|--------|
| Lunch Declaration | default / empty | `src/products/lunch-declaration/` |
| Kitchen Forecast | `#/chef` | `src/products/kitchen-forecast/` |
| Service Closeout | `#/service-closeout` | `src/products/service-closeout/` |
| Forecast Results | `#/chef-results`, `#/chef-results-admin` | `src/products/forecast-results/` |
| Kitchen Skills Challenge | `#/kitchen-day*` | `src/products/kitchen-skills-challenge/` |
| Legacy Trim Smart v1 | `#/waste/trim-smart` | `src/legacy/trim-smart-v1/` |

Kitchen Skills Challenge is the product name. `#/kitchen-day*` and the session prefix `kitchen-day:` are **legacy-stable technical identifiers** for GameBus URLs and persisted records.

Canonical routes live in `src/app/routes.ts`. Hash matching, document titles, and `AppRouter` share that registry.

## App shell

`src/main.tsx` is the Vite entry. It loads `src/app/styles.css` and renders `AppRouter`, which selects a product surface from the hash. There is no React Router.

## GameBus platform boundary

```
GameBus parent
  ↓
platform/gamebus          handshake, TASK, INPUT_COLLECTIONS, postMessage
  ↓
product GameBus adapter   mapper + ACTIVITY builder
  ↓
product domain logic
  ↓
product surface
```

`platform/gamebus` must not import `products/*` or `legacy/*`. Products post through `tryPostBuiltActivity` (already-built ACTIVITY or SILENT_ACTIVITY message) or, for Kitchen Skills Challenge student/trainer writes, their own posting helper that still uses the same `postMessage` shape. Duplicate and in-flight handling in the bridge is generic (`once` vs keyed, optional `markOnce`), not product-named. Kitchen Skills **Finish challenge** uses `postGameBusExit()` (`{ type: 'EXIT' }`).

Shared calendar/menu/time/identifiers may be consumed by several products. Shared must not import `products/*` or `legacy/*`.

## Shared operational kernel

Only genuinely shared code:

- `shared/time/` — Europe/Helsinki dates, clock, countdown
- `shared/calendar/` — operational service days
- `shared/menu/` — menu resolution and meal slots
- `shared/identifiers/` — generic ids such as ingredient ids
- `shared/ui/` — `MenuStatusBanner`

Do not add `shared/services/` dumping grounds. If a module is owned by one product, keep it there.

## Data / generated pipelines

- Menu: `npm run menu:convert` / `npm run menu:check` → `src/data/generated/`
- Kitchen Skills recipes: `npm run kitchen-skills:recipes` (alias `kitchen-day:recipes`) → `generated-data/kitchen-skills/` and `src/data/generated/kitchen-skills-recipes.json`

Workbooks stay under `reference/`. Do not edit generated JSON by hand.

## External contracts

Official embed protocol (tasks vs pages vs menu items): [`../contracts/GAMEBUS.md`](../contracts/GAMEBUS.md). Activity slugs, property slugs, TASK expectations, INPUT_COLLECTIONS keys, and public hashes are documented under `docs/contracts/` and `docs/product/kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md`. Do not change them to match a folder rename.

## Legacy code boundary

`src/legacy/trim-smart-v1/` is the old Trim Smart payload (`practice`, `participantWasteGrams`) on `#/waste/trim-smart`. Kitchen Skills Challenge Trim uses different properties on the same `trimSmart` slug. Current Kitchen Skills Challenge must not import legacy.

## Dependency direction

- `app/` may import products and platform
- `products/*` may import `shared/` and `platform/`
- products must not import another product's React UI
- Cross-product domain use is explicit and minimal (Forecast Results may consume forecast/closeout parsers; it must not import `KitchenForecastApp` / `ServiceCloseoutApp`)
- `shared/` must not import products
- Avoid circular imports

## Actors vs surfaces

Roles determine **access**, not folders. See [`ACTORS_AND_SURFACES.md`](ACTORS_AND_SURFACES.md).

Kitchen Skills Challenge internals:

- **Domain capabilities:** trim, reuse, portion, assessment
- **Read models:** persisted activity parsing, session/progress projections
- **Surfaces:** challenge (student session), session review, progress, trainer

Session review, progress, and trainer are not domains.

## Testing

Tests stay colocated (`*.test.ts` / `*.test.tsx` next to the code). `src/test/` is shared fixtures and setup only.

## Deployment

GitHub Pages, `base` `/raise-food-waste-minigames/`. Production URLs are not changed by this architecture. Do not deploy from a refactor branch unless explicitly requested.

## Custom-task ACTIVITY may close the iframe

On a GameBus **custom task**, `ACTIVITY` completes the task and may destroy the dialog iframe. `SILENT_ACTIVITY` stores `/api/me/activities` and keeps the iframe open. See [Custom tasks](https://docs.next.gamebus.eu/integrations/custom-embeds/custom-tasks).

**Kitchen Skills Challenge student flow:** Trim, Reuse, and Portion post `SILENT_ACTIVITY`, retain local session state, and continue in the same iframe. **Finish challenge** posts `{ type: 'EXIT' }`. Do not assume in-memory React state survives an `ACTIVITY` close on *other* games (lunch, forecast, closeout).

Student challenge hydration uses `kitchenGroupInputSelf.activities`. Trainer/group still uses `kitchenGroupInput.activities`.
