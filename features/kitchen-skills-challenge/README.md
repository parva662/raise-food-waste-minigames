# Kitchen Skills Challenge — acceptance baseline for PR #12

**Repository target:** `parva662/raise-food-waste-minigames`, PR #12. These files are the reconciled **canonical acceptance specifications**. They retain non-conflicting established cases (combobox, uniqueness, Session Review, retrieval) alongside the approved PR #12 gates. Gherkin is not executed by CI; Vitest is the executable suite. Keep PR #12 **unmerged** until critical acceptance coverage is verified.

| File | Scope |
|------|-------|
| `kitchen-skills-challenge.feature` | One recipe/attempt, lifecycle, Helsinki cutoff, recovery, cross-module gates |
| `portion-precision.feature` | One Portion, measurements, g/kg, metrics and GameBus payload |
| `trim-smart.feature` | Multiple Trim ingredients, validation, timer and positive-waste handoff |
| `rescue-and-reuse.feature` | **Consecutive ingredient saves**, explicit 0 g cannot-reuse decisions, completion |
| `chef-review.feature` | One tutor review per evidenced module, same-day attempt isolation, confirmation, privacy |

## Accepted product rules for this baseline

1. **One** saved Portion recipe per attempt; open another attempt to record another Portion recipe.
2. No Trim is necessary to finish Portion-only work. If Trim is recorded with **positive actual waste**, the student must record **one explicit Rescue decision per affected ingredient** before Finish. A valid decision may say **0 g reusable / cannot be reused**, with explanation in the existing `reuseDestination` field. A Trim entry with **0 g actual waste** requires no Rescue decision.
3. Multiple Trim and Rescue records remain allowed for different ingredients in the same recipe. One Rescue save never closes the form or implicitly completes another ingredient.
4. Tutor reviews remain **per evidenced module**, not per Trim/Rescue ingredient; old multi-recipe records stay readable.
5. `SILENT_ACTIVITY` for module saves; `EXIT` only on Finish. `postMessage` success never establishes GameBus persistence. Existing slugs and schema remain unchanged.
6. **All fresh mass inputs default to kg.** The student may select g instead and enter a number. The unit toggle is a selector, **not a quantity converter**: changing units leaves the typed number unchanged and interprets it in the selected unit for canonical-gram calculation. No automatic 1500 g → 1.5 kg or reverse transformation. Applies to Portion, Trim, and Rescue; volume units retain their own existing behaviour.

## Acceptance process

- Gherkin is **not executed automatically** by the current project: `npm run check` executes Vitest, lint, typecheck and build, not `.feature` files.
- `@release-gate` scenarios are the **highest-priority end-to-end regression paths**. Each requires a real executable test and named proof before PR #12 may merge. Existing passing tests can count if they exercise the complete path.
- Other `@critical` scenarios need an executable unit/integration test mapping where relevant, but do not generate redundant new tests or retest already proven domain rules in the browser.
- Prefer actual React interaction tests for navigation, saved-state and two-ingredient journeys; add domain tests for arithmetic, attempt identity and validation; verify GameBus outbound mappings and inbound hydration. Distinguish synthetic fixture evidence from actual live GameBus persistence.
- Verify selected critical journeys in a browser (320 / 390 / 768 / 1200 px as relevant). Do not claim that screenshot appearance alone proves functionality.
- Do **not** add Cucumber merely to claim Gherkin coverage. A test runner can be considered later; first close the actual acceptance-to-test gaps.
- Do not change unrelated games or live GameBus admin configuration.

**Application rule:** These files are an updated canonical acceptance *proposal*, **not** instructions to blindly delete other valid acceptance scenarios already in PR #12. When adopting them, reconcile and retain any non-conflicting established cases (including detailed JAMIX, form validity, and privacy checks) instead of reducing existing coverage.

**Important — decision precedence:** The older stakeholder change register (item 09 and item 11) and some PR #12 documentation/tests describe Rescue as optional after positive-waste Trim. Those were provisional and are superseded: **optional to start Trim; mandatory Rescue decision for every saved Trim item with positive actual waste**. `0 g reusable` plus an explanation is a valid decision. The new unit-selector decision likewise supersedes PR #12's `g` default: **kg by default, g selectable, no automatic numeric conversion on toggle**. Keep the pre-existing per-module GameBus schema unchanged.
