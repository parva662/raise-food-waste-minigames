# Student Lunch

**Documentation role:** Canonical product navigation page (not a full specification).
**Audience:** Developers and AI assistants starting Student Lunch work.

---

## Purpose

Students declare attendance and intended lunch for the **next operational lunch service** (research / awareness data collection via GameBus Custom Embed). The mission posts a `studentLunchCheckin` ACTIVITY.

---

## Authoritative documents

| Role | Path | Status |
|------|------|--------|
| **Approved acceptance rules** | [`../../features/student/student-lunch.feature`](../../features/student/student-lunch.feature) | **APPROVED PRODUCT TARGET** |
| **GameBus contract** | [`../contracts/STUDENT_LUNCH_GAMEBUS.md`](../contracts/STUDENT_LUNCH_GAMEBUS.md) | **EXTERNAL / GAMEBUS CONTRACT** |
| **Current implementation vs approved target** | [`../current-state/IMPLEMENTATION_STATUS.md`](../current-state/IMPLEMENTATION_STATUS.md) | **CURRENT IMPLEMENTATION** + known gaps |
| **Engineering rules** | [`../../PROJECT_RULES.md`](../../PROJECT_RULES.md) | Process |
| **Charter** | [`../../PROJECT_CHARTER.md`](../../PROJECT_CHARTER.md) | Scope |
| **Legacy mixed spec** | [`../archive/SPEC_LEGACY.md`](../archive/SPEC_LEGACY.md) | **HISTORICAL** — do not treat as product truth over the `.feature` |

Do **not** rewrite the approved `.feature` merely to match current code. Known differences are tracked in implementation status.

---

## Relevant source (current implementation)

| Area | Location |
|------|----------|
| Route | Default / empty hash → student mode (`src/routing/appMode.ts`, `App.tsx`) |
| Selection / submit | `src/hooks/useLunchSelection.ts` |
| Window / deadline | `src/config/canteen.ts`, `src/services/submissionWindow.ts` |
| Menu / slots | `src/services/menuResolver.ts`, `src/services/mealSlots.ts` |
| ACTIVITY mapping | `src/gamebus/mapStudentLunchCheckin.ts`, `src/gamebus/bridge.ts` |

---

## Related reading

- Study context: [`RAISE_BARLAUREA_MASTER_PLAN.md`](RAISE_BARLAUREA_MASTER_PLAN.md)
- Roadmap: [`../current-state/ROADMAP.md`](../current-state/ROADMAP.md)
- Docs index: [`../README.md`](../README.md)
