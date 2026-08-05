# GameBus admin setup — `chefForecast`

**Purpose:** Manual checklist to configure the existing **`chefForecast`** activity in GameBus admin.  
**Do not** create `chefForecastV2`, delete global property templates, or edit live config from this repository.  
**Chef app URL (after setup):** `https://parva662.github.io/raise-food-waste-minigames/#/chef`

**Code verification:** `src/gamebus/mapChefForecast.ts` and `src/gamebus/resolveChefForecastProperties.ts` require exactly **twelve required** property references always sent (including zero quantities and all four item IDs), plus **two optional** links (`confidence`, `notes`) included in the ACTIVITY only when the chef enters a value.

| Order | Reference | Required on activity |
|-------|-----------|----------------------|
| 1 | `targetDate` | yes |
| 2 | `forecastTotalCustomers` | yes |
| 3 | `mainItemId` | yes |
| 4 | `forecastMeat` | yes |
| 5 | `vegetarianItemId` | yes |
| 6 | `forecastVegetarian` | yes |
| 7 | `soupItemId` | yes |
| 8 | `forecastSoup` | yes |
| 9 | `dessertItemId` | yes |
| 10 | `forecastDessert` | yes |
| 11 | `timingStatus` | yes |
| 12 | `submittedAt` | yes |
| 13 | `confidence` | **optional link** — omit from payload when unanswered |
| 14 | `notes` | **optional link** — omit from payload when empty |

**Research value:** `confidence` supports comparison between perceived and actual forecast accuracy. `notes` preserves contextual information for unusual service days and improves interpretation and FAIR metadata.

**Activity template (test export):**

| Field | Value |
|-------|-------|
| Reference | `chefForecast` |
| Display name | Chef forecast |
| Admin ID | `019f9404-88f4-742a-9846-f9097610bae7` |

**Export snapshot date:** 2026-07-27 (`GAMEBUS_TEMPLATE_EXPORT.json` / `GAMEBUS_CONFIG_SNAPSHOT.md`). Live admin may differ — search before creating duplicates.

**ACTIVITY payload shape (confirmed):**

```json
{
  "type": "ACTIVITY",
  "data": {
    "template": "chefForecast",
    "start": "<ISO-8601>",
    "end": "<ISO-8601>",
    "properties": [
      { "template": "<reference>", "obj": { "value": <payload> } }
    ]
  }
}
```

**Forbidden on `chefForecast` (do not link):** `chefId`, `actors`, `provider`, `result`, `accuracy`, `waste`, `points`, `badge`, and any student-only properties (`mealType`, `mainQuantity`, etc.).

**Keep linked (optional):** `confidence`, `notes` — see §B.13–14. Do not delete their global property templates.

**Participant:** Chef identity comes from the **authenticated GameBus user** — no `chefId` on ACTIVITY.

---

## A. Final chefForecast property table

