# Next steps — GameBus integration

**Single workflow:** activity template **`studentLunchCheckin`** (existing reference retained) with **twelve** quantity-aware properties.

**References:** [`GAMEBUS_LUNCH_CONTRACT.md`](./GAMEBUS_LUNCH_CONTRACT.md), [`SPEC.md`](./SPEC.md), `src/gamebus/propertySchemas.ts`, Louar `gamebus-minigame-demo` (`schemas.ts`, `embed/task`).

**Participant model:** Embedded submit does **not** send `studentId` on ACTIVITY; persistence must bind to the **authenticated GameBus user** (verify after admin migration). `CANTEEN_CONFIG.studentId` is used by the local declaration model and standalone storage only. Do not add `actors` unless participant association verification fails.

**Do not create** `studentLunchCheckinV2` or relink Pari in this phase.

---

## Final `studentLunchCheckin` property set (repo mapper ready)

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

1. Create or update **property templates** in GameBus admin (one step at a time; schemas in `propertySchemas.ts`).
2. Update **`studentLunchCheckin`** activity-template property links (8 required + 4 optional item IDs).
3. Confirm optional item-ID **omission**, enum behaviour, and schema validation on ingest.
4. **Test Pari** embedded task against migrated template (no relink if reference unchanged).
5. Verify stored values and **logged-in participant** association (no `studentId` on ACTIVITY).
6. Verify duplicate behaviour and modal closure.
7. Production hardening (origins, iframe, repeat access, mobile, deploy, recovery).

## Completed in repo (do not regress)

- Single embed mapper: `src/gamebus/mapStudentLunchCheckin.ts` → `studentLunchCheckin` only.
- Pari iframe on GitHub Pages + `providerPari` origin (admin).
- Node **Excel → JSON** conversion (`scripts/menu/`, `generated-data/menu/`).
- **Runtime dated menu** from `src/data/generated/` (synced by `menu:convert`); +175 day date shift unchanged.
- **Category placeholder images** (`public/images/menu/placeholders/`).

## Still pending (manual / live)

- GameBus admin: migrate `studentLunchCheckin` to the twelve-property set (live template still has seven legacy properties).
- Participant association without `studentId` on ACTIVITY (verify on test env).
- Real food photography (`public/images/menu/items/<id>.webp`).

## Out of scope this phase

- Commit; deploy; relink `embedded-task-Pari`; create `studentLunchCheckinV2`; delete existing GameBus property templates.
