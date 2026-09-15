# Trim Smart — Product Specification

> **Documentation status (Phase 1)**
>
> This file **mixes** two kinds of content:
>
> - **CURRENT IMPLEMENTATION** — §3 and other facts that describe Trim Smart **v1 on `main`** (route `#/waste/trim-smart`, `trimSmart` ACTIVITY, multi-ingredient session).
> - **WORKING / PROPOSED** — §4 onward (preparation technique, reusable material, chef review activity, GameBus API reload, Rescue & Reuse handoff). **Not** automatically approved or implemented because it appears here.
>
> Do not treat proposed sections as shipped product without explicit approval. See `docs/current-state/IMPLEMENTATION_STATUS.md`.

**Status:** Working specification v0.3

**Scope:** Trim Smart participant flow + Trim Smart chef review + handoff to Rescue & Reuse

**Repository:** `parva662/raise-food-waste-minigames`

**Verified baseline:** `main` at `019ce6637c2b75319b0c86a6a099b0645ec9ae4f` (`feat: add multi-ingredient Trim Smart game`)

**Implementation status:** Current v1 is deployed; later sections describe a **proposed** target redesign.

## 1. Purpose

Trim Smart is a practical kitchen activity for recording how a participant prepares ingredients and for enabling a chef to evaluate the quality of that preparation.

The game must not reduce performance to “lowest waste wins.” The amount removed during preparation is objective evidence, while the quality of the preparation technique is judged separately by the chef.

Trim Smart also identifies how much of the removed material the participant believes is still usable. That reusable quantity becomes input to the separate Rescue & Reuse game.

## 2. Product principles

1. **Real kitchen work first.** The digital game records the practical activity; it does not replace it with a questionnaire.
2. **One kitchen session can contain multiple ingredients.** Each ingredient is recorded separately while belonging to the same session.
3. **Technique comes from the kitchen task.** The recipe/chef determines what technique should be used. The game does not need to import or configure the recipe/menu. The participant selects the technique they are using from the controlled list, using the menu/recipe available to them outside this game as reference.
4. **Technique uses a controlled vocabulary.** No free-text technique names except `Other`.
5. **Measurements and chef judgement are separate.** The system calculates objective measurements; the chef evaluates performance.
6. **Removed material is not automatically waste.** The participant records total material removed and the reusable part of that material.
7. **Trim Smart and Rescue & Reuse remain separate games.** Trim Smart identifies reusable material; Rescue & Reuse records what is actually done with it.
8. **No automatic “best student” conclusion from trim percentage alone.** A low removed percentage can still represent poor technique.

## 3. Current deployed implementation

The deployed Trim Smart v1 route is:

`#/waste/trim-smart`

Current participant flow:

1. **Ingredient**
   - ingredient category
   - ingredient name
   - starting weight in grams
2. **Practice**
   - Usual preparation
   - Trim carefully
   - Use as much as possible
3. **Measure**
   - preparation waste in grams

Current behaviour:

- one active session can contain multiple ingredient entries;
- one `trimSmart` GameBus ACTIVITY is posted per ingredient;
- all ingredients in the active session share the same session identity/date;
- participant can add another ingredient or finish the session;
- the local session summary keeps completed ingredient entries in memory;
- current GameBus payload includes:
  - `sessionId`
  - `sessionDate`
  - `ingredientCategory`
  - `ingredientId`
  - `ingredientName`
  - `ingredientWeightGrams`
  - `participantWasteGrams`
  - `practice`
  - `submittedAt`

Current v1 does **not** record:

- preparation technique;
- reusable portion of removed material;
- derived non-reusable material;
- chef score/feedback;
- cross-game handoff to Rescue & Reuse.

## 4. Target Trim Smart concept

### 4.1 Session

A participant completes one Trim Smart kitchen session containing one or more ingredient preparations.

The session identity remains stable across all ingredients recorded during that active session.

The operational date is based on `Europe/Helsinki` and is locked when the first ingredient of the session is started. An already-open active session does not silently move to a new service date if the clock passes midnight.

