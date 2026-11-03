# PoweResta → RAISE menu adapter (design only)

**Documentation role:** Explanation / design note. **Not implemented** in the production menu resolver.

**Status:** Offline design pending live payload confirmation. Sample Excel menus through **2027-04-30** remain the runtime source (`src/data/generated/`).

## Current RAISE menu contract

| Concern | Current contract |
|---------|------------------|
| Categories / slots | Exactly four: `classic`, `vegetarian`, `soup`, `dessert` |
| Daily record | One open day → four slot rows with `itemId`, name, forecast quantity |
| Item identity | Stable slug IDs in `food-catalogue.json` (Excel-derived) |
| Resolver seam | `src/shared/menu/menuResolver.ts` → `resolveMenuForDate` |
| GameBus | Student/Chef/Closeout may send `mainItemId` / `vegetarianItemId` / `soupItemId` / `dessertItemId` using those catalogue IDs |

Do **not** change the production resolver or GameBus property contracts until a confirmed adapter + migration plan exists.

## What PoweResta published menus provide (documented)

Dated menus expose `mealOptions[]` with localized option names and `rows[]` dish names, allergens, diets, ingredients text, nutrition-ish fields.

They do **not** (in the registered docs):

- Label rows as classic / vegetarian / soup / dessert
- Include a `recipeId` (or equivalent) on each row
- Guarantee image URLs on public dated rows
- Document how far ahead unpublished days appear

## Adapter design (blocked on confirmation)

Proposed offline-safe shape (not wired):

```text
PowerestaDatedMenu
  → inspect mealOptions / diets / names (live confirmation required)
  → RaiseDailyMenuDraft { date, slots[classic|vegetarian|soup|dessert] }
  → optional catalogue upsert with NEW external IDs
  → crosswalk table: powerestaRowKey → raiseItemId (historical GameBus IDs preserved)
```

### Information required from Teemu / live capture before coding the mapper

1. Exact field(s) that distinguish the four RAISE slots (option name? diet? recipe group? site convention?).
2. Whether dated `rows[]` include any recipe UUID/`code` join key.
3. Canonical language for Finnish/English display names in the pilot site.
4. How missing slots or closed days appear in real responses.
5. Whether `publishUrl` equals the `menu` query parameter.
6. How far in advance future dates are published.

Until those answers exist, keep Excel/sample generation as the only runtime menu source.
