# Next steps — GameBus integration

**Student workflow:** activity template **`studentLunchCheckin`** (twelve quantity-aware properties).  
**Closeout workflow:** activity template **`wasteMeasurement`** (fifteen required properties — mapper implemented in repo).  
**Chef workflow:** activity template **`chefForecast`** (twelve required properties + two optional links — mapper implemented in repo).

**References:** [`GAMEBUS_LUNCH_CONTRACT.md`](./GAMEBUS_LUNCH_CONTRACT.md), [`GAMEBUS_CHEF_FORECAST_CONTRACT.md`](./GAMEBUS_CHEF_FORECAST_CONTRACT.md), [`GAMEBUS_SERVICE_CLOSEOUT_CONTRACT.md`](./GAMEBUS_SERVICE_CLOSEOUT_CONTRACT.md), [`RAISE_BARLAUREA_STUDY_AND_SYSTEM_MASTER_PLAN.md`](./RAISE_BARLAUREA_STUDY_AND_SYSTEM_MASTER_PLAN.md), [`SPEC.md`](./SPEC.md).

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

## Service closeout — **completed** (manually verified end-to-end)

| Item | Status |
|------|--------|
| Route `#/service-closeout` | **Complete** |
| Input Collection canonical key | `serviceCloseoutInput` |
| Legacy plural key | `serviceCloseoutInputs` — temporarily accepted for backwards compatibility |
| **chefForecast retrieval** | **Complete** — `serviceCloseoutInput.chefForecasts` (`/api/me/activities`, authenticated user) |
| `GameBusChefForecast` read model | Parsed from inbound activities; read-only in closeout UI |
| Forecast selection | Exact `targetDate` match; duplicate testing activities → latest valid submission |
| GameBus ACTIVITY output | **Complete** — one `wasteMeasurement` per Finalize (fifteen required properties) |
| Embed behaviour | One Finalize → one ACTIVITY → iframe closes via normal GameBus behaviour |
| Waste units | UI grams; GameBus persistence kg (`grams / 1000` at mapper boundary) |
| Quantity properties | `preparedMainQuantity`, `preparedVegetarianQuantity`, `preparedSoupQuantity`, `preparedDessertQuantity` = actual kitchen prepared portions |
| Portion weights | Reference/calculation data in app only — **not** posted to GameBus |
| Actor identity | Authenticated GameBus user (`activity.actor`) — no separate head-chef property on ACTIVITY |
| Daily result calculation | **Implemented** — `#/chef-results` (fixture-backed simulation engine) |

Closeout embed URL: `https://parva662.github.io/raise-food-waste-minigames/#/service-closeout`

**Not used by operational closeout:** `actualServiceData`, `kitchenServiceCloseout`, `wasteReflection`, `productionPlan`.

**Known non-blocking GameBus issue (display only):** My Activities may show dessert overproduction (`overproductionDessertKg`) with the label “Overproduction meat (kg)” even though the property reference and persisted value are correct. Investigate in GameBus admin/UI — no application change required.

### `wasteMeasurement` required properties

| Property | Maps from |
|----------|-----------|
| `serviceDate` | closeout `targetDate` |
| `actualCustomers` | actual customers entered |
| `mainItemId` | resolved Main menu item ID |
| `preparedMainQuantity` | Main prepared portions |
| `vegetarianItemId` | resolved Vegetarian menu item ID |
| `preparedVegetarianQuantity` | Vegetarian prepared portions |
| `soupItemId` | resolved Soup menu item ID |
| `preparedSoupQuantity` | Soup prepared portions |
| `dessertItemId` | resolved Dessert menu item ID |
| `preparedDessertQuantity` | Dessert prepared portions |
| `overproductionMeatKg` | Main waste grams ÷ 1000 |
| `overproductionVegetarianKg` | Vegetarian waste grams ÷ 1000 |
| `overproductionSoupKg` | Soup waste grams ÷ 1000 |
| `overproductionDessertKg` | Dessert waste grams ÷ 1000 |
| `submittedAt` | finalization timestamp |

