# APPROVED PRODUCT TARGET
# Do not rewrite this specification merely to match existing code.
# Implementation gaps are resolved separately.
#
@product @student @student-journey @gamebus
Feature: Student opens My Food Journey personal dashboard
  Authenticated canteen participants can open a read-only Custom Page that
  summarises their own lunch declaration history. The page never posts GameBus
  activities and never invents badges, streaks, or plate-waste measurements.

  Product principles:
    - The authenticated GameBus student is the only person whose history is shown.
    - Personal studentLunchCheckin activities come from an authorized /api/me/activities Input Request.
    - Identity comes from inputCollectionPari.me.
    - Each valid service date counts once (latest submission wins).
    - No lunch is valid participation.
    - Badges, streaks, and plate measurements appear only from verified GameBus sources.
    - When those sources are unavailable, the UI explains the limitation instead of fabricating values.
    - Existing Student Lunch missions and other kitchen products stay unchanged.

  Background:
    Given the My Food Journey Custom Page is embedded at "#/student-journey"
    And the page does not submit GameBus activities

  Scenario: Overview shows personal participation counts
    Given the authenticated student has distinct lunch declarations including No lunch
    When the student opens the Overview tab
    Then the dashboard shows the number of completed lunch declarations
    And the dashboard shows the number of distinct lunch service dates
    And the dashboard shows the most recent participation

  Scenario: History keeps one row per service date
    Given the authenticated student submitted more than once for the same service date
    When the student opens My Progress
    Then only the latest submission for that service date is listed
    And No lunch entries are listed as participation

  Scenario: Another student's activities are never shown
    Given the self activity feed contains another actor's studentLunchCheckin
    When the authenticated student opens My Food Journey
    Then only activities whose actor id matches the authenticated me id are shown

  Scenario: Unsupported rewards stay unavailable without fabrication
    When the student opens Overview
    Then streak and badge sections explain that verified GameBus data is not available in this app
    And the dashboard does not invent streak or badge values

  Scenario: Plate measurements stay unavailable without a contract
    When the student opens My Progress
    Then plate measurement and personal food-waste sections explain that a verified measurement source is not available
    And the dashboard does not calculate plate waste from kitchen closeout data

  @pending @live-gamebus
  Scenario: GameBus left menu opens the Custom Page for the student group
    Given the organizer configured My Food Journey as a Custom Page for the student group
    And Input Collections include inputCollectionPari.me and kitchenGroupInputSelf.activities
    When the student selects My Food Journey in the GameBus left menu
    Then the Custom Page loads at "#/student-journey"
