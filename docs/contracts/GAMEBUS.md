# GameBus documentation index

**Status:** EXTERNAL / GAMEBUS CONTRACT — this page is an index, not a copy of GameBus docs.

Official docs: [docs.next.gamebus.eu](https://docs.next.gamebus.eu)

This SPA is loaded as a GameBus iframe. Read the official pages before changing `postMessage` behaviour. Do not invent protocol fields that those pages do not describe.

## Official pages

| Page | URL | Use it for |
|------|-----|------------|
| Overview | https://docs.next.gamebus.eu | Campaigns, groups, missions, activities |
| Custom tasks | https://docs.next.gamebus.eu/integrations/custom-embeds/custom-tasks | Mission iframe: `TASK`, `INPUT_COLLECTIONS`, `ACTIVITY` vs `SILENT_ACTIVITY` |
| Custom pages | https://docs.next.gamebus.eu/integrations/custom-embeds/custom-pages | Left-menu full page: `MENU_ITEM`, `INPUT_COLLECTIONS`, `NAVIGATE` |
| Custom menu items | https://docs.next.gamebus.eu/integrations/custom-embeds/custom-menu-items | Compact side-menu widgets and `IFRAME_READY` height |
| Core API | https://docs.next.gamebus.eu/core-api | REST API (including `/api/me/activities`) |

## How GameBus talks to this iframe

All three embed kinds use `window.parent.postMessage`. The child sends `IFRAME_READY` first. GameBus then sends context. Activities are stored with `POST /api/me/activities` after the parent validates origin and template.

| Embed | Parent sends | Child may post | Close / leave behaviour |
|-------|--------------|----------------|-------------------------|
| **Custom task** (`userTriggeredEmbedded`) | `TASK`, `INPUT_COLLECTIONS` | `ACTIVITY`, `SILENT_ACTIVITY` | `ACTIVITY` completes the task and **closes the dialog**. `SILENT_ACTIVITY` stores a checkpoint and **keeps the iframe open**. |
| **Custom page** (`AppEmbedPage`) | `MENU_ITEM`, `INPUT_COLLECTIONS` | `ACTIVITY`, `SILENT_ACTIVITY`, `NAVIGATE` | The page is already the main route, so activity posts do **not** close it. `NAVIGATE` moves the GameBus parent to an internal path. |
| **Custom menu item** | `INPUT_COLLECTIONS` | `IFRAME_READY` (+ height), `NAVIGATE`, `ACTIVITY`, `SILENT_ACTIVITY` | Side-menu widget; report pixel height so the parent can size the iframe. |

Kitchen Skills Challenge **student work** is a custom **task**: Trim, Reuse, and Portion post `SILENT_ACTIVITY` so the same iframe can continue. **Finish challenge** then posts `{ type: 'EXIT' }` from this app (`src/platform/gamebus/exit.ts`). `EXIT` is the current Kitchen Skills close handshake; confirm against live GameBus if the official task page later documents a different leave message.

Tutor `wastePracticeReview` remains `ACTIVITY`. Lunch, forecast, and closeout also post `ACTIVITY` so those tasks can complete and close.

Input collections in this repo include `inputCollectionPari.me`, `kitchenGroupInput.activities` (`GET /groups/activities`), and Kitchen Skills student self-read `kitchenGroupInputSelf.activities` (`GET /api/me/activities`).

## Repo contracts

Product-specific slugs and hashes: [`KITCHEN_SKILLS_CHALLENGE_TASK.md`](KITCHEN_SKILLS_CHALLENGE_TASK.md), [`KITCHEN_SKILLS_CHALLENGE_ROUTES.md`](KITCHEN_SKILLS_CHALLENGE_ROUTES.md), [`../product/kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md`](../product/kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md). Other games: [`STUDENT_LUNCH_GAMEBUS.md`](STUDENT_LUNCH_GAMEBUS.md), [`KITCHEN_FORECAST_GAMEBUS.md`](KITCHEN_FORECAST_GAMEBUS.md), [`SERVICE_CLOSEOUT_GAMEBUS.md`](SERVICE_CLOSEOUT_GAMEBUS.md).
