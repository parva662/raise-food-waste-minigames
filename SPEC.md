# Student lunch declaration — product and technical specification

**Repository:** `gamebus-lunch-dnd-v2` (npm package name; GitHub: `raise-food-waste-minigames`)  
**Status:** Current implementation in `src/` is authoritative.  
**GameBus integration:** Single quantity-aware `studentLunchCheckin` ACTIVITY mapper — see [`GAMEBUS_LUNCH_CONTRACT.md`](./GAMEBUS_LUNCH_CONTRACT.md). **Repository mapper is ready**; live GameBus activity must still be **manually migrated** to the twelve-property set.

---

## 1. Purpose

Students declare tomorrow’s canteen lunch using one of three mutually exclusive options: **Regular lunch**, **Soup lunch**, or **No lunch**. Submission is **final** (one submit per lunch date). Scoring uses Europe/Helsinki deadlines (18:00 on-time, 23:00 late close).

---

## 2. User interface

### 2.1 Layout

- **GameStatusHeader** — deadline / points guidance.
- **Three vertical sections** (always visible):
  1. **Regular lunch** — main + vegetarian portion cards.
  2. **Soup lunch** — soup + dessert portion cards.
  3. **No lunch** — whole-section activate (no food quantities).
- **SelectionPanel** — summary, submit, saved status after submit.
- **Mobile action bar** — reset + submit when interactive.

### 2.2 Section interaction

- Only one section is **active** (`mealChoice`: `regular` | `soup` | `no_lunch`).
- Inactive sections are **muted** but remain visible.
- Activating another section (section header or `+` on a card) **clears all portion quantities** from the previous section (`draftForMealChoice` in `src/utils/mealDraftActions.ts`).
- `+` / `−` adjust quantities within max per catalogue item (`clampItemQuantity`).

### 2.3 Validity before submit

| Section | Valid when |
|---------|------------|
| Regular | `mainQuantity > 0` OR `vegetarianQuantity > 0` |
| Soup | `soupQuantity > 0` OR `dessertQuantity > 0` |
| No lunch | `mealChoice === 'no_lunch'` (all quantities 0) |

User must pick a section (`mealChoice !== null`) and satisfy the rule above (`isMealDraftSubmittable` in `src/utils/mealChoice.ts`).

### 2.4 Submit behavior

- Single button: **Submit my lunch** (`ActionButtons.tsx`).
- After submit: **Final — no changes allowed**; submit disabled (`hasSavedDeclaration`).
- **No** update flow, **no** late-update dialog, **no** second submit in UI.
- Success toast via `SubmissionMessage`.

---

## 3. Domain model

### 3.1 `MealDraft` (in-memory)

`src/types/mealChoice.ts`:

- `mealChoice`: `'regular' | 'soup' | 'no_lunch' | null`
- `mainQuantity`, `vegetarianQuantity`, `soupQuantity`, `dessertQuantity`: non-negative integers, clamped to slot `maxQuantity`

### 3.2 `DailyMealSlots`

One resolved main (classic), vegetarian, soup, dessert per lunch date (`resolveMealSlotsForDate` in `src/services/mealSlots.ts`).

### 3.3 `ActiveDeclaration` (persisted)

`src/types/declaration.ts` — written on submit by `createDeclarationFromDraft`:

- Identity: `studentId`, `lunchDate`
- Menu metadata: `menuCycleWeek`, `menuVersion`
- Choice: `mealChoice`, `noLunch`, optional `regularMainSelected` / `regularVegetarianSelected`
- `selections`: `SelectionEntry[]` built from draft + slots (`buildSelectionsFromMealDraft`)
- Scoring: `timingStatus`, `basePoints` (20), `timingAdjustment` (±5), `totalPoints` (25 or 15)
- Timestamps: `submittedAt`, `updatedAt` (equal on first submit)
- `includeInForecast`: always `true`

### 3.4 Submission window

