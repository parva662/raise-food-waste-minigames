# Critical Kitchen Skills acceptance-to-test mapping (PR #12)

Gherkin is specification only. Each `@release-gate` scenario maps to a passing Vitest interaction or integration test. Browser checks use the local Kitchen Skills harness; they are not live GameBus persistence evidence.

| Critical journey | Source specification | Executable test | Result |
|---|---|---|---|
| One Portion per attempt | `kitchen-skills-challenge.feature` / `portion-precision.feature` | `kitchenSkills.flow.test.tsx` `A/B: blocks a second Portion recipe in the same attempt`; `kitchenSkills.attempt.identity.test.tsx` `F: reload before Finish recovers the same attempt without posting Portion again` | PASS |
| Same student, two attempts, one date | `kitchen-skills-challenge.feature` | `kitchenSkills.attempt.identity.test.tsx` `D/V: two same-day attempts use different sessionIds and do not duplicate Portion`; `trainerSessions.test.ts` `keeps two sessions on the same date distinct by sessionId` | PASS |
| Same recipe in two separate attempts | `kitchen-skills-challenge.feature` | `kitchenSkills.attempt.identity.test.tsx` `D/V` (Hedelmät recorded twice with different sessionIds) | PASS |
| Midnight before / at / after cutoff; open and reload | `kitchen-skills-challenge.feature` | `identity.test.ts` Helsinki `23:59:59` / `00:00:00` / `00:00:01`; `attempt.test.ts` `keeps a dispatched unfinished attempt at Helsinki %s without reposting`; empty stale replacement remains in `attempt.test.ts` | PASS (page-left-open is the in-memory lock; no clock remint while mounted) |
| Portion only → Finish without empty modules | `kitchen-skills-challenge.feature` | `kitchenSkills.flow.test.tsx` `G: Finish is available after Portion only` | PASS |
| Two Trim ingredients in same attempt | `trim-smart.feature` | `kitchenSkills.flow.test.tsx` `J: records multiple Trim ingredients and requires a Rescue decision for each` | PASS |
| Rescue A save → Rescue B save | `rescue-and-reuse.feature` | `kitchenSkills.flow.test.tsx` `J`; `kitchenSkills.attempt.identity.test.tsx` `posts two distinct Rescue activities consecutively and does not lock the second ingredient` | PASS |
| 0 g reusable, text says cannot reuse | `rescue-and-reuse.feature` | `kitchenSkills.flow.test.tsx` `H: Finish is blocked after positive-waste Trim until Rescue is recorded` | PASS |
| After Trim A+B, Rescue A only cannot Finish | `kitchen-skills-challenge.feature` / `rescue-and-reuse.feature` | `challengeGate.test.ts` `lets Finish proceed after every positive-waste Trim has a Rescue decision`; flow `J` | PASS |
| New Trim B after Rescue A reopens pending decisions | `rescue-and-reuse.feature` | `kitchenSkills.flow.test.tsx` `reopens pending Rescue after another positive-waste Trim is saved` | PASS |
| Reload between Rescue A and B | `rescue-and-reuse.feature` | `kitchenSkills.attempt.identity.test.tsx` `reload between Rescue A and B keeps A and never reposts it` | PASS |
| 0 g actual Trim waste requires no Rescue | `trim-smart.feature` | `challengeGate.test.ts` `does not open Reuse when saved Trim has no reusable waste`; flow `does not offer Reuse when saved Trim has no reusable waste` | PASS |
| kg default, g selectable, same typed number on toggle | `portion-precision.feature` / `trim-smart.feature` / `rescue-and-reuse.feature` | `KitchenSkillsMassInput.test.tsx`; `kitchenSkills.flow.test.tsx` `K/N` | PASS |
| Trim duration appears per ingredient in summary | `trim-smart.feature` | `domain/attemptSummary.test.ts`; flow records timer then asserts summary | PASS |
| Tutor evidence contains two Rescue entries but one review | `chef-review.feature` | `trainerSessions.test.ts` `shows two Rescue ingredient records under one Rescue assessment slot` | PASS |
| Tutor status is feed-confirmed, not postMessage-confirmed | `chef-review.feature` | `kitchenSkills.trainerStatus.test.tsx`; `read/trainerAssessmentStatus.test.ts` | PASS |
| Historical multi-recipe and unattributed rows | `kitchen-skills-challenge.feature` / `chef-review.feature` | existing trainer / read-model tests | PASS |
| Finish with unconfirmed GameBus save | `kitchen-skills-challenge.feature` | `kitchenSkills.attempt.identity.test.tsx` `F` (unconfirmed warning); `attempt.test.ts` `archives dispatched Finish evidence without auto-reposting it on the next open` | PASS (archive is local-only, never auto-posted) |
| Cross-tab active attempt and Finish behavior | `kitchen-skills-challenge.feature` | `attempt.test.ts` `treats another window Finish as a closed attempt` | PASS (localStorage guard; not a live two-tab GameBus race) |
| Student Progress actor privacy | `chef-review.feature` | Progress / read-model actor fail-closed tests | PASS |

## Evidence notes

- **Behavior exercised:** React Testing Library user journeys, GameBus `postMessage` spies in embed fixtures, local attempt storage, and trainer read-model grouping.
- **Browser verified:** local Kitchen Skills harness at 320 / 390 / 768 / 1200 where layout or navigation changed. Not live foodtracker persistence.
- **Limitations:** no Cucumber runner; no live GameBus ACK; archive-on-finish is a local recovery record, not proof GameBus stored the activity.
