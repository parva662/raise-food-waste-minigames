# Trim Smart — Data Model Specification

> **Documentation status (Phase 1)**
>
> This file **mixes**:
>
> - **CURRENT IMPLEMENTATION** — §2 (nine `trimSmart` properties on `main`; pointers to `src/trimSmart/` and GameBus mappers).
> - **WORKING / PROPOSED** — §3 onward (target property set, `preparationTechnique`, `wastePracticeReview`, GameBus API session reload, Rescue & Reuse read contract). **Not** automatically approved or implemented.
>
> See `docs/current-state/IMPLEMENTATION_STATUS.md` for the short v1 vs target distinction.

**Status:** Working data model v0.3

**Scope:** Trim Smart participant activity, chef review relationship, reload reconstruction, and Rescue & Reuse read contract

**Repository:** `parva662/raise-food-waste-minigames`

**Verified baseline:** `main` at `019ce6637c2b75319b0c86a6a099b0645ec9ae4f`

**Companion specifications:** `product-spec.md`, `trim-smart.feature`

## 1. Data-model goals

The model must support the agreed kitchen workflow without duplicating facts or mixing participant measurement with chef judgement.

The core rules are:

1. One participant Trim Smart session may contain multiple ingredient activities.
2. One `trimSmart` GameBus ACTIVITY represents one completed ingredient preparation.
3. GameBus actor identity identifies the participant; do not add `participantId` / `studentId` to the participant activity.
4. The participant records measured facts and the technique used.
5. Derived quantities are calculated by the application, not stored as duplicate GameBus properties.
6. Chef evaluation is stored separately from the participant's measurement activity.
7. Rescue & Reuse reads reusable material from completed Trim Smart activities through the GameBus API.
8. Historical Trim Smart v1 activities remain valid historical records; the target client does not rewrite them.

---

## 2. Current deployed `trimSmart` contract

The current `main` implementation requires these properties on each participant `trimSmart` ACTIVITY:

1. `sessionId`
2. `sessionDate`
3. `ingredientCategory`
4. `ingredientId`
5. `ingredientName`
6. `ingredientWeightGrams`
7. `participantWasteGrams`
8. `practice`
9. `submittedAt`

Current implementation files include:

- `src/gamebus/mapTrimSmart.ts`
- `src/gamebus/resolveTrimSmartProperties.ts`
- `src/gamebus/buildTrimSmartActivityMessage.ts`
- `src/trimSmart/types.ts`
- `src/trimSmart/useTrimSmart.ts`

The current participant payload does not contain preparation technique or reusable material.

---

## 3. Target participant activity

### 3.1 Activity template

Keep the existing activity template reference:

```text
trimSmart
```

Do **not** create `trimSmartV2` or another parallel activity template unless GameBus later proves that in-place template evolution is impossible.

### 3.2 Target property order

The target `trimSmart` ACTIVITY should emit the following properties in this order:

1. `sessionId`
2. `sessionDate`
3. `ingredientCategory`
4. `ingredientId`
5. `ingredientName`
6. `ingredientWeightGrams`
7. `preparationTechnique`
8. `removedMaterialGrams`
9. `reusableMaterialGrams`
10. `submittedAt`

### 3.3 Existing properties reused unchanged

| Property | Source | Type | Required | Meaning |
|---|---|---|---:|---|
| `sessionId` | existing | string | yes | Shared Trim Smart session key |
| `sessionDate` | existing | date string | yes | Europe/Helsinki operational date locked for the session |
| `ingredientCategory` | existing | enum | yes | Controlled ingredient category |
| `ingredientId` | existing | string | yes | Stable technical ingredient key derived by current v1 logic |
| `ingredientName` | existing | string | yes | Human-readable ingredient name entered by participant |
| `ingredientWeightGrams` | existing | number | yes | Starting ingredient weight before preparation |
| `submittedAt` | existing | ISO date-time | yes | Absolute submission timestamp |

### 3.4 New properties

| Property | Type | Required | Entered by | Meaning |
|---|---|---:|---|---|
| `preparationTechnique` | enum | yes | participant | Technique being used for this ingredient |
| `removedMaterialGrams` | number >= 0 | yes | participant | Total material physically removed during preparation |
| `reusableMaterialGrams` | number >= 0 | yes | participant | Portion of removed material the participant identifies as suitable for another kitchen use |

### 3.5 Properties retired from new Trim Smart submissions

