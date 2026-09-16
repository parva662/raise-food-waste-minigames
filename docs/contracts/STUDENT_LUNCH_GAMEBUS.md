# Student Lunch — `studentLunchCheckin` GameBus contract

**Status:** **EXTERNAL / GAMEBUS CONTRACT** — repository mapper implemented; live GameBus template migration still manual and pending.
**Approved product behaviour:** [`../../features/student/student-lunch.feature`](../../features/student/student-lunch.feature) (**APPROVED PRODUCT TARGET**).
**Implemented technical behaviour:** current `src/` on `main` — `src/gamebus/mapStudentLunchCheckin.ts`, `src/gamebus/resolveActivityProperties.ts`, `src/gamebus/buildActivityMessage.ts`, `src/gamebus/propertySchemas.ts`.
**Live GameBus configuration:** not verified from this repository. The last recorded admin audit was taken from the test environment on 2026-07-27 and is not stored here.

This document has four distinct layers, in order:

| Section | Layer |
|---------|-------|
| [A](#a-approved-product-semantics) | Approved Student Lunch product semantics |
| [B](#b-canonical-studentluncheckin-activity-contract) | Canonical `studentLunchCheckin` ACTIVITY contract |
| [C](#c-current-repository-implementation) | Current repository implementation |
| [D](#d-manual--live-gamebus-work-still-required) | Manual / live GameBus admin work still required |

Do not treat older documents as authoritative over the approved `.feature` (product) or current `src/` (technical). Historical material lives in [`../archive/SPEC_LEGACY.md`](../archive/SPEC_LEGACY.md) and is **HISTORICAL** only.

---

## A. Approved product semantics

The `.feature` file is authoritative; this is the subset that shapes the GameBus payload.

- The **authenticated GameBus student** is the participant and owner of the declaration. A student submits only for themself, and never selects or types an identity.
- The target is the **next operational lunch service**, not calendar tomorrow. Weekends and explicitly closed / non-service days are skipped.
- BarLaurea menus are planned well in advance. **Missing menu data does not redefine the target service date**: it may block the form, but the resolved date stands.
- **Europe/Helsinki** is authoritative regardless of device timezone.
- The declaration is open **before 23:59:00** Helsinki time and **closed at exactly 23:59:00**; a page left open closes without a reload.
- The student **reviews** the declaration before one final confirmation.
- A successful submission is **final**: no edit, no second declaration.
- A failed submission preserves the entered values and may be retried while the window is still open.
- In embedded mode, **GameBus persistence is authoritative**. Local storage exists only for the standalone GitHub Pages demo and is never a GameBus record.

---

## B. Canonical `studentLunchCheckin` ACTIVITY contract

### B.1 Activity template

| Field | Value |
|-------|--------|
| **Slug / reference** | `studentLunchCheckin` (retained; `studentLunchCheckinV2` is **not** supported) |
| **Label** | Student lunch check-in |
| **Admin ID (test env, 2026-07-27 audit)** | `019f9404-88ec-7f31-89d6-8b2cbfbcab4f` |
| **Purpose** | One-shot student declaration for the **next operational lunch service** (regular, soup, or no lunch) with portion quantities |
| **Message type** | `ACTIVITY` only — never `SILENT_ACTIVITY` |

The existing template is **modified** (its linked property templates are replaced) rather than recreated, so the embedded Pari task does not need re-linking.

### B.2 Property set

The mapper sends **7 always-required** business properties and **up to 4 conditional** item-ID properties — a **maximum of 11** property links.

Always sent, including when the value is zero:

| # | Property | JSON Schema (`obj.value`) | Source | Example |
|---|----------|---------------------------|--------|---------|
| 1 | `targetDate` | `string`, `format: date` | resolved next operational service date | `"2026-07-28"` |
| 2 | `mealType` | `string`, enum `regular` \| `soup` \| `no_lunch` | active meal package | `"regular"` |
| 3 | `mainQuantity` | `integer`, `minimum: 0`, `maximum: 6` | Main stepper | `2` |
| 4 | `vegetarianQuantity` | `integer`, `minimum: 0`, `maximum: 6` | Vegetarian stepper | `0` |
| 5 | `soupQuantity` | `integer`, `minimum: 0`, `maximum: 6` | Soup stepper | `0` |
| 6 | `dessertQuantity` | `integer`, `minimum: 0`, `maximum: 6` | Dessert stepper | `0` |
| 7 | `submittedAt` | `string`, `format: date-time` | submission timestamp | `"2026-07-27T16:00:00.000Z"` |

Sent only when the matching quantity is greater than zero, and **omitted entirely** otherwise:

| Property | JSON Schema (`obj.value`) | Condition |
|----------|---------------------------|-----------|
| `mainItemId` | `string`, `minLength: 1` | `mainQuantity > 0` |
| `vegetarianItemId` | `string`, `minLength: 1` | `vegetarianQuantity > 0` |
| `soupItemId` | `string`, `minLength: 1` | `soupQuantity > 0` |
| `dessertItemId` | `string`, `minLength: 1` | `dessertQuantity > 0` |

Item IDs are generated catalogue slugs from `reference/Example_menu.xlsx` (via `src/data/generated/`). There are no nulls, no empty strings, and **no sentinel values** such as `noMain`, `noVeg`, `noSoup`, or `noDessert`.

Quantity schemas use `maximum: 6` as a single admin-side cap; the application clamps each item to its own configured per-slot maximum. The final business maximum is still an open product decision (`@pending @quantity` in the `.feature`).

Property order follows `orderedPropertyRefsForDraft`: `targetDate`, `mealType`, then each package slot as `<slot>ItemId?` immediately before `<slot>Quantity`, then `submittedAt`.

### B.3 Not part of this contract

| Excluded | Reason |
|----------|--------|
| `studentId` | The authenticated GameBus user is the participant. Identity is never a business property on the ACTIVITY. |
| `actors`, `provider` | Must not be added to represent identity either. |
| `timingStatus` | **Student Lunch has no `timingStatus` property.** It is valid on `chefForecast`, which is a different product; do not link it to `studentLunchCheckin` and do not add it to the mapper. |
| `basePoints`, `timingAdjustment`, `totalPoints` | Local scoring concepts; not sent. |
| `comingStatus`, `selectedMain`, `selectedVegetarianOrNoVeg`, `selectedSoupOrNoSoup`, `selectedDessertOrNoDessert` | Superseded legacy properties (see [D.1](#d1-admin-migration-manual)). |
| `menuCycleWeek`, `menuVersion`, `includeInForecast`, `regularMainSelected`, `regularVegetarianSelected`, `noLunch`, `selections` | Internal record fields, redundant with `mealType` and the quantities, or local forecast metadata. |

### B.4 Message shape

```json
{
  "type": "ACTIVITY",
  "data": {
    "template": "studentLunchCheckin",
    "start": "<ISO-8601 datetime>",
    "end": "<ISO-8601 datetime>",
    "properties": [
      { "template": "<propertySlug>", "obj": { "value": <schema-conformant> } }
    ]
  }
}
```

- Each property is `{ "template": "<slug>", "obj": { "value": … } }` — **not** `{ "template": "<slug>", "value": … }`.
- `start` is `submittedAt`; `end` is `start + 1 minute`.
- The child posts once via `window.parent.postMessage`; the parent closes the modal on an accepted `ACTIVITY`.

Embed handshake, as implemented in `src/gamebus/bridge.ts`:

1. Child registers its `message` listener and posts `{ type: 'IFRAME_READY' }`, retrying until a TASK arrives.
2. Parent posts `{ type: 'TASK', data: { activityTemplates, … } }`; the first TASK wins and later duplicates are ignored.
3. Parent optionally posts `{ type: 'INPUT_COLLECTIONS', data: { … } }`, which carries the authenticated user under `inputCollectionPari.me`.
4. Child posts one `ACTIVITY`.
5. Parent closes the modal. There is no acknowledgement message, so closure is the only success signal available to the child.

### B.5 Examples

Target service **2026-07-28** (Tuesday), declared on Monday 2026-07-27 at `16:00:00.000Z`. Slots: main `meatballs`, vegetarian `pasta-primavera`, soup `tomato-soup`, dessert `yogurt-berries`.

#### Regular lunch — main only (8 properties)

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
      { "template": "vegetarianQuantity", "obj": { "value": 0 } },
      { "template": "soupQuantity", "obj": { "value": 0 } },
      { "template": "dessertQuantity", "obj": { "value": 0 } },
      { "template": "submittedAt", "obj": { "value": "2026-07-27T16:00:00.000Z" } }
    ]
  }
}
```

#### No lunch (7 properties, no item IDs)

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
      { "template": "mainQuantity", "obj": { "value": 0 } },
      { "template": "vegetarianQuantity", "obj": { "value": 0 } },
      { "template": "soupQuantity", "obj": { "value": 0 } },
      { "template": "dessertQuantity", "obj": { "value": 0 } },
      { "template": "submittedAt", "obj": { "value": "2026-07-27T16:00:00.000Z" } }
    ]
  }
}
```

Other combinations follow the same pattern:

| Case | `mealType` | Item IDs present | Property count |
|------|-----------|------------------|----------------|
| Regular, vegetarian only | `regular` | `vegetarianItemId` | 8 |
| Regular, main and vegetarian | `regular` | `mainItemId`, `vegetarianItemId` | 9 |
| Soup, soup only | `soup` | `soupItemId` | 8 |
| Soup, dessert only | `soup` | `dessertItemId` | 8 |
| Soup, soup and dessert | `soup` | `soupItemId`, `dessertItemId` | 9 |

The theoretical maximum of 11 properties requires positive quantities in both packages at once, which the mutually exclusive package rule prevents.

---

## C. Current repository implementation

| Concern | Implementation on `main` |
|---------|--------------------------|
| Route | Default / empty hash → student mode (`src/routing/appMode.ts`) |
| Target service date | `src/services/studentLunchServiceDate.ts` — first operational day after the Helsinki operational date, skipping weekends and explicitly closed days via `isOperationalServiceDay` |
| Menu unavailable | Blocks the form and submission; the resolved `targetDate` is unchanged |
| Deadline | `CANTEEN_CONFIG` 23:59:00 Europe/Helsinki on the calendar day before the target service; `submissionWindow` closes when `now >= deadline` (also once the service day itself begins) |
| Flow | Edit → Review → Confirm in `src/hooks/useLunchSelection.ts` |
| Submit states | `idle` / `sending` / `failed` / `success`; failure keeps the draft and allows retry |
| Duplicate safety | Bridge in-flight and `hasPosted` guards reject a second post as `duplicate` |
| Mapping | `mapStudentLunchCheckin` → `buildActivityMessage` → `ACTIVITY` with `start` = `submittedAt`, `end` = `+1 min` |
| TASK validation | `resolveActivityProperties` matches templates by **slug**, requires all 7 always-required refs to be linked, and fails a submission if a needed item-ID ref is missing from the template |
| Persistence (embedded) | The ACTIVITY is the only record written; the app does **not** write local storage in embedded mode |
| Persistence (standalone) | `LocalStorageDeclarationRepository` only, for the GitHub Pages demo |

### C.1 Internal legacy that is not part of the GameBus contract

`CANTEEN_CONFIG.studentId` (`demo-student-001`) still exists and keys the local storage record as `lunch-declaration-<studentId>-<lunchDate>`. It is a **standalone/demo implementation detail**, not an identity contract: it is never included in the ACTIVITY, and `mapStudentLunchCheckin.test.ts` asserts its absence. The `ActiveDeclaration` record likewise keeps local fields (`menuCycleWeek`, `menuVersion`, `includeInForecast`, `selections`) that are not sent to GameBus.

---

## D. Manual / live GameBus work still required

None of this can be done from this repository, and none of it has been verified here.

### D.1 Admin migration (manual)

Modify the existing `studentLunchCheckin` template; do not delete old property templates yet.

| Current linked property | Action | Result |
|-------------------------|--------|--------|
| `targetDate` | retain | `targetDate` |
| `submittedAt` | retain | `submittedAt` |
| `comingStatus` | replace | `mealType` |
| `selectedMain` | replace | `mainItemId` + `mainQuantity` |
| `selectedVegetarianOrNoVeg` | replace | `vegetarianItemId` + `vegetarianQuantity` |
| `selectedSoupOrNoSoup` | replace | `soupItemId` + `soupQuantity` |
| `selectedDessertOrNoDessert` | replace | `dessertItemId` + `dessertQuantity` |

Result: 7 required links plus 4 optional item-ID links. **Do not add a `timingStatus` link to this template.**

Full JSON Schemas: `STUDENT_LUNCH_CHECKIN_PROPERTY_SCHEMAS` in `src/gamebus/propertySchemas.ts`.

Until the admin templates match, live ingest will not accept what the repository mapper sends.

### D.2 Verification checklist (live)

1. Confirm the Pari embedded task's `activityTemplates[0]` slug is `studentLunchCheckin`.
2. Confirm optional item-ID omission and enum validation pass on ingest.
3. Confirm the stored activity is associated with the **authenticated participant** with no `studentId` property present.
4. Confirm exactly one activity per completed declaration, and modal closure on accept.
5. Production hardening: `postMessage` target origin allowlist instead of `'*'`, iframe and mobile checks.

### D.3 Open questions

| # | Question | Status |
|---|----------|--------|
| 1 | Are `basePoints` / `totalPoints` required by platform rules, or only in-app UX? | Unresolved; nothing is sent today |
| 2 | Exact production `postMessage` target origin | Unresolved; test environment used a localhost origin |

Resolved and no longer open: student identity comes from the authenticated GameBus user, so there is no question of sourcing a `studentId` from configuration.
