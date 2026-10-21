# Acceptance target for PR #12; keep the existing ten techniques and reference-data semantics.
@trim-smart @kitchen-day
Feature: Prepare multiple ingredients from the one saved recipe
  As a student
  I want to measure preparation time and waste for eligible recipe ingredients
  So that my Trim results can be reviewed without losing individual ingredients

  Background:
    Given the student saved one Portion Precision recipe in the current attempt
    And only ingredients of that recipe are eligible for this Trim module

  Rule: Trim is optional until an ingredient is recorded

    @critical
    Scenario: A recipe with no eligible ingredients can finish
      Given every ingredient of the recipe has zero percent reference Hävikki
      When the student opens the challenge
      Then Trim is not required
      And Rescue is not required
      And no empty Trim or Rescue activity is created

    @critical
    Scenario: No Trim chosen means Portion-only completion
      Given the student has saved Portion Precision
      And has not started a Trim ingredient
      When the student opens Review and finish
      Then no Trim activity is invented
      And Finish challenge is available

  Rule: Select eligible and unused ingredients only

    @critical
    Scenario: Ingredient picker excludes recorded, unrelated and zero-reference ingredients
      Given the selected recipe contains both eligible and ineligible ingredients
      When the student opens the Trim ingredient picker
      Then only unused ingredients of that recipe with positive reference Hävikki are offered
      And no ingredient category field is required
      And no ingredient from a different recipe is offered

    @release-gate @critical @regression
    Scenario: Save two different Trim ingredients in one attempt
      Given carrots and potatoes are eligible for Trim
      When the student records and saves carrots
      And chooses Another ingredient
      And records and saves potatoes
      Then two distinct trimSmart activities are dispatched
      And both carry the same sessionId and recipeId
      And each carries its own ingredientId, waste quantities and duration
      And both appear in the challenge summary and Tutor evidence

    @critical @regression
    Scenario: The same ingredient cannot be saved twice in one attempt
      Given carrots were already saved in Trim Smart
      When the student attempts to record carrots again
      Then no second trimSmart activity is dispatched for carrots

  Rule: Preparation measurements and timer are validated

    @critical
    Scenario Outline: Starting weight must be positive
      When the student enters <weight> grams as starting weight
      Then the starting-weight field is <result>

      Examples:
        | weight | result   |
        | 0      | rejected |
        | -1     | rejected |
        | 5000   | accepted |

    Scenario Outline: Estimate and actual waste must not exceed starting mass
      Given starting weight is 5000 grams
      When the student enters <waste> grams of estimated or actual waste
      Then that waste value is <result>

      Examples:
        | waste | result   |
        | 0     | accepted |
        | 5000  | accepted |
        | 5001  | rejected |
        | -1    | rejected |

    @release-gate @critical
    Scenario: Preparation duration is collected by the timer
      Given the student has selected a valid technique and estimated waste
      When the student starts and stops timed preparation
      And records actual waste
      And saves the ingredient
      Then the recorded duration is associated with that ingredient
      And the student did not type a duration manually
      And that duration appears alongside the ingredient's waste in the challenge summary

    @critical
    Scenario: Mass input supports kilograms but posts canonical grams
      Given the student selected kilograms
      When the student records 5 kg starting mass and 0.45 kg actual waste
      Then the trimSmart entry stores 5000 grams starting mass and 450 grams actual waste
      And the preparation technique uses an existing allowed enum value

    Scenario: A student may return to an earlier unsaved step
      Given the student has entered a starting weight but not saved the ingredient
      When the student chooses Back
      Then the ingredient selection is preserved
      And earlier entered values remain correctable

  Rule: Mass input units are explicit and default to kilograms

    @release-gate @critical @units
    Scenario: Trim fresh mass fields start in kilograms
      Given the student opens a new Trim Smart measurement
      Then starting weight, estimated waste, and actual waste mass fields default to kg
      When the student selects g for a mass field and enters 450
      Then the entered value is interpreted as 450 grams
      And the saved canonical amount is 450 grams
      And switching units does not automatically convert any typed number

  Rule: Positive recorded waste is followed by an explicit Rescue decision

    @critical @journey
    Scenario: Zero Trim waste does not need Rescue
      Given a Trim ingredient was saved with zero grams actual waste
      Then Rescue is not required for that ingredient

    @critical @journey
    Scenario: Positive Trim waste requires an eventual Rescue decision
      Given a Trim ingredient was saved with positive actual waste
      When the student tries to finish without a Rescue decision for that ingredient
      Then Finish cannot be completed
      And the student can record 0 grams reusable with an explanation if nothing can be rescued

  Rule: Reference comparisons are derived, not student-facing or stored

    Scenario: JAMIX comparison is only on authorized results surfaces
      Given a recipe ingredient has a Hävikki reference
      When the student saves a Trim ingredient
      Then the student Trim screen does not show the waste percentage or reference delta
      And neither the percentage nor the reference difference is posted as an activity property
      When the tutor or student Progress reads the saved Trim entry
      Then actual waste percentage and reference delta may be derived for that recipe ingredient

    Scenario: A zero percent Hävikki reference is valid reference data
      Given a historical recipe ingredient has a zero percent Hävikki reference
      When an authorized results surface calculates a comparison
      Then zero percent is not treated as a missing reference
      And a missing ingredient-to-recipe join is never guessed

    @pending
    Scenario: Percentile comparison remains disabled
      Given no sufficient-data percentile rule is approved
      When results are shown
      Then no percentile or competitive ranking is displayed