| Order | Reference | Display name | Export / live status | Action | Link on `chefForecast` | Value type |
|-------|-----------|--------------|----------------------|--------|------------------------|------------|
| 1 | `targetDate` | Target date | In export; linked on `chefForecast` | **REUSE EXISTING** | **Required** | `string` (date) |
| 2 | `forecastTotalCustomers` | Forecast total customers | In export; linked on `chefForecast` | **REUSE EXISTING** | **Required** | `integer` |
| 3 | `mainItemId` | Main dish id | **Not in export** | **VERIFY IN LIVE ADMIN** (create if missing) | **Required** | `string` |
| 4 | `forecastMeat` | Forecast meat | In export; linked on `chefForecast` | **REUSE EXISTING** | **Required** | `integer` |
| 5 | `vegetarianItemId` | Vegetarian dish id | **Not in export** | **VERIFY IN LIVE ADMIN** (create if missing) | **Required** | `string` |
| 6 | `forecastVegetarian` | Forecast vegetarian | In export; linked on `chefForecast` | **REUSE EXISTING** | **Required** | `integer` |
| 7 | `soupItemId` | Soup id | **Not in export** | **VERIFY IN LIVE ADMIN** (create if missing) | **Required** | `string` |
| 8 | `forecastSoup` | Forecast soup | In export; linked on `chefForecast` | **REUSE EXISTING** | **Required** | `integer` |
| 9 | `dessertItemId` | Dessert id | **Not in export** | **VERIFY IN LIVE ADMIN** (create if missing) | **Required** | `string` |
| 10 | `forecastDessert` | Forecast dessert | **Not in export** | **CREATE NEW** | **Required** | `integer` |
| 11 | `timingStatus` | Timing status | **Not in export** | **VERIFY IN LIVE ADMIN** (create if missing) | **Required** | `string` (enum) |
| 12 | `submittedAt` | Submitted at | In export on `studentLunchCheckin`; **not** linked on `chefForecast` | **VERIFY IN LIVE ADMIN** (reuse global) | **Required** | `string` (date-time) |
| 13 | `confidence` | Confidence | In export; linked on `chefForecast` | **REUSE EXISTING** | **KEEP LINKED, OPTIONAL** | `number` (0–1) |
| 14 | `notes` | Notes | In export; linked on `chefForecast` | **REUSE EXISTING** | **KEEP LINKED, OPTIONAL** | `string` (`minLength: 1` when sent) |

**Note:** `forecastMeat` is the existing reference for **main/classic** forecast quantity. Do not create `forecastMain`.

**Note:** The chef app validates integers 0–1000 (`src/config/chef.ts`). Existing export schemas for forecast integers use a wider maximum (`9007199254740991`) — **do not change those existing templates** unless you deliberately align admin with app limits.

---

## B. Full YAML schemas

Copy each block into the GameBus property-template editor as the full schema for `obj`.

### 1. `targetDate` — REUSE EXISTING

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
type: object
properties:
  value:
    type: string
    format: date
    minLength: 1
required:
  - value
additionalProperties: false
```

Example payload entry:

```json
{ "template": "targetDate", "obj": { "value": "2026-07-29" } }
```

---

### 2. `forecastTotalCustomers` — REUSE EXISTING

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
type: object
properties:
  value:
    type: integer
    minimum: 0
    maximum: 9007199254740991
required:
  - value
additionalProperties: false
```

Example payload entry:

```json
{ "template": "forecastTotalCustomers", "obj": { "value": 120 } }
```

---

### 3. `mainItemId` — VERIFY IN LIVE ADMIN (create if missing)

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
type: object
properties:
  value:
    type: string
    minLength: 1
required:
  - value
additionalProperties: false
```

Example payload entry:

```json
{ "template": "mainItemId", "obj": { "value": "chicken-steak-with-pesto-sauce-and-pasta" } }
```

---

### 4. `forecastMeat` — REUSE EXISTING

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
type: object
properties:
  value:
    type: integer
    minimum: 0
    maximum: 9007199254740991
required:
  - value
additionalProperties: false
```

Example payload entry:

```json
{ "template": "forecastMeat", "obj": { "value": 50 } }
```

---

### 5. `vegetarianItemId` — VERIFY IN LIVE ADMIN (create if missing)

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
type: object
properties:
  value:
    type: string
    minLength: 1
required:
  - value
additionalProperties: false
```

Example payload entry:

```json
{ "template": "vegetarianItemId", "obj": { "value": "chickpea-caponata-with-pasta" } }
```

---

### 6. `forecastVegetarian` — REUSE EXISTING

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
type: object
properties:
  value:
    type: integer
    minimum: 0
    maximum: 9007199254740991
required:
  - value
additionalProperties: false
```

Example payload entry:

```json
{ "template": "forecastVegetarian", "obj": { "value": 30 } }
```

---

### 7. `soupItemId` — VERIFY IN LIVE ADMIN (create if missing)

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
type: object
properties:
  value:
    type: string
    minLength: 1
required:
  - value
