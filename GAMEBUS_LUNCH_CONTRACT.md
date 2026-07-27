# GameBus lunch declaration — integration contract

**Status:** Design document (implementation not started)  
**Source of truth:** React app `gamebus-lunch-dnd-v2` (`src/` as of commit `137d30b` and later)  
**Protocol reference:** Louar `gamebus-minigame-demo` (`schemas.ts`, `embed/task`) — protocol only, not UI  
**Live GameBus config audit:** `GAMEBUS_TEMPLATE_EXPORT.json` / `GAMEBUS_CONFIG_SNAPSHOT.md` (test env, 2026-07-27)

---

## A. Final declaration model (React)

### A.1 Persisted record: `ActiveDeclaration`

Defined in `src/types/declaration.ts`. Created by `createDeclarationFromDraft` in `src/utils/declaration.ts` on successful submit.

| Field | Type | Meaning |
|-------|------|---------|
| `studentId` | `string` | From `CANTEEN_CONFIG.studentId` (`demo-student-001`) |
| `lunchDate` | `string` | ISO date `YYYY-MM-DD`; target meal = **tomorrow** (`getTomorrowIsoDate`) |
| `menuCycleWeek` | `number` | 1–3 from menu resolver at submit time |
| `menuVersion` | `string` | e.g. `2026-v1` from config |
| `mealChoice` | `'regular' \| 'soup' \| 'no_lunch'` | Active section at submit |
| `regularMainSelected` | `boolean` \| `undefined` | Set when `mealChoice === 'regular'`: `mainQuantity > 0` |
| `regularVegetarianSelected` | `boolean` \| `undefined` | Set when `mealChoice === 'regular'`: `vegetarianQuantity > 0` |
| `noLunch` | `boolean` | `true` when `mealChoice === 'no_lunch'` |
| `selections` | `SelectionEntry[]` | Non-empty lines for selected items (see below); `[]` for no lunch |
| `timingStatus` | `'on-time' \| 'late'` | From Helsinki submission window at submit instant |
| `basePoints` | `number` | Always `20` |
| `timingAdjustment` | `5 \| -5` | `+5` on-time, `-5` late |
| `totalPoints` | `number` | `25` or `15` |
| `submittedAt` | `string` | ISO timestamp (first and only submit) |
| `updatedAt` | `string` | Same as `submittedAt` (no updates in product) |
| `includeInForecast` | `true` | Literal; no UI consumer |

`SelectionEntry` (`src/types/menu.ts`): `{ itemId, name, quantity, unit }` — only items with `quantity > 0` in the active section.

### A.2 Draft (pre-submit): `MealDraft` / `DraftSnapshot`

Defined in `src/types/mealChoice.ts`. Held in `useLunchSelection` state.

| Field | Type | Meaning |
|-------|------|---------|
| `mealChoice` | `'regular' \| 'soup' \| 'no_lunch' \| null` | Active section; `null` before user picks |
| `mainQuantity` | `number` | 0…`mealSlots.main.maxQuantity` when regular active |
| `vegetarianQuantity` | `number` | 0…`mealSlots.vegetarian.maxQuantity` when regular active |
| `soupQuantity` | `number` | 0…`mealSlots.soup.maxQuantity` when soup active |
| `dessertQuantity` | `number` | 0…`mealSlots.dessert.maxQuantity` when soup active |

**Section rules** (`mealDraftActions.ts`, `mealChoice.ts`):

- Three UI sections always visible; only one `mealChoice` active.
- Switching section clears all portion quantities (`draftForMealChoice`).
- `+` on a card in another section activates that section and applies the increment.
- **Regular** valid iff `mainQuantity > 0` OR `vegetarianQuantity > 0`.
- **Soup** valid iff `soupQuantity > 0` OR `dessertQuantity > 0`.
- **No lunch** valid with all quantities 0.

### A.3 Daily slots: `DailyMealSlots`

One main (classic), one vegetarian, one soup, one dessert per lunch day (`resolveMealSlotsForDate`). Item ids come from `menuSchedule` + `foodCatalogue`.

**Max quantities (catalogue):** main/vegetarian typically **3** portions; soup **2** cups; dessert **2** pieces; classic meat items may be **6** pieces where used as main.

