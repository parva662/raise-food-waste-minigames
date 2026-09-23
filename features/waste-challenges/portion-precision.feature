# APPROVED PRODUCT TARGET
# Product: docs/product/waste-challenges/PORTION_PRECISION.md
# Slugs: docs/product/waste-challenges/GAMEBUS_SLUG_CONTRACT.md
# Not implemented on main.
#
@portion-precision @waste-challenges @kitchen-day
Feature: Portion Precision recipe measurement
  As a student preparing a recipe during a kitchen day
  I want to record the actual amount used for each recipe ingredient and the final recipe weight
  So that the chef can see measurement mistakes and what I produced

  Background:
    Given a kitchen day session is active for the student
    And required recipe amounts and the expected final weight are read from the current recipe reference keyed by recipe id

  Rule: One activity is one prepared recipe

    Scenario: The activity is identified by the recipe
      When the student selects the component "Mayonnaise"
      Then one portionPrecision activity is created for that recipe
      And every measured ingredient is stored inside recipeComposition of that same activity

    Scenario: Ingredient identity is nested, not top-level
      When the student submits the mayonnaise activity
      Then the activity does not post a top-level ingredient id, name, or category

  Rule: Required amounts come from the recipe dataset

    Scenario: Required quantities are shown as given
      When the student opens the component "Mayonnaise"
      Then each required ingredient is shown with its required quantity and unit
      And the student cannot edit the required quantity

    Scenario: Required amounts are not stored on the activity
      When the comparison is shown
      Then the required amount is read from the recipe dataset
      And the actual amount is read from recipeComposition

  Rule: Actual amounts live in recipeComposition

    Scenario: A complete composition is one property
      Given the mayonnaise recipe requires 1000 grams of yogurt
      When the student records 1000 grams as the actual amount used for yogurt
      And records actual amounts for the remaining mayonnaise ingredients
      Then recipeComposition contains ingredient id, name, actual amount, and unit for yogurt
      And actualAmount is not a separate GameBus property
      And the yogurt line is an exact match against the recipe dataset

    Scenario Outline: Any deviation is a deviation
      Given the recipe requires 100 grams of lemon juice
      When the student records <actual> grams as the actual amount used
      Then the line is evaluated as "<outcome>"
      And no tolerance range is applied

      Examples:
        | actual | outcome       |
        | 100    | exact match   |
        | 120    | over-measure  |
        | 99     | under-measure |

  Rule: Final recipe weight is required

    Scenario: Submission is blocked without a final recipe weight
      Given the student has entered the actual amounts for all mayonnaise ingredients
      When the student has not entered a final recipe weight
      Then the Portion Precision activity cannot be submitted

    Scenario: The final recipe weight is part of the kitchen day
      Given the student has completed all mayonnaise ingredient lines
      When the student enters a final recipe weight of 1850 grams
      And submits the activity
      Then the final recipe weight of 1850 grams is part of the kitchen day record

  Rule: Same kitchen day as preparation

    Scenario: The dashboard shows portioning alongside preparation
      Given the student recorded an ingredient preparation entry for "Lemon"
      And submitted a Portion Precision activity for "Mayonnaise"
      When the student opens the kitchen day overview
      Then both records are visible for the same kitchen day

  Rule: Ingredient deviation is a percentage of the required amount

    Scenario Outline: The line shows how far the actual amount is from the target
      Given the recipe requires 100 grams of lemon juice
      When the student records <actual> grams as the actual amount used
      Then the ingredient deviation is shown as "<copy>"
      And the absolute gram difference remains visible

      Examples:
        | actual | copy        |
        | 100    | Exact       |
        | 110    | 10.0% over  |
        | 75     | 25.0% under |

  Rule: Whole-recipe ingredient accuracy is weighted by target mass

    Scenario: All ingredients match
      Given every ingredient actual matches its target
      Then ingredient accuracy is 100.0%
      And ingredient error is 0.0%

    Scenario: A small ingredient does not dominate the recipe result
      Given a high-mass ingredient is slightly off
      And a tiny ingredient is far off
      Then ingredient error uses the total absolute gram difference divided by the total target mass
      And the tiny ingredient does not receive equal influence

  Rule: Final-weight deviation uses the recipe reference

    Scenario: Expected final weight comes from the recipe reference
      When the comparison is shown
      Then the expected final weight is the recipe reference value
      And it is not inferred from the sum of ingredient targets

    Scenario Outline: Final-weight deviation is shown separately from ingredient accuracy
      Given the recipe reference expected final weight is 1850 grams
      When the student records a final recipe weight of <actual> grams
      Then the final-weight difference is "<difference>"
      And the final-weight deviation is "<deviation>"
      And ingredient accuracy remains a separate figure

      Examples:
        | actual | difference  | deviation |
        | 1850   | Exact       | 0.0%      |
        | 1890   | 40 g over   | 2.2%      |
        | 1810   | 40 g under  | 2.2%      |

  Rule: Metrics are derived, not stored

    Scenario: Derived figures are not part of the posted activity
      When the student submits a Portion Precision activity
      Then the activity stores only the recorded recipe composition and final recipe weight
      And ingredient accuracy is calculated later from those records and the current recipe reference
      And final-weight deviation is calculated later from the recorded final weight and the current recipe reference

  Rule: Tutor judgement is not automatic

    Scenario: System metrics do not set tutor scores
      When a tutor opens the student evidence
      Then ingredient accuracy and final-weight deviation are visible
      And time efficiency and preparation quality are still entered by the tutor
      And no automatic tutor score is created
