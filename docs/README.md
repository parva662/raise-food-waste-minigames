# Documentation — start here

Repository: **parva662/raise-food-waste-minigames**

Verify the current commit with `git rev-parse HEAD` before relying on any pinned baseline in older docs.

This page is the **authoritative documentation map** for the repository. Documentation work follows the official [Diátaxis](https://diataxis.fr/start-here/) method.

**Diátaxis defines exactly four documentation types:**

| Type | Purpose |
|------|---------|
| **Tutorials** | Learning-oriented lessons (guided practice) |
| **How-to guides** | Goal-oriented recipes (get a job done) |
| **Reference** | Information-oriented facts (correct, lookup) |
| **Explanation** | Understanding-oriented discussion (why / context) |

When classification is uncertain, consult [diataxis.fr/start-here](https://diataxis.fr/start-here/) (and the [compass](https://diataxis.fr/compass/)) rather than inventing extra types.

**Not Diátaxis types** — these are **repository lifecycle / governance** areas:

| Area | Purpose |
|------|---------|
| [`current-state/`](current-state/) | Living status of what is true on `main` today |
| [`decisions/`](decisions/) | ADRs / recorded product–architecture decisions |
| [`archive/`](archive/) | Historical material (**never** overrides current sources) |

Do **not** create empty tutorial or how-to folders just to fill the map. Paths stay where they are for now; this index groups by type.

---

## Authoritative sources of truth

| Concern | Authoritative | Secondary |
|---------|---------------|-----------|
| Behaviour acceptance | [`../features/**/*.feature`](../features/) | Product MD (must not contradict) |
| GameBus activity / property slugs & TASK | [`contracts/`](contracts/) + [`product/kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md`](product/kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md) | Product MD |
| Official iframe protocol | **External** GameBus docs via [`contracts/GAMEBUS.md`](contracts/GAMEBUS.md) | RAISE conventions section in that file only |
| Architecture / dependency rules | [`architecture/`](architecture/) | README snippets |
| What code does on `main` | **Source** + [`current-state/IMPLEMENTATION_STATUS.md`](current-state/IMPLEMENTATION_STATUS.md) | Roadmap |
| Engineering / agent process | [`../PROJECT_RULES.md`](../PROJECT_RULES.md) + [`.cursor/rules/`](../.cursor/rules/) | — |
| Study narrative | [`../PROJECT_CHARTER.md`](../PROJECT_CHARTER.md) + demoted master plan (explanation only) | — |
| Historical | [`archive/`](archive/) | Never override |

Always separate **intended product behaviour**, **current implementation**, and **observed / live GameBus behaviour**. Never silently collapse them.

---

## Entry points by audience

### Developers

1. [`../PROJECT_RULES.md`](../PROJECT_RULES.md) — engineering / diagnosis rules  
2. [`architecture/README.md`](architecture/README.md) — one SPA, GameBus boundary  
3. Relevant **Reference** contracts / features for the area you change  
4. [`current-state/IMPLEMENTATION_STATUS.md`](current-state/IMPLEMENTATION_STATUS.md) — what is on `main`  
5. Inspect **current source** on `main`

### Product / research

1. [`../PROJECT_CHARTER.md`](../PROJECT_CHARTER.md) — purpose and scope  
2. Relevant page under [`product/`](product/) — intent and flow  
3. Approved Gherkin under [`../features/`](../features/) — acceptance behaviour  
4. Study / system explanation: [`product/RAISE_BARLAUREA_MASTER_PLAN.md`](product/RAISE_BARLAUREA_MASTER_PLAN.md) (**not** product SoT)

### Operators (GameBus admin / setup)

1. [`contracts/GAMEBUS.md`](contracts/GAMEBUS.md) — official GameBus doc index  
2. [`contracts/KITCHEN_FORECAST_ADMIN_SETUP.md`](contracts/KITCHEN_FORECAST_ADMIN_SETUP.md) — forecast admin checklist  
3. [`how-to/verify-input-collections.md`](how-to/verify-input-collections.md) — verify embed Input Collections  
4. [`product/kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md`](product/kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md) — Kitchen Skills locked slugs  

### AI agents (Cursor and similar)

1. [`../PROJECT_RULES.md`](../PROJECT_RULES.md) + [`.cursor/rules/docs-sync.mdc`](../.cursor/rules/docs-sync.mdc)  
2. This map (`docs/README.md`)  
3. [`architecture/`](architecture/) + [`contracts/`](contracts/) + [`../features/`](../features/)  
4. [`testing/`](testing/) coverage maps for the area under change  
5. [`how-to/`](how-to/) when diagnosing live embed / results issues  
6. [`current-state/IMPLEMENTATION_STATUS.md`](current-state/IMPLEMENTATION_STATUS.md)  
7. **Do not** treat [`archive/`](archive/) or the master plan as behaviour SoT  

---

## Tutorials

Learning-oriented lessons with guided practice.

**None yet.** A reading list is not a tutorial. Add a real tutorial only when onboarding needs a safe, stepwise lesson (for example local run without GameBus).

---

## How-to guides

Goal-oriented recipes for a concrete job:

| Path | Notes |
|------|--------|
| [`how-to/diagnose-chef-results.md`](how-to/diagnose-chef-results.md) | Diagnose `#/chef-results` empty / wrong Progress (product vs code vs live feed) |
| [`how-to/verify-input-collections.md`](how-to/verify-input-collections.md) | Verify which GameBus Input Collections the embed received |
| [`contracts/KITCHEN_FORECAST_ADMIN_SETUP.md`](contracts/KITCHEN_FORECAST_ADMIN_SETUP.md) | Configure / verify Kitchen Forecast on GameBus |
| [`../reference/README.md`](../reference/README.md) | Menu / recipe workbook and regenerate pipelines |

**Before repository-specific work**

1. Separate intended product behaviour, current implementation, and live GameBus behaviour.  
2. Never silently resolve an open product decision.  
3. Never modify an approved product contract merely to match existing code.  
4. Update documentation when an agreed product or architecture decision changes ([`PROJECT_RULES.md`](../PROJECT_RULES.md#documentation-synchronization); [`.cursor/rules/docs-sync.mdc`](../.cursor/rules/docs-sync.mdc)).

---

## Reference

Correct facts for lookup: schemas, slugs, hashes, coverage, UI tokens, external protocol index.

| Path | Notes |
|------|--------|
| [`contracts/GAMEBUS.md`](contracts/GAMEBUS.md) | **Single in-repo index** to official GameBus docs; separates official contract, RAISE conventions, and empirically verified live behaviour |
| [`contracts/KITCHEN_SKILLS_CHALLENGE_TASK.md`](contracts/KITCHEN_SKILLS_CHALLENGE_TASK.md) | One student TASK; student `SILENT_ACTIVITY` + `EXIT`; trainer review `SILENT_ACTIVITY` + `actors` |
| [`contracts/KITCHEN_SKILLS_CHALLENGE_ROUTES.md`](contracts/KITCHEN_SKILLS_CHALLENGE_ROUTES.md) | Left-menu hashes `#/kitchen-day*` |
| [`product/kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md`](product/kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md) | Locked Kitchen Skills activity / property slugs |
| [`product/kitchen-skills-challenge/TRIM_SMART_DATA_MODEL.md`](product/kitchen-skills-challenge/TRIM_SMART_DATA_MODEL.md) | Trim field / join reference |
| [`contracts/STUDENT_LUNCH_GAMEBUS.md`](contracts/STUDENT_LUNCH_GAMEBUS.md) | `studentLunchCheckin` |
| [`contracts/KITCHEN_FORECAST_GAMEBUS.md`](contracts/KITCHEN_FORECAST_GAMEBUS.md) | `chefForecast` |
| [`contracts/SERVICE_CLOSEOUT_GAMEBUS.md`](contracts/SERVICE_CLOSEOUT_GAMEBUS.md) | `wasteMeasurement` |
| [`product/UI_STANDARD.md`](product/UI_STANDARD.md) | Shared visual language, density, form, layout rules |
| [`../features/`](../features/) | Approved Gherkin acceptance specs |
| [`testing/`](testing/) | Vitest ↔ Gherkin coverage maps |
| [`../.github/workflows/test.yml`](../.github/workflows/test.yml) | CI test policy |
| [`../.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml) | GitHub Pages deploy |

---

## Explanation

Understanding-oriented context: why the product and architecture look this way.

| Path | Notes |
|------|--------|
| [`architecture/README.md`](architecture/README.md) | One SPA, GameBus boundary, iframe close rules |
| [`architecture/ACTORS_AND_SURFACES.md`](architecture/ACTORS_AND_SURFACES.md) | Roles vs source folders |
| [`product/kitchen-skills-challenge/KITCHEN_SKILLS_CHALLENGE.md`](product/kitchen-skills-challenge/KITCHEN_SKILLS_CHALLENGE.md) | Kitchen Skills Challenge orchestration — **APPROVED PRODUCT TARGET** |
| [`product/kitchen-skills-challenge/UX_FLOW.md`](product/kitchen-skills-challenge/UX_FLOW.md) | Student UI flow |
| [`product/kitchen-skills-challenge/TRIM_SMART.md`](product/kitchen-skills-challenge/TRIM_SMART.md) | Trim Smart |
| [`product/kitchen-skills-challenge/RESCUE_AND_REUSE.md`](product/kitchen-skills-challenge/RESCUE_AND_REUSE.md) | Reuse |
| [`product/kitchen-skills-challenge/PORTION_PRECISION.md`](product/kitchen-skills-challenge/PORTION_PRECISION.md) | Portion Precision |
| [`product/kitchen-skills-challenge/CHEF_REVIEW.md`](product/kitchen-skills-challenge/CHEF_REVIEW.md) | Session Review, Progress, trainer |
| [`product/kitchen-skills-challenge/IMPLEMENTATION_BLUEPRINT.md`](product/kitchen-skills-challenge/IMPLEMENTATION_BLUEPRINT.md) | Architectural constraints + remaining admin risks (status lives in current-state) |
| [`product/STUDENT_LUNCH.md`](product/STUDENT_LUNCH.md) | Student Lunch |
| [`product/KITCHEN_FORECAST.md`](product/KITCHEN_FORECAST.md) | Kitchen Forecast |
| [`product/SERVICE_CLOSEOUT.md`](product/SERVICE_CLOSEOUT.md) | Service Closeout |
| [`product/KITCHEN_RESULTS.md`](product/KITCHEN_RESULTS.md) | Staff + management results |
| [`product/WASTE_CHALLENGES.md`](product/WASTE_CHALLENGES.md) | Practical kitchen family overview |
| [`product/RAISE_BARLAUREA_MASTER_PLAN.md`](product/RAISE_BARLAUREA_MASTER_PLAN.md) | Study / system **explanation only** — not product SoT |
| [`testing/README.md`](testing/README.md) | Testing strategy notes |

---

## Repository lifecycle / governance (not Diátaxis types)

| Path | Notes |
|------|--------|
| [`current-state/IMPLEMENTATION_STATUS.md`](current-state/IMPLEMENTATION_STATUS.md) | Approved vs code vs live on `main` |
| [`current-state/ROADMAP.md`](current-state/ROADMAP.md) | Integration follow-ups |
| [`decisions/`](decisions/) | Future ADRs (stub) |
| [`archive/`](archive/) | **HISTORICAL** — including [`archive/SPEC_LEGACY.md`](archive/SPEC_LEGACY.md) |
| [`../PROJECT_RULES.md`](../PROJECT_RULES.md) | Engineering / AI working rules |
| [`../PROJECT_CHARTER.md`](../PROJECT_CHARTER.md) | High-level purpose and scope |
| This file | Documentation master index |

---

## Documentation status legend

| Label | Meaning |
|--------|---------|
| **APPROVED PRODUCT TARGET** | Agreed behaviour the application should satisfy. |
| **CURRENT IMPLEMENTATION** | Behaviour that can be verified from current source on `main`. |
| **WORKING / PROPOSED** | Design or draft not yet approved or implemented. |
| **FINAL PRODUCT MODEL** | Product logic and property names are settled and locked; not yet implemented in code. |
| **HISTORICAL** | Retained for context only; may contradict current product or code. |
| **EXTERNAL / GAMEBUS CONTRACT** | Integration requirement; verify against live GameBus templates and ingest, not only this repo. |

---

## Layout (paths unchanged in this pass)

```
docs/
├── README.md                 ← this map
├── how-to/                   ← practical diagnosis / verification recipes
├── product/                  ← mostly Explanation (+ some Reference)
├── architecture/             ← Explanation
├── contracts/                ← Reference (+ some How-to)
│   └── GAMEBUS.md            ← official GameBus doc index
├── current-state/            ← lifecycle (not a Diátaxis type)
├── testing/                  ← Reference coverage + Explanation strategy
├── decisions/                ← lifecycle (ADRs)
└── archive/                  ← lifecycle (HISTORICAL)
```

Canonical acceptance specs: [`../features/`](../features/) (`student-lunch`, `kitchen-forecast`, `kitchen-skills-challenge`, closeout, results).

---

## Canonical acceptance specs

| Game / area | Canonical path | Status |
|-------------|----------------|--------|
| Student Lunch | [`../features/student/student-lunch.feature`](../features/student/student-lunch.feature) | **APPROVED PRODUCT TARGET** |
| Kitchen Forecast | [`../features/kitchen/kitchen-forecast.feature`](../features/kitchen/kitchen-forecast.feature) | **APPROVED PRODUCT TARGET** — one `@pending` rollover edge case deferred |
| Kitchen Skills Challenge (five features) | [`../features/kitchen-skills-challenge/`](../features/kitchen-skills-challenge/) | **APPROVED PRODUCT TARGET** — public hashes remain `#/kitchen-day*` |

---

## Related reading

- Automated tests: Vitest (`npm run test:run`); see [`testing/README.md`](testing/README.md). Coverage maps under [`testing/`](testing/).
- Do not assume Gherkin files are executed in CI until a runner is explicitly added.