### A.4 Field classification

| Data | Category |
|------|----------|
| `mealChoice`, quantities, `selections`, `lunchDate` | **Product / domain** — required for GameBus activity |
| `mealSlots.*.id`, `mealSlots.*.name` | **Domain** — map to GameBus item id/name properties |
| `timingStatus`, `basePoints`, `timingAdjustment`, `totalPoints`, `submittedAt` | **Domain + scoring** — required for GameBus audit/replay |
| `studentId` | **Local identity** — optional on GameBus if platform knows actor; include in contract for parity |
| `menuCycleWeek`, `menuVersion`, `includeInForecast` | **Local / forecast metadata** — not required for GameBus v1 |
| `regularMainSelected`, `regularVegetarianSelected` | **Redundant** with quantities — derivable; optional on GameBus |
| `noLunch` | **Redundant** with `mealChoice === 'no_lunch'` — derivable |
| `successMessage`, toast state, `initialized`, `now` | **UI-only** — not sent to GameBus |
| `savedSnapshot`, localStorage JSON | **Local persistence** — not authoritative when embedded in GameBus |

---

## B. Proposed GameBus activity template

| Field | Value |
|-------|--------|
| **Reference** | `studentLunchCheckin` (retain) |
| **Label** | Student lunch check-in |
| **Admin ID (test)** | `019f9404-88ec-7f31-89d6-8b2cbfbcab4f` |
| **Purpose** | One-shot student declaration for tomorrow’s canteen meal (regular, soup, or no lunch) with portion quantities and scoring |

**Modify vs replace:** **Modify** the existing template in GameBus admin by **replacing linked property templates** with the set in section C. Keep the reference `studentLunchCheckin` so Pari’s embedded task (`embedded-task-Pari`, URL in test config) does not need re-linking once the task’s `+1` activity is confirmed as this template.

Do **not** edit live templates from this repository; this document is the specification for a manual/admin or follow-up config change.

---

## C. Property templates (proposed)

GameBus property values use the platform wrapper: `{ "value": <payload> }` inside each activity property’s `obj` (see section E).

All numeric quantity schemas: **integer**, **minimum 0**, **maximum** = per-slot `maxQuantity` from catalogue (use **6** as global max if admin requires one cap; app clamps per item).

| Reference | Label | Required | JSON Schema (`value`) | React source | Example |
|-----------|-------|----------|----------------------|--------------|---------|
| `targetDate` | Target date | yes | `string`, `format: date` | `lunchDate` | `"2026-07-28"` |
| `mealType` | Meal type | yes | `string`, `enum`: `regular`, `soup`, `no_lunch` | `mealChoice` | `"regular"` |
| `mainItemId` | Main dish id | yes* | `string`, `minLength: 1` | `mealSlots.main.id` | `"meatballs"` |
| `mainQuantity` | Main quantity | yes | `integer`, `minimum: 0`, `maximum: 6` | `mainQuantity` (0 if not regular) | `2` |
| `vegetarianItemId` | Vegetarian dish id | yes* | `string`, `minLength: 1` | `mealSlots.vegetarian.id` | `"pasta-primavera"` |
| `vegetarianQuantity` | Vegetarian quantity | yes | `integer`, `minimum: 0`, `maximum: 6` | `vegetarianQuantity` | `0` |
| `soupItemId` | Soup id | yes* | `string`, `minLength: 1` | `mealSlots.soup.id` | `"tomato-soup"` |
| `soupQuantity` | Soup quantity | yes | `integer`, `minimum: 0`, `maximum: 6` | `soupQuantity` | `1` |
| `dessertItemId` | Dessert id | yes* | `string`, `minLength: 1` | `mealSlots.dessert.id` | `"yogurt-berries"` |
| `dessertQuantity` | Dessert quantity | yes | `integer`, `minimum: 0`, `maximum: 6` | `dessertQuantity` | `0` |
| `timingStatus` | Timing status | yes | `string`, `enum`: `on-time`, `late` | `timingStatus` | `"on-time"` |
| `basePoints` | Base points | yes | `integer`, `const` or `minimum: 20`, `maximum: 20` | `basePoints` | `20` |
| `timingAdjustment` | Timing adjustment | yes | `integer`, `enum`: `5`, `-5` | `timingAdjustment` | `5` |
| `totalPoints` | Total points | yes | `integer`, `enum`: `25`, `15` | `totalPoints` | `25` |
| `submittedAt` | Submitted at | yes | `string`, `format: date-time` | `submittedAt` | `"2026-07-27T15:30:00.000Z"` |

