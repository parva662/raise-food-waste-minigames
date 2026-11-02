# PoweResta Public API — RAISE Integration Reference

**Document status:** API reference / integration handoff; **not** an implemented integration or a verified live API contract.  
**Prepared:** 2026-11-02  
**Source:** User-supplied copy of PoweResta public API documentation, version **1.0.0**, **OpenAPI 3.0**.  
**Source archive:** [`POWERESTA_PUBLIC_API_SOURCE_CAPTURE_2026-11-02.md`](./POWERESTA_PUBLIC_API_SOURCE_CAPTURE_2026-11-02.md) (verbatim copy, including full response examples).  
**RAISE repository inspected:** `parva662/raise-food-waste-minigames`, `main`, commit `436cf49ce85afb68bf06d797a3a04667edb61439` (2026-11-02 inspection).  
**Suggested repository location:** `docs/integrations/POWERESTA_PUBLIC_API_REFERENCE.md` (the source archive may live beside it).  
**Intended readers:** Cursor, RAISE developers, API integrators and pilot coordinators.

> **Evidence boundary.** This document describes what the supplied documentation **shows**. No credentials were supplied to the assistant, no live API calls were made, and endpoint response envelopes, pagination, token expiry, CORS, tenancy, and access scopes have **not** been experimentally verified. Placeholders are placeholders, not actual site/menu identifiers. Keep this reference even if the eventual integration architecture changes.

## 1. Quick start and key facts

| Item | Documented value |
|---|---|
| Product | PoweResta public API |
| API version | `1.0.0` / version 1 (default) |
| Spec label | OpenAPI `3.0` |
| Public-data base URL | `https://publicapi.fi.poweresta.com/public/` |
| Login base URL | `https://publicapi.fi.poweresta.com/` |
| Login method | `POST /login/` (not under `/public`) |
| Login request body | `tenant`, `publicApiUserName`, `password` |
| Login success | JSON `{"token":"<JWT>"}` (HTTP 200); HTTP 401 is documented |
| Authenticated requests | **`authorization` header containing raw JWT**, **no `Bearer ` prefix** |
| Cookies | **Do not send login cookie on later requests**; the source warns that requests with both header and cookie fail |
| Core menu lookup | `/public/publicmenu/menus/{SITE_NAME}/`, `/public/publicmenu/menu/{SITE_NAME}/?menu=...`, `/public/publicmenu/dates/{SITE_NAME}/?menu=...&dates=...` |
| Recipe detail | `/public/recipe/{id}/?_languageId={LANGUAGE_ID}` |
| Recipe list | `/public/recipe/` with optional filters |
| Supported languages | `/public/language/` |

**URL composition:** The source lists a `/public/` server and then shows relative paths such as `/publicmenu/dates/{SITE_NAME}/`. The fully combined `/public/publicmenu/...` URLs above reflect that documented server + endpoint pairing; confirm with a safe request before treating the combination as production-verified. The login endpoint uses the separate root server.

### Safe, illustrative requests (credentials supplied at runtime only)

```bash
# Environment variables must be set outside shell history / source control.
API_ORIGIN='https://publicapi.fi.poweresta.com'

# Login: note that this endpoint is NOT under /public/.
curl -sS -X POST "$API_ORIGIN/login/" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{"tenant":"<TENANT>","publicApiUserName":"<API_USERNAME>","password":"<PASSWORD>"}'
# Response example: {"token":"<JWT>"}

# Use the JWT in the authorization header *without* a Bearer prefix.
# Avoid carrying over any cookies from the login response.
curl -sS "$API_ORIGIN/public/publicmenu/menus/<SITE_NAME>/" \
  -H 'Accept: application/json' \
  -H "authorization: <JWT>"

curl -sS "$API_ORIGIN/public/publicmenu/dates/<SITE_NAME>/?menu=<URL_ENCODED_MENU_NAME>&dates=2026-11-03,2026-11-04" \
  -H 'Accept: application/json' \
  -H "authorization: <JWT>"
```

These commands are **illustrations, not executed tests**. Replace placeholders securely. URL-encode path/query values as appropriate. Avoid logging the JWT or response bodies containing confidential information.

## 2. Endpoint directory — complete list in the supplied capture

All paths below are **relative to the public-data base** (`https://publicapi.fi.poweresta.com/public/`) **except login**.

