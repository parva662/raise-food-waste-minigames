# Acceptance target for PR #12; preserve legacy #/kitchen-day* routes and existing GameBus slugs.
# One attempt has one Portion recipe; existing historical multi-recipe sessions remain readable.
@kitchen-skills-challenge @kitchen-day
Feature: One-recipe Kitchen Skills Challenge
  As a student in the practical kitchen
  I want one recorded recipe and its optional ingredient preparation in a distinct challenge attempt
  So that my own work and my tutor's assessment can be attributed correctly

  Background:
    Given a student is authenticated in GameBus
    And the Kitchen Skills Challenge TASK and INPUT_COLLECTIONS are available
    And the operational timezone is Europe/Helsinki

  Rule: Each attempt has exactly one recipe and a stable identity

    @critical @regression
    Scenario: Portion is required before any other recorded module
      Given the student has not saved Portion Precision
      When the student attempts to enter Trim Smart, Rescue & Reuse, or Session Review
      Then those modules cannot record a new activity
      And the student is directed to Portion Precision

    @release-gate @critical @regression
    Scenario: A second Portion recipe cannot be submitted in one attempt
      Given the student saved Portion Precision for recipe A
      When the student returns to Portion Precision
      Then recipe A is read-only
      And there is no Start another recipe action
      And a second portionPrecision activity cannot be posted for the attempt

    @critical @integration
    Scenario: All recorded modules use one attempt identity
      Given the student saved Portion Precision for recipe A
      When the student saves Trim Smart for an ingredient of recipe A
      And the student saves Rescue & Reuse for that ingredient
      Then the three activities use the same sessionId and sessionDate
      And Trim and Rescue contain recipeId for recipe A
      And no module save posts EXIT

    @release-gate @critical @integration
    Scenario: Finishing and reopening on the same date creates a separate attempt
      Given the student finished a challenge containing recipe A
      When the same student opens the same TASK again on the same Helsinki date
      And records recipe B
      Then a new sessionId is used
      And the new activity does not merge with the previous attempt
      And the previous attempt remains separately visible in Progress and Tutor Feedback

    @critical @integration
    Scenario: Same recipe in two attempts does not collapse into one
      Given the student finished a challenge containing recipe A
      When the student opens a new attempt and saves recipe A again
      Then the new portionPrecision activity has a different sessionId
      And the two attempts are distinguishable by the Tutor

    @release-gate @critical @recovery
    Scenario: An unfinished attempt resumes after a reload
      Given the student dispatched Portion Precision for recipe A but did not finish
      When the student reloads the same GameBus task
      Then the original sessionId and sessionDate are restored
      And recipe A is not posted again automatically
      And an absent record in a stale GameBus feed is not treated as proof of failed persistence

    @critical @recovery
    Scenario: A replayed TASK or INPUT_COLLECTIONS does not create another attempt
      Given the student is working in an unfinished attempt
      When GameBus sends TASK or INPUT_COLLECTIONS again
      Then the locked sessionId does not change
      And no previously dispatched entry is automatically posted again

    @release-gate @critical @time
    Scenario Outline: The active attempt does not change identity at the Helsinki midnight cutoff
      Given an unfinished attempt was created at 23:59:59 Europe/Helsinki
      When the same page is still open at <moment> Europe/Helsinki
      Then the attempt keeps its original sessionId and sessionDate
      And no module is automatically reposted

      Examples:
        | moment   |
        | 23:59:59 |
        | 00:00:00 |
        | 00:00:01 |

    @critical @time @recovery
    Scenario: Reload just after midnight resumes a dispatched unfinished attempt
      Given the student dispatched work before 00:00 Europe/Helsinki
      And did not finish the attempt
      When the student reloads the challenge at 00:00:01 Europe/Helsinki
      Then the original attempt and operational session date remain in use
      And the submitted work is not duplicated

    @critical @time @recovery
    Scenario: An empty previous-day attempt can be replaced after midnight
      Given an unfinished challenge has no dispatched work
      When the student opens the task on the next Helsinki operational date
      Then a new attempt may start with the new sessionDate
      And no activity is falsely attributed to the abandoned empty attempt

    @critical @privacy
    Scenario: One student's view does not hydrate another student's activities
      Given INPUT_COLLECTIONS includes activities belonging to another student
      When the student opens their own Progress
      Then other students' raw activities and Tutor feedback are not disclosed

  Rule: Unit selection is explicit throughout the challenge

    @release-gate @critical @units
    Scenario: All fresh mass fields default to kg and allow g entry without automatic conversion
      Given the student opens the Portion Precision mass inputs
      Then the mass inputs start with kg selected
      When the student switches to Trim Smart and then Rescue & Reuse
      Then each new mass input also defaults to kg
      And the student can select g and enter an amount in grams
      And switching the selected unit never silently converts the typed number
      And persisted mass properties continue using canonical grams
      And volume fields preserve their existing reference units

  Rule: Trim is optional before it is started; Rescue records a decision for each positive-waste Trim entry

    @release-gate @critical @journey
    Scenario: Portion only is a valid complete attempt
      Given the student saved Portion Precision
      And no Trim Smart entry was recorded
      When the student opens Review and finish
      Then only Portion Precision appears as recorded evidence
      And Finish challenge is available
      And no empty Trim or Rescue activity is fabricated

    @critical @journey
    Scenario: No eligible Trim ingredients is not a dead end
      Given the saved recipe has no ingredients with positive Hävikki reference
      When the student reviews the attempt
      Then the absence of Trim is explained
      And the challenge can be finished without Trim or Rescue

    @critical @journey
    Scenario: Trim with no actual waste needs no Rescue activity
      Given the student saved Portion Precision
      And the student saved a Trim ingredient with 0 grams actual waste
      When the student opens Review and finish
      Then Trim evidence is present
      And Rescue is not required for that ingredient
      And no Rescue activity is invented

    @release-gate @critical @journey
    Scenario: Every trimmed ingredient with positive waste needs a Rescue decision
      Given the student saved Portion Precision
      And saved positive-waste Trim entries for carrots and potatoes
      When the student records a Rescue decision for carrots only
      Then potatoes remain to be addressed
      And the student cannot finish the attempt as complete
      And a clear link to the remaining Rescue decision is available
      When the student records a 0-gram Rescue decision for potatoes with the explanation "Cannot be reused"
      Then Review and finish can complete with both ingredients accounted for

    @critical @journey
    Scenario: Adding another Trim ingredient after a Rescue decision reopens pending Rescue work
      Given the student completed Rescue decisions for all recorded positive-waste Trim ingredients
      When the student records another positive-waste Trim ingredient
      Then the new ingredient appears as requiring a Rescue decision
      And existing Rescue entries remain saved and are not submitted again

    @release-gate @critical @journey
    Scenario: Unsaved draft must not disappear without confirmation
      Given the student has entered an unsaved Trim or Rescue measurement
      When the student attempts to navigate away or Finish
      Then the student is warned that the measurement is unsaved
      And cancelling the warning preserves the draft

  Rule: Finishing closes the attempt without claiming unverified GameBus persistence

    @critical @integration
    Scenario: Only Finish challenge sends EXIT
      Given the student saved the required Portion and any applicable Rescue decisions
      When the student opens the challenge summary
      Then no EXIT has been posted
      When the student chooses Finish challenge
      Then exactly one EXIT is posted for that interaction
      And a subsequent task open creates a new attempt

    @release-gate @critical @persistence
    Scenario: Dispatched activities absent from a stale feed remain unconfirmed
      Given a student module save was dispatched by SILENT_ACTIVITY
      And the returned self-feed does not contain that activity
      When the student opens the challenge summary
      Then the save is not described as confirmed persistence
      And the application does not silently repost the activity
      And the user is warned if the save remains unconfirmed

    @release-gate @critical @history
    Scenario: Historical multi-recipe sessions remain readable
      Given a historical session contains multiple Portion recipes under its old day-scoped sessionId
      When a Tutor opens that historical session
      Then its recipe-specific evidence and assessments remain readable
      And the new one-recipe restriction does not rewrite or relabel historical records

  Rule: Preserved established UI, uniqueness, and retrieval cases

    Scenario: The same ingredient id is allowed in a later attempt with a different recipe
      Given the student finished a challenge that recorded Trim for an ingredient under recipe A
      When the student opens a new challenge attempt
      And records Portion Precision for recipe B that shares that ingredient id
      And the student records an ingredient preparation entry for that ingredient under recipe B
      Then the two Trim entries belong to different session ids
      And each Trim entry keeps its own recipeId

    Scenario: A started Trim ingredient must be finished before going forward
      Given the student has started an ingredient preparation entry
      When the ingredient has not been saved
      Then Add another ingredient is not shown
      And leaving the unfinished measurement requires confirmation

    Scenario: From Reuse the student can return to Trim
      Given the student has opened Reuse for a saved Trim ingredient
      When the reuse suggestion has not been saved
      Then leaving the unfinished reuse entry requires confirmation
      And the student can open Trim Smart to add another ingredient

    Scenario: From the challenge summary the student can keep working
      Given the student saved Portion Precision and any required Rescue decisions
      When the student chooses Keep working
      Then the summary closes
      And the student can open Trim Smart to add another ingredient

    Scenario: The activity page has practical modules only
      When the student opens Kitchen Day
      Then Portion Precision, Trim Smart, and Reuse are available
      And Progress and tutor dashboards are not part of that navigation

    Scenario: Session review is the current Kitchen Day only
      When the student opens session review
      Then only the current session records are shown
      And the session identity is not shown as an internal id

    Scenario: Session Review does not change recorded facts
      Given the student has completed kitchen-day records
      When the student opens Session Review
      Then the records are shown
      And the student cannot edit submitted measurements there

    Scenario: Kitchen day records are loaded with existing group activities
      When a student or tutor opens a kitchen-day evidence surface
      Then the records are retrieved through the existing group activities mechanism
      And no new retrieval endpoint is required