\* **Item ids:** Always send the **day’s** slot ids from `DailyMealSlots`, even when quantity is 0, so consumers know which menu row applied. Names are not duplicated on GameBus; display names stay in catalogue / `selections[].name` locally.

**Justification:** Replaces sentinel strings (`noVeg`, `noSoup`, `noDessert`) and ambiguous `comingStatus` with explicit `mealType` + numeric quantities. Matches the React model directly.

---

## D. Migration from current GameBus `studentLunchCheckin` properties

| Current property | Action | Reason |
|------------------|--------|--------|
| `targetDate` | **Retain** | Same semantics as `lunchDate` |
| `comingStatus` | **Remove** → `mealType` | `no_lunch` vs coming is expressed by `mealType`; no separate status string |
| `selectedMain` | **Remove** → `mainItemId` + `mainQuantity` | Quantity model; no encoded selection string |
| `selectedVegetarianOrNoVeg` | **Remove** → `vegetarianItemId` + `vegetarianQuantity` | No `noVeg` sentinel |
| `selectedSoupOrNoSoup` | **Remove** → `soupItemId` + `soupQuantity` | No `noSoup` sentinel |
| `selectedDessertOrNoDessert` | **Remove** → `dessertItemId` + `dessertQuantity` | No `noDessert` sentinel |
| `submittedAt` | **Retain** | Same |
| — | **Add** `mealType`, scoring fields | Align with app points and section choice |

Until admin templates are updated, the React mapper must **not** target the old string properties.

---

## E. Example `ACTIVITY` payloads

**Protocol shape** (from `gamebus-minigame-demo` `EmbeddedActivityMessage` + `activitySchema`):

```json
{
  "type": "ACTIVITY",
  "data": {
    "template": "studentLunchCheckin",
    "start": "<ISO-8601 datetime>",
    "end": "<ISO-8601 datetime>",
    "properties": [
      { "template": "<propertyReference>", "obj": { "value": <schema-conformant> } }
    ]
  }
}
```

- Child sends via `window.parent.postMessage(payload, targetOrigin)`.
- Use **`ACTIVITY`** only (not `SILENT_ACTIVITY`) so the parent closes the modal.
- `start` / `end`: recommend `submittedAt` for `start` and `start + 1 minute` for `end` unless task rules require otherwise.
- **Placeholder:** replace `studentLunchCheckin` and property references with admin-confirmed refs if they differ.

Assume lunch date **2026-07-28**, slots: main `meatballs`, vegetarian `pasta-primavera`, soup `tomato-soup`, dessert `yogurt-berries`, submit at `2026-07-27T16:00:00.000Z` (on-time).

### 1. Regular lunch — main only

`mealType` `regular`, main × 2, vegetarian × 0.

```json
{
  "type": "ACTIVITY",
  "data": {
    "template": "studentLunchCheckin",
    "start": "2026-07-27T16:00:00.000Z",
    "end": "2026-07-27T16:01:00.000Z",
    "properties": [
      { "template": "targetDate", "obj": { "value": "2026-07-28" } },
      { "template": "mealType", "obj": { "value": "regular" } },
      { "template": "mainItemId", "obj": { "value": "meatballs" } },
      { "template": "mainQuantity", "obj": { "value": 2 } },
      { "template": "vegetarianItemId", "obj": { "value": "pasta-primavera" } },
      { "template": "vegetarianQuantity", "obj": { "value": 0 } },
      { "template": "soupItemId", "obj": { "value": "tomato-soup" } },
      { "template": "soupQuantity", "obj": { "value": 0 } },
      { "template": "dessertItemId", "obj": { "value": "yogurt-berries" } },
      { "template": "dessertQuantity", "obj": { "value": 0 } },
      { "template": "timingStatus", "obj": { "value": "on-time" } },
      { "template": "basePoints", "obj": { "value": 20 } },
      { "template": "timingAdjustment", "obj": { "value": 5 } },
      { "template": "totalPoints", "obj": { "value": 25 } },
      { "template": "submittedAt", "obj": { "value": "2026-07-27T16:00:00.000Z" } }
    ]
  }
}
```

