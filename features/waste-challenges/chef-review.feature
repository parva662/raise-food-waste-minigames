# APPROVED PRODUCT TARGET
# Product: docs/product/waste-challenges/CHEF_REVIEW.md
# Slugs: docs/product/waste-challenges/GAMEBUS_SLUG_CONTRACT.md
# Not implemented on main.
#
@chef-review @waste-challenges @kitchen-day
Feature: Student dashboard and end-of-session chef review
  As a student or chef
  I want one kitchen-day overview and one qualitative chef review at the end of the session
  So that system performance stays separate from chef judgement

  Background:
    Given a student completed a kitchen day containing carrot preparation with a reuse suggestion, onion preparation, and a mayonnaise Portion Precision record
    And the chef reviews that kitchen day at the end of the student's session

  Rule: One evidence surface per student kitchen day

    Scenario: Completed records are visible together
      When the chef opens the student's kitchen day
      Then the carrot entry, the onion entry, the carrot reuse suggestion, and the mayonnaise entry are listed together

    Scenario: The student overview shows the same day
      When the student opens the kitchen day overview
      Then all of that student's completed records for the day are listed
      And the overview is read-only

    Scenario: Evidence stays read-only for the chef
      When the chef opens the student's kitchen day
      Then ingredient preparation, reuse, and Portion Precision records are shown as evidence
      And the chef cannot edit the student's measurements

    Scenario: Unfinished work is not completed evidence
      Given the student has an unfinished ingredient preparation entry
      When the chef opens the student's kitchen day
      Then the unfinished entry is not treated as completed evidence

  Rule: One session-level chef review

    Scenario Outline: Time efficiency accepts 0 to 5
      When the chef gives the kitchen day a time efficiency score of <score>
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
      When the chef gives the kitchen day a preparation quality score of <score>
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
      When the chef has not scored preparation quality
      Then preparation quality is shown as not yet scored
      When the chef sets preparation quality to 0
      Then preparation quality is scored as 0

    Scenario: Chef feedback is optional
      When the chef submits the two scores without feedback
      Then the end-of-session review is accepted

    Scenario: One review covers the whole kitchen day
      When the chef submits the review
      Then one review is recorded for the student's session
      And the review is not one judgement per ingredient or per module
      And Trim Smart, reuse, and Portion Precision do not receive separate chef scores

  Rule: System performance is not chef scoring

    Scenario: A better-than-reference message is not a chef score
      Given the system shows that the carrot waste was better than the kitchen reference
      When the chef opens the student's kitchen day
      Then that comparison is visible as calculated performance
      And the chef scores stay empty until the chef enters them

    @pending
    Scenario: Percentile messaging waits for an agreed sufficient-data rule
      Given no agreed sufficient-data rule for percentile messaging is in force
      When the comparison is shown
      Then percentile or ranking messaging is not shown as a chef score

  Rule: No competitive leaderboard

    Scenario: The review surface does not rank students as a game leaderboard
      When the chef opens kitchen day reviews
      Then the product does not present a competitive winner board as the review goal
