# Student lunch declaration — product and technical specification

**Repository:** `gamebus-lunch-dnd-v2` (npm package name; GitHub: `raise-food-waste-minigames`)  
**Status:** Current implementation in `src/` is authoritative.  
**GameBus integration:** Design only — see [`GAMEBUS_LUNCH_CONTRACT.md`](./GAMEBUS_LUNCH_CONTRACT.md).

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

## 4. Application architecture

| Layer | Location |
|-------|----------|
| UI | `src/App.tsx`, `src/components/*` |
| State | `useReducer` in `src/hooks/useLunchSelection.ts` |
| Menu | `menuResolver.ts`, `mealSlots.ts`, `src/data/*` |
| Rules | `mealChoice.ts`, `mealDraftActions.ts`, `declarationSelection.ts` |
| Persistence | `DeclarationRepository` + `LocalStorageDeclarationRepository` |
| Config | `src/config/canteen.ts` |
| Styles | `src/styles.css` |

No client-side routing (single SPA).

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

**106 tests** in 11 files (`npm run test:run`). Coverage focuses on menu resolution, meal slots, submission window, meal draft actions, declaration build, hook submit/lock behavior, and key UI strings.

---

## 8. Out of scope (this repo)

- Chef forecast, waste, production activities (separate GameBus templates exist in test env only)
- GameBus iframe bridge (**planned** — contract written, code not implemented)
- Authentication / real student identity (demo `studentId` only)
- Menu import from workbook (`reference/Example_menu.xlsx` not used at runtime)

---

## 9. Migration notes (historical)

Earlier revisions used four menu grids with per-item quantities across all categories and an **update** flow. The current product uses **three sections**, **mealChoice**, and **one-shot submit** only. Do not reintroduce update or `SILENT_ACTIVITY` without an explicit product change.