### 2. Regular lunch — vegetarian only

`mainQuantity` 0, `vegetarianQuantity` 1.

Same as (1) with `"mainQuantity": { "value": 0 }`, `"vegetarianQuantity": { "value": 1 }`.

### 3. Regular lunch — main and vegetarian

`mainQuantity` 1, `vegetarianQuantity` 2.

### 4. Soup lunch — soup only

`mealType` `soup`, `soupQuantity` 2, `dessertQuantity` 0, main/veg quantities 0.

### 5. Soup lunch — dessert only

`mealType` `soup`, `soupQuantity` 0, `dessertQuantity` 1.

### 6. Soup lunch — soup and dessert

`mealType` `soup`, `soupQuantity` 1, `dessertQuantity` 1.

### 7. No lunch

`mealType` `no_lunch`, all quantities 0, item ids still the day’s slot ids.

```json
{
  "type": "ACTIVITY",
  "data": {
    "template": "studentLunchCheckin",
    "start": "2026-07-27T16:00:00.000Z",
    "end": "2026-07-27T16:01:00.000Z",
    "properties": [
      { "template": "targetDate", "obj": { "value": "2026-07-28" } },
      { "template": "mealType", "obj": { "value": "no_lunch" } },
      { "template": "mainItemId", "obj": { "value": "meatballs" } },
      { "template": "mainQuantity", "obj": { "value": 0 } },
      { "template": "vegetarianItemId", "obj": { "value": "pasta-primavera" } },
      { "template": "vegetarianQuantity", "obj": { "value": 0 } },
      { "template": "soupItemId", "obj": { "value": "tomato-soup" } },
      { "template": "soupQuantity", "obj": { "value": 0 } },
      { "template": "dessertItemId", "obj": { "value": "yogurt-berries" } },
      { "template": "dessertQuantity", "obj": { "value": 0 } },
      { "template": "timingStatus", "obj": { "value": "on-time" } },
      { "template": "basePoints", "obj": { "value": 20 } },
      { "template": "timingAdjustment", "obj": { "value": 5 } },
      { "template": "totalPoints", "obj": { "value": 25 } },
      { "template": "submittedAt", "obj": { "value": "2026-07-27T16:00:00.000Z" } }
    ]
  }
}
```

**Late submit:** same payloads with `timingStatus` `late`, `timingAdjustment` `-5`, `totalPoints` `15`.

---

## F. One-shot submission architecture

| Rule | Behavior |
|------|----------|
| Pre-submit | User edits draft freely; Helsinki window enforced (`menuInteractive` false when closed or already saved) |
| Submit trigger | Single user action → build `ActiveDeclaration` → map to `ACTIVITY` |
| Message type | **`ACTIVITY` only** — closes iframe per demo documentation |
| No `SILENT_ACTIVITY` | Never used for this product |
| Duplicate click | Bridge sets `submissionInFlight` / `hasPostedActivity`; ignore further submits |
| Success | Mark `gameBusSubmitComplete`; lock UI (mirror `hasSavedDeclaration`); optional localStorage write non-authoritative |
| Failure | Show error; allow retry only if parent did not accept (no local “saved” state) |
| Post-success | No second `ACTIVITY`; repository `upsert` must not drive a second GameBus write |
| Persistence | GameBus activity store is authoritative in embed mode; localStorage is for standalone GitHub Pages demo |

**Parent protocol (reference demo):**

1. Child: `postMessage({ type: 'IFRAME_READY' }, '*')` on load (optionally `{ data: { height } }`).
2. Parent: `postMessage({ type: 'TASK', data: { … activityTemplates, … } })`.
3. Parent (optional): `postMessage({ type: 'INPUT_COLLECTIONS', data: { … } })`.
4. Child: `postMessage({ type: 'ACTIVITY', data: { … } })` once.
5. Parent closes modal on accepted `ACTIVITY`.

Origin validation: production should use `event.origin` allowlist (`providerPari` → `http://localhost:5193` in test); demo uses `'*'` — tighten in implementation.

