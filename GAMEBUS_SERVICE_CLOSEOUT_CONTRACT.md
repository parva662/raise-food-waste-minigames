# GameBus service closeout — contract (approved)

**Status:** Implemented in repository (2026-08-11)  
**Live GameBus:** Not modified from this repository.

---

## 1. Product and routing

| Item | Value |
|------|-------|
| Product / page name | **Service Closeout** |
| Route | `#/service-closeout` |
| Input Collection key (kitchen group activities) | `kitchenGroupInput` |
| Input Collection request (read-only, group) | `activities` → `GET /groups/activities` |
| Authenticated current user | `inputCollectionPari.me` |
| Output activity template | **`wasteMeasurement`** |
| Local constant | `SERVICE_CLOSEOUT_ACTIVITY_REF = 'wasteMeasurement'` (`src/gamebus/appMode.ts`) |

**One Finalize = one ACTIVITY.** Clicking **Finalize service** validates, normalizes, maps to `wasteMeasurement`, and posts exactly one `ACTIVITY` through the existing GameBus bridge. The iframe closes via normal GameBus ACTIVITY behaviour — no manual close mechanism.

**Not used by this workflow:** `kitchenServiceCloseout`, `actualServiceData`, `wasteReflection`, `productionPlan`, `SILENT_ACTIVITY`.

---

## 2. Inbound forecast

- Input Collection `kitchenGroupInput.activities` retrieves group kitchen activities (`GET /groups/activities`).
- Service Closeout filters **only** `chefForecast` template activities; `wasteMeasurement` and unrelated templates are ignored.
- Parsed into `GameBusChefForecast`; matched by exact `targetDate` only (no cross-date fallback).
- Multiple kitchen staff may submit forecasts for the same service date — all exact-date forecasts are shown read-only (one row per actor per category).
- When `SERVICE_CLOSEOUT_CONFIG.syntheticForecastFallbackEnabled` is true and no real exact-date forecast exists, a labelled synthetic test forecast is shown (never posted).
- Displayed **read-only** in the closeout UI.
- Forecast values are **not** copied into `wasteMeasurement`.

Authenticated recorder identity: read-only **Recorded by** from `inputCollectionPari.me`. The GameBus `activity.actor` on finalize remains authoritative for persistence. The former **Head chef today** selector is removed.

`chefForecast` remains a separate activity (forecast before service). `wasteMeasurement` is final observed service data after service.

---

## 3. Outbound `wasteMeasurement` contract

### 3.1 Required property references (15)

| Ref | Source (Service Closeout domain) | Notes |
|-----|----------------------------------|-------|
| `serviceDate` | `targetDate` | ISO date |
| `actualCustomers` | `actualCustomers` | integer |
| `mainItemId` | resolved Main menu item ID | not derived from labels |
| `preparedMainQuantity` | Main prepared portions | actual kitchen prepared |
| `vegetarianItemId` | resolved Vegetarian menu item ID | |
| `preparedVegetarianQuantity` | Vegetarian prepared portions | |
| `soupItemId` | resolved Soup menu item ID | |
| `preparedSoupQuantity` | Soup prepared portions | |
| `dessertItemId` | resolved Dessert menu item ID | |
| `preparedDessertQuantity` | Dessert prepared portions | |
| `overproductionMeatKg` | Main overproduction (grams → kg) | `grams / 1000` at mapper boundary |
| `overproductionVegetarianKg` | Vegetarian overproduction (grams → kg) | |
| `overproductionSoupKg` | Soup overproduction (grams → kg) | |
| `overproductionDessertKg` | Dessert overproduction (grams → kg) | |
| `submittedAt` | finalization timestamp | ISO date-time |

Prepared quantity properties (`preparedMainQuantity`, `preparedVegetarianQuantity`, `preparedSoupQuantity`, `preparedDessertQuantity`) are dedicated **wasteMeasurement** properties for actual kitchen prepared portions (integer 0–1000). They are **not** the student `mainQuantity` / `vegetarianQuantity` / `soupQuantity` / `dessertQuantity` properties (individual student selections, max 6).

### 3.2 Unit conversion

- UI collects overproduction in **grams**.
- GameBus properties use **kilograms**.
- Conversion at mapper boundary only: `kg = grams / 1000` (`src/serviceCloseout/units.ts`).

### 3.3 Explicitly excluded from ACTIVITY

| Field | Reason |
|-------|--------|
| Standard portion weights | Reference/calculation data in app only |
| Recorder / user name fields | Submitting user identified via GameBus `activity.actor` |
| Chef forecast fields | Separate `chefForecast` activity |

---

## 4. Implementation map

| Module | Role |
|--------|------|
| `src/gamebus/mapWasteMeasurement.ts` | Domain → property value map |
| `src/gamebus/buildWasteMeasurementActivityMessage.ts` | Validated ACTIVITY builder |
| `src/gamebus/resolveWasteMeasurementProperties.ts` | Canonical fifteen refs |
| `src/gamebus/bridge.ts` → `tryPostCloseoutActivity` | postMessage via existing bridge |
| `src/serviceCloseout/useServiceCloseout.ts` | Finalize → map → post (embed mode) |
| `src/gamebus/groupActivities.ts` | Read `kitchenGroupInput.activities`; filter by template reference |
| `src/gamebus/inputCollections.ts` | Authenticated `inputCollectionPari.me` |

---

## 9. Known non-blocking GameBus issues

| Issue | Notes |
|-------|-------|
| Dessert overproduction label in My Activities | `overproductionDessertKg` may display as “Overproduction meat (kg)” despite correct reference (`overproductionDessertKg`) and persisted value. GameBus display/configuration — not an application mapper defect. |

DEV log before postMessage: `[gamebus] wasteMeasurement ACTIVITY payload`

---

## 5. ACTIVITY property shape

```json
{
  "type": "ACTIVITY",
  "data": {
    "template": "wasteMeasurement",
    "start": "<ISO date-time>",
    "end": "<ISO date-time>",
    "properties": [
      { "template": "serviceDate", "obj": { "value": "2026-07-29" } },
      { "template": "actualCustomers", "obj": { "value": 150 } }
    ]
  }
}
```

---

## 6. Standalone / local development

When no GameBus parent is present (`isGameBusEmbed() === false`), **Finalize service** finalizes local state only — no ACTIVITY is posted.

---

## 7. Related activities (platform context)

From `GAMEBUS_TEMPLATE_EXPORT.json` — closeout-relevant templates that remain **separate**:

| Reference | Role relative to closeout |
|-----------|---------------------------|
| `chefForecast` | Inbound read via Input Collection |
| `wasteMeasurement` | **Outbound** closeout submission |
| `actualServiceData` | Not used by this workflow |
| `wasteReflection` | Qualitative reflection — separate, not operational closeout |
| `productionPlan` | Not used by this workflow |
| `kitchenServiceCloseout` | Not in export; not used |

---

## 8. References

- [`SPEC.md`](./SPEC.md) — product specification §10
- [`GAMEBUS_CHEF_FORECAST_CONTRACT.md`](./GAMEBUS_CHEF_FORECAST_CONTRACT.md) — chef forecast (unchanged)
- [`NEXT_STEPS.md`](./NEXT_STEPS.md) — roadmap