**Not posted:** portion weights, `headChefUserId`, forecast fields, `actualServiceData`, `wasteReflection`, `productionPlan`, `kitchenServiceCloseout`.

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

---

## Chef results — **implemented** (participant privacy + admin split)

| Item | Status |
|------|--------|
| Route `#/chef-results` | **Implemented** — participant-safe view (GameBus menu target) |
| Route `#/chef-results-admin` | **Implemented** — hidden admin/research all-staff view |
| GameBus exposure | Participant menu already opens `#/chef-results`; no config change required |
| Data source (this phase) | Development fixtures only — closeout actuals, chef forecasts, portion weights, staff rotation |
| Calculation model | Shared pure engine; per-staff simulation against shared observed service reality |
| Participant privacy | Own identifiable results + anonymous team median/range only |
| Composite score / ranking | **Not approved** — no score, leaderboard, or winner language |
| Admin authorization | **Not implemented** — route-level auth required before production |
| Multi-user GameBus retrieval | **Not implemented** (next major phase) |
| Fixture current user | Default `fixture-user-c`; dev selector + `sessionStorage` for calculation testing only |
| **GameBus authenticated identity** | **Confirmed** — `inputCollectionPari.me` (`/api/me`); parses `id`, `firstName`, `lastName`; debug panel with `?gamebusDebug=1` only |

**Participant (`#/chef-results`):** summary cards, category diverging visual, anonymous “How you compare”, weekly trend, lightweight “Kitchen progress”. No coworker names/IDs.

**Admin (`#/chef-results-admin`):** preserves prior all-staff research table — names, head chef, full calculation detail, weekly raw aggregation.

**Confirmed (GameBus identity):**

- Custom Embed Pages receive `INPUT_COLLECTIONS`.
- `inputCollectionPari.me` provides the authenticated GameBus account.
- Real `/api/me` shape uses `id`, `firstName`, `lastName`, `picture`, etc. (no top-level `name`).
- Current-user identity can be resolved in the app now.

**Blocked / waiting for GameBus (Raoul endpoint in progress):**

- Cross-user activity retrieval.
- Retrieving all kitchen staff `chefForecast` activities.
- Replacing fixture result users with real GameBus actors.
- Participant anonymous group comparison using real users.

**Student mission architecture (agreed, not implemented here):**

1. Lunch declaration → `studentLunchCheckin` (this repository).
2. Lunch observation/logging → future GameBus-native Activity task.

Conditional availability of Task 2 should preferably use existing `studentLunchCheckin.mealType` (`no_lunch` vs lunch) through the planned GameBus task availability mechanism rather than creating a synthetic activity. Student observation activity property schema is **not** finalized in code yet.

**Unresolved production decisions:**

**Semantics:** Simulated overproduction / shortage answers: “What would have happened if this staff member’s forecast had been used as the production plan?” — based on observed service demand. This is **not** attributed actual waste per person.

**Customer metrics (separate):** signed `forecastTotalCustomers - actualCustomers` and absolute error.

**Weekly aggregation (participant):** participated service count only; absent days omitted; total simulated over/shortage grams; mean absolute customer error — no winner/ranking.

---

## Next major phase (not started)

### MULTI-USER / GAMEBUS PARTICIPANT ORGANIZATION AND VISIBILITY TESTING

Validate participant association, multi-user visibility, and organization boundaries across student, chef, and closeout embeds in a real GameBus environment. Replace fixture forecasts with real multi-user GameBus data in the calculation engine. **Do not implement in this repository phase.**

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
- **Service closeout:** `src/serviceCloseout/*`, `src/gamebus/mapWasteMeasurement.ts`, route `#/service-closeout` → `wasteMeasurement` ACTIVITY.
- **Chef results:** `src/chefResults/*`, route `#/chef-results` (participant-safe), `#/chef-results-admin` (admin/research).
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

- Deploy; daily result calculation; badges/dashboards.