| Property | Target status | Reason |
|---|---|---|
| `practice` | historical only / no longer emitted | The old Usual preparation / Trim carefully / Use as much as possible step is replaced by preparation technique |
| `participantWasteGrams` | historical only / no longer emitted by Trim Smart | “Removed material” is not equivalent to waste because part of it may be reusable |
| `sessionCategoryWasteGrams` | never part of participant Trim Smart | Whole-kitchen/session measurement is a different fact |
| `chefPerformanceScore` | never part of participant Trim Smart | Chef judgement belongs to the separate review activity |

If GameBus administration requires the old `practice` or `participantWasteGrams` links to remain temporarily on the activity template for backwards compatibility, they should be **optional** and the target client must not populate them.

---

## 4. Property schemas

GameBus property templates use an object containing a `value` field. The following schemas define the target semantics.

### 4.1 `preparationTechnique`

Use stable machine values while showing friendly labels in the UI.

| Stored value | UI label |
|---|---|
| `dicing` | Dicing |
| `slicing` | Slicing |
| `chopping` | Chopping |
| `peeling` | Peeling |
| `trimming` | Trimming |
| `julienne` | Julienne |
| `filleting` | Filleting |
| `portioning_cutting` | Portioning / cutting |
| `other` | Other |

Recommended schema:

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
type: object
properties:
  value:
    type: string
    enum:
      - dicing
      - slicing
      - chopping
      - peeling
      - trimming
      - julienne
      - filleting
      - portioning_cutting
      - other
required:
  - value
additionalProperties: false
```

No additional free-text “other technique” property is required in this version.

### 4.2 `removedMaterialGrams`

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
type: object
properties:
  value:
    type: number
    minimum: 0
required:
  - value
additionalProperties: false
```

Application-level cross-field rule:

```text
removedMaterialGrams <= ingredientWeightGrams
```

### 4.3 `reusableMaterialGrams`

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
type: object
properties:
  value:
    type: number
    minimum: 0
required:
  - value
additionalProperties: false
```

Application-level cross-field rule:

```text
reusableMaterialGrams <= removedMaterialGrams
```

Zero is a valid measured value and must remain distinguishable from blank/missing.

---

## 5. Existing field semantics retained

### 5.1 `ingredientCategory`

Controlled values remain:

```text
vegetables
fruit
meat
fish
dairy
grains
legumes
other
```

### 5.2 `ingredientWeightGrams`

Meaning in Trim Smart:

> The participant's measured starting weight of the ingredient before the recorded preparation begins.

Rules:

- required;
- numeric;
- strictly greater than 0;
- grams throughout the new kitchen games;
- decimals allowed if supported by the GameBus number property.

### 5.3 `ingredientId`

Keep the current deterministic v1 derivation from `ingredientName` for this version.

Examples:

```text
Carrot -> carrot
Red Onion -> red-onion
```

The participant does not enter or see this technical value.

A future controlled ingredient catalogue may replace free-text normalization, but that is outside this Trim Smart redesign.

---

## 6. Derived values — calculate, do not persist

The following values are useful for UI, chef review and analysis but must **not** become additional GameBus properties in Trim Smart because they are fully derivable from stored facts.

### 6.1 Non-reusable material

```text
nonReusableMaterialGrams
= removedMaterialGrams - reusableMaterialGrams
```

### 6.2 Removed percentage

```text
removedPercentage
= removedMaterialGrams / ingredientWeightGrams * 100
```

Only calculate when `ingredientWeightGrams > 0`, which is guaranteed by valid submitted activities.

### 6.3 Reusable share of removed material

When `removedMaterialGrams > 0`:

```text
reusablePercentageOfRemoved
= reusableMaterialGrams / removedMaterialGrams * 100
```

When both removed and reusable material are 0, display the reusable share as `0%` or `—` according to the later UI specification; do not store either representation.

### 6.4 Score separation

None of the calculations above produces `chefPerformanceScore` automatically.

Example:

```text
starting weight = 10,000 g
removed = 800 g
reusable = 250 g

