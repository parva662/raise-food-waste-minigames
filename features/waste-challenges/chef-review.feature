# APPROVED PRODUCT TARGET
# Product: docs/product/waste-challenges/CHEF_REVIEW.md
# Slugs: docs/product/waste-challenges/GAMEBUS_SLUG_CONTRACT.md
# Filename is historical. Product wording is Tutor / Tutor assessment.
# GameBus activity slug remains wastePracticeReview.
# Not implemented on main.
#
@chef-review @waste-challenges @kitchen-day
Feature: Session Review, Student Progress, and tutor assessment
  As a student or tutor
  I want one current-session review, one historical Progress page, and one qualitative tutor assessment
  So that system performance stays separate from tutor judgement

  Background:
    Given a student completed a kitchen day containing carrot preparation with a reuse suggestion, onion preparation, and a Portion Precision record
    And the tutor reviews that kitchen day at the end of the student's session

  Rule: One evidence surface per student kitchen day

    Scenario: Completed records are visible together
      When the tutor opens the student's kitchen day
      Then the carrot entry, the onion entry, the carrot reuse suggestion, and the recipe entry are listed together

    Scenario: Session Review shows the same current day
      When the student opens Session Review
      Then all of that student's completed records for the current kitchen day are listed
      And the overview is read-only

    Scenario: Evidence stays read-only for the tutor
      When the tutor opens the student's kitchen day
      Then ingredient preparation, reuse, and Portion Precision records are shown as evidence
      And the tutor cannot edit the student's measurements

    Scenario: Unfinished work is not completed evidence
      Given the student has an unfinished ingredient preparation entry
      When the tutor opens the student's kitchen day
      Then the unfinished entry is not treated as completed evidence

  Rule: One session-level tutor assessment

    Scenario Outline: Time efficiency accepts 0 to 5
      When the tutor gives the kitchen day a time efficiency score of <score>
      Then the time efficiency score is accepted

      Examples:
        | score |
        | 0     |
        | 1     |
        | 2     |
        | 3     |
        | 4     |
        | 5     |

    Scenario Outline: Preparation quality accepts 0 to 5
      When the tutor gives the kitchen day a preparation quality score of <score>
      Then the preparation quality score is accepted

      Examples:
        | score |
        | 0     |
        | 1     |
        | 2     |
        | 3     |
        | 4     |
        | 5     |

    Scenario: Score zero is distinct from not yet scored
      When the tutor has not scored preparation quality
      Then preparation quality is shown as not yet scored
      When the tutor sets preparation quality to 0
      Then preparation quality is scored as 0

    Scenario: Tutor feedback is optional
      When the tutor submits the two scores without feedback
      Then the end-of-session review is accepted

    Scenario: One review covers the whole kitchen day
      When the tutor submits the review
      Then one review is recorded for the student's session
      And the review is not one judgement per ingredient or per module
      And Trim Smart, reuse, and Portion Precision do not receive separate tutor scores

  Rule: System performance is not tutor scoring

    Scenario: A better-than-reference message is not a tutor assessment
      Given the system shows that the carrot waste was better than the kitchen reference
      When the tutor opens the student's kitchen day
      Then that comparison is visible as calculated performance
      And the tutor scores stay empty until the tutor enters them

    @pending
    Scenario: Percentile messaging waits for an agreed sufficient-data rule
      Given no agreed sufficient-data rule for percentile messaging is in force
      When the comparison is shown
      Then percentile or ranking messaging is not shown as a tutor assessment

  Rule: No competitive leaderboard

    Scenario: The review surface does not rank students as a game leaderboard
      When the tutor opens kitchen day reviews
      Then the product does not present a competitive winner board as the review goal
