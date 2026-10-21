# APPROVED PRODUCT TARGET
# Orchestration: docs/product/kitchen-skills-challenge/KITCHEN_SKILLS_CHALLENGE.md
# Slugs: docs/product/kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md
# CURRENT IMPLEMENTATION on main includes this product at #/kitchen-day.
# Public hashes stay #/kitchen-day* for GameBus Custom Embed compatibility.
#
@kitchen-day @kitchen-skills-challenge @waste-challenges
Feature: Kitchen Skills Challenge connected session
  As a student or tutor in a practical kitchen
  I want one kitchen-day session that holds preparation, reuse, and portioning records together
  So that the work is reviewed as one day rather than as separate games

  Background:
    Given a kitchen day session is active for the student
    And the session has a session id and a Europe/Helsinki session date

  Rule: One unique attempt identity per challenge open

    Scenario: Two students on the same task and date receive different session ids
      Given two authenticated students share one Kitchen Day TASK on the same operational date
      When each student locks an embedded session
      Then their session ids are different

    Scenario: The same student, task, and date stay stable during one attempt
      Given an authenticated student already locked an embedded Kitchen Day attempt
      When the TASK or authenticated-user payload refreshes
      Then the locked session id and session date do not change

    Scenario: Two challenge opens on the same day are separate attempts
      Given an authenticated student finished a Kitchen Day challenge
      When the student opens the same TASK later on the same operational date
      Then a new session id is used
      And the new activities do not merge with the finished attempt

    Scenario: Participant hydration cannot ingest another actor
      Given group activities include another student's completed records
      When the authenticated student hydrates their Kitchen Day
      Then only records whose actor matches that student are shown

  Rule: One connected day, not three standalone games

    Scenario: Modules share the same session
      When the student records a Portion Precision recipe
      And records an ingredient preparation entry from that recipe
      And records a reuse suggestion for that ingredient
      Then all three records belong to the same kitchen day
      And they are not treated as separate standalone games

    Scenario: Multiple different ingredients are allowed
      Given the student recorded an ingredient preparation entry for a recipe ingredient
      When the student records an ingredient preparation entry for another unused recipe ingredient
      Then both entries belong to the same kitchen day

    Scenario: The same ingredient is not recorded twice under the same recipe
      Given the student recorded an ingredient preparation entry for a recipe ingredient
      When the student tries to start another ingredient preparation entry for that same ingredient under the same recipe
      Then a second preparation entry is not created for that recipe

    Scenario: The same ingredient id is allowed in a later attempt with a different recipe
      Given the student finished a challenge that recorded Trim for an ingredient under recipe A
      When the student opens a new challenge attempt
      And records Portion Precision for recipe B that shares that ingredient id
      And the student records an ingredient preparation entry for that ingredient under recipe B
      Then the two Trim entries belong to different session ids
      And each Trim entry keeps its own recipeId

  Rule: Recipe first, then Trim from that recipe, then Reuse

    Scenario: Kitchen Day opens on Portion Precision
      When the student opens Kitchen Day
      Then Portion Precision is shown first
      And the recipe is chosen with the searchable recipe combobox
      And opening the combobox shows the ordered recipes immediately
      And typing filters that list
      And every recipe ingredient actual and the final recipe weight are recorded before Save

    Scenario: Forward navigation waits for prerequisites
      Given the student has started Portion Precision and has not saved the recipe
      When the student tries to open Trim Smart, Reuse, or Session Review
      Then the student stays on Portion Precision

    Scenario: The student can go back inside an unfinished task
      Given the student is on a later Trim Smart step and has not saved the ingredient
      When the student chooses Back
      Then earlier Trim choices and values are still there to correct

    Scenario: Backward navigation to completed sections is allowed
      Given the student recorded a Portion Precision recipe
      When the student is on Trim Smart
      Then Portion Precision stays available
      And Reuse stays locked until a Trim ingredient with reusable waste is saved

    Scenario: After the recipe is saved, Trim uses that recipe's ingredients
      Given the student recorded a Portion Precision recipe
      Then Trim Smart is shown
      And the selected recipe name stays visible
      And opening the ingredient combobox shows that recipe's unused ingredients with Hävikki greater than 0
      And ingredients with 0 percent Hävikki are not listed
      And ingredients from other recipes are not listed
      And typing filters that list
      And already recorded recipe ingredients are not offered again
      And Record reuse is not shown until a Trim ingredient with reusable waste is saved

    Scenario: A second Portion recipe cannot be added to the same attempt
      Given the student recorded a Portion Precision recipe
      When the student returns to Portion Precision
      Then Start another recipe is not shown
      And a second recipe cannot be saved in this attempt
      And Finish challenge is available

    Scenario: A new attempt after Finish can record a different recipe
      Given the student recorded a Portion Precision recipe
      When the student chooses Finish challenge
      And the student opens the challenge again
      Then a new session id is used
      And the student can record a different Portion Precision recipe

    Scenario: Finish is available after Portion Precision without Trim or Rescue
      Given the student recorded a Portion Precision recipe
      Then Finish challenge is available
      And no Trim or Reuse activity is required

    Scenario: A recipe with no Trim Smart ingredients can still complete
      Given the student recorded a Portion Precision recipe whose ingredients all have 0 percent Hävikki
      And that recipe is the only saved recipe in the session
      Then Trim Smart shows that there are no Trim Smart ingredients for this recipe
      And Record reuse is not shown
      And no Trim or Reuse activity is created
      When the student chooses Finish challenge
      Then Finish challenge is available

    Scenario: A started Trim ingredient must be finished before going forward
      Given the student has started an ingredient preparation entry
      When the ingredient has not been saved
      Then Add another ingredient is not shown
      And the student cannot open Reuse or Session Review
      And leaving the unfinished measurement requires confirmation

    Scenario: After a Trim ingredient is saved the student chooses the next step
      Given the student saved an ingredient preparation entry with reusable waste
      Then the student can record another unused recipe ingredient
      And the student can continue to Reuse
      When the student chooses Record reuse
      Then Reuse is shown

    Scenario: Saved Trim with no reusable waste does not open Reuse
      Given the student saved an ingredient preparation entry with 0 grams actual waste
      Then Record reuse is not shown
      And Reuse stays locked

    Scenario: Record reuse still works after every eligible recipe ingredient is recorded
      Given the student saved a preparation entry for every eligible unused recipe ingredient
      When the student returns to Trim Smart
      Then the all-recorded empty state is shown
      When the student chooses Record reuse
      Then Reuse is shown

    Scenario: From Reuse the student can return to Trim
      Given the student has opened Reuse for a saved Trim ingredient
      When the reuse suggestion has not been saved
      Then leaving the unfinished reuse entry requires confirmation
      And the student can open Trim Smart to add another ingredient

    Scenario: From the challenge summary the student can keep working
      Given the student saved Portion Precision, at least one Trim ingredient, and Reuse
      Then the challenge complete summary is shown
      And Finish challenge is available
      When the student chooses Keep working
      Then the summary closes
      And the student can open Trim Smart to add another ingredient
      And unsaved Trim work must be confirmed before it is abandoned

    Scenario: Finish challenge ends the attempt
      Given the student saved Portion Precision
      And there is no unfinished Trim or Reuse draft, or the student confirmed leaving it
      Then the challenge complete summary is shown
      And Finish challenge is available
      And the student is not shown a waste percentage or kitchen Hävikki reference
      And Start another recipe is not shown
      When the student chooses Finish challenge
      Then the kitchen day closes
      And the next open is a new attempt

  Rule: Kitchen Day activity is separate from progress and tutor pages

    Scenario: The activity page has practical modules only
      When the student opens Kitchen Day
      Then Portion Precision, Trim Smart, and Reuse are available
      And Progress and tutor dashboards are not part of that navigation

    Scenario: Session review is the current Kitchen Day only
      When the student opens session review
      Then only the current session records are shown
      And the session identity is not shown as an internal id

  Rule: Dashboards are read-only

    Scenario: Session Review does not change recorded facts
      Given the student has completed kitchen-day records
      When the student opens Session Review
      Then the records are shown
      And the student cannot edit submitted measurements there

    Scenario: The Tutor dashboard does not change recorded facts
      Given the student has completed kitchen-day records
      When the tutor opens that student's kitchen day
      Then the records are shown as evidence
      And the tutor cannot edit the student's measurements

  Rule: Retrieval uses the existing group activities path

    Scenario: Kitchen day records are loaded with existing group activities
      When a student or tutor opens a kitchen-day evidence surface
      Then the records are retrieved through the existing group activities mechanism
      And no new retrieval endpoint is required