| Area | Method | Documented relative route | Purpose | Parameters explicitly shown | Notes |
|---|---|---|---|---|---|
| Authentication | POST | `/login/` | Request JWT | JSON body: `tenant`, `publicApiUserName`, `password` | Root server, not public-data base |
| Site properties | GET | `/site/propertybypublicurl/{PUBLIC_URL}/` | Property value(s) of a site | `PUBLIC_URL` and `authorization` | The source labels `PUBLIC_URL` as *query* despite displaying it in the path; verify |
| Site | GET | `/site/{id}` | Site record by ID | `id` UUID | No auth header parameter explicitly shown in this endpoint entry |
| Allergen | GET | `/allergen/{id}` | Allergen record by ID | `id` UUID | Localized names, `containmentCode` |
| Languages | GET | `/language/` | Supported languages | None shown | Use to resolve `_languageId` |
| Country | GET | `/country/{id}` | Country record by ID | No details captured | **Only method and path visible in source** |
| Origin | GET | `/origin/{id}` | Origin record by ID | `id` UUID | Localized names |
| Nutritive claim | GET | `/nutritiveclaim/{id}` | Nutritional claim record | `id` UUID | `claimCode`, localized names |
| Additive | GET | `/additive/{id}` | Additive record | `id` UUID | Localized names |
| Diet | GET | `/diet/{id}` | Diet record | `id` UUID | Localized names |
| Unit of measurement | GET | `/unitofmeasurement/{id}` | Unit metadata | `id` UUID | `code`, `ratio`, `type`, `quantityType`, names |
| Recipe detail | GET | `/recipe/{id}/?_languageId={LANGUAGE_id}` | Recipe with ingredients/steps/nutrition/waste fields | `id` UUID, `_languageId` UUID | Both parameters marked required in capture |
| Recipe list | GET | `/recipe/` | List/search recipes | See §5 | Source example looks like one object; actual collection wrapper unverified |
| Recipe group | GET | `/recipegroup/{id}` | Group by ID | `id` UUID | Localized names and `order` |
| Published menu metadata | GET | `/publicmenu/menu/{SITE_NAME}/?menu={MENU_NAME}` | Menu basic info | `SITE_NAME`, `MENU_NAME`, `authorization` | `SITE_NAME` marked *query* in table despite path notation |
| Published menu discovery | GET | `/publicmenu/menus/{SITE_NAME}/` | Find published menus at a site | `SITE_NAME`, `authorization` | Returns example with `publishUrl` and localized names |
| Published menu dates | GET | `/publicmenu/dates/{SITE_NAME}/?menu={MENU_NAME}&dates={DATE1,DATE2...}` | Get dated published menu content | `SITE_NAME`, `MENU_NAME`, `dates`, `authorization` | Dates are comma-separated `YYYY-MM-DD` |

**Source limitation:** All documented response entries show HTTP `200`; the login entry also shows `401`, and the recipe-list entry also shows `400` with `{"message":"string"}`. Do not assume this is a comprehensive error-code list. Some entity endpoints omit an `authorization` parameter in the captured documentation; **this does not prove anonymous access**.

## 3. Authentication and security requirements

**Documented sequence**

1. POST a JSON login payload to `https://publicapi.fi.poweresta.com/login/`:

   ```json
   {"tenant":"<TENANT>","publicApiUserName":"<API_USERNAME>","password":"<PASSWORD>"}
   ```

2. Parse the `token` from a successful JSON response.
3. On subsequent requests pass `authorization: <JWT>` **without `Bearer`**.
4. Do not send the login cookie along with the token. The capture states that sending both causes failure.
5. Handle authorization failures and expired tokens robustly. **Token expiry/refresh semantics are not documented in the capture.**

**RAISE-specific security constraint:** The current frontend is deployed as a static GitHub Pages React application. **Never put PoweResta credentials, a persistent token, or a login request containing secrets in browser JavaScript, a bundled `.env`, GameBus client-side Input Collections, screenshots, tests, or committed Markdown.** A future integration should use a server-side connector, approved GameBus server-side Input Request if it supports the requisite login/header handling, or a secured data synchronization service. How the API fits GameBus needs explicit testing and authorization approval. The capture does not establish whether PoweResta permits cross-origin browser calls.