`src/services/submissionWindow.ts` — day before lunch, **Europe/Helsinki**:

- `now <= 18:00:00` → on-time (25 points)
- `18:00:00 < now <= 23:00:00` → late (15 points)
- After 23:00:00 on submission day, or from lunch-day midnight → closed (`createDeclarationFromDraft` returns `null`)

Lunch date: **tomorrow** via `getTomorrowIsoDate()` (`src/utils/dates.ts`) — browser local calendar.

---

## 3.5 Menu data and images

- **Source:** `reference/Example_menu.xlsx`, converted with `npm run menu:convert` into `generated-data/menu/` and runtime copies under `src/data/generated/`.
- **Date shift:** Workbook dates (`2026-02-02`–`2026-05-29`) are shifted by **+175 days** to runtime (`2026-07-27`–`2026-11-20`) via `scripts/menu/menuConfig.ts` — not edited manually in JSON.
- **Resolution:** `menuResolver.ts` looks up lunch by **ISO calendar date** (weekdays only). There is **no** fallback to the old three-week rotation.
- **CLOSED days** (workbook `CLOSED` rows or override): menu status `closed` — no selectable dishes, submit disabled.
- **Missing dates** (outside `2026-02-02`–`2026-05-29` range or not in the workbook): status `unavailable` — submit disabled.
- **Quantities:** `maxQuantity` / `unit` come from the generated catalogue (product defaults), not Excel forecast portions.
- **Images:** Expected dedicated files at `public/images/menu/items/<item-id>.webp`. Until added, neutral **category placeholders** (`public/images/menu/placeholders/*.svg`) are shown. The app does **not** download images from the internet.
- **Diagnostics:** `generated-data/menu/missing-images.json` lists items still on placeholders.

---

| Layer | Location |
|-------|----------|
| UI | `src/App.tsx`, `src/AppRouter.tsx`, `src/chef/*`, `src/components/*` |
| State | `useReducer` in `src/hooks/useLunchSelection.ts`, `src/chef/useChefForecast.ts` |
| Menu | `menuResolver.ts`, `mealSlots.ts`, `src/data/generated/*`, `generatedMenuData.ts` |
| Rules | `mealChoice.ts`, `mealDraftActions.ts`, `declarationSelection.ts`, `src/chef/validation.ts` |
| Persistence | `DeclarationRepository` + `LocalStorageDeclarationRepository` |
| Config | `src/config/canteen.ts`, `src/config/chef.ts` |
| GameBus | `src/gamebus/mapStudentLunchCheckin.ts`, `src/gamebus/mapChefForecast.ts` |
| Styles | `src/styles.css` |

Routing: student default at `/`; chef forecast at `#/chef`.

---

## 5. Persistence

- Key: `lunch-declaration-{studentId}-{lunchDate}` (`declarationRepository.ts`)
- Full `ActiveDeclaration` JSON on submit only
- Restore on load when menu available; after submit UI locks
- **GameBus embed:** localStorage is not authoritative; see `GAMEBUS_LUNCH_CONTRACT.md`

---

## 6. Build and deploy

- **Dev:** `npm run dev` (base `/`)
- **Production:** `npm run build` — base `/raise-food-waste-minigames/` (`vite.config.ts`)
- **CI:** `.github/workflows/test.yml` — `tsc`, `vitest run`, `build`
- **Pages:** `.github/workflows/deploy-pages.yml`

---

## 7. Tests

**Coverage includes** GameBus `studentLunchCheckin` and `chefForecast` ACTIVITY mapping, chef route, dated menu resolution, placeholder images, menu workbook pipeline, meal slots, submission windows, and key UI strings. Run `npm run test:run` for the current count (219 tests).

---

## 8. Out of scope (later phases)

- Actual-waste import, forecast-result calculations, badges, leaderboards, dashboards
- Live GameBus admin migration (manual; see contract docs)
- Authentication / real student identity (demo `studentId` only; not sent on embedded ACTIVITY)
- Dedicated food photography (`public/images/menu/items/*.webp`)

