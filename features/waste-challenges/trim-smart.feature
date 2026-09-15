# DOCUMENTATION STATUS: WORKING / PROPOSED (target acceptance scenarios)
# Not aligned with deployed Trim Smart v1 on main (practice enum, participantWasteGrams, etc.).
# Current v1: docs/current-state/IMPLEMENTATION_STATUS.md and src/trimSmart/
# Proposed behavior here is not automatically approved or implemented.
#
@trim-smart
Feature: Trim Smart ingredient preparation and review
  As a participant in a practical kitchen session
  I want to record each ingredient I prepare and the measurable preparation result
  So that the chef can evaluate my technique
  And reusable material can continue to Rescue & Reuse

  Background:
    Given a Trim Smart kitchen session is active for the participant
    And the session uses the Europe/Helsinki operational date

  Rule: The participant records one ingredient at a time

    Scenario: Start a valid ingredient preparation
      Given the participant is ready to prepare an ingredient
      When the participant selects ingredient category "Vegetables"
      And enters ingredient name "Carrot"
      And enters starting weight 10000 grams
      Then the ingredient setup is valid
      And the participant can continue to technique selection

    Scenario Outline: Invalid starting weight blocks continuation
      Given the participant has selected a valid ingredient category
      And entered a valid ingredient name
      When the participant enters <weight> as the starting weight
      Then the participant cannot continue
      And a clear starting-weight validation message is shown

      Examples:
        | weight |
        | blank  |
        | 0      |
        | -1     |

  Rule: The participant selects the preparation technique used in the kitchen

    Scenario Outline: Select a supported preparation technique
      Given the participant has a valid ingredient setup
      When the participant selects "<technique>" as the preparation technique
      Then "<technique>" is recorded for the current ingredient
      And the participant can continue to measurement

      Examples:
        | technique            |
        | Dicing               |
        | Slicing              |
        | Chopping             |
        | Peeling              |
        | Trimming             |
        | Julienne             |
        | Filleting            |
        | Portioning / cutting |
        | Other                |

    Scenario: Technique selection is required
      Given the participant has a valid ingredient setup
      When no preparation technique has been selected
      Then the participant cannot continue to measurement

    Scenario: Different ingredients can use different techniques
      Given the participant records Carrot using "Dicing"
      And later starts Potato in the same session
      When the participant selects "Peeling" for Potato
      Then the Carrot result keeps "Dicing"
      And the Potato result uses "Peeling"

  Rule: The participant records objective preparation measurements

    Scenario: Record removed and reusable material
      Given the participant started with 10000 grams of Carrot
      And selected "Dicing" as the technique
      And the physical preparation is complete
      When the participant records 800 grams as total material removed
      And records 250 grams as reusable material
      Then the ingredient result records 800 grams as total material removed
      And records 250 grams as reusable material
      And calculates 550 grams as non-reusable material
      And calculates 8 percent as the removed percentage
      And the 8 percent measurement is not automatically treated as the chef score

    Scenario: Zero removed material is a valid measurement
      Given the participant started with a valid positive ingredient weight
      And selected a valid preparation technique
      When the participant records 0 grams as total material removed
      And records 0 grams as reusable material
      Then the measurement is accepted
      And non-reusable material is 0 grams
      And the removed percentage is 0 percent

    Scenario: No removed material is reusable
      Given the participant records 300 grams as total material removed
      When the participant records 0 grams as reusable material
      Then reusable material is 0 grams
      And non-reusable material is 300 grams
      And this ingredient contributes no reusable quantity to Rescue & Reuse

    Scenario Outline: Invalid removed-material measurement is rejected
      Given the participant started with 1000 grams of an ingredient
      When the participant enters <removed> grams as total material removed
      Then the measurement is rejected
      And a clear validation message is shown

      Examples:
        | removed |
        | blank   |
        | -1      |
        | 1001    |

    Scenario Outline: Invalid reusable-material measurement is rejected
      Given the participant records 300 grams as total material removed
      When the participant enters <reusable> grams as reusable material
      Then the reusable-material value is rejected
      And a clear validation message is shown

      Examples:
        | reusable |
        | -1       |
        | 301      |

    Scenario: All removed material can be marked reusable
      Given the participant records 300 grams as total material removed
      When the participant records 300 grams as reusable material
      Then reusable material is 300 grams
      And non-reusable material is 0 grams

  Rule: The participant can correct the current ingredient before submission

    Scenario: Correct current ingredient information before submission
      Given the participant has entered technique and measurements for the current ingredient
      And the ingredient has not yet been submitted
      When the participant goes back and corrects the ingredient information
      Then the corrected information is used for that ingredient
      And no duplicate ingredient result is created

    Scenario: Correct technique before submission
      Given the participant selected "Dicing" for the current ingredient
      And the ingredient has not yet been submitted
      When the participant changes the technique to "Slicing"
      Then "Slicing" is used for the submitted ingredient
      And "Dicing" is not submitted for that ingredient

  Rule: Each completed ingredient creates one recorded ingredient result

    Scenario: Submit one completed ingredient
      Given the participant has valid ingredient information
      And a valid preparation technique
      And valid removed-material and reusable-material measurements
      When the participant submits the ingredient result
      Then exactly one completed ingredient result is recorded
      And the participant sees that the ingredient was recorded
      And the participant can add another ingredient or finish the session

    Scenario: Repeated submission does not duplicate an ingredient result
      Given an ingredient result was successfully submitted
      When the same submit action is triggered again without starting a new ingredient
      Then a second completed ingredient result is not created

    Scenario: Failed submission can be retried without duplication
      Given the participant has a valid ingredient result ready to submit
      And the first submission attempt fails before the result is accepted
      When the participant retries the submission
      Then the participant can complete the submission
      And only one successful ingredient result exists

  Rule: One Trim Smart session can contain multiple ingredients

    Scenario: Add another ingredient after recording the first
      Given the participant has recorded a Carrot ingredient result
      When the participant chooses "Add another ingredient"
      Then the current ingredient fields are cleared
      And the completed Carrot result remains in the session
      And the Trim Smart session identity remains unchanged

    Scenario: Record multiple ingredients with different techniques
      Given the participant has recorded:
        | ingredient | technique | starting grams | removed grams | reusable grams |
        | Carrot     | Dicing    | 10000          | 800           | 250            |
        | Onion      | Slicing   | 6000           | 420           | 100            |
      When the participant records Potato using "Peeling"
      And a starting weight of 15000 grams
      And 2100 grams removed
      And 300 grams reusable
      Then the same session contains three ingredient results
      And each ingredient keeps its own technique and measurements

    Scenario: Active session keeps its locked operational date across midnight
      Given the participant started the first ingredient before midnight in Europe/Helsinki
      And the active Trim Smart session has a locked operational date
      When the clock passes midnight before the participant finishes the session
      And the participant records another ingredient
      Then the new ingredient remains in the same active Trim Smart session
      And the session keeps the original locked operational date

  Rule: Submitted ingredients survive page reload

    Scenario: Reload reconstructs already-submitted ingredients
      Given the participant has successfully submitted Carrot and Onion in the active Trim Smart session
      When the participant reloads the Trim Smart page
      Then the app retrieves the participant's submitted Trim Smart activities for the active session from the GameBus API
      And Carrot and Onion are restored to the completed-ingredient list
      And the participant is not asked to submit those ingredients again

    Scenario: Unsaved current ingredient may be lost on reload
      Given the participant has successfully submitted Carrot
      And has started entering Potato but has not submitted it
      When the participant reloads the page
      Then the submitted Carrot result is restored
      And the unsaved Potato draft is not required to be restored
      And no duplicate activity is created

  Rule: The participant can finish the Trim Smart session

    Scenario: Finish session after at least one ingredient
      Given the participant has recorded at least one ingredient result
      When the participant chooses "Finish session"
      Then the Trim Smart session is shown as complete
      And all completed ingredients from the session are shown in the session summary
      And finishing the session does not create an additional ingredient result

    Scenario: Empty session cannot be finished
      Given the participant has not recorded any ingredient result
      Then the session cannot be completed as a finished Trim Smart session

  Rule: Reusable material becomes input for Rescue & Reuse

    Scenario: Rescue & Reuse retrieves reusable material from Trim Smart
      Given the participant completed a Carrot Trim Smart result
      And the result contains 250 grams of reusable Carrot material
      When Rescue & Reuse retrieves the participant's relevant Trim Smart activities through the GameBus API
      Then 250 grams of Carrot is available as Rescue & Reuse input
      And Trim Smart does not require a reuse destination

    Scenario: Only the reusable portion is exposed to Rescue & Reuse
      Given an ingredient has 800 grams of total material removed
      And 250 grams is identified as reusable
      And 550 grams is non-reusable
      When Rescue & Reuse retrieves the Trim Smart result
      Then 250 grams is exposed as the available reusable quantity
      And 800 grams is not exposed as the reusable quantity

  Rule: Chef review is organised by participant and session

    Scenario: Chef sees all ingredients for one participant on one review page
      Given a participant completed a Trim Smart session containing Carrot, Onion and Potato
      When the chef opens that participant's Trim Smart session review
      Then all three ingredient results are visible on the same review page
      And the chef does not need to open a separate page for each ingredient

    Scenario: Chef sees the evidence needed for each ingredient
      Given the chef is reviewing a participant's Trim Smart session
      When an ingredient result is shown
      Then the chef can see the ingredient name
      And the ingredient category
      And the selected preparation technique
      And the starting weight
      And the total material removed
      And the reusable material
      And the non-reusable material
      And the removed percentage

    Scenario: Chef scores each ingredient separately
      Given the participant prepared multiple ingredients in one session
      When the chef assigns a score from 0 to 5 to each ingredient
      Then each ingredient keeps its own chef score
      And a score of 0 is stored as a valid score
      And an unscored ingredient remains distinguishable from an ingredient scored 0
      And one ingredient's score does not overwrite another ingredient's score

    Scenario: Chef adds optional feedback per ingredient
      Given the chef is reviewing an ingredient result
      When the chef enters written feedback
      Then the feedback is stored with that ingredient evaluation
      And the chef can leave the feedback field empty if no comment is needed

    Scenario: Chef reviews and submits several ingredient evaluations from one page
      Given the participant has Carrot, Onion and Potato in the session
      And the chef can see all three on the same review page
      When the chef scores Carrot
      And scores Onion
      And scores Potato
      And optionally enters feedback for any ingredient
      Then the chef can submit the session review from the same page
      And each ingredient retains its own score and feedback

    Scenario: Objective removed percentage does not automatically determine chef score
      Given one ingredient has a lower removed percentage than another
      When the chef reviews the preparation results
      Then the system does not automatically give the lower-percentage ingredient a higher score
      And the chef can judge preparation quality separately from the measured result

# TECHNICAL DEPENDENCY STILL OPEN:
# - Cross-user GameBus retrieval for chef review depends on Raoul's implementation.
#   This does not change the behavioural requirement above.