### 4.2 Ingredient preparation

For each ingredient, the participant records/selects:

- ingredient category;
- ingredient name;
- starting weight;
- preparation technique from the controlled list.

The technique is determined by the recipe/chef in normal kitchen work, but the game does **not** import or configure that recipe assignment. The participant selects the technique they are using from the list.

### 4.3 Controlled technique list

Use the following list:

- Dicing
- Slicing
- Chopping
- Peeling
- Trimming
- Julienne
- Filleting
- Portioning / cutting
- Other

This list is considered agreed for the current target specification.

### 4.4 Replace the legacy Practice step

The current v1 Practice choices:

- Usual preparation
- Trim carefully
- Use as much as possible

are **not retained as a separate step** in the target flow.

The target flow replaces that step with **Preparation technique** selection.

Historical GameBus activities that already contain `practice` remain historical data. The data-model specification will define how the new target activity template evolves without rewriting old activities.

### 4.5 Measurements after preparation

After physical preparation, the participant records:

1. **Total material removed during preparation** in grams.
2. **Reusable material** in grams: the part of the removed material that the participant believes is still suitable for another kitchen use.

The system derives:

- **non-reusable material** = total removed material − reusable material;
- **removed percentage** = total removed material ÷ starting weight × 100;
- **reusable percentage of removed material** = reusable material ÷ total removed material × 100, when total removed material > 0.

These are measurements, not automatic technique scores.

### 4.6 Relationship with Rescue & Reuse

Trim Smart ends after identifying the reusable quantity.

Trim Smart does **not** ask where that material will be reused.

Rescue & Reuse retrieves completed Trim Smart activities through the **GameBus API** and exposes reusable material as available input.

Example:

- Carrot starting weight: 10,000 g
- Total material removed: 800 g
- Reusable material entered by student: 250 g
- Derived non-reusable material: 550 g
- Rescue & Reuse retrieves: **250 g carrot available for reuse**

The exact API endpoint/authentication/query details belong in the later technical/data-model specification, but the architectural mechanism is agreed: **retrieve the relevant Trim Smart activities through the GameBus API.**

## 5. Participant journey

### Step A — Ingredient

Participant records/selects:

- ingredient category;
- ingredient name;
- starting weight.

The participant cannot continue until required ingredient information and a valid positive starting weight are provided.

### Step B — Technique

Participant selects the technique used for the ingredient from the controlled list.

The participant is expected to know the required technique from the kitchen task/recipe/chef. The game does not duplicate the weekly menu or recipe configuration inside Trim Smart.

### Step C — Measure

After preparation, participant records:

- total material removed;
- reusable part of the removed material.

The game displays derived measurements but does not convert them into the final chef score.

### Step D — Ingredient recorded

After successful submission, participant sees a concise result and chooses:

- **Add another ingredient**, or
- **Finish session**.

Adding another ingredient resets only the current ingredient form while retaining the session identity and already completed ingredients.

### Step E — Session complete

Participant sees all ingredients recorded in the session and an objective summary.

Finishing the session does not create an extra ingredient activity.

## 6. Validation rules

### Starting weight

- required;
- numeric;
- greater than 0;
- decimals allowed where the underlying number schema supports them.

### Technique

- required;
- must be one of the controlled options.

### Total removed material

- required;
- numeric;
- zero is valid;
- cannot be negative;
- cannot exceed starting weight.

### Reusable material

- required; zero is valid;
- numeric;
- cannot be negative;
- cannot exceed total removed material.

### Derived non-reusable material

- never entered manually;
- always `removed − reusable`;
- can be zero.

## 7. Chef review

### 7.1 Review unit

Chef review is organised by:

**participant + Trim Smart session**

The chef sees all ingredients completed by that participant in that session on **one review page**.

The chef does not open a separate review page for each ingredient.

### 7.2 Per-ingredient evidence

For each ingredient, show at minimum:

