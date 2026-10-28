# How-to: add My Food Journey to the GameBus left menu

**Documentation role:** How-to guide — configure the student Custom Page embed and Input Collections so authenticated students see only their own lunch history.

**Does not** change Student Lunch task logic, badges, streaks, or other games.

Official layout: [Campaign app layout](https://docs.next.gamebus.eu/explanations-core-concepts/campaign-app-layout). Protocol index: [`../contracts/GAMEBUS.md`](../contracts/GAMEBUS.md). Custom Pages vs tasks: [Custom Pages](https://docs.next.gamebus.eu/how-to-guides/create-a-custom-page) / Input Collections docs linked from `GAMEBUS.md`.

---

## Goal

Students in the target Participant group open **My Food Journey** from the GameBus left menu. The SPA hash is `#/student-journey`. The page is read-only.

---

## Create or verify the Custom Page

In the GameBus campaign editor (organizer / `admin`+`editor`):

| Setting | Value |
|---------|--------|
| Name | My Food Journey |
| Type | Custom Page / AppEmbedPage (external embed) |
| Embed URL | `https://parva662.github.io/raise-food-waste-minigames/#/student-journey` |
| Requires authentication | `true` |
| Global availability | `false` |
| Activity / TASK templates | **None** (this page must not submit activities) |

Suggested app-page slug (choose one unused in the campaign): `/student-journey` or `/my-food-journey`.

### Required Input Collections

Attach **only** these collections to the My Food Journey page:

| Collection key | Input request | Endpoint (summary) | Purpose |
|----------------|---------------|--------------------|---------|
| `inputCollectionPari` | `me` | `GET /api/me` | Authenticated student identity |
| `kitchenGroupInputSelf` | `activities` | `GET /api/me/activities` | Personal activities; SPA keeps `studentLunchCheckin` only |

Recommended filter on the self activities request: template reference / slug `studentLunchCheckin` when the admin UI supports it. `limit` should be high enough for personal history (for example `100` or `500`).

### Do not attach

- `kitchenGroupInput` (group `chefForecast` / `wasteMeasurement`)
- `kitchenSkillsTrainerInput` or any `GET /api/groups/activities` Kitchen Skills feed
- Unrelated research or admin collections

---

## Left menu item

1. Add a `SINGLE_ITEM` menu entry linked to the My Food Journey page.
2. **Title:** `My Food Journey`
3. **Subtitle (optional):** `Your lunch declarations`
4. **Groups:** Student / canteen participant group(s) only
5. **Waves:** at least one active wave
6. Keep the page **`isGloballyAvailable` = false** so access requires that menu item (and those groups)

Do not grant this menu item to Chef-only or admin-only groups unless product intentionally wants staff to see their own lunch history too.

---

## Verify

| Check | Expect |
|-------|--------|
| Authenticated student in the group | Left menu shows **My Food Journey**; page loads Overview / My Progress |
| Identity | Header/participation uses that student’s name; history matches their `studentLunchCheckin` posts |
| Another student’s activities | Never appear (actor id must match `me.id`) |
| No lunch declarations | Appear as participation |
| Duplicate same `targetDate` | One history row (latest submission) |
| Unauthenticated | Login or page not found |
| Student Lunch mission | Unchanged |

Confirm collections with [`verify-input-collections.md`](verify-input-collections.md).

---

## If organizer access is unavailable

Provide these exact steps to the campaign organizer; no SPA workaround can create the GameBus menu item.

1. Create Custom Page embed → GitHub Pages URL with `#/student-journey`
2. Attach `inputCollectionPari.me` + `kitchenGroupInputSelf.activities`
3. Set `isGloballyAvailable = false`
4. Add left-menu `SINGLE_ITEM` for the Student group only
5. Smoke-test with two student accounts for isolation

---

## Out of scope

- Changing badge distribution, streak engines, or leaderboards inside GameBus
- Fabricating streak/badge/plate-waste values in the SPA
- Editing Student Lunch TASK templates
