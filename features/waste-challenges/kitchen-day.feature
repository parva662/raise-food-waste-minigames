# APPROVED PRODUCT TARGET
# Orchestration: docs/product/waste-challenges/KITCHEN_DAY.md
# Slugs: docs/product/waste-challenges/GAMEBUS_SLUG_CONTRACT.md
# CURRENT IMPLEMENTATION on main is Trim Smart v1 only — not this target.
#
@kitchen-day @waste-challenges
Feature: Kitchen Day connected session
  As a student or tutor in a practical kitchen
  I want one kitchen-day session that holds preparation, reuse, and portioning records together
  So that the work is reviewed as one day rather than as separate games

  Background:
    Given a kitchen day session is active for the student
    And the session has a session id and a Europe/Helsinki session date

  Rule: One Kitchen Day session per student

    Scenario: Two students on the same task and date receive different session ids
      Given two authenticated students share one Kitchen Day TASK on the same operational date
      When each student locks an embedded session
      Then their session ids are different

    Scenario: The same student, task, and date stay stable
      Given an authenticated student already locked an embedded Kitchen Day session
      When the TASK or authenticated-user payload refreshes
      Then the locked session id and session date do not change

    Scenario: Participant hydration cannot ingest another actor
      Given group activities include another student's completed records
      When the authenticated student hydrates their Kitchen Day
      Then only records whose actor matches that student are shown

  Rule: One connected day, not three standalone games

    Scenario: Modules share the same session
      When the student records an ingredient preparation entry
      And records a reuse suggestion for that ingredient
      And records a Portion Precision recipe
      Then all three records belong to the same kitchen day
      And they are not treated as separate standalone games

    Scenario: Multiple different ingredients are allowed
      Given the student recorded an ingredient preparation entry for "Carrot"
      When the student records an ingredient preparation entry for "Potato"
      Then both entries belong to the same kitchen day

    Scenario: The same ingredient is not recorded twice
      Given the student recorded an ingredient preparation entry for "Carrot"
      When the student tries to start another ingredient preparation entry for "Carrot"
      Then a second carrot preparation entry is not created in that session

  Rule: Kitchen Day activity is separate from progress and tutor pages

    Scenario: The activity page has practical modules only
      When the student opens Kitchen Day
      Then Trim Smart, Reuse, and Portion Precision are available
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
