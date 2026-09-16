# GameBus chef forecast — integration contract

**Status:** Repository mapper implemented (`src/gamebus/mapChefForecast.ts`)  
**Activity reference:** `chefForecast` only (no `chefForecastV2`)  
**Live GameBus:** Manual admin migration required — do not edit live config from this repo.

---

## A. Product model

The on-duty chef (personal GameBus account) submits **one forecast per target service date** (see [§A.1](#a1-target-service-date-and-eligible-windows)):

- expected total customers (headcount forecast);
- main, vegetarian, soup, and dessert portion forecasts (main and vegetarian are independent; soup and dessert share one soup-menu quantity);
- four menu item IDs from the generated catalogue;
- `timingStatus` and `submittedAt`;
- optionally `confidence` and `notes` when the chef enters values.

No `chefId`, `actors`, `provider`, `result`, `waste`, `points`, or `badge` fields on `chefForecast`.

**Research value:** `confidence` supports comparison between perceived and actual forecast accuracy. `notes` preserve contextual information for unusual service days and improve interpretation and FAIR metadata.

Participant association: **authenticated GameBus user** (chef on duty).

**Forecast semantics:** Expected customers and each menu-item quantity are separate forecasts, except soup and dessert which operationally form one soup menu. The chef UI enters soup quantity once and derives `forecastDessert` from `forecastSoup`; both properties are still submitted for GameBus compatibility. Main and vegetarian remain independent. One customer may consume multiple portions or categories. Later analysis compares each forecast property with its matching actual value; waste is a separate operational outcome.

---

## A.1 Target service date and eligible windows

All times are Europe/Helsinki, independent of device timezone. The target is resolved deterministically from the clock — there is no target-date picker and never two selectable targets.

| Helsinki time on an operational service day | Target | Entry |
|---|---|---|
| 00:00:00–07:59:59 | none | **closed** |
| 08:00:00–08:29:59 | **today's** operational service (same-day grace window) | open |
| 08:30:00–23:59:59 | **next** operational service | open |

An operational service day is a weekday that is not explicitly configured as closed. Menu availability is a **separate** concern: a weekday with missing menu data is still an operational service day; its `targetDate` is unchanged and only the menu-dependent form is blocked.

### Eligible activity windows for retrieval

An activity carrying `targetDate = D` is eligible only when `submittedAt` falls inside one of:

1. the previous operational service day `P`, **08:30:00–23:59:59**; or
2. `D` itself, **08:00:00–08:29:59**.

Anything outside those windows is ineligible for `D`. `targetDate` is always explicit on the activity: never infer it from `submittedAt`, and never substitute an activity belonging to another `targetDate`.

### Pilot replay and retrieval selection

Intended production behaviour is **one successful forecast per authenticated staff member per `targetDate`**. GameBus is currently configured to allow replay during the pilot, so for a given actor + exact `targetDate`, downstream retrieval collects matching activities, discards those outside the eligible windows, and uses the **latest eligible `submittedAt`**. A later **ineligible** activity never replaces an earlier eligible one.

This is a retrieval/analysis rule for deterministic pilot data. It does not change the production workflow, is not permission to submit multiple forecasts, and the current replay count must not be hard-coded into product logic.

---

## B. Activity template

| Field | Value |
|-------|--------|
| **Reference** | `chefForecast` (retain) |
| **Label** | Chef forecast |
| **Admin ID (test)** | `019f9404-88f4-742a-9846-f9097610bae7` |
| **Embed URL** | `https://parva662.github.io/raise-food-waste-minigames/#/chef` |

---

## C. Final property set (fourteen activity links)

ACTIVITY shape: `{ "template": "<ref>", "obj": { "value": <payload> } }`

Twelve properties are **always sent**. Two are **optional in the payload** (omit when unanswered).

| Reference | Display name | Exists | Action | Activity link |
|-----------|--------------|--------|--------|---------------|
| `targetDate` | Target date | yes | reuse | required |
| `forecastTotalCustomers` | Forecast total customers | yes | reuse | required |
| `mainItemId` | Main dish id | yes (global) | reuse + link | required |
| `forecastMeat` | Forecast main (classic) | yes | reuse | required |
| `vegetarianItemId` | Vegetarian dish id | yes (global) | reuse + link | required |
| `forecastVegetarian` | Forecast vegetarian | yes | reuse | required |
| `soupItemId` | Soup id | yes (global) | reuse + link | required |
| `forecastSoup` | Forecast soup | yes | reuse | required |
| `dessertItemId` | Dessert id | yes (global) | reuse + link | required |
| `forecastDessert` | Forecast dessert | **no** | **create + link** if missing | required |
| `timingStatus` | Timing status | yes (global) | reuse + link | required |
| `submittedAt` | Submitted at | yes (global) | reuse + link | required |
| `confidence` | Confidence | yes | **keep linked** | **optional** |
| `notes` | Notes | yes | **keep linked** | **optional** |

**Note:** `forecastMeat` is the existing property for main/classic forecast quantity. Do not create `forecastMain` as a duplicate.

**Note:** `forecastTotalCustomers` is reused for expected customers (exact semantics match).

All four item IDs and all four forecast quantities are **always sent**, including zero values.

Optional payload rules:

- omit `confidence` when unanswered;
- omit `notes` when empty or whitespace only;
- never send `null` or empty strings;
- if a value was entered but the corresponding optional link is missing on the TASK, the app returns a clear error.

---

## D. GameBus admin migration plan

Verify and reuse existing property templates. **Create only** `forecastDessert` if missing. **Keep** `confidence` and `notes` linked as optional activity properties.

### D.1 Property templates — full editor YAML

#### `targetDate` — reuse

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

Example `obj.value`: `"2026-07-29"`

#### `forecastTotalCustomers` — reuse

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

Example `obj.value`: `120`

#### `mainItemId` — reuse global template, add activity link

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

Example `obj.value`: `"chicken-steak-with-pesto-sauce-and-pasta"`

#### `forecastMeat` — reuse (main forecast quantity)

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

Example `obj.value`: `50`

#### `vegetarianItemId` — reuse global template, add activity link

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

Example `obj.value`: `"chickpea-and-apricot-stew-with-pasta"`

#### `forecastVegetarian` — reuse

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

Example `obj.value`: `30`

#### `soupItemId` — reuse global template, add activity link

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

Example `obj.value`: `"pike-fish-ball-soup"`

#### `forecastSoup` — reuse

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

Example `obj.value`: `40`

#### `dessertItemId` — reuse global template, add activity link

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

Example `obj.value`: `"mango-and-pear-lassi"`

#### `forecastDessert` — **CREATE** new global property template if missing

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

Example `obj.value`: `40` (must match `forecastSoup` for chef-submitted forecasts)

#### `timingStatus` — reuse global template, add activity link

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

Example `obj.value`: `"on-time"`

**Note:** the `late` enum value is retained for **schema compatibility** with the shared global template. Kitchen Forecast never creates an accepted late forecast: a submission is only possible inside an eligible window ([§A.1](#a1-target-service-date-and-eligible-windows)), so every recorded `chefForecast` carries `on-time`.

#### `submittedAt` — reuse global template, add activity link

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
type: object
properties:
  value:
    type: string
    format: date-time
required:
  - value
additionalProperties: false
```

Example `obj.value`: `"2026-07-28T12:00:00.000Z"`

#### `confidence` — reuse (KEEP LINKED, OPTIONAL)

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

Example `obj.value`: `0.75`

#### `notes` — reuse (KEEP LINKED, OPTIONAL)

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

Example `obj.value`: `"Staff shortage expected at lunch service."`

---

## E. Example ACTIVITY payload

Twelve required properties only:

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
      { "template": "forecastDessert", "obj": { "value": 40 } },
      { "template": "timingStatus", "obj": { "value": "on-time" } },
      { "template": "submittedAt", "obj": { "value": "2026-07-28T12:00:00.000Z" } }
    ]
  }
}
```

With optional values:

```json
{
  "template": "confidence",
  "obj": { "value": 0.75 }
}
```

```json
{
  "template": "notes",
  "obj": { "value": "Field trip expected at lunch." }
}
```

Use **`ACTIVITY`** only (not `SILENT_ACTIVITY`) so GameBus closes the embedded task iframe.

---

## F. Future result integration boundary

Not implemented in this phase. Join keys for a later `chefForecastResult` or badge process:

- `targetDate`
- authenticated chef (GameBus activity owner)
- restaurant/service identifier (if required later)
- menu item IDs where available

Comparison uses **whole-canteen operational data**, not student declarations.

---

## G. Code references

| Module | Role |
|--------|------|
| `src/chef/ChefApp.tsx` | Chef UI |
| `src/chef/components/ChefAdditionalContext.tsx` | Optional confidence (five labeled radios) and notes |
| `src/chef/components/ChefFormGuidance.tsx` | Incomplete-form guidance |
| `src/chef/components/ChefSubmitPanel.tsx` | Submit control and disabled explanation |
| `src/chef/useChefForecast.ts` | State and submit |
| `src/config/chef.ts` | Max quantity (1000) and deadline config |
| `src/gamebus/mapChefForecast.ts` | Property value mapper |
| `src/gamebus/buildChefActivityMessage.ts` | ACTIVITY builder |
| `src/gamebus/propertySchemas.ts` | `CHEF_FORECAST_PROPERTY_SCHEMAS` |
