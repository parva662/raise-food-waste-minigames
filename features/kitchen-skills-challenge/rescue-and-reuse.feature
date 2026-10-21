# Acceptance target for PR #12; activity slug rescueAndReuse, existing property reuseDestination.
# A 0 g reusable amount is an explicit valid decision (not missing data).
@rescue-and-reuse @kitchen-day
Feature: Per-ingredient Rescue & Reuse decisions
  As a student who has measured preparation waste
  I want to record how much can or cannot be reused for each waste-producing ingredient
  So that every Trim outcome is accounted for before I finish

  Background:
    Given the student has saved one Portion Precision recipe in the active attempt
    And any Rescue record must refer to a saved Trim ingredient of that recipe

  Rule: Rescue is applicable only to recorded positive-waste Trim entries

    @critical
    Scenario: No Trim waste means no Rescue is required
      Given there is no saved Trim ingredient with actual waste greater than 0 grams
      When the student opens Rescue & Reuse
      Then no independent Rescue inventory is offered
      And no Rescue activity is created

    @critical
    Scenario: Rescue uses the correct ingredient-specific waste
      Given carrots were trimmed with 1000 grams of actual waste
      And potatoes were trimmed with 800 grams of actual waste
      When the student selects potatoes for Rescue & Reuse
      Then 800 grams is the available actual waste
      And the student cannot record more than 800 grams as reusable

  Rule: Every saved positive-waste Trim ingredient needs exactly one Rescue decision

    @release-gate @critical @regression @journey
    Scenario: Save two Rescue decisions consecutively in the same attempt
      Given carrots and potatoes both have saved Trim entries with positive actual waste
      When the student selects carrots
      And records 300 grams reusable with the explanation "Use in soup"
      And saves the carrots Rescue decision
      Then the carrots decision is saved once
      And the Rescue screen remains usable
      And potatoes remain selectable as not yet addressed
      And the completion summary is not forced open
      When the student selects potatoes
      And records 0 grams reusable with the explanation "Cannot be reused; discard"
      And saves the potatoes Rescue decision
      Then two distinct rescueAndReuse activities are dispatched for the correct ingredientIds
      And the carrots decision remains unchanged
      And both entries appear in the challenge summary and Tutor evidence
      And Finish challenge is available

    @release-gate @critical @regression
    Scenario: A first saved Rescue decision does not complete every ingredient
      Given carrots and potatoes both have saved positive-waste Trim entries
      When the student saves the carrots Rescue decision
      Then potatoes are still pending
      And Finish challenge cannot bypass the potatoes Rescue decision
      And no empty potatoes Rescue activity is created

    @release-gate @critical @regression
    Scenario: An explicit cannot-reuse decision is accepted
      Given carrots have 500 grams of recorded actual Trim waste
      When the student enters 0 grams reusable
      And explains "Cannot be reused; discard"
      And saves the decision
      Then 0 grams is recorded as reusableWasteGrams
      And discarded is calculated as 500 grams
      And the decision is treated as completed evidence
      And the explanation is stored in reuseDestination

    @release-gate @critical @regression
    Scenario: Saved ingredient decisions are not submitted twice
      Given the carrots Rescue decision was already saved in the active attempt
      When the student returns to Rescue & Reuse
      Then carrots show as already recorded and are not offered for another save
      And any unrecorded positive-waste ingredient remains available

    @release-gate @critical @regression
    Scenario: Reload between the first and second Rescue preserves the first
      Given carrots and potatoes have positive-waste Trim entries
      And the student dispatched a Rescue decision for carrots
      When the student reloads the same unfinished attempt
      Then carrots remain shown as already dispatched or confirmed
      And no duplicate carrots SILENT_ACTIVITY is sent
      And potatoes can receive a new Rescue decision

    @release-gate @critical @regression
    Scenario: Recording another Trim after all current Rescue decisions creates new pending work
      Given carrots have a saved Rescue decision
      And carrots were the only ingredient with recorded positive Trim waste
      When the student saves a positive-waste Trim entry for potatoes
      Then potatoes become available as not yet addressed in Rescue & Reuse
      And the existing carrots Rescue record remains intact

    @critical @regression
    Scenario: Rescue without matching Trim cannot be submitted
      Given there is no saved Trim entry for ingredient "Onion" in this attempt
      When the student attempts to submit a Rescue decision for "Onion"
      Then no rescueAndReuse activity is posted

  Rule: The reusable-mass selector starts on kilograms

    @release-gate @critical @units
    Scenario: Student can enter reusable waste in grams instead of default kilograms
      Given the student opens a new Rescue & Reuse reusable-mass field
      Then kg is selected by default
      When the student selects g and enters 300
      Then the reusable mass is interpreted as 300 grams
      And a save records reusableWasteGrams as 300
      And changing the unit selection does not auto-convert the typed number

  Rule: Validation, units, and recorded facts

    @critical
    Scenario Outline: Reusable grams must be within the recorded actual waste
      Given an ingredient has 1000 grams actual Trim waste
      When the student enters <grams> grams reusable
      Then the reusable amount is <result>

      Examples:
        | grams | result   |
        | 0     | accepted |
        | 500   | accepted |
        | 1000  | accepted |
        | 1001  | rejected |
        | -1    | rejected |

    @critical
    Scenario: Reuse destination or cannot-reuse explanation is required
      Given an ingredient has 1000 grams actual waste
      When the student enters 0 grams reusable but leaves the text field blank
      Then Save reuse is unavailable
      When the student enters "Cannot be reused"
      Then Save reuse is available

    Scenario: One mass field supports grams and kilograms
      Given an ingredient has 2000 grams of actual Trim waste
      When the student selects kilograms and records 1.25 as reusable
      Then reusableWasteGrams is 1250 in the posted activity
      And no new kg GameBus property is created

    Scenario: Discarded amount is derived, not persisted
      Given an ingredient has 1000 grams of actual waste
      When the student records 400 grams reusable
      Then the screen shows 600 grams discarded
      And discardedWasteGrams is not posted as a GameBus property

    Scenario: Reuse keeps the existing text-property contract
      When the student enters "Wash the peel, dry it, then use it in cake."
      Then the full text is stored in reuseDestination
      And no reuseMethod property is created
      And the detailed readback shows the full text without invented destination parsing

    Scenario: Identity is session plus recipe plus ingredient
      Given an ingredient with the same ingredientId occurs in two distinct attempts
      When a Rescue decision is recorded in the second attempt
      Then it is linked by sessionId, recipeId, and ingredientId for the second attempt
      And the historical first attempt remains unchanged

  Rule: Tutor assessment is per evidenced module, not per ingredient

    @critical
    Scenario: Multiple Rescue decisions require only one module assessment
      Given two Rescue records were saved under the active attempt's one recipe
      When the tutor opens the Rescue & Reuse evidence
      Then both ingredient decisions are shown
      And the tutor has one Rescue & Reuse assessment form for that recipe and attempt