removed percentage = 8%
non-reusable = 550 g
```

The 8% result is evidence for review, not the chef's 0–5 score.

---

## 7. Example target participant payload

Logical submission:

```json
{
  "sessionId": "trim-smart:<gamebus-task-id>:2026-09-15",
  "sessionDate": "2026-09-15",
  "ingredientCategory": "vegetables",
  "ingredientId": "carrot",
  "ingredientName": "Carrot",
  "ingredientWeightGrams": 10000,
  "preparationTechnique": "dicing",
  "removedMaterialGrams": 800,
  "reusableMaterialGrams": 250,
  "submittedAt": "2026-09-15T08:42:31.000Z"
}
```

Derived, not stored:

```json
{
  "nonReusableMaterialGrams": 550,
  "removedPercentage": 8,
  "reusablePercentageOfRemoved": 31.25
}
```

---

## 8. Session identity and time model

### 8.1 Operational date

`sessionDate` uses the `Europe/Helsinki` operational calendar date.

Do not use browser-local date getters and do not hardcode UTC offsets.

### 8.2 Absolute timestamp

`submittedAt` is an ISO instant and remains independent of the operational timezone.

### 8.3 Current session key

Retain the current session-key strategy unless later GameBus constraints require a change.

Embedded:

```text
trim-smart:${task.id}:${sessionDate}
```

Standalone/demo:

```text
trim-smart:standalone:${sessionDate}
```

All ingredient activities created in one active session share the same `sessionId` and `sessionDate`.

### 8.4 Midnight while the page remains open

If the page remains open across Helsinki midnight, retain the locked `sessionId` / `sessionDate` for that already-active session.

Do not recompute the session date for each ingredient from the current clock.

---

## 9. Participant identity

Do not add any of the following to `trimSmart`:

```text
participantId
studentId
actorId
participantName
```

GameBus authenticated activity actor is the participant identity.

The application may use current-user information for display/API queries, but it must not duplicate that identity as a participant-entered property.

---

## 10. API reconstruction after reload

### 10.1 Source of truth

Successfully posted GameBus activities are the persistence source.

Do not introduce `localStorage` or `sessionStorage` as a competing source of truth for submitted ingredient results.

### 10.2 Same-session reconstruction

To reconstruct submitted ingredients, retrieve the current participant's `trimSmart` activities from the GameBus API and retain activities matching the active `sessionId`.

The reconstructed object must include at minimum:

- GameBus activity identifier returned by the API;
- actor/current-user association;
- `sessionId`;
- `sessionDate`;
- ingredient fields;
- technique;
- removed/reusable measurements;
- `submittedAt`.

Exact endpoint, query syntax and authentication are implementation details to be wired against the GameBus API contract used by the project; do not invent an endpoint in the application.

### 10.3 Unsaved draft

An ingredient that has not yet been successfully posted is not persistent and may be lost on reload.

### 10.4 Important session-completion limitation

`Finish session` currently does not create a GameBus activity or persistent completion flag.

Therefore, from participant ingredient activities alone the application can reconstruct **what was submitted**, but it cannot prove whether the participant previously pressed `Finish session`.

Target interpretation:

- submitted ingredient data must be recoverable;
- finish-screen state itself is not a persisted research fact;
- reopening/reloading may show the reconstructed session rather than remembering the exact previous UI screen.

This is intentional unless a later requirement introduces a persisted session-completion event.

### 10.5 Reload after Helsinki date rollover

There is one boundary that cannot be inferred perfectly without persisted session state:

- an open page can preserve an old session across midnight because its session lock remains in memory;
- after a full reload on the new Helsinki date, the application cannot unambiguously know whether the participant intended to continue yesterday's unfinished session or begin today's session.

Recommended minimal rule:

> A reload after the operational date has changed starts/reconstructs the new operational day's session. Previous-day activities remain historical records and are not silently merged into the new day.

If the study later requires continuation of an unfinished previous-day session after browser restart, that would require an explicit persisted session-state rule and should be specified separately.

---

## 11. Rescue & Reuse read contract

Trim Smart does not post a separate handoff activity.

Rescue & Reuse retrieves completed `trimSmart` activities through the GameBus API.

### 11.1 Eligible source activity

A Trim Smart activity is eligible to appear as available Rescue & Reuse material when:

```text
reusableMaterialGrams > 0
```

and it belongs to the relevant participant/session context.

### 11.2 Data exposed to Rescue & Reuse

For each eligible Trim Smart source activity, Rescue & Reuse needs:

- GameBus activity ID returned by the API;
- `sessionId`;
- `sessionDate`;
- ingredient category;
- ingredient ID;
- ingredient name;
- `reusableMaterialGrams`;
- `submittedAt`.

For context it may also display technique, starting weight and total removed material, but these are not the available rescue quantity.

### 11.3 Available quantity

Example:

```text
Trim Smart
Carrot
removedMaterialGrams = 800
reusableMaterialGrams = 250

