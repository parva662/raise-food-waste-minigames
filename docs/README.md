# Documentation — start here

Repository: **parva662/raise-food-waste-minigames**

Verify the current commit with `git rev-parse HEAD` before relying on any pinned baseline in older docs.

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
| [`architecture/`](architecture/) | Technical architecture (placeholder) |
| [`current-state/`](current-state/) | Implementation status, gaps, roadmap |
| [`decisions/`](decisions/) | Future ADR / product decisions |
| [`testing/`](testing/) | Testing strategy notes |
| [`archive/`](archive/) | Superseded / legacy documents (**HISTORICAL**) |
| `src/` | Current implementation |

No single legacy root file competes with this structure.

---

## Before repository-specific work

1. Read [`/PROJECT_RULES.md`](../PROJECT_RULES.md).
2. Read [`/PROJECT_CHARTER.md`](../PROJECT_CHARTER.md).
3. Read the **relevant product documentation** under [`product/`](product/).
4. Read the **relevant `.feature` acceptance specification** under [`../features/`](../features/) when one exists.
5. **Inspect current source on `main`** for the area you are changing or diagnosing.
6. Separate clearly:
   - **intended product behavior** (approved contracts and explicit decisions),
   - **current implementation** (what the code does today),
   - **observed / live GameBus behavior** (test or production environment; verify independently).
