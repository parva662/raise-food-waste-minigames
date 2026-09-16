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
| **Current implementation vs approved target** | [`../current-state/IMPLEMENTATION_STATUS.md`](../current-state/IMPLEMENTATION_STATUS.md) | **CURRENT IMPLEMENTATION** |
| **Engineering rules** | [`../../PROJECT_RULES.md`](../../PROJECT_RULES.md) | Process |
| **Charter** | [`../../PROJECT_CHARTER.md`](../../PROJECT_CHARTER.md) | Scope |
| **Legacy mixed spec** | [`../archive/SPEC_LEGACY.md`](../archive/SPEC_LEGACY.md) | **HISTORICAL** — do not treat as product truth over the `.feature` |

Do **not** rewrite the approved `.feature` merely to match current code.

---

## Confirmed product highlights (see Gherkin for full rules)

- Target = **next operational service** (skip weekends and explicitly closed / non-service days), not calendar tomorrow.
- Menus are planned well in advance; **do not** redefine the service date by skipping a day only because menu data is missing.
- Cutoff = **23:59:00 Europe/Helsinki** (open at 23:58:59; closed at exactly 23:59:00); open page must close without reload.
- Meal packages **Regular / Soup / No lunch** are mutually exclusive; quantity steppers use whole numbers **0…configured max**; no blank-vs-zero UX.
- Distinct **review** before final confirm; one-shot submission with failure/retry preserving entered values.

---

## Relevant source (current implementation)

| Area | Location |
|------|----------|
| Route | Default / empty hash → student mode (`src/routing/appMode.ts`, `App.tsx`) |
| Selection / submit | `src/hooks/useLunchSelection.ts` |
| Service date | `src/services/studentLunchServiceDate.ts` |
| Window / deadline | `src/config/canteen.ts`, `src/services/submissionWindow.ts` |
| Menu / slots | `src/services/menuResolver.ts`, `src/services/mealSlots.ts` |
| ACTIVITY mapping | `src/gamebus/mapStudentLunchCheckin.ts`, `src/gamebus/bridge.ts` |

---

## Related reading

- Study context: [`RAISE_BARLAUREA_MASTER_PLAN.md`](RAISE_BARLAUREA_MASTER_PLAN.md)
- Roadmap: [`../current-state/ROADMAP.md`](../current-state/ROADMAP.md)
- Docs index: [`../README.md`](../README.md)