Rescue & Reuse available source quantity = 250 g
```

Never expose the full 800 g as reusable when only 250 g was identified as reusable.

### 11.4 Source identity

The GameBus API's existing activity identifier is sufficient to identify the source Trim Smart record when Rescue & Reuse later needs provenance.

Do **not** add a new manually generated `ingredientAttemptId` to Trim Smart for this purpose.

Whether the Rescue & Reuse activity persists that source activity ID will be defined in the Rescue & Reuse data model.

---

## 12. Chef review data model

Chef judgement remains a separate activity from the participant's `trimSmart` activity.

### 12.1 Activity template

Use the previously agreed review activity:

```text
wastePracticeReview
```

### 12.2 One page, multiple review activities

The chef UX may display all ingredients for one participant/session on a single page.

Data storage should still remain **one review record per ingredient activity**, because each ingredient receives its own 0–5 score and optional feedback.

Example session:

```text
Participant session
  Trim Smart Carrot activity   -> one wastePracticeReview
  Trim Smart Onion activity    -> one wastePracticeReview
  Trim Smart Potato activity   -> one wastePracticeReview
```

The chef can submit those evaluations from one page; “one page” does not require one combined GameBus review object.

### 12.3 Review activity properties

| Property | Status | Required | Meaning |
|---|---|---:|---|
| `sessionId` | reuse | yes | Joins review to participant session |
| `sessionDate` | reuse | yes | Operational date of reviewed session |
| `reviewedActivityId` | new | yes | GameBus ID of the exact participant `trimSmart` activity being reviewed |
| `chefPerformanceScore` | existing/reuse | yes | Integer score 0–5 |
| `chefFeedback` | new | no | Optional chef feedback |
| `submittedAt` | reuse | yes | Review submission timestamp |

Do not add `reviewedGame`; the source activity ID already identifies the reviewed record/template.

Do not add `reviewedParticipantId` or `reviewerId` until/unless the confirmed cross-user GameBus contract requires them:

- participant identity belongs to the source `trimSmart` activity actor;
- reviewer identity belongs to the `wastePracticeReview` activity actor.

### 12.4 `reviewedActivityId`

Recommended schema:

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
type: object
properties:
  value:
    type: string
    minLength: 1
required:
  - value
additionalProperties: false
```

The value must come from the stable GameBus activity ID returned by the cross-user API response. Do not fabricate it from ingredient name/session data.

### 12.5 `chefPerformanceScore`

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
type: object
properties:
  value:
    type: integer
    minimum: 0
    maximum: 5
required:
  - value
additionalProperties: false
```

Important:

```text
0 = valid scored result
missing = not yet scored
```

The UI and analysis layer must never collapse those two states.

### 12.6 `chefFeedback`

Recommended schema:

```yaml
$schema: https://json-schema.org/draft/2020-12/schema
type: object
properties:
  value:
    type: string
    maxLength: 1000
required:
  - value
additionalProperties: false
```

The property is optional on the review activity. If no feedback is entered, omit the property rather than storing a placeholder string.

### 12.7 Review join

Logical relationship:

```text
wastePracticeReview.reviewedActivityId
              |
              v
