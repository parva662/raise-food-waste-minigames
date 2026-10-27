# PR #12 — authoritative decisions for acceptance alignment

Baseline: PR #12 `feat/kitchen-skills-single-recipe`. These six decisions are the accepted product rules for this PR.

## Approved decisions (supersede earlier provisional language)

1. **One Portion recipe per attempt**. A new attempt on the same Helsinki day must have a different `sessionId`. Legacy multi-recipe sessions remain readable.
2. **Trim is optional until a Trim activity has been saved.** After any saved Trim entry with **positive actual waste**, the student must submit exactly one **Rescue decision for that ingredient** before finishing. A decision of **0 g reusable** with an explanation in existing `reuseDestination` is valid. A saved Trim entry with 0 g actual waste requires no Rescue decision.
3. **Sequential Rescue:** saving Rescue A must leave Rescue B selectable if B has positive Trim waste and no saved Rescue; saved A remains read-only and is not resent. Finish is unavailable if positive-waste Trim ingredients have no Rescue decisions; this rule applies after another positive-waste Trim is added. No invented empty records. The Tutor still assesses each evidenced **module** once, not each ingredient.
4. **Mass fields (superseded by Staff Challenge bug fixes KS-TRIM-001):** fresh mass inputs default to **g**; the student can select **kg**. Switching the unit **converts the displayed number** so the physical quantity is unchanged; canonical grams remain the storage unit. Summary formatting remains: exactly 1000 g in g; >1000 g displayed in kg. Volume dL/L unchanged. Trim starting weight prefills from Portion actual mass when available (KS-TRIM-002).
5. Unsaved drafts require confirmation on abandonment. Only Finish sends `EXIT`, module saves use `SILENT_ACTIVITY`, and `postMessage` does not prove GameBus persistence. Do not lose the sole recoverable record of an unconfirmed dispatch without an explicitly reviewed safe policy.
6. Gherkin is a specification, **not an executable test** in this repository. Each `@release-gate` scenario must map to a real passing Vitest interaction/integration test and be exercised in an actual browser where the journey depends on navigation; distinguish simulated GameBus data from live persistence evidence.

## Implementation handoff

- Reconcile, do not blindly overwrite the repository's existing `.feature` files and valid scenarios.
- Update existing PR #12 only; retain approved visuals; do not start a new PR, merge, or deploy.
- Update the code, tests, documentation, and `docs/testing/KITCHEN_SKILLS_CHALLENGE_ACCEPTANCE_COVERAGE.md` to agree with these decisions. The ZIP checklist is a targeted gap list, **not proof that the gaps have been closed**.
- The stakeholder feedback change register v2 was an **earlier discussion-stage record**. Its optional-Reuse wording in item 11 is superseded by decision 2 above.