**No credentials or real tenant/site names are included in this document.**

## 4. Published menus — priority for the student lunch game

The most useful starting point for the RAISE student lunch interface is the **published-menu** family, not the recipe catalogue alone.

### 4.1 Discover published menus for a site

`GET /publicmenu/menus/{SITE_NAME}/`

Source example:

```json
{
  "publishUrl": "<PUBLISHED_MENU_IDENTIFIER>",
  "menuNames": [{"language":"<LANGUAGE>","name":"<NAME>"}]
}
```

**Use:** Discover what published menu identifiers exist. Confirm whether `publishUrl` corresponds to the `menu` query parameter; the source does not explicitly state this relationship. Confirm actual response is a list or an envelope before implementing collection parsing.

### 4.2 Retrieve menu metadata

`GET /publicmenu/menu/{SITE_NAME}/?menu={MENU_NAME}`

Source response fields:

| JSON path | Source type | Meaning/notes |
|---|---|---|
| `menuId` | UUID example | Menu identifier |
| `siteId` | UUID example | Site identifier |
| `version` | UUID example | Version identifier **in this endpoint** |
| `menuNames[]` | Array of `{language, name}` | Localized menu name |
| `menuInformation[]` | Array of `{language, information}` | Localized contextual information |

### 4.3 Retrieve actual dated menu

`GET /publicmenu/dates/{SITE_NAME}/?menu={MENU_NAME}&dates={DATE1,DATE2...}`

The `dates` query parameter is a comma-separated list of `YYYY-MM-DD` dates (per source). The payload is the central source for what is offered on a particular lunch day.

**Field tree reproduced from the captured response example** (types are those in the example, not verified live values):

```text
menuId: string (UUID example)
siteId: string (UUID example)
date: string
version: number                 <-- differs from menu metadata's UUID-like version
mealOptions[]
  names[]
    language: string
    name: string
  prices[]
    names[] { language: string, name: string }
    priceExclTax: string
    priceInclTax: string
    priceTaxPercent: string
  rows[]
    names[] { language: string, name: string }
    allergens[] { language: string, allergens: string[] }
    diets[] { language: string, diets: string[], dietShorts: string[] }
    ingredients[] { language: string, ingredients: string }
    publicInfos[] { language: string, publicInfos: string }
    co2Value[]
      valuePerPortionInKg: string
      ranges[] { name: string, min: string, max: string, color: string }
    nutritiveItems
      portionSize: number
      portionUnitOfMeasurementNames[] { language: string, name: string }
      factors[]
        nutritiveFactorNames[] { language: string, name: string }
        values[] { language: string, value: string, value100: string }
        mainGroupCode: string
        factorOrder: string
        energyContent: string
        energyProportion: string
        compareProportion: string
```

**Important integration caveats:**

- The source does **not** identify a dedicated slot key corresponding to RAISE's `classic`, `vegetarian`, `soup`, and `dessert` categories. The actual menu structure, localized names, group/option semantics and site-specific conventions must be inspected before defining a reliable slot adapter.
- The published menu endpoint does **not** show recipe IDs on its dated `mealOptions[].rows[]`. **Do not assume an automatic join to `/recipe/{id}` is possible.** Confirm a real identifier/crosswalk first.
- The public menu's `version` is shown as `number`, while menu metadata's `version` example is a UUID. Keep the two endpoint types separate until actual examples confirm.
- `nutritiveItems.factors[].values[]` and prices are example **strings**, not parsed numbers. Convert only after validating actual locale/decimal separator and units.
- `co2Value.valuePerPortionInKg` is an environmental-footprint field; it is **not** a plate-waste measurement.
- No explicit menu row photograph/image URL appears in the published dated-menu response example.
- The source describes published menu data but gives **no promise** about how far in advance future dates are available or whether unpublished days return empty/404.

## 5. Recipes — priority for kitchen ingredient and waste-method context

### 5.1 Recipe detail

`GET /recipe/{id}/?_languageId={LANGUAGE_ID}`

Source identifies both path ID and `_languageId` (UUID) as required.

**Top-level fields**