GameBus activity ID of trimSmart ingredient activity
```

`sessionId` remains useful for grouping all reviews and source activities into the same participant/session review page, while `reviewedActivityId` supplies exact per-ingredient attribution.

### 12.8 Cross-user API dependency

The product requirement is fixed: the chef must retrieve the relevant participant Trim Smart activities and review all ingredients for a participant/session on one page.

Implementation remains dependent on the cross-user endpoint being provided by Raoul. The application must not guess endpoint shape, permissions, actor representation or filtering rules before that API contract is available.

---

## 13. Target GameBus property-template inventory

### Reuse existing

```text
sessionId
sessionDate
ingredientCategory
ingredientId
ingredientName
ingredientWeightGrams
submittedAt
chefPerformanceScore
```

### Create for target Trim Smart

```text
preparationTechnique
removedMaterialGrams
reusableMaterialGrams
```

### Create for chef review

```text
reviewedActivityId
chefFeedback
```

### Existing but no longer emitted by target Trim Smart

```text
practice
participantWasteGrams
```

### Must not be attached as required participant Trim Smart properties

```text
sessionCategoryWasteGrams
chefPerformanceScore
```

---

## 14. Target `trimSmart` property mapping

The target mapper should conceptually map:

```text
sessionId                 <- locked session
sessionDate               <- locked Europe/Helsinki session date
ingredientCategory        <- participant ingredient setup
ingredientId              <- derived from ingredient name
ingredientName            <- participant ingredient setup
ingredientWeightGrams     <- participant starting weight
preparationTechnique      <- participant technique selection
removedMaterialGrams      <- participant measurement
reusableMaterialGrams     <- participant measurement
submittedAt               <- absolute current timestamp at successful submission attempt
```

It must not emit derived values or chef fields.

---

## 15. Validation matrix

| Field/rule | Blank | 0 | Negative | Too high | Valid decimal |
|---|---:|---:|---:|---:|---:|
| starting weight | reject | reject | reject | n/a | accept |
| technique | reject | n/a | n/a | n/a | n/a |
| removed material | reject | accept | reject | reject if > starting weight | accept |
| reusable material | reject | accept | reject | reject if > removed | accept |
| chef score | unscored until submitted | accept | reject | reject if > 5 | reject non-integer |
| chef feedback | allowed absent | n/a | n/a | reject/truncate only according to agreed max policy | n/a |

Cross-field validation must happen before constructing/posting the GameBus ACTIVITY.

---

## 16. Duplicate and retry semantics

### Participant activity

One successful submit action creates one `trimSmart` activity for that ingredient.

Repeated taps/re-renders/retries after a successful post must not create an additional activity.

A failed post may be retried with the same entered data.

### Chef review

One intended chef evaluation creates one `wastePracticeReview` per reviewed ingredient.

The review page can submit several review activities in one user workflow, but each source ingredient must retain an independent success/error state so that a partial network failure does not silently duplicate already-posted reviews.

If review editing is added later, prefer append-only review history and select the latest valid review by `submittedAt`; do not mutate the participant's source activity.

---

## 17. Historical compatibility

Historical v1 `trimSmart` activities contain:

```text
participantWasteGrams
practice
```

Target activities contain:

```text
removedMaterialGrams
reusableMaterialGrams
preparationTechnique
```

Analysis and retrieval code must distinguish the schemas rather than silently interpreting old `participantWasteGrams` as new `removedMaterialGrams`.

Do not backfill `reusableMaterialGrams` or `preparationTechnique` into old activities unless a separate data-migration protocol is explicitly approved.

For participant UI/reload, target-flow reconstruction should require the target property set; older activities may be shown in historical results separately if needed later.

---

## 18. Data ownership summary

| Fact | Stored where | Authoritative source |
|---|---|---|
| participant identity | GameBus activity actor | GameBus |
| session identity/date | `trimSmart` properties | Trim Smart submission |
| ingredient + starting weight | `trimSmart` properties | participant measurement/setup |
| preparation technique | `trimSmart.preparationTechnique` | participant selection based on kitchen task |
| total removed material | `trimSmart.removedMaterialGrams` | participant measurement |
| reusable material | `trimSmart.reusableMaterialGrams` | participant measurement |
| non-reusable material | not stored | derived |
| removed percentage | not stored | derived |
| reusable percentage | not stored | derived |
| chef identity | review activity actor | GameBus |
| chef score | `wastePracticeReview.chefPerformanceScore` | chef |
| chef feedback | `wastePracticeReview.chefFeedback` | chef |
| exact reviewed ingredient | `wastePracticeReview.reviewedActivityId` | GameBus activity relation |
| Rescue & Reuse available source quantity | retrieved from Trim Smart | `reusableMaterialGrams` |

---

## 19. Implementation gap against current `main`

Current `main` must later be changed in these specific data-contract areas:

1. Replace `practice` in Trim Smart domain/submission mapping with `preparationTechnique`.
2. Replace the current `participantWasteGrams` Trim Smart measurement with:
   - `removedMaterialGrams`
   - `reusableMaterialGrams`
3. Add cross-field validation:
   - removed <= starting
   - reusable <= removed
4. Update GameBus required property refs and mapping order.
5. Update Trim Smart TASK fixtures/contract tests to the target property set.
6. Add GameBus API read/reconstruction for submitted participant Trim Smart activities.
7. Add API read contract for Rescue & Reuse source material.
8. Add separate `wastePracticeReview` mapping/builder after Raoul's cross-user API contract is available.

This is a gap list only. It is **not** an instruction to implement yet.

---

## 20. Data-model decisions now locked

The following are considered agreed for this specification version:

- one `trimSmart` activity per ingredient;
- multiple ingredients share one session;
- participant selects technique from the agreed controlled list;
- technique is stored as an enum value;
- student records starting weight, total removed material and reusable material;
- `practice` is retired from new Trim Smart submissions;
- `participantWasteGrams` is not reused for total removed material because the semantics differ;
- calculated grams/percentages are not persisted redundantly;
- Rescue & Reuse reads the reusable amount through the GameBus API;
- no new custom ingredient-attempt ID is introduced in Trim Smart;
- chef review is separate;
- chef scores each ingredient 0–5 and may add free-text feedback;
- one chef review page may create multiple per-ingredient review activities;
- current GameBus actor identity remains the identity source;
- cross-user review implementation waits for Raoul's endpoint contract;
- submitted participant activities are persistent source-of-truth; unsaved drafts are not;
- `Finish session` remains UI state, not a separate stored activity.