additionalProperties: false
```

Example payload entry:

```json
{ "template": "soupItemId", "obj": { "value": "minced-meat-and-bean-soup" } }
```

---

### 8. `forecastSoup` — REUSE EXISTING

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
type: object
properties:
  value:
    type: integer
    minimum: 0
    maximum: 9007199254740991
required:
  - value
additionalProperties: false
```

Example payload entry:

```json
{ "template": "forecastSoup", "obj": { "value": 40 } }
```

---

### 9. `dessertItemId` — VERIFY IN LIVE ADMIN (create if missing)

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
type: object
properties:
  value:
    type: string
    minLength: 1
required:
  - value
additionalProperties: false
```

Example payload entry:

```json
{ "template": "dessertItemId", "obj": { "value": "chocolate-mousse" } }
```

---

### 10. `forecastDessert` — CREATE NEW

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
type: object
properties:
  value:
    type: integer
    minimum: 0
    maximum: 1000
required:
  - value
additionalProperties: false
```

Example payload entry:

```json
{ "template": "forecastDessert", "obj": { "value": 25 } }
```

---

### 11. `timingStatus` — VERIFY IN LIVE ADMIN (create if missing)

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
type: object
properties:
  value:
    type: string
    enum:
      - on-time
      - late
required:
  - value
additionalProperties: false
```

Example payload entry:

```json
{ "template": "timingStatus", "obj": { "value": "on-time" } }
```

---

### 12. `submittedAt` — VERIFY IN LIVE ADMIN (reuse global)

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
type: object
properties:
  value:
    type: string
    format: date-time
    minLength: 1
required:
  - value
additionalProperties: false
```

Example payload entry:

```json
{ "template": "submittedAt", "obj": { "value": "2026-07-28T12:00:00.000Z" } }
```

---

### 13. `confidence` — REUSE EXISTING (KEEP LINKED, OPTIONAL)

Exact schema from `GAMEBUS_TEMPLATE_EXPORT.json`:

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
type: object
additionalProperties: false
properties:
  value:
    type: number
    minimum: 0
    maximum: 1
required:
  - value
```

Example payload entry (only when chef entered a value):

```json
{ "template": "confidence", "obj": { "value": 0.75 } }
```

---

### 14. `notes` — REUSE EXISTING (KEEP LINKED, OPTIONAL)

Exact schema from `GAMEBUS_TEMPLATE_EXPORT.json`:

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
type: object
additionalProperties: false
properties:
  value:
    type: string
    minLength: 1
required:
  - value
```

Example payload entry (only when chef entered non-empty text):

```json
{ "template": "notes", "obj": { "value": "Field trip — expect higher dessert uptake." } }
```

---

## C. Final activity links

`chefForecast` must link **fourteen** properties in this order: **twelve required** and **two optional**.

| Order | Reference | Display name | Required on activity |
|-------|-----------|--------------|-------------------|
| 1 | `targetDate` | Target date | yes |
| 2 | `forecastTotalCustomers` | Forecast total customers | yes |
| 3 | `mainItemId` | Main dish id | yes |
| 4 | `forecastMeat` | Forecast meat | yes |
| 5 | `vegetarianItemId` | Vegetarian dish id | yes |
| 6 | `forecastVegetarian` | Forecast vegetarian | yes |
| 7 | `soupItemId` | Soup id | yes |
| 8 | `forecastSoup` | Forecast soup | yes |
| 9 | `dessertItemId` | Dessert id | yes |
| 10 | `forecastDessert` | Forecast dessert | yes |
| 11 | `timingStatus` | Timing status | yes |
| 12 | `submittedAt` | Submitted at | yes |
| 13 | `confidence` | Confidence | **KEEP LINKED, OPTIONAL** |
| 14 | `notes` | Notes | **KEEP LINKED, OPTIONAL** |

**Verify and reuse** all existing property templates. **Create only** `forecastDessert` if missing.

**Current export (2026-07-27) — already linked on `chefForecast`:**  
`targetDate`, `forecastTotalCustomers`, `forecastMeat`, `forecastVegetarian`, `forecastSoup`, `confidence`, `notes` (keep these).