| Field(s) | Example type | Notes |
|---|---|---|
| `id`, `siteId`, `workspaceId` | UUID strings | Recipe, site and workspace identifiers |
| `code` | string | Recipe code |
| `sizeBatch`, `numberBatch` | number | Batch attributes; units not established |
| `sizePortion`, `numberPortion` | number | Portion attributes; units not established |
| `lossServing`, `lossCooking` | number | Loss fields; **units/percentage semantics not defined in capture** |
| `sizePortionRaw`, `sizePortionCooked`, `sizeTotalRaw`, `sizeTotalCooked`, `sizeTotal`, `sizeBatchRaw`, `sizeBatchCooked` | number | Amount/weight-style fields; actual unit semantics need verification |
| `createdAt`, `updatedAt` | string | Timestamp/date strings |
| `names[]` | object array | `{id,languageId,name,type}` |
| `rows[]` | object array | Ingredients, subrecipes, preparation instructions and costing; see below |
| `salesPrices[]`, `recipeGroups[]`, `diets[]`, `deliveries[]` | object arrays | Pricing, categorization, site delivery data |
| `labelIngredientLists[]`, `labels[]`, `label[]`, `allergens[]`, `nutritiveClaims[]`, `originCountries[]`, `additives[]` | arrays | Label, regulatory/ingredient and classification data |
| `nutritiveItem` | object | Portion nutrition and factor details |
| `co2Value` | object | CO2 value and provenance |
| `comparePriceExclTax`, `comparePriceInclTax`, `batchPriceExclTax`, `batchPriceInclTax`, `portionPriceExclTax`, `portionPriceInclTax` | number | Prices in response example |

**`rows[]` — the key recipe/ingredient record**

| JSON path | Example type | Notes |
|---|---|---|
| `rows[].id` | string | Row ID |
| `rows[].itemId`, `rows[].tradeItemId`, `rows[].subRecipeId` | string | May be item/trade-item/subrecipe IDs; example does not establish null/empty semantics |
| `rows[].order`, `rows[].type` | number | Recipe row ordering/type |
| `rows[].quantity` | **string** | Source example is a string, not number |
| `rows[].quantityUnitOfMeasurementId` | **string** | Resolve unit via unit-of-measurement endpoint when possible |
| `rows[].lossPreparation` | **string** | Potential preparation/trim-loss input; **meaning, units and formula must be confirmed** |
| `rows[].translated[]` | objects | `{id,languageId,info,header,method}` — preparation instructions |
| `rows[].tradeItemNames[]`, `rows[].itemNames[]`, `rows[].subRecipeNames[]` | objects | Localized ingredient/subrecipe names |
| `rows[].imageId`, `rows[].imageType`, `rows[].imageIdFullUrl`, `rows[].imageIdUrl` | UUID/string/number/string/string | Recipe-row image references; check URLs and permissions before use |
| `rows[].portionPriceExclTax`, `rows[].portionPriceInclTax`, `rows[].comparePriceExclTax`, `rows[].comparePriceInclTax` | **string** | Example row price strings |
| `rows[].isFoodstuff` | boolean | Foodstuff indicator |
| `rows[].ratioText`, `rows[].purchaseQuantity`, `rows[].percentage` | **string** | Example conversion/proportion-related fields |
| `rows[].usedTradeItemId` | UUID string | Used trade item |

**Other nested recipe fields shown:**

```text
salesPrices[]: id, marginExclTax, marginPercent, targetMarginPercent,
               siteId, workspaceId, name, portionType, priceExclTax,
               priceInclTax, priceTaxPercent, compensationExclTax,
               validityStartDate, validityEndDate
recipeGroups[]: recipeGroupId
diets[]: dietId
deliveries[]: quantity, siteNames[{languageId,name}], targetSiteNames[{languageId,name}]
labelIngredientLists[]: id, languageId, ingredients
labels[]: id, originId, origin2Id, countryId, country2Id, name,
          dateUseByType, datePackagingType, shelfLife, gtin,
          translated[{storageInstructions,usageInstructions,info}]
label[]: languageId, ingredients
nutritiveItem: portionSize, portionUnitOfMeasurement{id,code,names[]},
               preparedState, factors[{nutritiveFactor{...},value,valuePer100,
               percentage,energyContent,calculatePercentage,energyProportion,
               compareProportion,unitOfMeasurement{...}}]
co2Value: valuePerKg, value, portionSize, portionUnitOfMeasurementId,
          sources[{source,targetCountry,targetYear}]
originCountries[]: originId, countryId
```

