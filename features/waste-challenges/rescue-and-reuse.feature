# APPROVED PRODUCT TARGET
# Product: docs/product/waste-challenges/RESCUE_AND_REUSE.md
# Slugs: docs/product/waste-challenges/GAMEBUS_SLUG_CONTRACT.md
# Not implemented on main.
#
@rescue-and-reuse @waste-challenges @kitchen-day
Feature: Reuse suggestions connected to ingredient preparation
  As a student who generated preparation waste
  I want to record how much of that waste can still be used and where I suggest using it
  So that reuse intentions stay connected to measured waste

  Background:
    Given a kitchen day session is active for the student
    And the student has an ingredient preparation entry for "Carrot"
    And that entry recorded an actual waste of 1000 grams

  Rule: Reuse depends on a Trim Smart entry

    Scenario: The reusable amount is taken from that ingredient's actual waste
      When the student opens reuse for "Carrot"
      Then the actual waste shown is 1000 grams
      And the student is asked how much of that waste can be reused

    Scenario: Reuse cannot start without a preparation entry
      Given there is no ingredient preparation entry with actual waste
      When the student tries to start a reuse suggestion
      Then no independent reuse inventory is offered
      And the student is guided to record an ingredient preparation entry first

  Rule: Join is session plus ingredient

    Scenario: The reuse record joins the Trim entry by session and ingredient
      When the student saves a reuse suggestion for "Carrot"
      Then the reuse record stores the session id and the ingredient id
      And the reuse record stores the reusable amount and the destination
      And the reuse record does not store a second copy of the ingredient name, category, or starting weight

  Rule: Reusable amount and free-text destination

    Scenario: A complete reuse suggestion
      When the student enters a reusable amount of 500 grams
      And enters the reuse destination "Carrot soup tomorrow"
      Then the reuse suggestion can be saved
      And the discarded waste shown is 500 grams
      And the discarded waste is calculated from the actual waste minus the reusable amount
      And the discarded waste is never stored as a recorded fact

    Scenario: The destination is free text
      When the student enters the reuse destination "Use in today's vegetable stock"
      Then the destination is accepted as free text

    Scenario Outline: An incomplete reuse suggestion cannot be saved
      Given the student has filled every reuse field except "<missing field>"
      Then the reuse suggestion cannot be saved

      Examples:
        | missing field     |
        | reusable amount   |
        | reuse destination |

    Scenario Outline: The reusable amount must fit within the actual waste
      When the student enters a reusable amount of <amount> grams
      Then the reusable amount is <result>

      Examples:
        | amount | result   |
        | 0      | accepted |
        | 500    | accepted |
        | 1000   | accepted |
        | 1001   | rejected |

  Rule: Only the suggestion is recorded

    Scenario: No reuse status or later confirmation
      When the student saves a reuse suggestion
      Then the student is not asked for a reuse status
      And nobody is asked later whether the reuse actually happened
      And no reuse chef score is awarded

  Rule: Each ingredient may have its own suggestion

    Scenario: A second ingredient gets its own suggestion
      Given the student also recorded "Potato" with an actual waste of 800 grams
      When the student saves a reuse suggestion for "Potato"
      Then that suggestion is joined to "Potato" by session id and ingredient id
      And the "Carrot" reuse suggestion is unchanged