**Must be added as new links (if missing):**  
`mainItemId`, `vegetarianItemId`, `soupItemId`, `dessertItemId`, `forecastDessert`, `timingStatus`, `submittedAt`.

---

## D. Optional links — do not unlink

| Reference | Display name | Action |
|-----------|--------------|--------|
| `confidence` | Confidence | **KEEP LINKED, OPTIONAL** — supports perceived vs actual forecast accuracy research |
| `notes` | Notes | **KEEP LINKED, OPTIONAL** — preserves context for unusual service days and FAIR metadata |

**Do not delete** the global `confidence` or `notes` property templates. Other activities (e.g. `productionPlan`) may still use `notes`.

---

## E. Exact manual admin sequence

### Step 1 — Search existing property templates first

In GameBus admin → Property templates, search each reference:

`targetDate`, `forecastTotalCustomers`, `mainItemId`, `forecastMeat`, `vegetarianItemId`, `forecastVegetarian`, `soupItemId`, `forecastSoup`, `dessertItemId`, `forecastDessert`, `timingStatus`, `submittedAt`, `confidence`, `notes`

Record which already exist. **Do not create a duplicate** if the reference already exists.

### Step 2 — Create only missing templates

| Reference | If missing, action |
|-----------|-------------------|
| `forecastDessert` | **Always create** (not in export) — use schema in §B.10 |
| `mainItemId`, `vegetarianItemId`, `soupItemId`, `dessertItemId` | Create with §B.3, §B.5, §B.7, §B.9 if search finds nothing |
| `timingStatus` | Create with §B.11 if search finds nothing |
| `submittedAt` | Reuse existing global template (present on `studentLunchCheckin` in export); create only if missing everywhere |
| `targetDate`, `forecastTotalCustomers`, `forecastMeat`, `forecastVegetarian`, `forecastSoup`, `confidence`, `notes` | Should already exist — **do not recreate** |

### Step 3 — Open activity template `chefForecast`

- Reference: `chefForecast`
- Admin ID: `019f9404-88f4-742a-9846-f9097610bae7`
- Do **not** create a new activity or change the reference.

### Step 4 — Add missing property links

Add any missing links from §C. Keep existing links for `targetDate`, `forecastTotalCustomers`, `forecastMeat`, `forecastVegetarian`, `forecastSoup`, `confidence`, and `notes`.

### Step 5 — Set required flags

- Twelve core properties (§C rows 1–12): **Required** on the activity link.
- `confidence` and `notes`: **Optional** on the activity link (not required for ingest when omitted from payload).

### Step 6 — Keep `confidence` and `notes` linked

Do **not** unlink optional research fields. Leave global templates intact.

### Step 7 — Do not delete global templates

Never delete `confidence`, `notes`, or legacy properties used by other activities.

### Step 8 — Save and verify

1. Confirm `chefForecast` shows **14** linked properties: **12 required** + **2 optional**, in the order in §C.
2. Confirm `confidence` and `notes` remain **linked** (optional).
3. Submit a test `chefForecast` ACTIVITY from the embedded app (`#/chef`) or inspect ingest logs.
4. Verify stored activity has twelve `properties[]` entries minimum; fourteen when optional values were entered.
5. Verify participant is the logged-in chef (no `chefId` field).
6. Message type must be **`ACTIVITY`** (not `SILENT_ACTIVITY`).

### Step 9 — Embedded task (only after activity is correct)

Create or update an embedded task:

| Field | Value |
|-------|-------|
| Activity template | `chefForecast` (only this template on the task) |
| URL | `https://parva662.github.io/raise-food-waste-minigames/#/chef` |
| Type | `USER_TRIGGERED_EMBEDDED` (or equivalent) |

Ensure the provider origin allowlist includes the GitHub Pages host if required by your environment.

---

## F. Link change summary

### Properties that stay linked (already on `chefForecast` in export)

