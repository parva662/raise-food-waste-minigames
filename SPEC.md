# Student Lunch Declaration — Product and Technical Specification

**Document status:** Derived from repository evidence (source, tests, config).  
**Repository:** `gamebus-lunch-dnd-v2`  
**Evidence labels:** CONFIRMED BY CODE | CONFIRMED BY TEST | INFERRED | UNKNOWN

**Revision (2026-07-27):** Canteen-accurate meal types (regular / soup / no lunch). Single final submission. Regular lunch portion quantities restored. Compact game-status UI. Temporary menu data unchanged.

---

## 1. Purpose

Students declare tomorrow’s canteen lunch so the kitchen can plan quantities. **CONFIRMED BY CODE:** `GameStatusHeader`, `useLunchSelection` (`getTomorrowIsoDate`).

Workflow:

1. Choose **Regular lunch**, **Soup lunch**, or **No lunch**.
2. Complete the choice (regular: ≥1 of main/vegetarian; soup: fixed package).
3. **Submit once** before the deadline; declaration becomes read-only.
4. See deadline, points, and confirmation toast.

**CONFIRMED BY CODE:** Single-page app (`main.tsx`, `App.tsx`); no routing.

---

## 2. Current product scope

| Area | Implementation | Evidence |
|------|----------------|----------|
| Target user | `demo-student-001` | CONFIRMED BY CODE: `canteen.ts` |
| Lunch date | Browser-local **tomorrow** | CONFIRMED BY CODE: `dates.ts` |
| Meal types | Regular, soup, no lunch (vertical sections) | CONFIRMED BY CODE: `MealSection`, `App` |
| Regular lunch | Unified `PortionFoodCard` qty controls for main + vegetarian | CONFIRMED BY TEST: `mealChoice.test.ts`, `mealDraftActions.test.ts` |
| Soup lunch | Same card pattern for soup + dessert; independent quantities | CONFIRMED BY TEST: `mealChoice.test.ts` |
| No lunch | Full-section activate; clears all portion quantities | CONFIRMED BY CODE: `ACTIVATE_MEAL_CHOICE` |
| Menu data | 15 rotating weekday menus (unchanged example data) | CONFIRMED BY TEST: `menuResolver.test.ts` |
| Meal slots | `mealSlots.ts` picks index 0 per section | CONFIRMED BY TEST: `mealSlots.test.ts` |
| Submission | One submit; UI locked after save | CONFIRMED BY TEST: `useLunchSelection.test.tsx` |
| Updates | Not supported in UI | CONFIRMED BY CODE: no update/late-confirm components |
| Deadline | Day before lunch, **Europe/Helsinki** | CONFIRMED BY TEST: `submissionWindow.test.ts` |
| Points | 25 on-time, 15 late (20 base ±5) | CONFIRMED BY TEST: `points.test.ts` |
| Persistence | `localStorage`, one key per student+date | CONFIRMED BY TEST: `LocalStorageDeclarationRepository.test.ts` |
| Post-submit | Saved status row + toast (~4s) | CONFIRMED BY CODE: `SavedStatusRow`, `SubmissionMessage` |

**Not in scope:** GameBus, auth, chef/waste apps, real Excel menu import.

---

## 3. Detailed user flow

### 3.1 Load

1. `App` waits for `initialized` (**CONFIRMED BY CODE**).
2. Resolve menu availability and `mealSlots` for tomorrow.
3. If saved declaration exists → **RESTORE** read-only state (**CONFIRMED BY CODE**).
4. Closed/unavailable → `MenuStatusBanner`.

### 3.2 Before submit (interactive)

1. Pick meal type by activating one of three **always-visible** sections (`MealSection` header).
2. **Regular:** select main and/or vegetarian; adjust portion quantity per selected dish (`RegularLunchPanel`, `QuantityControl`).
3. **Soup:** adjust soup and dessert portion quantities independently (`SoupLunchPanel`).
4. **No lunch:** activate section only (no items).
5. Switching section clears quantities from the previous section (**CONFIRMED BY TEST:** hook tests).
6. **Reset all** clears draft (**CONFIRMED BY CODE:** `RESET_DRAFT`).

