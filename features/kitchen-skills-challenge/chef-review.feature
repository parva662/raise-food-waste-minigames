# APPROVED PRODUCT TARGET
# Product: docs/product/kitchen-skills-challenge/CHEF_REVIEW.md
# Slugs: docs/product/kitchen-skills-challenge/GAMEBUS_SLUG_CONTRACT.md
# Filename is historical. Product wording is Tutor / Tutor assessment.
# GameBus activity slug remains wastePracticeReview.
# Implemented on main.
#
@chef-review @waste-challenges @kitchen-day
Feature: Session Review, Student Progress, and tutor assessment
  As a student or tutor
  I want one current-session review, one historical Progress page, and one qualitative tutor assessment per completed module
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

  Rule: Student Progress is the student's own history

    Scenario: Progress shows completed work before tutor review
      Given the student completed Trim, Reuse, and Portion
      And the tutor has not reviewed any module
      When the student opens Progress
      Then those completed records are listed
      And tutor assessment is shown as not yet scored

  Rule: One tutor assessment per completed module

    Scenario Outline: Time efficiency accepts 0 to 5
      When the tutor gives the Trim Smart module a time efficiency score of <score>
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
      When the tutor gives the Trim Smart module a preparation quality score of <score>
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
      When the tutor has not scored preparation quality for a module
      Then preparation quality is shown as not yet scored
      When the tutor sets preparation quality to 0
      Then preparation quality is scored as 0

    Scenario: Tutor feedback is optional
      When the tutor submits the two scores for a module without feedback
      Then the module review is accepted

    Scenario: One review covers one module only
      Given the kitchen day has Trim Smart and Rescue & Reuse evidence
      When the tutor submits a Trim Smart review
      Then one review is recorded for that session and reviewedGame trimSmart
      And Rescue & Reuse remains open for assessment
      And the review is not one judgement per ingredient
      And there is no overall session-level tutor score

  Rule: Session assessment status uses only modules with participant evidence

    Scenario: Portion-only session is Reviewed after the Portion assessment
      Given the student recorded Portion Precision only
      And Trim Smart and Rescue & Reuse have no participant evidence
      And the tutor submitted a Portion Precision review
      Then the session status is Reviewed
      And Trim Smart and Rescue & Reuse do not require a review
      And those modules do not appear as needs review
      And they do not inflate the awaiting-assessment count

    Scenario: Portion and Trim reviewed without Reuse evidence is Reviewed
      Given the student recorded Portion Precision and Trim Smart
      And Rescue & Reuse has no participant evidence
      And the tutor reviewed Portion Precision and Trim Smart
      Then the session status is Reviewed

    Scenario: One unreviewed module among recorded evidence is Partially reviewed
      Given the student recorded Portion Precision, Trim Smart, and Rescue & Reuse
      And one of those modules has no tutor review
      Then the session status is Partially reviewed

    Scenario: Unreviewed Portion-only evidence is Needs assessment
      Given the student recorded Portion Precision only
      And the tutor has not reviewed it
      Then the session status is Needs assessment
      And awaiting assessment is 1
      And the session list does not say Trim needs review or Rescue needs review

  Rule: System performance is not tutor scoring

    Scenario: Trim actual vs JAMIX reference is calculated performance
      Given the student recorded Trim for a recipe ingredient with a JAMIX Hävikki reference
      When the tutor opens the student's kitchen day
      Then Trim evidence shows starting weight, actual removed grams and percent, JAMIX reference percent and grams, and the difference in percentage points
      And the difference uses above reference, below reference, or at reference
      And the comparison does not call lower waste better
      And Time efficiency and Preparation quality stay empty until the tutor enters them

    Scenario: Missing historical recipe join is not guessed
      Given a persisted Trim entry cannot be joined safely to a recipe-ingredient JAMIX reference
      When the tutor opens that kitchen day
      Then the Trim comparison shows Reference unavailable
      And no seeded or name-inferred reference is used

    Scenario: A 0 percent JAMIX reference is valid
      Given the recipe-ingredient Hävikki reference is 0 percent
      When the comparison is shown
      Then 0 percent is used as the reference
      And it is not treated as missing

    @pending
    Scenario: Percentile messaging waits for an agreed sufficient-data rule
      Given no agreed sufficient-data rule for percentile messaging is in force
      When the comparison is shown
      Then percentile or ranking messaging is not shown as a tutor assessment

  Rule: Student Progress shows own JAMIX comparison and anonymous peer context

    Scenario: Weighted Trim session comparison on Progress
      Given a completed Trim session has two ingredients with different starting weights and JAMIX references
      When the student opens Kitchen Skills Progress
      Then the session actual trim percent is total removed grams over total starting grams
      And the session reference percent is total expected reference grams over total starting grams
      And the difference is shown in percentage points above, below, or at reference
      And that comparison is visually separate from tutor scores
      And the student Trim game does not show it

    @pending
    Scenario: Anonymous peer Trim comparison uses deviation from each person's own JAMIX reference
      Given a privacy-safe anonymous aggregate of peer Trim deltas is available
      When the student opens Kitchen Skills Progress
      Then the anonymous group median delta is shown
      And the sample size is shown as Group median and peer count
      And no peer name or actor id is shown
      And there is no ranking or leaderboard

    Scenario: Missing privacy-safe peer aggregate hides the statistic
      When the student opens Kitchen Skills Progress
      Then the peer comparison shows Not enough peer data yet

    Scenario: Repeated submissions do not overweight one peer
      Given one other participant submitted Trim more than once
      When the anonymous median is calculated
      Then only that participant's latest valid result is used

    @pending
    Scenario: Anonymous peer tutor scores are like-for-like module medians
      Given a privacy-safe anonymous aggregate of peer tutor scores is available
      When the student opens Kitchen Skills Progress
      Then Time efficiency and Preparation quality are compared with the anonymous group median for Trim
      And those medians are not a new overall score

    Scenario: Progress never consumes raw peer activities
      Given student Progress receives kitchenGroupInputSelf
      And a raw GET /api/groups/activities Kitchen Skills collection is attached
      When the student opens Kitchen Skills Progress
      Then the peer comparison shows Not enough peer data yet
      And no peer name, actor id, raw activity, review record, or chef feedback is shown
      And kitchenSkillsTrainerInput is not used as a student feed

  Rule: No competitive leaderboard

    Scenario: The review surface does not rank students as a game leaderboard
      When the tutor opens kitchen day reviews
      Then the product does not present a competitive winner board as the review goal