7. **Never silently resolve** an open product decision—record uncertainty or ask the product owner.
8. **Never modify an approved product contract** merely to match existing code.
9. **Update documentation** when an agreed product or architecture decision changes. The mandatory synchronization workflow and the documentation consistency check are defined in [`/PROJECT_RULES.md`](../PROJECT_RULES.md#documentation-synchronization); follow it in the same change, not as a follow-up.

---

## Documentation status legend

| Label | Meaning |
|-------|---------|
| **APPROVED PRODUCT TARGET** | Agreed behavior the application should satisfy. |
| **CURRENT IMPLEMENTATION** | Behavior that can be verified from current source on `main`. |
| **WORKING / PROPOSED** | Design or draft not yet approved or implemented. |
| **FINAL PRODUCT MODEL** | Product logic and property names are settled and locked; not yet implemented in code. |
| **HISTORICAL** | Retained for context only; may contradict current product or code. |
| **EXTERNAL / GAMEBUS CONTRACT** | Integration requirement; verify against live GameBus templates and ingest, not only this repo. |

---

## Layout

```
docs/
├── README.md
├── product/
│   ├── STUDENT_LUNCH.md
│   ├── KITCHEN_FORECAST.md
│   ├── SERVICE_CLOSEOUT.md
│   ├── KITCHEN_RESULTS.md
│   ├── WASTE_CHALLENGES.md
│   ├── RAISE_BARLAUREA_MASTER_PLAN.md
│   └── waste-challenges/
│       ├── KITCHEN_DAY.md
│       ├── GAMEBUS_SLUG_CONTRACT.md
│       ├── TRIM_SMART.md
│       ├── TRIM_SMART_DATA_MODEL.md
│       ├── RESCUE_AND_REUSE.md
│       ├── PORTION_PRECISION.md
│       ├── CHEF_REVIEW.md
│       ├── UX_FLOW.md
│       └── IMPLEMENTATION_BLUEPRINT.md
├── contracts/
│   ├── STUDENT_LUNCH_GAMEBUS.md
│   ├── KITCHEN_FORECAST_GAMEBUS.md
│   ├── SERVICE_CLOSEOUT_GAMEBUS.md
│   └── KITCHEN_FORECAST_ADMIN_SETUP.md
├── current-state/
│   ├── IMPLEMENTATION_STATUS.md
│   └── ROADMAP.md
├── architecture/   decisions/   testing/   archive/
└── student-game/   (pointer to canonical Student Lunch .feature)

features/
├── student/student-lunch.feature          ← APPROVED PRODUCT TARGET
├── kitchen/kitchen-forecast.feature       ← APPROVED PRODUCT TARGET
└── waste-challenges/*.feature             ← APPROVED PRODUCT TARGET (not Trim Smart v1)
```

---

## Product pages

| Path | Notes |
|------|--------|
| [`product/STUDENT_LUNCH.md`](product/STUDENT_LUNCH.md) | Student Lunch navigation |
| [`product/KITCHEN_FORECAST.md`](product/KITCHEN_FORECAST.md) | Kitchen Forecast navigation |
| [`product/SERVICE_CLOSEOUT.md`](product/SERVICE_CLOSEOUT.md) | Service Closeout navigation |
| [`product/KITCHEN_RESULTS.md`](product/KITCHEN_RESULTS.md) | Staff + management results |
| [`product/WASTE_CHALLENGES.md`](product/WASTE_CHALLENGES.md) | Practical kitchen family overview (Kitchen Day modules) |
| [`product/RAISE_BARLAUREA_MASTER_PLAN.md`](product/RAISE_BARLAUREA_MASTER_PLAN.md) | Study / system master plan |
| [`product/waste-challenges/KITCHEN_DAY.md`](product/waste-challenges/KITCHEN_DAY.md) | Kitchen Day orchestration — **APPROVED PRODUCT TARGET** |
| [`product/waste-challenges/GAMEBUS_SLUG_CONTRACT.md`](product/waste-challenges/GAMEBUS_SLUG_CONTRACT.md) | Locked GameBus slugs + admin checklist |
| [`product/waste-challenges/TRIM_SMART.md`](product/waste-challenges/TRIM_SMART.md) | Trim Smart — CURRENT v1 + approved target |
| [`product/waste-challenges/TRIM_SMART_DATA_MODEL.md`](product/waste-challenges/TRIM_SMART_DATA_MODEL.md) | Trim data model |
| [`product/waste-challenges/RESCUE_AND_REUSE.md`](product/waste-challenges/RESCUE_AND_REUSE.md) | Reuse (`sessionId` + `ingredientId`) |
| [`product/waste-challenges/PORTION_PRECISION.md`](product/waste-challenges/PORTION_PRECISION.md) | Portion Precision |
| [`product/waste-challenges/CHEF_REVIEW.md`](product/waste-challenges/CHEF_REVIEW.md) | Session Review, Student Progress, tutor assessment |
| [`product/waste-challenges/UX_FLOW.md`](product/waste-challenges/UX_FLOW.md) | Kitchen Day UX |
| [`product/UI_STANDARD.md`](product/UI_STANDARD.md) | Shared application visual language |
| [`product/waste-challenges/IMPLEMENTATION_BLUEPRINT.md`](product/waste-challenges/IMPLEMENTATION_BLUEPRINT.md) | Phases 0–6 |

---

## Contracts

| Path | Notes |
|------|--------|
| [`contracts/STUDENT_LUNCH_GAMEBUS.md`](contracts/STUDENT_LUNCH_GAMEBUS.md) | `studentLunchCheckin` |
| [`contracts/KITCHEN_FORECAST_GAMEBUS.md`](contracts/KITCHEN_FORECAST_GAMEBUS.md) | `chefForecast` |
| [`contracts/SERVICE_CLOSEOUT_GAMEBUS.md`](contracts/SERVICE_CLOSEOUT_GAMEBUS.md) | `wasteMeasurement` |
| [`contracts/KITCHEN_FORECAST_ADMIN_SETUP.md`](contracts/KITCHEN_FORECAST_ADMIN_SETUP.md) | Admin checklist |
| [`contracts/KITCHEN_DAY_ROUTES.md`](contracts/KITCHEN_DAY_ROUTES.md) | Kitchen Day GameBus left-menu URLs |
| [`contracts/KITCHEN_DAY_TASK.md`](contracts/KITCHEN_DAY_TASK.md) | One student TASK with three templates; tutor TASK for `wastePracticeReview` |

---

## Current state and archive

| Path | Notes |
|------|--------|
| [`current-state/IMPLEMENTATION_STATUS.md`](current-state/IMPLEMENTATION_STATUS.md) | Status + known gaps |
| [`current-state/ROADMAP.md`](current-state/ROADMAP.md) | Integration roadmap (former `NEXT_STEPS.md`) |
| [`archive/SPEC_LEGACY.md`](archive/SPEC_LEGACY.md) | **HISTORICAL** mixed root SPEC |

---

## Canonical acceptance specs

| Game / area | Canonical path | Status |
|-------------|----------------|--------|
| Student Lunch | [`../features/student/student-lunch.feature`](../features/student/student-lunch.feature) | **APPROVED PRODUCT TARGET** |
| Kitchen Forecast | [`../features/kitchen/kitchen-forecast.feature`](../features/kitchen/kitchen-forecast.feature) | **APPROVED PRODUCT TARGET** — one `@pending` rollover edge case deferred |
| Kitchen Day (five features) | [`../features/waste-challenges/`](../features/waste-challenges/) | **APPROVED PRODUCT TARGET** — not Trim Smart v1 |

---

## Other operational docs

| Path | Notes |
|------|--------|
| [`../reference/README.md`](../reference/README.md) | Menu workbook reference |
| [`../.github/workflows/test.yml`](../.github/workflows/test.yml) | CI test policy |
| [`../.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml) | GitHub Pages deploy |

---

## Related reading

- Automated tests: Vitest (`npm run test:run`); see [`testing/README.md`](testing/README.md). Coverage maps: [`testing/KITCHEN_FORECAST_ACCEPTANCE_COVERAGE.md`](testing/KITCHEN_FORECAST_ACCEPTANCE_COVERAGE.md), [`testing/SERVICE_CLOSEOUT_ACCEPTANCE_COVERAGE.md`](testing/SERVICE_CLOSEOUT_ACCEPTANCE_COVERAGE.md), Kitchen Results matrices under [`testing/`](testing/).
- Do not assume Gherkin files are executed in CI until a runner is explicitly added.
