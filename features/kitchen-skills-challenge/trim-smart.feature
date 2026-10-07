# APPROVED PRODUCT TARGET
# Product: docs/product/kitchen-skills-challenge/TRIM_SMART.md
# Slugs: docs/product/kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md
# CURRENT IMPLEMENTATION: Kitchen Skills Trim at #/kitchen-day/trim uses remaining ingredients from the saved Portion recipe.
# Public hash #/kitchen-day remains the Kitchen Day landing (Portion Precision).
#
@trim-smart @waste-challenges @kitchen-day
Feature: Ingredient preparation in a kitchen day
  As a student working in the practical kitchen
  I want to estimate waste before preparation and measure actual waste after
  So that I can see how I compare to kitchen reference data

  Background:
    Given a kitchen day session is active for the student
    And the student has recorded a Portion Precision recipe for this session
    And the ingredient preparation module is part of that session

  Rule: One entry is one ingredient preparation task

    Scenario: Trim starts with the ingredient, not a category
      When the student opens ingredient preparation
      Then the first step is choosing a recipe ingredient
      And no ingredient category is shown or required
      And free-text ingredient names are not used

    Scenario: A valid ingredient setup can continue
      When the student selects a recipe ingredient
      And enters a starting weight of 5000 grams
      Then the ingredient setup is valid
      And the student can continue to technique selection

    Scenario Outline: Invalid starting weight is blocked
      Given the student has entered a valid name
      When the student enters <weight> as the starting weight
      Then the student cannot continue
      And a starting-weight validation message is shown

      Examples:
        | weight |
        | blank  |
        | 0      |
        | -1     |

    Scenario: A technique is required
      Given the student has a valid ingredient setup
      When no technique has been selected
      Then the student cannot continue to the estimate step

    Scenario: A technique can be recorded
      Given the student has a valid ingredient setup
      When the student selects a preparation technique
      Then that technique is recorded for the entry

  Rule: Estimate before timed preparation

    Scenario: A valid estimate is accepted
      Given the starting weight is 5000 grams
      When the student enters an estimated waste of 600 grams
      Then the estimate is accepted
      And the student can start timed preparation

    Scenario: Zero estimated waste is allowed
      Given the starting weight is 5000 grams
      When the student enters an estimated waste of 0 grams
      Then the estimate is accepted

    Scenario Outline: Invalid estimates are blocked
      Given the starting weight is 5000 grams
      When the student enters an estimated waste of <estimate>
      Then the estimate is rejected

      Examples:
        | estimate |
        | blank    |
        | -1       |
        | 5001     |

    Scenario: Duration comes from timed preparation
      Given the student has entered a valid estimated waste
      When the student starts preparation
      And later finishes preparation
      Then a preparation duration is recorded
      And the student is not asked to type the duration in minutes

  Rule: Actual waste after preparation

    Scenario: Actual waste is recorded without showing a waste percentage
      Given the starting weight is 5000 grams
      And the student has finished preparation
      When the student enters an actual waste of 450 grams
      Then the actual waste is accepted
      And the calculated waste percentage is 9 percent internally
      And the waste percentage is not stored as a recorded fact
      And the student is not shown a waste percentage or kitchen Hävikki reference

    Scenario: Zero actual waste is allowed
      Given the starting weight is 5000 grams
      When the student enters an actual waste of 0 grams
      Then the actual waste is accepted

    Scenario Outline: Invalid actual waste is blocked
      Given the starting weight is 5000 grams
      When the student enters an actual waste of <actual>
      Then the actual waste is rejected

      Examples:
        | actual |
        | blank  |
        | -1     |
        | 5001   |

  Rule: System comparison is not student-facing

    Scenario: Recipe-ingredient Hävikki is internal chef/progress data
      Given the recipe ingredient has a kitchen Hävikki reference of 0 percent or more
      When the student finishes measuring actual waste
      Then the student is not shown the kitchen reference or a comparison
      And that reference stays attached to the specific recipe ingredient
      And the comparison is not stored on the entry
      And the comparison is not a tutor assessment

    Scenario: Later comparison uses accumulated Trim Smart data when available
      Given accumulated kitchen-day Trim Smart data exists for a recipe ingredient
      When chef feedback or progress is calculated
      Then the system can compare actual trim against that recipe ingredient's Hävikki reference
      And the comparison is calculated on read and never stored

    Scenario: Missing history still keeps a 0 percent recipe Hävikki
      Given the recipe ingredient Hävikki reference is 0 percent
      When chef feedback is calculated
      Then 0 percent is treated as a valid reference, not as missing

    @pending
    Scenario: Percentile messaging waits for an agreed sufficient-data rule
      Given no agreed sufficient-data rule for percentile messaging is in force
      When the comparison is shown
      Then the system shows the reference or average comparison
      And the system does not show percentile or ranking messaging

  Rule: Session uniqueness

    Scenario: A second different ingredient is allowed
      Given the student has recorded an ingredient preparation entry for one recipe ingredient
      When the student records an ingredient preparation entry for another unused recipe ingredient
      Then both entries belong to the same kitchen day
      And each entry keeps its own measurements

    Scenario: The same ingredient is not recorded twice
      Given the student has recorded an ingredient preparation entry for one recipe ingredient
      When the student tries to record another ingredient preparation entry for that same ingredient
      Then a second preparation entry is not created in that session
      And that ingredient is not offered in the recipe ingredient list

    Scenario: Add more ingredients stays on Trim
      Given the student has finished measuring actual waste for one recipe ingredient
      And the student has saved that ingredient
      When the student chooses Another ingredient
      Then Trim stays open for another unused recipe ingredient

    Scenario: The student can go back before saving
      Given the student is on the starting weight step
      When the student chooses Back
      Then the ingredient choice is still selected
      And the student can correct it before saving