For exact field shapes, see the archived original API source (recipe detail response example spans approximately lines 501–752).

### 5.2 Recipe list and filters

`GET /recipe/`

The source documents the following **optional query filters**:

| Filter | Example type | Meaning |
|---|---|---|
| `siteId` | UUID string | By site |
| `code` | string | By recipe code |
| `sizeBatch` | number | Batch size |
| `numberBatch` | number | Batch number |
| `sizePortion` | number | Portion size |
| `numberPortion` | number | Number of portions |
| `lossServing` | number | Serving loss |
| `lossCooking` | number | Cooking loss |
| `createdAt`, `createdAt_gte`, `createdAt_lte` | ISO UTC datetime string | Exact / from / to |
| `updatedAt`, `updatedAt_gte`, `updatedAt_lte` | ISO UTC datetime string | Exact / from / to |
| `_embed` | string | Optional enrichment; names already returned by default |

The source's `/recipe/` example includes `id`, `siteId`, `code`, batch/portion values, serving/cooking loss and localized `names[]`. The example's response is shown as a **single JSON object even though the description says “Returns all entities.”** Confirm whether live response is an array, paginated envelope, or another wrapper; pagination parameters and limits are **not documented**.

### 5.3 Unit of measurement

`GET /unitofmeasurement/{id}` → response example keys: `id`, `code`, `type`, `ratio`, `quantityType`, `names[{id,languageId,name}]`.

Never infer that `lossPreparation`, `lossCooking`, `lossServing`, or `sizePortion*` fields use grams or percentages based only on their names. Validate with the provider and representative live recipes before using them as ground-truth waste figures.

## 6. Supporting reference entities

| Endpoint | Documented example fields |
|---|---|
| `/site/propertybypublicurl/{PUBLIC_URL}/` | `value`, `propertyId`, `propertyCode` |
| `/site/{id}` | `id`, `name`, `shortName`, `publicUrl` |
| `/allergen/{id}` | `id`, `description`, `code`, `containmentCode`, `names[{id,languageId,name}]` |
| `/language/` | `id`, `code`, `name` |
| `/origin/{id}` | `id`, `description`, `code`, `names[{id,languageId,name}]` |
| `/nutritiveclaim/{id}` | `id`, `description`, `code`, `claimCode`, `names[{id,languageId,name}]` |
| `/additive/{id}` | `id`, `description`, `code`, `names[{id,languageId,name}]` |
| `/diet/{id}` | `id`, `description`, `code`, `names[{id,languageId,name}]` |
| `/recipegroup/{id}` | `id`, `order`, `names[{id,languageId,name}]` |
| `/country/{id}` | No schema or parameters beyond the route in the capture |

## 7. RAISE repository: exact integration touchpoints (no code change authorized)

The project currently uses **Excel-derived menu data**, not live PoweResta data:

| Current source path on `main` | Purpose / likely future integration point |
|---|---|
| `reference/Example_menu.xlsx` | Historical/example workbook source |
| `scripts/menu/` | Workbook conversion and validation pipeline |
| `generated-data/menu/daily-menus.json` | Generated canonical day-by-day menu export |
| `generated-data/menu/food-catalogue.json` | Generated food catalogue |
| `src/data/generated/` | Static runtime JSON consumed by the SPA |
| `src/shared/menu/menuResolver.ts` | `resolveMenuForDate(lunchDate)` and closure handling; **main menu-provider seam** |
| `src/shared/menu/mealSlots.ts` | `resolveMealSlotsForDate(lunchDate)`; supplies exactly 4 slots |
| `src/shared/menu/types.ts` | `MenuItem`, `MenuAvailability`, category types |
| `src/shared/menu/generatedMenu.ts` | Generated menu data types |
| `src/products/lunch-declaration/studentLunchServiceDate.ts` | Next operational service day, Europe/Helsinki |
| `src/products/lunch-declaration/` | Student menu choice/review/submit (must preserve current GameBus contract) |
| `src/products/kitchen-forecast/` | Chef menu/quantity interface; keep established calculations |
| `src/products/service-closeout/` | Final service quantities and waste; preserve existing closeout rules |
| `src/shared/calendar/operationalServiceCalendar.ts` | Operational day/closure source of truth |
| `docs/contracts/STUDENT_LUNCH_GAMEBUS.md` | Student `studentLunchCheckin` payload and compatibility |
| `docs/contracts/KITCHEN_FORECAST_GAMEBUS.md` | Chef `chefForecast` payload and compatibility |