- ingredient name;
- ingredient category;
- selected preparation technique;
- starting weight;
- total removed material;
- reusable material;
- derived non-reusable material;
- removed percentage.

### 7.3 Per-ingredient chef evaluation

Each ingredient receives its own evaluation because performance can differ by ingredient and technique.

For each ingredient, the chef can enter:

- **score:** integer 0–5;
- **feedback:** optional free-text field.

`0` is a valid score. “Not yet scored” must remain distinguishable from a score of `0` in the UI/data model.

The objective trim percentage is shown as evidence but does not automatically determine the 0–5 score.

### 7.4 No overall score yet

The current target does not require a calculated overall Trim Smart session score. The review page shows all per-ingredient scores together.

An overall score can be considered later if the project needs one.

### 7.5 Chef access dependency

The behavioural requirement is fixed: the chef must be able to open one participant/session and review all ingredients together.

The exact cross-user GameBus retrieval mechanism is still dependent on Raoul’s work. This is a **technical integration dependency**, not an unresolved product rule.

## 8. Reload recovery

Target behaviour:

- already-submitted ingredient activities are the source of truth in GameBus;
- if the participant reloads the page during an unfinished session, the app should retrieve that participant’s already-submitted Trim Smart activities for the active session through the GameBus API and reconstruct the completed-ingredient list;
- the participant should not be asked to re-enter ingredients that were already successfully submitted;
- an **unsaved current ingredient draft** may be lost on reload;
- the app must not create duplicate activities merely because the page was refreshed.

This avoids localStorage/sessionStorage becoming a second persistence source.

## 9. Student vs system vs chef responsibilities

| Information/action | Participant | System | Chef/recipe |
|---|---:|---:|---:|
| Ingredient category/name | Records/selects | Stores | Provides kitchen context outside game |
| Starting weight | Records | Validates/stores | — |
| Preparation technique | Selects from controlled list | Validates/stores | Determines required kitchen technique |
| Total material removed | Records | Validates/stores | Reviews |
| Reusable part | Records | Validates/stores | Reviews if needed |
| Non-reusable material | — | Calculates | Reviews |
| Removed % | — | Calculates | Uses as evidence |
| Technique quality | — | — | Scores 0–5 |
| Chef feedback | — | Stores/displays | Enters optionally |
| Rescue & Reuse source material | — | Retrieved from Trim Smart activities via GameBus API | — |

## 10. Explicit non-goals

The target does **not** currently add:

- food-safety scoring;
- leaderboard/winner logic;
- external waste-percentage benchmarks as automatic score thresholds;
- automatic assumption that lower removed percentage means better technique;
- Rescue & Reuse destination/use fields inside Trim Smart;
- weekly-menu or recipe duplication inside Trim Smart;
- automatic recipe-to-technique configuration;
- overall Trim Smart session score;
- changes to Student Lunch, Kitchen Forecast or Service Closeout.

## 11. Remaining technical dependencies for later specifications

These are not product questions to send back to the kitchen team:

1. Exact GameBus/API mechanism for a chef to retrieve another participant’s Trim Smart activities — dependent on Raoul’s cross-user work.
2. Exact GameBus API endpoint/query/auth details for Rescue & Reuse retrieval.
3. Exact GameBus property-template changes required to replace legacy `practice` with preparation technique and to add reusable material/chef review data.
4. Exact API query used to reconstruct the participant’s submitted ingredients after reload.

## 12. Implementation guardrails

When this specification is later given to Cursor:

- inspect current `main` first;
- treat this product specification and agreed Gherkin as target source of truth;
- perform a gap analysis before changing code;
- preserve working behaviour unless this spec explicitly changes it;
- replace the participant Practice step with Technique selection;
- do not modify unrelated games;
- do not invent cross-user GameBus behaviour before Raoul’s mechanism is available;
- maintain Europe/Helsinki operational-date semantics;
- add regression tests corresponding to implemented Gherkin scenarios;
- test before/exactly-at/after relevant time boundaries;
- test page reload recovery and duplicate prevention;
- run the full regression suite before deployment.
