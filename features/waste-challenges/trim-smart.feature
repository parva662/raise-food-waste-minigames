# APPROVED PRODUCT TARGET
# Product: docs/product/waste-challenges/TRIM_SMART.md
# Slugs: docs/product/waste-challenges/GAMEBUS_SLUG_CONTRACT.md
# CURRENT IMPLEMENTATION on main still uses practice / participantWasteGrams — not this target.
#
@trim-smart @waste-challenges @kitchen-day
Feature: Ingredient preparation in a kitchen day
  As a student working in the practical kitchen
  I want to estimate waste before preparation and measure actual waste after
  So that I can see how I compare to kitchen reference data

  Background:
    Given a kitchen day session is active for the student
    And the ingredient preparation module is part of that session

  Rule: One entry is one ingredient preparation task

    Scenario: A valid ingredient setup can continue
      When the student selects ingredient category "Root vegetables"
      And enters ingredient name "Carrot"
      And enters a starting weight of 5000 grams
      Then the ingredient setup is valid
      And the recorded category value is "root"
      And the student can continue to technique selection

    Scenario Outline: Locked categories are offered with friendly labels
      When the student opens the ingredient category list
      Then "<label>" is available
      And it is recorded as "<value>"

      Examples:
        | label             | value |
        | Root vegetables   | root  |
        | Leafy vegetables  | leafy |
        | Fruit vegetables  | fruit |
        | Stem vegetables   | stem  |
        | Herbs             | herbs |
        | Other             | other |

    Scenario Outline: Invalid starting weight is blocked
      Given the student has selected a valid category and name
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

    Scenario: Actual waste and calculated percentage
      Given the starting weight is 5000 grams
      And the student has finished preparation
      When the student enters an actual waste of 450 grams
      Then the actual waste is accepted
      And the calculated waste percentage is 9 percent
      And the waste percentage is not stored as a recorded fact

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

  Rule: System comparison is not a chef score

    Scenario: Initial comparison uses chef-seeded reference data
      Given chef-seeded reference waste for ingredient "carrot" is 12 percent
      And the student recorded a calculated waste of 9 percent
      When the comparison is shown
      Then the system indicates the student performed better than the kitchen reference
      And the comparison is keyed by ingredient id
      And the comparison is not stored on the entry
      And the comparison is not a chef score

    Scenario: Later comparison uses accumulated Trim Smart data when available
      Given accumulated kitchen-day Trim Smart data exists for ingredient "carrot"
      When the comparison is shown
      Then the system compares the student against that historical data
      And the comparison is calculated on read and never stored

    Scenario: Missing history falls back to seeded reference data
      Given accumulated kitchen-day Trim Smart data is unavailable for ingredient "carrot"
      When the comparison is shown
      Then the system uses the chef-seeded reference data for that ingredient

    @pending
    Scenario: Percentile messaging waits for an agreed sufficient-data rule
      Given no agreed sufficient-data rule for percentile messaging is in force
      When the comparison is shown
      Then the system shows the reference or average comparison
      And the system does not show percentile or ranking messaging

  Rule: Session uniqueness

    Scenario: A second different ingredient is allowed
      Given the student has recorded an ingredient preparation entry for "Carrot"
      When the student records an ingredient preparation entry for "Onion"
      Then both entries belong to the same kitchen day
      And each entry keeps its own measurements

    Scenario: The same ingredient is not recorded twice
      Given the student has recorded an ingredient preparation entry for "Carrot"
      When the student tries to record another ingredient preparation entry for "Carrot"
      Then a second carrot preparation entry is not created in that session
