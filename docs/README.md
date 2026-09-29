# Documentation — start here

Repository: **parva662/raise-food-waste-minigames**

Verify the current commit with `git rev-parse HEAD` before relying on any pinned baseline in older docs.

This index follows [Diátaxis](https://diataxis.fr/) (Tutorials / How-to / Reference / Explanation). **Files stay where they are**; only this map is grouped that way for now.

---

## Authority model

| Document | Role |
|----------|------|
| [`../PROJECT_RULES.md`](../PROJECT_RULES.md) | Engineering / AI working rules |
| [`../PROJECT_CHARTER.md`](../PROJECT_CHARTER.md) | High-level purpose and scope |
| **This file** (`docs/README.md`) | Documentation master index / START HERE |
| [`product/`](product/) | Human-readable product documentation |
| [`../features/`](../features/) | Gherkin acceptance specifications |
| [`contracts/`](contracts/) | GameBus and external technical contracts |
| [`architecture/`](architecture/) | One-SPA architecture, GameBus boundary, actors vs surfaces |
| [`current-state/`](current-state/) | Implementation status, gaps, roadmap |
| [`decisions/`](decisions/) | Future ADR / product decisions |
| [`testing/`](testing/) | Testing strategy notes |
| [`archive/`](archive/) | Superseded / legacy documents (**HISTORICAL**) |
| `src/` | Current implementation |

No single legacy root file competes with this structure.

---

## Tutorials

Learning path when you are new to this repo (not a separate tutorials folder yet):

1. [`/PROJECT_RULES.md`](../PROJECT_RULES.md)
2. [`/PROJECT_CHARTER.md`](../PROJECT_CHARTER.md)
3. The **relevant product page** under [`product/`](product/)
4. The **relevant `.feature` file** under [`../features/`](../features/) when one exists
5. **Inspect current source on `main`** for the area you are changing

Kitchen Skills Challenge start: [`product/kitchen-skills-challenge/KITCHEN_SKILLS_CHALLENGE.md`](product/kitchen-skills-challenge/KITCHEN_SKILLS_CHALLENGE.md) then [`product/kitchen-skills-challenge/UX_FLOW.md`](product/kitchen-skills-challenge/UX_FLOW.md).

---

## How-to

Operational recipes (configure, verify, trace tests):

| Path | Notes |
|------|--------|
| [`current-state/IMPLEMENTATION_STATUS.md`](current-state/IMPLEMENTATION_STATUS.md) | What is on `main` vs still live-GameBus |
| [`current-state/ROADMAP.md`](current-state/ROADMAP.md) | Integration roadmap |
| [`contracts/KITCHEN_FORECAST_ADMIN_SETUP.md`](contracts/KITCHEN_FORECAST_ADMIN_SETUP.md) | Forecast GameBus admin checklist |
| [`product/kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md`](product/kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md) | Kitchen Skills admin slug checklist |
| [`testing/`](testing/) | Vitest ↔ Gherkin coverage maps |

**Before repository-specific work**

1. Separate **intended product behaviour**, **current implementation**, and **observed / live GameBus behaviour**.
2. **Never silently resolve** an open product decision.
3. **Never modify an approved product contract** merely to match existing code.
4. **Update documentation** when an agreed product or architecture decision changes ([`/PROJECT_RULES.md`](../PROJECT_RULES.md#documentation-synchronization)).

---

## Reference

Stable facts, slugs, hashes, and external GameBus protocol:

| Path | Notes |
|------|--------|
| [`contracts/GAMEBUS.md`](contracts/GAMEBUS.md) | Index of official GameBus docs (tasks, pages, menu items, Core API) |
| [`contracts/KITCHEN_SKILLS_CHALLENGE_TASK.md`](contracts/KITCHEN_SKILLS_CHALLENGE_TASK.md) | One student TASK, three templates; `SILENT_ACTIVITY` + `EXIT` |
| [`contracts/KITCHEN_SKILLS_CHALLENGE_ROUTES.md`](contracts/KITCHEN_SKILLS_CHALLENGE_ROUTES.md) | Left-menu hashes `#/kitchen-day*` |
| [`product/kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md`](product/kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md) | Locked activity/property slugs |
| [`contracts/STUDENT_LUNCH_GAMEBUS.md`](contracts/STUDENT_LUNCH_GAMEBUS.md) | `studentLunchCheckin` |
| [`contracts/KITCHEN_FORECAST_GAMEBUS.md`](contracts/KITCHEN_FORECAST_GAMEBUS.md) | `chefForecast` |
| [`contracts/SERVICE_CLOSEOUT_GAMEBUS.md`](contracts/SERVICE_CLOSEOUT_GAMEBUS.md) | `wasteMeasurement` |
| [`product/UI_STANDARD.md`](product/UI_STANDARD.md) | Shared visual language plus density, form efficiency, and layout rules |
| [`../.github/workflows/test.yml`](../.github/workflows/test.yml) | CI test policy |
| [`../.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml) | GitHub Pages deploy |
| [`../reference/README.md`](../reference/README.md) | Menu workbook reference |

---

## Explanation

Why the product and architecture look this way:

| Path | Notes |
|------|--------|
| [`architecture/README.md`](architecture/README.md) | One SPA, GameBus boundary, iframe close rules |
| [`architecture/ACTORS_AND_SURFACES.md`](architecture/ACTORS_AND_SURFACES.md) | Roles vs source folders |
| [`product/kitchen-skills-challenge/KITCHEN_SKILLS_CHALLENGE.md`](product/kitchen-skills-challenge/KITCHEN_SKILLS_CHALLENGE.md) | Kitchen Skills Challenge orchestration — **APPROVED PRODUCT TARGET** |
| [`product/kitchen-skills-challenge/UX_FLOW.md`](product/kitchen-skills-challenge/UX_FLOW.md) | Student UI: Trim → Reuse → Portion → summary → Finish |
| [`product/kitchen-skills-challenge/TRIM_SMART.md`](product/kitchen-skills-challenge/TRIM_SMART.md) | Trim Smart |
| [`product/kitchen-skills-challenge/TRIM_SMART_DATA_MODEL.md`](product/kitchen-skills-challenge/TRIM_SMART_DATA_MODEL.md) | Trim data model |
| [`product/kitchen-skills-challenge/RESCUE_AND_REUSE.md`](product/kitchen-skills-challenge/RESCUE_AND_REUSE.md) | Reuse |
| [`product/kitchen-skills-challenge/PORTION_PRECISION.md`](product/kitchen-skills-challenge/PORTION_PRECISION.md) | Portion Precision |
| [`product/kitchen-skills-challenge/CHEF_REVIEW.md`](product/kitchen-skills-challenge/CHEF_REVIEW.md) | Session Review, Progress, trainer |
| [`product/kitchen-skills-challenge/IMPLEMENTATION_BLUEPRINT.md`](product/kitchen-skills-challenge/IMPLEMENTATION_BLUEPRINT.md) | Phases 0–6 |
| [`product/STUDENT_LUNCH.md`](product/STUDENT_LUNCH.md) | Student Lunch |
| [`product/KITCHEN_FORECAST.md`](product/KITCHEN_FORECAST.md) | Kitchen Forecast |
| [`product/SERVICE_CLOSEOUT.md`](product/SERVICE_CLOSEOUT.md) | Service Closeout |
| [`product/KITCHEN_RESULTS.md`](product/KITCHEN_RESULTS.md) | Staff + management results |
| [`product/WASTE_CHALLENGES.md`](product/WASTE_CHALLENGES.md) | Practical kitchen family overview |
| [`product/RAISE_BARLAUREA_MASTER_PLAN.md`](product/RAISE_BARLAUREA_MASTER_PLAN.md) | Study / system master plan |
| [`archive/SPEC_LEGACY.md`](archive/SPEC_LEGACY.md) | **HISTORICAL** mixed root SPEC |

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

## Layout (paths unchanged)

```
docs/
├── README.md
├── product/kitchen-skills-challenge/   …
├── architecture/
├── contracts/GAMEBUS.md                ← official GameBus doc index
├── current-state/
├── testing/
├── decisions/
└── archive/
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