---

## 9. Chef kitchen forecast (`#/chef`)

- **Route:** `#/chef` — `https://parva662.github.io/raise-food-waste-minigames/#/chef`
- **Activity:** `chefForecast` only (mapper in `src/gamebus/mapChefForecast.ts`)
- **Properties:** twelve always sent; `confidence` and `notes` optional in payload when entered (keep linked in GameBus)
- **Input model:** all five numeric fields start blank (unanswered); explicit `0` is intentional zero; all five required before submit; confidence uses five labeled options mapped to 0–1; no auto-distribution of portions
- **Forecast semantics:** `forecastTotalCustomers` is a headcount forecast; each menu quantity (`forecastMeat`, `forecastVegetarian`, `forecastSoup`, `forecastDessert`) is an independent category forecast. One customer may correspond to multiple prepared portions or menu items (e.g. main plus soup, meal plus dessert). The chef UI does **not** compare or force equality between expected customers and menu quantities. Later analysis compares each forecast with its matching actual value; waste is handled separately.
- **Contract:** [`GAMEBUS_CHEF_FORECAST_CONTRACT.md`](./GAMEBUS_CHEF_FORECAST_CONTRACT.md)
- **Master plan:** [`RAISE_BARLAUREA_STUDY_AND_SYSTEM_MASTER_PLAN.md`](./RAISE_BARLAUREA_STUDY_AND_SYSTEM_MASTER_PLAN.md)

---

## 10. Service closeout (`#/service-closeout`)

- **Route:** `#/service-closeout`
- **Purpose:** Operational data entry for **today's** lunch service (not a dashboard).
- **Service date:** current calendar date (`getTodayIsoDate()`); same menu resolver and item IDs as student/chef apps.
- **Submitted forecast (read-only):** when embedded in GameBus, inbound `INPUT_COLLECTIONS` → `serviceCloseoutInput.chefForecasts` (legacy `serviceCloseoutInputs` accepted) provides the authenticated user's `chefForecast` activities.
- **Inputs:** actual customers; head chef for the day (fixture `headChefUserId` in dev); per category — prepared portions, read-only standard portion weight (grams, from reference provider), overproduction waste (**entered in grams**).
- **Domain model:** `ServiceCloseout` (application field names; overproduction in grams). Optional `NormalizedServiceCloseout` adds `overproductionKg` per category (`normalizeCloseoutKg()`).
- **GameBus:** outbound **`wasteMeasurement`** ACTIVITY on Finalize (embed mode) — see [`GAMEBUS_SERVICE_CLOSEOUT_CONTRACT.md`](./GAMEBUS_SERVICE_CLOSEOUT_CONTRACT.md). Inbound forecast via `serviceCloseoutInput.chefForecasts`. One Finalize posts exactly one ACTIVITY; iframe closes via normal GameBus behaviour.
- **Validation:** overproduction grams ≤ prepared quantity × portion weight; prepared 0 requires waste 0.
- **State:** draft → ready → finalized (session-local in standalone; embed posts `wasteMeasurement` then relies on GameBus to close iframe).
- **Fixtures:** development staff rotation and portion weights are **not study data** (`src/serviceCloseout/fixtures/`, `src/serviceCloseout/portionWeight/`).
- **Future:** finalizing closeout will trigger per-user daily forecast evaluation; weekly results aggregate finalized daily results.
- **Contract:** [`GAMEBUS_SERVICE_CLOSEOUT_CONTRACT.md`](./GAMEBUS_SERVICE_CLOSEOUT_CONTRACT.md)

---

## 11. Migration notes (historical)

Earlier revisions used four menu grids with per-item quantities across all categories and an **update** flow. The current product uses **three sections**, **mealChoice**, and **one-shot submit** only. Do not reintroduce update or `SILENT_ACTIVITY` without an explicit product change.
