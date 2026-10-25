# Acceptance target for PR #12; preserve existing GameBus portionPrecision property contract.
@portion-precision @kitchen-day
Feature: Record exactly one recipe in Portion Precision per attempt
  As a student
  I want to capture a recipe's actual ingredient quantities and final weight once
  So that performance can be calculated and linked to optional Trim and Rescue work

  Background:
    Given a Kitchen Skills attempt is open
    And recipe targets and expected final weight come from the recipe reference

  Rule: Save one recipe with all measured lines

    @release-gate @critical @journey
    Scenario: Save the only Portion recipe for an attempt
      When the student selects a recipe from the searchable recipe selector
      And enters every ingredient's actual amount
      And enters the final prepared recipe weight
      And saves Portion Precision
      Then exactly one portionPrecision activity is dispatched
      And recipeComposition holds every actual ingredient line
      And the entry is linked to the current sessionId and recipeId
      And the student may continue to Trim or Review and finish
      And no EXIT is posted during Save

    @critical @regression
    Scenario: A second Portion record is blocked until a new attempt starts
      Given the student saved recipe A in this attempt
      When the student returns to Portion Precision
      Then recipe A is read-only
      And the student cannot submit recipe B under the same sessionId
      And Start another recipe is not shown

    @critical @regression
    Scenario: Empty final weight blocks submission
      Given actual amounts were entered for all recipe ingredients
      When the student leaves final recipe weight blank
      Then the Portion activity cannot be submitted

    @critical
    Scenario: Source targets are immutable and are not submitted as measurements
      When the student opens a recipe
      Then each ingredient target and its original unit are visible and read-only
      And required target amounts are retrieved from the recipe reference
      And only actual amounts are stored in recipeComposition
      And no top-level ingredientId, ingredientName, ingredientCategory, or actualAmount property is posted

  Rule: Mass may be entered in grams or kilograms without changing canonical storage

    @critical
    Scenario Outline: Kilogram input maps to grams
      When the student records <entered> kg as a mass amount
      Then the canonical value is <grams> g
      And no kilogram GameBus property is posted

      Examples:
        | entered | grams   |
        | 1.25    | 1250    |
        | 2       | 2000    |
        | 1.0005  | 1000.5  |

    @release-gate @critical @units
    Scenario: Kilograms are selected by default for a fresh mass input
      Given the student opens a new Portion Precision mass field
      Then the unit selected by default is kg
      When the student enters 1.25
      Then the field shows 1.25 kg
      And the canonical value is 1250 grams

    @release-gate @critical @units
    Scenario: Student can select grams and type a grams amount
      Given the student opens a new Portion Precision mass field with kg selected
      When the student selects g
      And enters 500
      Then the field shows 500 g
      And the canonical value is 500 grams

    @critical @units
    Scenario: Changing a unit selection does not automatically convert the typed number
      Given the student has entered 1.25 while kg is selected
      When the student selects g
      Then the field still displays 1.25
      And the selected unit is g
      And the canonical value is 1.25 grams
      When the student selects kg again
      Then the field still displays 1.25
      And the canonical value is 1250 grams
      And no quantity-preserving conversion is performed

    @critical
    Scenario: Volume units stay unchanged
      Given a recipe line has a volume-based unit
      When the student records its actual quantity
      Then the volume unit is preserved in recipeComposition
      And the application does not infer mass from volume without density data

    Scenario Outline: Mass summary formatting is accurate
      Given a persisted mass of <grams> grams
      When the student or tutor views the summary
      Then it is displayed as "<label>"

      Examples:
        | grams | label    |
        | 999   | 999 g    |
        | 1000  | 1000 g   |
        | 1001  | 1.001 kg |
        | 1250  | 1.25 kg  |
        | 2000  | 2 kg     |

  Rule: Calculations are derived and separate from tutor judgement

    Scenario Outline: An actual that differs from its target has no tolerance band
      Given a recipe ingredient requires 100 grams
      When the student records <actual> grams
      Then the result is "<result>"

      Examples:
        | actual | result        |
        | 100    | exact match   |
        | 120    | over-measure  |
        | 99     | under-measure |

    Scenario: Ingredient accuracy is weighted by target mass
      Given a high-mass ingredient is slightly different from its target
      And a tiny ingredient differs by a large percentage
      When recipe ingredient accuracy is calculated
      Then total absolute gram difference is divided by total target grams
      And each ingredient does not receive equal weight

    Scenario: Final weight deviation uses the recipe reference
      Given the recipe expected final weight is 1850 grams
      When the student records 1890 grams final weight
      Then the final-weight difference is 40 grams over
      And the final-weight deviation is displayed separately from ingredient accuracy
      And neither figure is posted as a GameBus activity property

    Scenario: Tutor scores are not automatically derived
      When the tutor opens a submitted Portion Precision activity
      Then the derived measurement metrics are visible as evidence
      And Time efficiency and Preparation quality remain for the tutor to enter