### 3.3 Submit

1. **Submit my lunch** enabled when `isMealDraftSubmittable` and window open.
2. `createDeclarationFromDraft` → `upsertDeclaration` → **SUBMIT_SUCCESS**.
3. Message states declaration is **final**.

### 3.4 After submit

1. `hasSavedDeclaration` → controls disabled, no submit/reset actions.
2. Saved status + “cannot be changed” notice (**CONFIRMED BY TEST:** `lunchComponents.test.tsx`).

### 3.5 Closed window

Submit disabled; `menuInteractive` false (**CONFIRMED BY TEST**).

---

## 4. Functional requirements

| ID | Requirement | Source | Function / component | Test |
|----|-------------|--------|----------------------|------|
| FR-001 | Lunch date = tomorrow (local) | CONFIRMED BY CODE | `getTomorrowIsoDate` | hook mocks date |
| FR-002 | Resolve menu availability | CONFIRMED BY CODE | `resolveMenuForDate` | `menuResolver.test.ts` |
| FR-003 | 15 weekday menus in validity range | CONFIRMED BY TEST | `dailyMenus` | `menuResolver.test.ts` |
| FR-004 | 3-week rotation | CONFIRMED BY TEST | `getMenuCycleWeek` | `menuResolver.test.ts` |
| FR-005 | Closed/replace overrides | CONFIRMED BY TEST | `menuOverrides` | `menuResolver.test.ts` |
| FR-006 | Meal slots = first ID per section | CONFIRMED BY TEST | `mealSlotsFromDailyMenu` | `mealSlots.test.ts` |
| FR-007 | Three always-visible meal sections (vertical) | CONFIRMED BY CODE | `MealSection`, `App` | `lunchComponents.test.tsx` |
| FR-008 | Regular requires ≥1 dish with positive quantity each | CONFIRMED BY TEST | `isMealDraftSubmittable` | `mealChoice.test.ts` |
| FR-009 | Soup saves soup+dessert with independent quantities | CONFIRMED BY TEST | `buildSelectionsFromMealDraft` | `mealChoice.test.ts` |
| FR-010 | Switching type clears incompatible state | CONFIRMED BY TEST | `SET_MEAL_CHOICE` | `useLunchSelection.test.tsx` |
| FR-011 | Helsinki submission day before lunch | CONFIRMED BY CODE | `submissionWindow.ts` | `submissionWindow.test.ts` |
| FR-012 | 18:00 inclusive on-time | CONFIRMED BY TEST | `getSubmissionPhase` | `submissionWindow.test.ts` |
| FR-013 | After 18:00 late until 23:00 | CONFIRMED BY TEST | `getSubmissionPhase` | `submissionWindow.test.ts` |
| FR-014 | After 23:00 closed | CONFIRMED BY TEST | `getSubmissionPhase` | `submissionWindow.test.ts` |
| FR-015 | Points 25 / 15 at submit instant | CONFIRMED BY TEST | `points.ts`, `createDeclarationFromDraft` | `points.test.ts` |
| FR-016 | Declaration includes `mealChoice` | CONFIRMED BY CODE | `ActiveDeclaration` | `declaration.test.ts` |
| FR-017 | Submit disabled when already saved | CONFIRMED BY TEST | `isSubmitDisabled` | `declarationSelection.test.ts` |
| FR-018 | Submit disabled when draft invalid | CONFIRMED BY TEST | hook + `declarationSelection` | `useLunchSelection.test.tsx` |
| FR-019 | One storage key per student+date | CONFIRMED BY TEST | `buildStorageKey` | repository test |
| FR-020 | Legacy records normalized on read | CONFIRMED BY TEST | `normalizeDeclarationRecord` | repository test |
| FR-021 | Production base path `/raise-food-waste-minigames/` | CONFIRMED BY CODE | `vite.config.ts` | build |
| FR-022 | CI: tsc, vitest, build | CONFIRMED BY CODE | `.github/workflows/test.yml` | — |

---

## 5. Business rules

### 5.1 Meal draft (`MealDraft`)

