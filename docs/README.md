# Documentation — start here

Repository: **parva662/raise-food-waste-minigames**

Engineering baseline: **`main`** at `019ce6637c2b75319b0c86a6a099b0645ec9ae4f` (verify with `git rev-parse HEAD` before relying on this line).

---

## Before repository-specific work

1. Read [`/PROJECT_RULES.md`](../PROJECT_RULES.md).
2. Read [`/PROJECT_CHARTER.md`](../PROJECT_CHARTER.md).
3. Read the **relevant product documentation** (see index below).
4. Read the **relevant `.feature` acceptance specification** under [`/features/`](../features/) when one exists.
5. **Inspect current source on `main`** for the area you are changing or diagnosing.
6. Separate clearly:
   - **intended product behavior** (approved contracts and explicit decisions),
   - **current implementation** (what the code does today),
   - **observed / live GameBus behavior** (test or production environment; verify independently).
7. **Never silently resolve** an open product decision—record uncertainty or ask the product owner.
8. **Never modify an approved product contract** merely to match existing code.
9. **Update documentation** when an agreed product or architecture decision changes.

---

## Documentation status legend

| Label | Meaning |
|-------|---------|
| **APPROVED PRODUCT TARGET** | Agreed behavior the application should satisfy. |
| **CURRENT IMPLEMENTATION** | Behavior that can be verified from current source on `main`. |
| **WORKING / PROPOSED** | Design or draft not yet approved or implemented. |
| **HISTORICAL** | Retained for context only; may contradict current product or code. |
| **EXTERNAL / GAMEBUS CONTRACT** | Integration requirement; verify against live GameBus templates and ingest, not only this repo. |

---

## Phase 1 layout (skeleton)

Migration is **in progress**. Root-level markdown files (`SPEC.md`, `GAMEBUS_*.md`, etc.) remain authoritative for their topics until moved in later phases.

```
docs/
├── README.md                 ← you are here
├── current-state/
│   └── IMPLEMENTATION_STATUS.md
├── product/                  (placeholder — future product specs)
├── architecture/             (placeholder)
├── contracts/                (placeholder — future home of GAMEBUS_*.md)
├── decisions/                (placeholder)
├── testing/                  (placeholder)
├── archive/                  (placeholder)
├── student-game/             (pointer to canonical student .feature)
└── teacher-game/             (Trim Smart working/proposed specs)

features/
├── student/
│   └── student-lunch.feature   ← APPROVED PRODUCT TARGET (canonical)
├── kitchen/                  (placeholder)
└── waste-challenges/         (placeholder)
```

---

## Documentation index (current)

| Path | Type | Notes |
|------|------|--------|
| [`../PROJECT_RULES.md`](../PROJECT_RULES.md) | Rules | Engineering and diagnosis process. |
| [`../PROJECT_CHARTER.md`](../PROJECT_CHARTER.md) | Charter | Pilot context, user groups, product families. |
| [`current-state/IMPLEMENTATION_STATUS.md`](current-state/IMPLEMENTATION_STATUS.md) | **CURRENT IMPLEMENTATION** + gaps | Short status; not full specs. |
| [`../features/student/student-lunch.feature`](../features/student/student-lunch.feature) | **APPROVED PRODUCT TARGET** | Student Lunch acceptance contract. |
| [`teacher-game/product-spec.md`](teacher-game/product-spec.md) | Mixed | Trim Smart v1 facts + **proposed** target (see file header). |
| [`teacher-game/data-model.md`](teacher-game/data-model.md) | Mixed | v1 properties + **proposed** target model (see file header). |
| [`teacher-game/trim-smart.feature`](teacher-game/trim-smart.feature) | **WORKING / PROPOSED** | Target Gherkin; not v1 behavior. |
| [`../SPEC.md`](../SPEC.md) | Product + implementation | Student lunch + sections for other routes; migration pending. |
| [`../RAISE_BARLAUREA_STUDY_AND_SYSTEM_MASTER_PLAN.md`](../RAISE_BARLAUREA_STUDY_AND_SYSTEM_MASTER_PLAN.md) | Study / product | Living master plan; migration pending. |
| [`../NEXT_STEPS.md`](../NEXT_STEPS.md) | Roadmap | GameBus integration steps; migration pending. |
| [`../GAMEBUS_LUNCH_CONTRACT.md`](../GAMEBUS_LUNCH_CONTRACT.md) | **EXTERNAL / GAMEBUS CONTRACT** | Student activity; migration pending. |
| [`../GAMEBUS_CHEF_FORECAST_CONTRACT.md`](../GAMEBUS_CHEF_FORECAST_CONTRACT.md) | **EXTERNAL / GAMEBUS CONTRACT** | Chef forecast; migration pending. |
| [`../GAMEBUS_SERVICE_CLOSEOUT_CONTRACT.md`](../GAMEBUS_SERVICE_CLOSEOUT_CONTRACT.md) | **EXTERNAL / GAMEBUS CONTRACT** | Closeout; migration pending. |
| [`../GAMEBUS_CHEF_ADMIN_SETUP.md`](../GAMEBUS_CHEF_ADMIN_SETUP.md) | Operational / contract | Admin checklist; migration pending. |
| [`../reference/README.md`](../reference/README.md) | Operational | Menu workbook reference. |
| [`../.github/workflows/test.yml`](../.github/workflows/test.yml) | Operational | CI test policy. |
| [`../.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml) | Operational | GitHub Pages deploy. |

---

## Canonical acceptance specs

| Game / area | Canonical path |
|-------------|----------------|
| Student Lunch | [`../features/student/student-lunch.feature`](../features/student/student-lunch.feature) |

No other `.feature` file is **APPROVED PRODUCT TARGET** in Phase 1.

---

## Related reading

- Automated tests: Vitest (`npm run test:run`); see [`testing/README.md`](testing/README.md).
- Do not assume Gherkin files are executed in CI until a runner is explicitly added.
