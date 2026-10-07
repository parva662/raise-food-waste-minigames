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
| `kitchenSkillsTrainerInput.activities` | Group activities filtered to Kitchen Skills templates | Kitchen Skills trainer / chef feedback only — **not** student Progress |
| `serviceCloseoutInput.chefForecasts` (legacy aliases exist) | Closeout forecast lookup | Service Closeout (compatibility path) |

**Do not** reuse `kitchenGroupInput` for Kitchen Skills student or trainer surfaces.
**Do not** attach `GET /api/groups/activities` Kitchen Skills templates to student Progress. Peer cards stay empty until a privacy-safe aggregate exists.

---

## 2. Current implementation accessors

Application code reads collections through helpers (there is **no** documented `window.*` console API that exposes them):

| Helper / module | Role |
|-----------------|------|
| `getInputCollectionKeys` | Top-level keys on the raw `INPUT_COLLECTIONS` payload |
| `getAuthenticatedGameBusUser` / `inputCollectionPari.me` | Authenticated identity |
| `getRawKitchenGroupActivitiesInput` | `kitchenGroupInput.activities` |
| `getRawKitchenSelfActivitiesInput` | `kitchenGroupInputSelf.activities` |
| `getRawKitchenSkillsTrainerActivitiesInput` | `kitchenSkillsTrainerInput.activities` (trainer only) |
| `src/platform/gamebus/bridge.ts` | Stores parent `INPUT_COLLECTIONS`; logs on receive when investigation logging is on |
| `src/platform/gamebus/inputCollections.ts` | Pari + service-closeout forecast lookup |
| `src/platform/gamebus/groupActivities.ts` | Group / self / trainer kitchen feeds |

Inspect behaviour via the mechanisms in §3, by reading those modules, or via Vitest fixtures — not by inventing browser console commands.

---

## 3. How to observe Input Collections in the browser / embed

### 3.1 Platform console logging (`gamebusDevLog`)

`src/platform/gamebus/devLog.ts` writes `[gamebus] …` lines to the **browser console** when either:

- the Vite **DEV** build is running (`import.meta.env.DEV`), or
- the hash query includes **`gamebusDebug=1`** (works on **any** hash route, e.g. `#/kitchen-day?gamebusDebug=1`, `#/service-closeout?gamebusDebug=1`).

When the parent posts `INPUT_COLLECTIONS`, `bridge.ts` logs (among other fields):

- `collectionKeys` — top-level keys present
- `kitchenGroupActivities` — raw `kitchenGroupInput.activities`
- `kitchenSkillsTrainerInput` / trainer activities summary when present

Open DevTools → Console on the embed (or local `npm run dev` with that hash). Missing keys in that log ⇒ live GameBus Input Collection config / payload, not a product parser inventing collections.

### 3.2 `#/chef-results?gamebusDebug=1` (participant Forecast Results only)

`isForecastResultsGameBusDebugMode()` is true only when the hash **starts with** `#/chef-results` and includes `gamebusDebug=1`.

**What it does today:** logs `[gamebus] authenticated user` `{ id, name }` from `inputCollectionPari.me` (`useGameBusAuthenticatedUser`).

**What it does not do:** the participant page does **not** render an on-page “GameBus debug” / Input Collections panel (`chef-results-debug-panel` is absent by design on current `main`). Use §3.1 console logging for collection keys and group activities.

### 3.3 Service Closeout — DEV-only on-page panel

On `#/service-closeout`, `ServiceCloseoutInputCollectionsDebug` renders only when `import.meta.env.DEV` is true (local Vite). It does **not** require `gamebusDebug=1`.

Use the **Show raw INPUT_COLLECTIONS (dev)** toggle to see:

- whether embed mode / INPUT_COLLECTIONS are ready
- collection keys (`getInputCollectionKeys`)
- raw `kitchenGroupInput.activities`

This panel is omitted from production builds.

### 3.4 Kitchen Skills Progress console summary

When Progress hydrates and investigation logging is on (DEV or `?gamebusDebug=1` on the Progress hash), `logKitchenSkillsProgressSelfFeedDebug` may emit `[gamebus] kitchen-skills-progress.self-feed-reviews` with a compact self-feed / review attachment summary. Treat it as a diagnostic, not product SoT.

### 3.5 Live verification recipe

1. Open the target surface on foodtracker or local DEV (Custom Task vs Custom Page matters for close/`EXIT` — see [`../contracts/GAMEBUS.md`](../contracts/GAMEBUS.md)).
2. Enable observation: DEV console and/or `?gamebusDebug=1` on the hash (§3.1); for closeout locally, use the DEV panel (§3.3); for participant identity only, `#/chef-results?gamebusDebug=1` (§3.2).
3. Confirm `INPUT_COLLECTIONS received` / collection keys in the console (or closeout panel).
4. For the key you expect, inspect activities **before** product parsers: array present? count? templates (`chefForecast`, `wasteMeasurement`, `trimSmart`, …)?
5. Only then apply product filters (actor, `sessionId`, `targetDate`, eligibility windows).

---

## 4. Common misreads

| Observation | Layer |
|-------------|--------|
| Collection key absent | Live GameBus menu / Input Collection config |
| Key present, activities empty or truncated | Live query / platform slice |
| Activities present, UI empty after eligibility / actor filters | Product rules or identity mismatch — see diagnose how-to |
| Student Skills empty when looking at `kitchenGroupInput` | Wrong collection (implementation + product rule) |
| Tutor list empty while student self-feed has data | Expected if trainer collection is separate / filtered |
| `#/chef-results?gamebusDebug=1` shows no debug panel | Expected on current `main` — use console identity log + §3.1 |

---

## 5. Eligibility and time (after the feed is verified)

Once activities exist in the correct collection:

- Kitchen Forecast / Results eligibility uses Europe/Helsinki windows on `submittedAt` for an exact `targetDate` — see [`../contracts/KITCHEN_FORECAST_GAMEBUS.md`](../contracts/KITCHEN_FORECAST_GAMEBUS.md) and [`diagnose-chef-results.md`](diagnose-chef-results.md).
- Kitchen Skills session identity uses locked Helsinki `sessionDate` and opaque `sessionId` (`kitchen-day:…` in embed) — see slug contract / TASK docs.

Do not “fix” an empty UI by reading the wrong collection or by relaxing eligibility without an approved product change.
