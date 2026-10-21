# Historical filename retained. UI wording Tutor / Tutor assessment; activity slug wastePracticeReview.
@chef-review @tutor-feedback @kitchen-day
Feature: Tutor assessment and student readbacks for one-recipe attempts
  As a tutor
  I want one reliable assessment per evidenced module for each student's attempt
  So that confirmed results are not mistaken for unsaved or unrelated work

  Background:
    Given the GameBus Tutor uses kitchenSkillsTrainerInput rather than kitchenGroupInput
    And historical day-scoped multi-recipe sessions are still readable

  Rule: Tutor sees all recorded evidence without mixing attempts

    @release-gate @critical @integration
    Scenario: Two same-day attempts remain separate
      Given a student finished recipe A in a morning attempt
      And finished recipe B in a later attempt on the same date
      When the tutor opens the student's history
      Then two separate attempt rows are shown
      And each row has its own recorded evidence and assessment status

    @release-gate @critical @journey
    Scenario: Multiple Trim and Rescue ingredient records need only one review per module
      Given one attempt has Portion Precision
      And recorded Trim for carrots and potatoes
      And recorded Rescue decisions for carrots and potatoes
      When the tutor opens that attempt
      Then both Trim ingredient records are visible in the Trim module evidence
      And both Rescue decisions are visible in Rescue evidence
      And exactly one Trim assessment form and one Rescue assessment form are required for that recipe
      And no separate tutor score is requested per ingredient

    @critical
    Scenario: Tutor cannot edit student's saved measurement activities
      When the tutor opens an attempt's evidence
      Then the measurement records are read-only
      And the tutor may enter qualitative scores separately

    @critical @history
    Scenario: Historical multi-recipe selection remains available
      Given an old session contains Portion recipe A and recipe B under the same sessionId
      When the tutor opens the old session
      Then the tutor can select recipe A or recipe B
      And each evidenced recipe-module pair retains its own assessment identity
      And legacy evidence without a defensible recipe link is not guessed

  Rule: Only recorded modules are assessed

    @critical
    Scenario: Portion-only attempt needs only one review
      Given an attempt has a saved Portion activity and no Trim or Rescue activity
      When the tutor opens the attempt
      Then Portion requires assessment
      And Trim and Rescue do not require assessment
      And confirming the Portion review makes the attempt Reviewed

    @critical
    Scenario: Portion and Trim without Rescue evidence require two module reviews
      Given the tutor feed contains Portion and Trim activities for an attempt
      And no Rescue activity is present
      When the tutor opens the attempt
      Then Portion and Trim require independent assessments
      And Rescue has no mandatory review slot without evidence

    @critical
    Scenario: Explicit zero-gram Rescue is evidence
      Given a student saved a Rescue decision with 0 grams reusable and explanation "Cannot be reused"
      When the tutor opens the attempt
      Then the Rescue record is shown as evidence
      And the Rescue module needs assessment

  Rule: Review status depends on confirmed GameBus activities

    @release-gate @critical @integration
    Scenario: Dispatch alone is not Reviewed
      Given a tutor entered valid scores for an evidenced module
      When the tutor submits the wastePracticeReview SILENT_ACTIVITY
      Then the module enters Awaiting confirmation
      And it is not Reviewed until the appropriate persisted review appears in the trainer feed
      And no automatic second assessment is posted

    @critical @integration
    Scenario: Confirmed persisted review is Reviewed
      Given the trainer feed contains a persisted review with the correct student, sessionId, recipeId and reviewedGame
      When the tutor reopens the task
      Then that module shows Reviewed
      And its recorded scores and feedback remain visible

    @critical @regression
    Scenario: One module's review does not confirm another
      Given an attempt has evidenced Portion, Trim and Rescue modules
      And only Portion and Trim reviews are confirmed
      When the tutor opens the attempt
      Then Rescue still requires assessment
      And the attempt is not fully Reviewed

    @critical @recovery
    Scenario: A replayed trainer feed does not enable unsafe retry
      Given a tutor dispatched an assessment while viewing a trainer feed
      When the iframe reloads and GameBus replays exactly that feed
      Then an Assess again action does not unlock on receipt time alone
      And the dispatched review remains Awaiting confirmation

    @critical @recovery
    Scenario: An incomplete or delayed feed is not proof of rejection
      Given a tutor has dispatched a review with no GameBus ACK
      When that review is absent from a subsequently received feed
      Then the application does not automatically repost the assessment
      And no status claims the review was definitely rejected
      And the possibility of a delayed or truncated feed remains documented

    @critical
    Scenario: The selected student and recipe determine review identity
      Given two attempts exist for the same student and recipe
      When the tutor submits a review for the first attempt's Trim module
      Then the second attempt's Trim module remains independently assessable
      And the review links to the correct actor, sessionId, recipeId and reviewedGame

  Rule: Scores remain qualitative and separate from system metrics

    Scenario Outline: Scores accept only the integer range zero through five
      When the tutor enters <score> for Time efficiency or Preparation quality
      Then the score is <result>

      Examples:
        | score | result   |
        | 0     | accepted |
        | 1     | accepted |
        | 5     | accepted |
        | 6     | rejected |
        | -1    | rejected |
        | 2.5   | rejected |

    Scenario: Zero is a valid tutor score and not an unanswered input
      Given the tutor has not yet selected Preparation quality
      When the tutor selects 0
      Then the value is a valid scored answer

    Scenario: Feedback text is optional and stored independently of measured facts
      When the tutor submits two valid scores without written feedback
      Then the review is valid
      And the student's measurement activities remain unchanged

    Scenario: JAMIX and Portion-derived metrics do not set tutor scores
      When the tutor examines calculated waste or ingredient-accuracy metrics
      Then the metrics are shown as evidence rather than stored review scores
      And no overall combined score or leaderboard is invented

  Rule: Student Progress never exposes raw peer records

    @critical @privacy
    Scenario: Student Progress displays only authorized own records
      Given the authenticated student's self activity feed is available
      When the student opens Progress
      Then only activities owned by the authenticated actor are shown
      And Tutor group activities and identifiable peer data are not exposed

    Scenario: Student results work before any tutor review exists
      Given a student has saved Portion and Trim activities
      And there is no persisted tutor assessment
      When the student opens Progress
      Then the completed measurements remain visible
      And absent tutor scores are not fabricated

    Scenario: Missing kitchen reference stays visible as unavailable
      Given a historical Trim row cannot be safely matched to its reference
      When Progress calculates the kitchen comparison
      Then the reference shows Reference unavailable
      And the application does not infer it from ingredient names

    @pending
    Scenario: Anonymous peer comparisons wait for a verified privacy-safe aggregate
      Given no approved privacy-safe group aggregate is available
      When the student opens Progress
      Then Not enough peer data yet is displayed
      And no raw group feed is used for this feature
