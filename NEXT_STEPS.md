# Next steps — GameBus integration

**Student workflow:** activity template **`studentLunchCheckin`** (twelve quantity-aware properties).  
**Chef workflow:** activity template **`chefForecast`** (twelve required properties + two optional links — mapper implemented in repo).

**References:** [`GAMEBUS_LUNCH_CONTRACT.md`](./GAMEBUS_LUNCH_CONTRACT.md), [`GAMEBUS_CHEF_FORECAST_CONTRACT.md`](./GAMEBUS_CHEF_FORECAST_CONTRACT.md), [`RAISE_BARLAUREA_STUDY_AND_SYSTEM_MASTER_PLAN.md`](./RAISE_BARLAUREA_STUDY_AND_SYSTEM_MASTER_PLAN.md), [`SPEC.md`](./SPEC.md).

**Participant model:** Embedded submit does **not** send `studentId` or `chefId` on ACTIVITY; persistence must bind to the **authenticated GameBus user**.

**Do not create** `studentLunchCheckinV2`, `chefForecastV2`, or relink embedded tasks in this phase.

---

## Chef `chefForecast` — repo mapper ready

| Property | Activity link | Notes |
|----------|---------------|-------|
| `targetDate` | required | reuse |
| `forecastTotalCustomers` | required | reuse (expected customers) |
| `mainItemId` | required | reuse global + link |
| `forecastMeat` | required | reuse (main quantity) |
| `vegetarianItemId` | required | reuse global + link |
| `forecastVegetarian` | required | reuse |
| `soupItemId` | required | reuse global + link |
| `forecastSoup` | required | reuse |
| `dessertItemId` | required | reuse global + link |
| `forecastDessert` | required | **create** new template |
| `timingStatus` | required | reuse global + link |
| `submittedAt` | required | reuse global + link |
| `confidence` | **optional link** | **keep linked** — omit from payload when unanswered |
| `notes` | **optional link** | **keep linked** — omit from payload when empty |

**Research value:** `confidence` supports perceived vs actual forecast accuracy; `notes` preserve context for unusual service days and FAIR metadata.

Full YAML schemas: `GAMEBUS_CHEF_FORECAST_CONTRACT.md`, `src/gamebus/propertySchemas.ts`.

Chef embed URL: `https://parva662.github.io/raise-food-waste-minigames/#/chef`

---

## Student `studentLunchCheckin` — repo mapper ready

| Property | Activity link | JSON Schema (`obj.value`) |
|----------|---------------|---------------------------|
| `targetDate` | required | `string`, `format: date` |
| `mealType` | required | `string`, enum `regular` \| `soup` \| `no_lunch` |
| `mainItemId` | **optional** | `string`, `minLength: 1` — **omit** when `mainQuantity` is 0 |
| `mainQuantity` | required | `integer`, min 0, max 6 — always sent |
| `vegetarianItemId` | **optional** | `string`, `minLength: 1` — omit when `vegetarianQuantity` is 0 |
| `vegetarianQuantity` | required | integer, min 0, max 6 — always sent |
| `soupItemId` | **optional** | `string`, `minLength: 1` — omit when `soupQuantity` is 0 |
| `soupQuantity` | required | integer, min 0, max 6 — always sent |
| `dessertItemId` | **optional** | `string`, `minLength: 1` — omit when `dessertQuantity` is 0 |
| `dessertQuantity` | required | integer, min 0, max 6 — always sent |
| `timingStatus` | required | enum `on-time` \| `late` |
| `submittedAt` | required | `string`, `format: date-time` |

**ACTIVITY property shape (confirmed):** `{ "template": "<ref>", "obj": { "value": <payload> } }` — not `{ "template": "<ref>", "value": <payload> }`.

**Excluded from ACTIVITY:** `studentId`, `basePoints`, `timingAdjustment`, `totalPoints`, `actors`, `provider`, legacy sentinels (`noMain`, `noVeg`, etc.).

**Item ids:** Generated catalogue slugs from `reference/Example_menu.xlsx` (via `src/data/generated/`). Selected dishes only; no null, no empty strings.

---

## Admin migration (manual — do not run from this repo)

Migrate the **existing** `studentLunchCheckin` activity template; do **not** delete old property templates yet.

| Current property | Action | Final |
|------------------|--------|-------|
| `targetDate` | reuse | `targetDate` |
| `submittedAt` | reuse | `submittedAt` |
| `comingStatus` | unlink / replace link | `mealType` |
| `selectedMain` | unlink / replace | `mainItemId` + `mainQuantity` |
| `selectedVegetarianOrNoVeg` | unlink / replace | `vegetarianItemId` + `vegetarianQuantity` |
| `selectedSoupOrNoSoup` | unlink / replace | `soupItemId` + `soupQuantity` |
| `selectedDessertOrNoDessert` | unlink / replace | `dessertItemId` + `dessertQuantity` |
| — | add property templates + links | `timingStatus` |

Full JSON Schemas and examples: `src/gamebus/propertySchemas.ts`.

---

## Roadmap (ordered)

### Chef forecast (manual admin)

1. Create **`forecastDessert`** property template in GameBus admin **only if missing**.
2. Link item IDs, `timingStatus`, `submittedAt`, `forecastDessert` on **`chefForecast`** (verify existing links).
3. **Keep** `confidence` and `notes` linked as **optional** activity properties.
4. Create embedded task pointing to `#/chef` URL.
5. Verify ingest, participant association, duplicate behaviour, modal closure.

### Student lunch (manual admin)

1. Create or update **property templates** in GameBus admin (schemas in `propertySchemas.ts`).
2. Update **`studentLunchCheckin`** activity-template property links.
3. Confirm optional item-ID **omission**, enum behaviour, and schema validation on ingest.
4. **Test Pari** embedded task against migrated template.
5. Verify stored values and **logged-in participant** association.
6. Production hardening (origins, iframe, mobile, deploy).

## Completed in repo (do not regress)

- Student embed mapper: `src/gamebus/mapStudentLunchCheckin.ts` → `studentLunchCheckin`.
- **Chef forecast:** `src/chef/*`, `src/gamebus/mapChefForecast.ts`, route `#/chef`.
- Pari iframe on GitHub Pages + `providerPari` origin (admin).
- Node **Excel → JSON** conversion (`scripts/menu/`, `generated-data/menu/`).
- **Runtime dated menu** from `src/data/generated/`; +175 day date shift unchanged.
- **Category placeholder images** (`public/images/menu/placeholders/`).

## Still pending (manual / live)

- GameBus admin: migrate `studentLunchCheckin` to twelve properties.
- GameBus admin: migrate `chefForecast` to fourteen links (12 required + 2 optional; create `forecastDessert` only if missing).
- Participant association without `studentId`/`chefId` on ACTIVITY (verify on test env).
- Real food photography (`public/images/menu/items/<id>.webp`).

## Out of scope this phase

- Commit; deploy; actual-waste import; result/badge calculation; dashboards; delete existing GameBus property templates.