- `mealChoice`: `regular` \| `soup` \| `no_lunch` \| `null`
- Regular: `mainQuantity`, `vegetarianQuantity` (0 = not selected); all cards show **+**/**−**; qty > 0 = selected; ≥ one > 0 to submit.
- Soup: `soupQuantity`, `dessertQuantity`; same interaction; valid when at least one > 0.
- Activating a section via **+** switches meal type, clears the previous section’s quantities, and applies the increment. Card or section header click activates only (no quantity change).
- No lunch: quantities zero; empty selections; `noLunch: true` on declaration.

**CONFIRMED BY CODE:** `types/mealChoice.ts`, `utils/mealChoice.ts`.

### 5.2 Switching meal type

`SET_MEAL_CHOICE` resets incompatible fields (**CONFIRMED BY CODE:** `useLunchSelection` reducer).

### 5.3 Submission window & points

Unchanged from prior spec: Helsinki boundaries; `getPointsBreakdownForInstant` at submit (**CONFIRMED BY TEST**).

### 5.4 Submit enablement

`isSubmitDisabled(hasSaved, canSubmit, menuInteractive)` → true if closed, already saved, or invalid draft (**CONFIRMED BY CODE:** `declarationSelection.ts`).

### 5.5 Final submission

UI never calls submit after `savedSnapshot` is set. Repository may still upsert if invoked (**CONFIRMED BY CODE**); GameBus layer should enforce single activity later (**UNKNOWN**).

### 5.6 `CANTEEN_CONFIG`

See `src/config/canteen.ts` (timezone, 18:00 / 23:00, points, cycle dates, `menuVersion`).

---

## 6. Domain model

### 6.1 `ActiveDeclaration`

| Field | Meaning |
|-------|---------|
| `mealChoice` | `regular` \| `soup` \| `no_lunch` |
| `regularMainSelected` / `regularVegetarianSelected` | When `mealChoice === 'regular'` |
| `noLunch` | true when `no_lunch` |
| `selections` | Persisted lines (0, 1, or 2 for regular; 2 for soup) |
| Scoring fields | `timingStatus`, `basePoints`, `timingAdjustment`, `totalPoints` |
| Timestamps | `submittedAt`, `updatedAt` (both set on first save) |
| `includeInForecast` | always `true` |

**CONFIRMED BY CODE:** `types/declaration.ts`, `createDeclarationFromDraft`.

### 6.2 `DailyMealSlots`

`main`, `vegetarian`, `soup`, `dessert` — each a `MenuItem`. **CONFIRMED BY CODE:** `mealSlots.ts`.

### 6.3 `DeclarationRepository`

`getDeclaration`, `upsertDeclaration` — **CONFIRMED BY CODE:** `declarationRepository.ts`.

---

## 7. Application architecture

| Layer | Location |
|-------|----------|
| UI | `App.tsx`, `components/*` (`GameStatusHeader`, meal-type UI, `QuantityControl`, selection panel) |
| State | `hooks/useLunchSelection.ts` (`useReducer`) |
| Services | `menuResolver.ts`, `submissionWindow.ts`, `mealSlots.ts` |
| Domain utils | `mealChoice.ts`, `declaration.ts`, `points.ts`, `declarationSelection.ts` |
| Data | `foodCatalogue.ts`, `menuSchedule.ts`, `menuOverrides.ts` |
| Persistence | `LocalStorageDeclarationRepository` |
| Tests | Vitest, 10 files, `pool: 'forks'`, `maxWorkers: 1` |

---

## 8. Persistence contract

| Topic | Behavior |
|-------|----------|
| Key | `lunch-declaration-{studentId}-{lunchDate}` |
| Write | On successful submit only (from UI) |
| Read | On init if menu available |
| Legacy | Missing `mealChoice` → inferred on read (`withDefaultMealChoice`) |

**CONFIRMED BY TEST:** repository tests.

---

## 9. UI inventory

| Component | Responsibility |
|-----------|----------------|
| `App` | Layout, meal-type flow |
| `GameStatusHeader` | Compact title, date, points badges, deadline, countdown |
| `MealSection` | Section header + body; active/muted states |
| `MealTypeChooser` | *(unused)* legacy segmented control |
| `PortionFoodCard` | Unified food card (image, label, name, qty controls) |
| `RegularLunchPanel` / `SoupLunchPanel` | Two-card grids using `PortionFoodCard` |
| `SelectionPanel` | Compact summary, points-if-now, submit/reset, final notice |
| `ActionButtons` | Reset + submit (pre-submit only) |
| `SavedStatusRow` | Points summary after save |
| `SubmissionMessage` | Toast |
| `MenuStatusBanner` | Closed / unavailable |
| `FoodImage` | Image + fallback |

---

## 10. Test coverage

**106 tests, 11 files** — **CONFIRMED BY TEST:** `npm run test:run`.

| Area | Test file |
|------|-----------|
| Menu rotation | `menuResolver.test.ts` |
| Meal slots | `mealSlots.test.ts` |
| Meal draft rules | `mealChoice.test.ts` |
| Deadlines / points | `submissionWindow.test.ts`, `points.test.ts` |
| Declaration build | `declaration.test.ts` |
| Submit disabled rules | `declarationSelection.test.ts` |
| Storage | `LocalStorageDeclarationRepository.test.ts` |
| Hook flow | `useLunchSelection.test.tsx` |
| Components | `lunchComponents.test.tsx` |

**Untested / partial:** live `getTomorrowIsoDate`; full responsive CSS; E2E browser.

---

## 11. Non-functional behavior

| Topic | Detail |
|-------|--------|
| Responsive | Sticky panel / mobile action bar (`styles.css`) |
| Node CI | 20 (`.github/workflows/test.yml`) |
| Deploy | GitHub Pages, subpath base on build |
| a11y | `aria-pressed`, live regions, progressbar |

---

## 12. Current limitations

- Hardcoded student ID; localStorage only.
- No GameBus activity on submit.
- Example menu only (no Excel import).
- Repository upsert exists; UI assumes single submit.
- Browser-local tomorrow vs Helsinki deadlines near TZ edges (**UNKNOWN** intent).

---

## 13. Migration contract

| Module | Port unchanged | Replace / adapt |
|--------|----------------|-----------------|
| `mealChoice.ts`, `mealSlots.ts`, `submissionWindow.ts`, `points.ts` | ✓ | |
| `declaration.ts`, types | ✓ | studentId source |
| `useLunchSelection.ts` | | Adapt to Svelte/store |
| `components/*` | | Replace UI |
| `LocalStorageDeclarationRepository` | | GameBus backend |

See **NEXT_STEPS.md** for GameBus roadmap.

---

## 14. Scope classification

| Feature | Class |
|---------|--------|
| Meal-type UI + final submit | **Current MVP** |
| Deadline + points | **Current MVP** |
| Example menu + rotation | **Current MVP** |
| GameBus submit | **Not present** |
| Menu import | **Not present** |
| AppHeader menu button | **Provisional** (no handler) |

---

## 15. Acceptance criteria

| ID | Criterion | Evidence |
|----|-----------|----------|
| AC-001 | Three meal types shown | CONFIRMED BY TEST |
| AC-002 | Regular requires ≥1 dish with valid quantity to enable submit | CONFIRMED BY TEST |
| AC-003 | Soup declaration contains soup and dessert with stored quantities | CONFIRMED BY TEST |
| AC-004 | After submit, submit stays disabled | CONFIRMED BY TEST |
| AC-005 | Saved UI shows final notice | CONFIRMED BY TEST |
| AC-006 | 18:00 on-time / 23:00 late boundaries | CONFIRMED BY TEST |
| AC-007 | 25 points on-time submit | CONFIRMED BY TEST |
| AC-008 | 15 points late submit | CONFIRMED BY TEST |
| AC-009 | 15 menus + rotation tests pass | CONFIRMED BY TEST |
| AC-010 | `npm run test:run` all pass | CONFIRMED BY TEST |
| AC-011 | `npm run build` succeeds | CONFIRMED BY TEST |

---

## Verification checklist

- [x] No imports of removed update-flow code in `src/`
- [x] Regular portion quantities via `QuantityControl`
- [x] Compact game-status header (no duplicated rules prose)
- [x] FR/AC renumbered to current behavior
- [x] `IMPLEMENTATION_INVENTORY.json` updated
