# How-to: verify GameBus Input Collection data

**Documentation role:** How-to guide — confirm which Input Collections the embed received and which feed a surface should use.
**Does not** change GameBus admin configuration or application code.

Separate these layers:

| Layer | Meaning |
|-------|---------|
| **Intended product behaviour** | Which collection each product surface is allowed to read |
| **Current implementation** | Keys and accessors in `src/platform/gamebus/` |
| **Live GameBus configuration / data** | Whether foodtracker actually attaches those collections and returns the expected activities |
| **Europe/Helsinki date / eligibility** | Applied **after** parse — empty feed ≠ failed eligibility |

Official protocol index: [`../contracts/GAMEBUS.md`](../contracts/GAMEBUS.md). Forecast Results diagnosis: [`diagnose-chef-results.md`](diagnose-chef-results.md).

---

## 1. Intended collection map (product)

| Key | Typical upstream | Used by |
|-----|------------------|---------|
| `inputCollectionPari.me` | `GET /api/me` | Authenticated identity for all embeds |
| `kitchenGroupInput.activities` | Group activities filtered to `chefForecast` / `wasteMeasurement` | Forecast, closeout, Forecast Results |
| `kitchenGroupInputSelf.activities` | `GET /api/me/activities` | Kitchen Skills student challenge, Session Review, Progress |
| `kitchenSkillsTrainerInput.activities` | Group activities filtered to Kitchen Skills templates | Kitchen Skills trainer / chef feedback |
| `serviceCloseoutInput.chefForecasts` (legacy aliases exist) | Closeout forecast lookup | Service Closeout (compatibility path) |

**Do not** reuse `kitchenGroupInput` for Kitchen Skills student or trainer surfaces.

---

## 2. Current implementation accessors

Inspect (do not invent new keys):

- `src/platform/gamebus/inputCollections.ts` — `inputCollectionPari`, service-closeout forecast lookup
- `src/platform/gamebus/groupActivities.ts` — `kitchenGroupInput`, `kitchenGroupInputSelf`, `kitchenSkillsTrainerInput`
- `src/platform/gamebus/bridge.ts` — stores raw `INPUT_COLLECTIONS` from the parent

Useful helpers: `getInputCollectionKeys`, `getRawKitchenGroupActivitiesInput`, `getRawKitchenSelfActivitiesInput`, `getRawKitchenSkillsTrainerActivitiesInput`, `getAuthenticatedGameBusUser`.

---

## 3. Live verification recipe

1. Open the embed on foodtracker for the surface under test (Custom Task vs Custom Page matters for close/`EXIT` behaviour — see [`../contracts/GAMEBUS.md`](../contracts/GAMEBUS.md)).
2. Confirm the parent sent `INPUT_COLLECTIONS` (dev log / `?gamebusDebug=1` where the surface supports it).
3. List **top-level keys** present in the payload (`getInputCollectionKeys`). Missing key ⇒ live admin / menu Input Collection config, not a parser bug.
4. For the key you expect, inspect `.activities` (or nested request key) **before** product parsers:
   - Is the array present?
   - Rough count of activities?
   - Do activity templates match the product (`chefForecast`, `wasteMeasurement`, `trimSmart`, …)?
5. Only then apply product filters (actor, `sessionId`, `targetDate`, eligibility windows).

Kitchen Skills Progress debug summary (when enabled): `kitchen-skills-progress.self-feed-reviews`. Trainer debug surfaces may log trainer-feed summaries — treat them as diagnostics, not product SoT.

---

## 4. Common misreads

| Observation | Layer |
|-------------|--------|
| Collection key absent | Live GameBus menu / Input Collection config |
| Key present, activities empty or truncated | Live query / platform slice |
| Activities present, UI empty after eligibility / actor filters | Product rules or identity mismatch — see diagnose how-to |
| Student Skills empty when looking at `kitchenGroupInput` | Wrong collection (implementation + product rule) |
| Tutor list empty while student self-feed has data | Expected if trainer collection is separate / filtered |

---

## 5. Eligibility and time (after the feed is verified)

Once activities exist in the correct collection:

- Kitchen Forecast / Results eligibility uses Europe/Helsinki windows on `submittedAt` for an exact `targetDate` — see [`../contracts/KITCHEN_FORECAST_GAMEBUS.md`](../contracts/KITCHEN_FORECAST_GAMEBUS.md) and [`diagnose-chef-results.md`](diagnose-chef-results.md).
- Kitchen Skills session identity uses locked Helsinki `sessionDate` and opaque `sessionId` (`kitchen-day:…` in embed) — see slug contract / TASK docs.

Do not “fix” an empty UI by reading the wrong collection or by relaxing eligibility without an approved product change.
