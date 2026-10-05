# GameBus documentation index

**Documentation role:** Reference — **single in-repo index** to official GameBus documentation.
**Status:** EXTERNAL / GAMEBUS CONTRACT — index plus clearly separated RAISE conventions and live notes. It is not a copy of GameBus docs.

Official docs: [docs.next.gamebus.eu](https://docs.next.gamebus.eu)

This SPA is loaded as a GameBus iframe. Read the official pages before changing `postMessage` behaviour. Do not invent protocol fields that those pages do not describe. Do not mirror Core API manuals or full GameBus docs into this repository.

Keep these three layers distinct when reading or editing this file:

1. **Official GameBus contract** — what [docs.next.gamebus.eu](https://docs.next.gamebus.eu) documents.
2. **RAISE conventions** — this repo’s agreed usage that is not claimed as official sample-JSON fields.
3. **Empirically verified live behaviour** — observed on foodtracker / deployments; may differ from docs until confirmed upstream.

## Official pages

| Page | URL | Notes (from official docs) |
|------|-----|----------------------------|
| Overview | https://docs.next.gamebus.eu | GameBus is a configurable framework for behavior-change web apps (campaigns). Reusable BCT / gamification components; extensible when a technique is missing. |
| Why GameBus | https://docs.next.gamebus.eu/why-gamebus | Shared platform to field-test intervention designs: vary layout/content by arm, collect action data, keep experiments clean, tailor per participant, privacy by default. |
| Framework components | https://docs.next.gamebus.eu/framework-components | Four parts: **Core** (config + delivery + structured behavior data), **Stories** (interactive video/quiz/minigame tasks), **Sync** (external data into Core), **Docs**. Core is the hub; Tasks represent target behaviors. |
| Core concepts | https://docs.next.gamebus.eu/explanations-core-concepts | Intervention = **campaign**. Configure app layout, app content (Tasks / BCTs), and policy (who sees what). |
| Campaign | https://docs.next.gamebus.eu/explanations-core-concepts/campaign | Campaign is a standalone study/app URL. Access via policies/consent, **waves** (when), and **groups** / holdings (to whom). Roles include Participant, Manager, Trainer, Ghost. Holding permissions control activity/group exposure. |
| Campaign app layout | https://docs.next.gamebus.eu/explanations-core-concepts/campaign-app-layout | Menu items (single, list-of-items, heading, account, custom embed), app pages (built-in types + External page), styling/CSS variables, PWA manifest. Custom embeds open iframes; details on custom-pages / custom-menu-items. |
| Campaign content | https://docs.next.gamebus.eu/explanations-core-concepts/campaign-content | Missions → Milestones → Tasks → Activities → Skill contributions. Gateways, enrollment, group skill stats. Embedded Tasks (Stories or custom) submit Activities evaluated like any other. |
| Custom tasks | https://docs.next.gamebus.eu/integrations/custom-embeds/custom-tasks | Mission `userTriggeredEmbedded` iframe. Protocol: `IFRAME_READY` → parent `TASK` + `INPUT_COLLECTIONS` → child `ACTIVITY` / `SILENT_ACTIVITY` / **`EXIT`**. `ACTIVITY` completes and closes the dialog; `SILENT_ACTIVITY` keeps it open (unless a milestone transition). Sample JSON shows `template` / `start` / `end` / `properties` only. |
| Custom pages | https://docs.next.gamebus.eu/integrations/custom-embeds/custom-pages | Full-page `AppEmbedPage`: `IFRAME_READY` → `MENU_ITEM` + `INPUT_COLLECTIONS`; child may post `ACTIVITY`, `SILENT_ACTIVITY`, `NAVIGATE`. Activity posts do not close the page. |
| Custom menu items | https://docs.next.gamebus.eu/integrations/custom-embeds/custom-menu-items | Compact side-menu iframe: `IFRAME_READY` (+ pixel `height`), `INPUT_COLLECTIONS`, optional `NAVIGATE` / `ACTIVITY` / `SILENT_ACTIVITY`. |
| Core API | https://docs.next.gamebus.eu/core-api | REST API reference (including participant activity endpoints used after validated iframe posts). |
| GameBus Stories | https://docs.next.gamebus.eu/integrations/gamebus-stories | Interactive story tasks (video parts, announcements, quizzes, branching). Embeddable player; completion can surface via `postMessage` to a parent. Can be used as a user-triggered embedded Task. |

## How GameBus talks to this iframe

All three embed kinds use `window.parent.postMessage`. The child sends `IFRAME_READY` first. GameBus then sends context. Validated activities are stored through the participant activity API (typically `POST /api/me/activities`) after the parent checks origin and template providers.

| Embed | Parent sends | Child may post | Close / leave behaviour |
|-------|--------------|----------------|-------------------------|
| **Custom task** (`userTriggeredEmbedded`) | `TASK`, `INPUT_COLLECTIONS` | `ACTIVITY`, `SILENT_ACTIVITY`, **`EXIT`** | Official: `ACTIVITY` completes the task and **closes** the dialog; `SILENT_ACTIVITY` stores a checkpoint and **keeps** the dialog open; **`EXIT` closes the task** without requiring an activity payload. |
| **Custom page** (`AppEmbedPage`) | `MENU_ITEM`, `INPUT_COLLECTIONS` | `ACTIVITY`, `SILENT_ACTIVITY`, `NAVIGATE` | Already the main route; activity posts do **not** close it. `NAVIGATE` moves the parent to an internal path. |
| **Custom menu item** | `INPUT_COLLECTIONS` | `IFRAME_READY` (+ height), `NAVIGATE`, `ACTIVITY`, `SILENT_ACTIVITY` | Side-menu widget; report pixel height so the parent can size the iframe. |

## Official contract vs RAISE convention vs live behaviour

### Official GameBus contract (custom-tasks / custom-pages / custom-menu-items)

- Message types listed on those pages are authoritative for iframe protocol.
- Custom **tasks** document **`EXIT`** in the embedded-task protocol (step 5: send `EXIT` to close the task).
- Activity `data` in the official sample JSON uses `template`, `start`, `end`, and `properties`. GameBus adds task-of-mission context itself.
- Origin checks are strict: messages accepted only from the configured embed URL origin; that origin must be allowed on the activity template provider.

### RAISE convention (this repo — not claimed as official sample-JSON fields)

- **On-behalf-of tutor reviews:** Kitchen Skills trainer posts `wastePracticeReview` as `SILENT_ACTIVITY` with **`actors: [selectedStudentActorId]`**. Official custom-tasks sample JSON does **not** document `actors`; do not invent other on-behalf fields. Treat `actors` as a RAISE convention for tutor posting on behalf of a student.
- Do **not** add a `studentId` activity property for that purpose.
- Product-specific templates, property slugs, and hashes live in the Kitchen Skills contracts linked below — not in GameBus core docs.

### Empirically verified live behaviour (foodtracker / deployments)

- Student Kitchen Skills Trim / Reuse / Portion use **`SILENT_ACTIVITY`** so the same task iframe can continue; **Finish challenge** posts **`{ type: 'EXIT' }`** (`src/platform/gamebus/exit.ts` via `postKitchenSkillsChallengeExit`).
- Trainer dashboard **Close** also posts **`EXIT`** (no review post on Close). Confirm dialog only when an unsaved assessment draft is dirty.
- Tutor `wastePracticeReview` stays **`SILENT_ACTIVITY`** (+ RAISE `actors`) so the tutor iframe remains open for the next student/module.
- Lunch, forecast, and closeout still post **`ACTIVITY`** where those products need task completion + dialog close.
- Input collections in this repo include `inputCollectionPari.me`; `kitchenGroupInput.activities` (`GET /groups/activities` filtered to `chefForecast` / `wasteMeasurement` for forecast/closeout); Kitchen Skills student `kitchenGroupInputSelf.activities` (`GET /api/me/activities`); and Kitchen Skills trainer `kitchenSkillsTrainerInput.activities` (`GET /api/groups/activities` filtered to `trimSmart`, `rescueAndReuse`, `portionPrecision`, `wastePracticeReview`). Do not reuse `kitchenGroupInput` for Kitchen Skills.

## Repo contracts

Product-specific slugs and hashes: [`KITCHEN_SKILLS_CHALLENGE_TASK.md`](KITCHEN_SKILLS_CHALLENGE_TASK.md), [`KITCHEN_SKILLS_CHALLENGE_ROUTES.md`](KITCHEN_SKILLS_CHALLENGE_ROUTES.md), [`../product/kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md`](../product/kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md). Other games: [`STUDENT_LUNCH_GAMEBUS.md`](STUDENT_LUNCH_GAMEBUS.md), [`KITCHEN_FORECAST_GAMEBUS.md`](KITCHEN_FORECAST_GAMEBUS.md), [`SERVICE_CLOSEOUT_GAMEBUS.md`](SERVICE_CLOSEOUT_GAMEBUS.md).