---

## G. React integration architecture (proposed, not implemented)

```
src/gamebus/
  types.ts              # EmbeddedTaskMessage, ACTIVITY payload TS types (mirror schemas.ts)
  detectEmbed.ts        # isGameBusEmbed(): parent !== window || URL flag
  bridge.ts             # subscribe message listener, post IFRAME_READY, hold task + input collections
  mapDeclarationToActivity.ts  # ActiveDeclaration + DailyMealSlots → ACTIVITY data
  submitGuard.ts        # in-flight + hasPosted flags
  useGameBusEmbed.ts    # hook: ready state, task template ref, submitActivity(declaration)
  index.ts              # public API
```

**Hook integration (minimal touch to product):**

- `useLunchSelection.submit`: if `isGameBusEmbed()`, call `mapDeclarationToActivity` + `bridge.postActivity` instead of/in addition to `declarationRepository.upsertDeclaration`.
- Standalone: unchanged localStorage path when `!isGameBusEmbed()`.
- Inject `Clock` and optional `DeclarationRepository` remain as today for tests.

**Modules:**

| Module | Responsibility |
|--------|----------------|
| `types.ts` | Protocol typings aligned with Zod schema in demo |
| `bridge.ts` | `window.addEventListener('message')`, state for TASK / INPUT_COLLECTIONS |
| `mapDeclarationToActivity.ts` | Pure mapper from `ActiveDeclaration` + slots |
| `submitGuard.ts` | `assertCanPost()`, `markPosting()`, `markPosted()` |
| `useGameBusEmbed.ts` | Compose bridge + guard for React |
| `detectEmbed.ts` | Mode switch for GitHub Pages vs iframe |

---

## H. Routing and hosting

| Approach | Recommendation |
|----------|----------------|
| Dedicated `/embed/task` **inside React** | **Not required** — GameBus loads whatever URL is configured on the task (today `http://localhost:5193/embed/task` on the **host** app) |
| Query param e.g. `?gamebus=1` | **Optional** for local testing when not in iframe |
| **Iframe detection** | **Primary:** `window.parent !== window` → GameBus mode |

**Least complex reliable approach:**

1. Build React lunch app as static assets (existing Vite build).
2. Deploy so the **same origin** registered in GameBus (`providerPari`) serves the SPA at the task URL path (host responsibility: Svelte shell, static server rewrite, or CDN path).
3. React detects embed context; no Svelte port of lunch UI.

Port **5193** and SvelteKit are **demo/hosting choices**, not protocol requirements.

---

## I. Open questions

### Blockers

| # | Question | Notes |
|---|----------|--------|
| B1 | **GameBus admin:** when will `studentLunchCheckin` property templates be updated to section C? | Mapper cannot validate against live schemas until admin matches contract |
| B2 | **Confirm** Pari embedded task `activityTemplates[0].reference === 'studentLunchCheckin'` | Audit showed `+1` not expanded |

### Non-blocking confirmations

| # | Question |
|---|----------|
| N1 | Should `studentId` come from `INPUT_COLLECTIONS` / `/api/me` instead of `CANTEEN_CONFIG`? |
| N2 | Exact `postMessage` target origin in production (localhost only vs deployed host)? |
| N3 | Are `basePoints` / `totalPoints` on the activity required by platform rules, or only in-app UX? |

### Safe assumptions (implement unless contradicted)

- Property `obj` shape is `{ value: T }` per test-env export.
- `TASK.data.activityTemplates[].reference` selects template for `data.template`.
- `ACTIVITY` closes the task modal.
- Item ids in GameBus match `foodCatalogue` ids in the React app for the pilot menu.

---

## Reference: parent → child message handling (demo)

From `gamebus-minigame-demo` `embed/task/+page.svelte`:

- On mount: `IFRAME_READY`.
- On `event.data.type === 'TASK'`: store task, default `selectedTemplate` to first `activityTemplates[].reference`.
- On `INPUT_COLLECTIONS`: store resolved inputs.
- Submit: `postMessage({ type: 'ACTIVITY', data: buildActivityPayload() })`.

Child does **not** receive confirmation message in the demo; success is assumed when parent closes iframe. Implementation should treat close as success and optionally listen for future error events if the platform adds them.