- `targetDate`
- `forecastTotalCustomers`
- `forecastMeat`
- `forecastVegetarian`
- `forecastSoup`
- `confidence` (optional link)
- `notes` (optional link)

### Properties that must be added to `chefForecast` (if missing)

- `mainItemId`
- `vegetarianItemId`
- `soupItemId`
- `dessertItemId`
- `forecastDessert`
- `timingStatus`
- `submittedAt`

### Confirmations

1. **`confidence` and `notes`** — **KEEP LINKED, OPTIONAL**; do not delete global templates.
2. **Do not link** `chefId`, `actors`, `provider`, `result`, `accuracy`, `waste`, `points`, `badge`, or student lunch properties.
3. **Do not create** `chefForecastV2` or any second chef activity.
4. **Create only** `forecastDessert` if the global template is missing; verify and reuse all other templates.

---

## G. Full example ACTIVITY (twelve required properties)

```json
{
  "type": "ACTIVITY",
  "data": {
    "template": "chefForecast",
    "start": "2026-07-28T12:00:00.000Z",
    "end": "2026-07-28T12:01:00.000Z",
    "properties": [
      { "template": "targetDate", "obj": { "value": "2026-07-29" } },
      { "template": "forecastTotalCustomers", "obj": { "value": 120 } },
      { "template": "mainItemId", "obj": { "value": "chicken-steak-with-pesto-sauce-and-pasta" } },
      { "template": "forecastMeat", "obj": { "value": 50 } },
      { "template": "vegetarianItemId", "obj": { "value": "chickpea-caponata-with-pasta" } },
      { "template": "forecastVegetarian", "obj": { "value": 30 } },
      { "template": "soupItemId", "obj": { "value": "minced-meat-and-bean-soup" } },
      { "template": "forecastSoup", "obj": { "value": 40 } },
      { "template": "dessertItemId", "obj": { "value": "chocolate-mousse" } },
      { "template": "forecastDessert", "obj": { "value": 25 } },
      { "template": "timingStatus", "obj": { "value": "on-time" } },
      { "template": "submittedAt", "obj": { "value": "2026-07-28T12:00:00.000Z" } }
    ]
  }
}
```

With optional values entered:

```json
{
  "type": "ACTIVITY",
  "data": {
    "template": "chefForecast",
    "start": "2026-07-28T12:00:00.000Z",
    "end": "2026-07-28T12:01:00.000Z",
    "properties": [
      { "template": "targetDate", "obj": { "value": "2026-07-29" } },
      { "template": "forecastTotalCustomers", "obj": { "value": 120 } },
      { "template": "mainItemId", "obj": { "value": "chicken-steak-with-pesto-sauce-and-pasta" } },
      { "template": "forecastMeat", "obj": { "value": 50 } },
      { "template": "vegetarianItemId", "obj": { "value": "chickpea-caponata-with-pasta" } },
      { "template": "forecastVegetarian", "obj": { "value": 30 } },
      { "template": "soupItemId", "obj": { "value": "minced-meat-and-bean-soup" } },
      { "template": "forecastSoup", "obj": { "value": 40 } },
      { "template": "dessertItemId", "obj": { "value": "chocolate-mousse" } },
      { "template": "forecastDessert", "obj": { "value": 25 } },
      { "template": "timingStatus", "obj": { "value": "on-time" } },
      { "template": "submittedAt", "obj": { "value": "2026-07-28T12:00:00.000Z" } },
      { "template": "confidence", "obj": { "value": 0.75 } },
      { "template": "notes", "obj": { "value": "Field trip expected at lunch." } }
    ]
  }
}
```

---

## H. Related repository docs

- [`GAMEBUS_CHEF_FORECAST_CONTRACT.md`](./GAMEBUS_CHEF_FORECAST_CONTRACT.md) — integration contract
- [`NEXT_STEPS.md`](./NEXT_STEPS.md) — roadmap
- `src/gamebus/mapChefForecast.ts` — runtime mapper (authoritative property list)