**Existing app contract:** Four food slots: `classic`, `vegetarian`, `soup`, `dessert`. Students select one of Classic, Vegetarian, Soup + Dessert, or No lunch; Soup + Dessert quantities remain linked. GameBus activity payloads currently reference generated item IDs. **Changing the menu source can change item identifiers; migration/crosswalk and historical compatibility require explicit design before implementation.**

**Do not** introduce PoweResta credentials, a new live menu provider, new GameBus properties, changed menu semantics, changed cutoff or kitchen rules during the documentation-only phase.

## 8. Future integration discovery sequence for Cursor (planning only)

1. **Confirm real identifiers** with authorized owner: `tenant`, public API username/password (store in secure secret manager, not docs), `SITE_NAME` and `MENU_NAME`; do not guess from the canteen display name.
2. **Validate auth** using a controlled server-side test: response token, required `authorization` header (raw token), cookie exclusion, expiry/failure behavior.
3. **Discover languages and site/menu IDs** via `/language/`, `/publicmenu/menus/{SITE_NAME}/`, `/publicmenu/menu/{SITE_NAME}/?menu=...`.
4. **Get representative dated menu payloads** using `/publicmenu/dates/...` for (a) normal weekday with Classic/Vegetarian/Soup/Dessert, (b) weekend or closure, (c) future date, and (d) missing date. Inspect exact response wrapper and option/category mapping.
5. **Inspect one recipe** via `/recipe/{id}` only after verifying actual recipe linkage; clarify preparation loss, cooking loss, serving loss and units with the PoweResta provider. Do not substitute recipe names for stable IDs without a designed crosswalk.
6. **Determine secure data path** into the current static GameBus-embedded SPA (server-side proxy / approved synchronization, refresh schedule, cache, error handling, access boundaries). Confirm CORS and whether GameBus Input Requests can support this authentication mechanism.
7. **Propose a normalized adapter contract** compatible with `MenuAvailability`, `MenuItem`, `resolveMenuForDate`, existing student `itemId` semantics and historical activities; compare with existing Excel fields. No automatic deployment until approved.
8. **Test timezone/operational boundaries** in `Europe/Helsinki`: date resolution before/at/after cutoff, page reload, page open across cutoff, next-operational-service vs missing menu, historical references and stale cache.

## 9. Not established by this source — do not invent

- Actual tenant, username, password, JWT, site public name, menu published name or Finnish language UUID.
- Verified live HTTP status and response envelopes, `null` conventions, pagination, rate limits, token lifetime, refresh workflow, CORS policy, cache headers or service-level guarantees.
- Category mapping from PoweResta `mealOptions` to RAISE's four meal slots.
- A reliable menu-row-to-recipe join.
- Whether recipe `lossPreparation` is a percentage, grams, raw-to-trim ratio or something else; the same caution applies to cooking/serving losses.
- Any API endpoint for **actual operational overproduction waste**, HUKKA AI waste measurements, plate photographs, or student GameBus activities. None appears in the provided endpoint list.
- Authorization access to all recipe rows or whether recipe detail returns data for the pilot site.
- Image availability or ability to use recipe images in a public frontend.

## 10. Source provenance / traceability

This reference is derived from the user-supplied PoweResta documentation copy (2026-11-02):

- Lines **5–27**: version, servers, authentication summary.
- Lines **40–70**: login request and token response.
- Lines **77–461**: site and lookup entities.
- Lines **463–756**: recipe detail sample schema.
- Lines **759–890**: recipe-list filters and response.
- Lines **892–932**: recipe group.
- Lines **934–989**: published menu metadata.
- Lines **992–1035**: published menu discovery.
- Lines **1037–1194**: dated published menus and nested values.
- Lines **1197–1242**: limited captured schema panel.

Use the **verbatim source archive** alongside this interpretive reference when exact key spelling, type or nesting matters. The archived pasted markdown is not itself a downloadable OpenAPI YAML/JSON specification; it is a rendered documentation copy.
