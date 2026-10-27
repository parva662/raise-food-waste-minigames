# How-to: configure Chef access to the Kitchen Management Dashboard

**Documentation role:** How-to guide — give authorized Chefs the same read-only GameBus page as administrators, without hard-coding accounts in the SPA.

**Does not** change dashboard calculations, activity templates, or other games.

Official layout rules: [Campaign app layout](https://docs.next.gamebus.eu/explanations-core-concepts/campaign-app-layout). Protocol index: [`../contracts/GAMEBUS.md`](../contracts/GAMEBUS.md).

---

## Goal

Authorized Chef accounts can open the existing Kitchen Management Dashboard (`#/chef-results-admin` embedded at `/admindashboard`) with the same sections and group data as administrators. Ordinary participants must not gain that visibility.

Authorization is **only** GameBus page + menu + Input Collections. The SPA has no Chef allow-list.

---

## Verified live page (foodtracker)

| Attribute | Required value |
|-----------|----------------|
| App page slug | `/admindashboard` |
| Type | External page |
| Embed URL | `https://parva662.github.io/raise-food-waste-minigames/#/chef-results-admin` |
| Requires authentication | `true` |

### Input Collections (do not remove)

Keep these collections on `/admindashboard` (filters and `limit=500` already verified):

| Key | Endpoint (summary) |
|-----|--------------------|
| `inputCollectionPari` → `me` | `GET /api/me` |
| `kitchenGroupInput` → `activities` | `GET /api/groups/activities` filtered to `chefForecast`, `wasteMeasurement`, `limit=500` |
| `kitchenSkillsTrainerInput` → `activities` | `GET /api/groups/activities` filtered to `trimSmart`, `rescueAndReuse`, `portionPrecision`, `wastePracticeReview`, `limit=500` |

Optional extras already attached (`kitchenGroupInputSelf`, `serviceCloseoutInputs`) may stay; do not change unrelated pages.

---

## Required access configuration

As of the live check: `/admindashboard` has **`menuItems: []`** (no left-menu entry) while authenticated Chefs can still open the URL when signed in. Unauthenticated visitors receive **App page not found**.

Apply **only** these layout changes in the GameBus campaign editor (organizer / `admin`+`editor` account):

1. **Menu item** — add a `SINGLE_ITEM` linked to `/admindashboard`:
   - Title: `Kitchen Management Dashboard` (or equivalent)
   - Subtitle: short read-only description
   - Slot / order: with other staff tools (center)
   - **Groups:** link only the authorized Chef / management Participant group(s). Do **not** leave the item unrestricted if students share the campaign.
   - **Waves:** at least one active wave
2. **Page global availability** — set `/admindashboard` **`isGloballyAvailable` = false** so access requires a qualifying menu item (and therefore those groups). Do not make the page globally available to every signed-in user.
3. **Do not** change Input Collection keys, template filters, or `limit=500` unless counts require a higher ceiling.
4. **Do not** grant the menu item to Student / ordinary kitchen-staff-only groups.

---

## Verify

| Account | Expect |
|---------|--------|
| Authorized Chef | Left menu shows Kitchen Management; `/admindashboard` loads Forecast & Service + Kitchen Skills with group data |
| Administrator / editor | Same dashboard and data |
| Unauthenticated | No management view (login or page not found) |
| Ordinary participant (no Chef group) | No menu item; direct `/admindashboard` denied |

Confirm collections with [`verify-input-collections.md`](verify-input-collections.md). Diagnose empty results with [`diagnose-chef-results.md`](diagnose-chef-results.md).

---

## Out of scope

- Frontend hard-coded Chef names or account IDs
- New editing / write features on the management dashboard
- Changing Forecast or Kitchen Skills calculations
- Other games’ Custom Pages or missions
