# APPROVED PRODUCT TARGET
# Do not rewrite this specification merely to match existing code.
# Implementation gaps are resolved separately.
#
# Sources reconstructed from:
#   - docs/product/RAISE_BARLAUREA_MASTER_PLAN.md (§2.3, §3, §6)
#   - docs/product/KITCHEN_RESULTS.md
#   - docs/current-state/ROADMAP.md (Chef results)
#   - docs/contracts/KITCHEN_FORECAST_GAMEBUS.md
#   - docs/contracts/SERVICE_CLOSEOUT_GAMEBUS.md
#   - features/kitchen/kitchen-forecast.feature (eligible forecast selection)
#   - features/kitchen/kitchen-results-participant.feature (shared calculation semantics)
#   - docs/archive/SPEC_LEGACY.md §11 (HISTORICAL context only)
#
# Route: #/chef-results-admin
# Operational timezone: Europe/Helsinki
#
# Product principles:
#   - Management / research view over the SAME calculation engine and shared service reality
#     as the participant dashboard.
#   - Read-only: does not create or edit forecasts or Service Closeout.
#   - May show staff identities for research/management.
#   - Must not invent a separate alternate truth or Student Lunch baseline.
#   - No composite score, ranking, leaderboard, or winner/best/worst language.
#   - Unauthorized ordinary participants must not gain management visibility in production.
#
@product @kitchen @kitchen-results @kitchen-results-admin
Feature: Authorized staff inspect all kitchen forecast simulation results
  An authorized management or research user opens a read-only admin dashboard that can
  inspect every participating staff member's forecast simulation against one shared
  Service Closeout per service date.

  Background:
    Given the operational timezone is "Europe/Helsinki"
    And Kitchen Forecast is compared with whole-canteen Service Closeout, never with Student Lunch
    And the admin dashboard uses the same calculation engine as the participant dashboard

  # ---------------------------------------------------------------------------
  # PURPOSE
  # ---------------------------------------------------------------------------

  Rule: The admin dashboard is a read-only management and research view

    @purpose @happy-path
    Scenario: Authorized users open the management results dashboard
      When an authorized management or research user opens the Kitchen Management Dashboard
      Then the admin results experience opens at "#/chef-results-admin"
      And the view is read-only
      And the view can inspect all participating staff results for a selected service date

    @purpose @scope
    Scenario: The admin dashboard does not create or edit operational records
      When the admin dashboard is open
      Then it does not create or edit chefForecast activities
      And it does not create or edit Service Closeout / wasteMeasurement activities
      And it does not calculate a separate alternate service truth

  # ---------------------------------------------------------------------------
  # AUTHORIZATION
  # ---------------------------------------------------------------------------

  Rule: Ordinary participants must not gain management visibility in production

    @security @authorization
    Scenario: Unauthorized participants must not see the management dashboard in production
      Given a kitchen-staff member is an ordinary participant without management authorization
      When that person attempts to use the management results view in production
      Then management visibility of all staff identities and all-staff metrics must not be granted

    @pending @security @authorization @platform
    Scenario: The technical GameBus authorization mechanism is unresolved
      Given the product rule requires that unauthorized participants must not gain management
        visibility in production
      And canonical documentation still records route-level authorization as required before
        production and does not specify a GameBus role API or permission signal
      Then the product/platform team must decide how GameBus proves authorization
      And this repository must not invent a GameBus role API in order to close the gap

  # ---------------------------------------------------------------------------
  # STAFF VISIBILITY
  # ---------------------------------------------------------------------------

  Rule: Authorized admin users may see staff identities and service metrics

    @visibility @multi-account
    Scenario: Authorized admin can see all participating staff for the selected service
      Given several kitchen-staff members have eligible forecasts and a shared finalized
        closeout for service date D
      When the authorized admin opens results for D
      Then each participating staff member is visible with their identity
      And each row shows that person's service-specific forecast and simulation metrics

    @visibility @data
    Scenario: Staff without an eligible forecast are not invented as zero-result rows
      Given a finalized closeout exists for service date D
      And kitchen-staff member A has an eligible forecast for D
      And kitchen-staff member B has no eligible forecast for D
      When the authorized admin opens results for D
      Then A appears with a calculable result
      And B is not invented as a zero overproduction / zero shortage / zero customer-error row
        unless product documentation later explicitly requires an absence indicator

    @visibility @retrieval
    Scenario: Pilot duplicate forecasts do not duplicate staff rows
      Given the pilot left several eligible chefForecast activities for the same actor and D
      When the authorized admin opens results for D
      Then that actor appears once
      And the latest eligible forecast is used

    @visibility @baseline
    Scenario: Student Lunch is never used as the actual baseline
      When admin results are calculated
      Then Student Lunch declarations are not used as actual customers, prepared portions,
        waste, or observed demand

  # ---------------------------------------------------------------------------
  # SERVICE DATE SELECTION
  # ---------------------------------------------------------------------------

  Rule: The admin dashboard selects among available service dates without inventing data

    @calendar @service-date
    Scenario: Selecting a service date shows that date's shared results
      Given usable result data exists for more than one service date
      When the authorized admin selects service date D
      Then the dashboard shows staff results for D
      And the shared closeout reality for D is used

    @calendar @service-date
    Scenario: No available dates yields a clear empty state
      Given no usable result dates are available
      When the authorized admin opens the management dashboard
      Then a clear empty state is shown
      And no fabricated staff rows are shown

    @pending @calendar @service-date
    Scenario: Which dates belong in the admin selector is not fully specified
      Given product documentation requires a service-date selector and shared calculation by
        targetDate, but does not unambiguously define whether the selector lists only dates
        with both forecast and finalized closeout, dates with closeout only, dates with
        forecast only, ordering rules, the initial default date, or how a stale selected date
        is replaced when the available set changes
      Then those selector semantics remain a product decision
      And current application behaviour must not silently become the specification

  # ---------------------------------------------------------------------------
  # SAME CALCULATION ENGINE
  # ---------------------------------------------------------------------------

  Rule: Participant and admin numbers agree exactly for the same actor and service date

    For the same actor + same service date, participant and admin results MUST agree for:
      - forecast customers
      - actual customers
      - signed customer difference
      - absolute customer error
      - each category forecast quantity
      - observed demand
      - simulated overproduction
      - simulated shortage
      - total simulated overproduction
      - total simulated shortage

    The admin dashboard may reveal more identities and detail, but it must not calculate
    different numbers.

    @metrics @parity
    Scenario: Participant and admin agree on customer metrics for the same actor and date
      Given kitchen-staff member A has a calculable result for service date D
      When A's result is shown on the participant dashboard and on the admin dashboard
      Then forecast customers, actual customers, signed difference, and absolute customer error
        are identical on both surfaces

    @metrics @parity @categories
    Scenario: Participant and admin agree on category simulation for the same actor and date
      Given kitchen-staff member A has a calculable result for service date D
      When A's result is shown on both dashboards
      Then each category's forecast quantity, observed demand, simulated overproduction, and
        simulated shortage are identical on both surfaces
      And total simulated overproduction and total simulated shortage are identical

  # ---------------------------------------------------------------------------
  # SHARED ACTUAL SERVICE REALITY
  # ---------------------------------------------------------------------------

  Rule: All staff for one targetDate share one observed service reality

    @metrics @shared-reality
    Scenario: Every staff forecast for D is evaluated against the same closeout
      Given kitchen-staff members A and B both have eligible forecasts for service date D
      And one finalized Service Closeout exists for D
      When admin results for D are calculated
      Then A and B are evaluated against the same actualCustomers
      And A and B are evaluated against the same prepared quantities
      And A and B are evaluated against the same portion weights
      And A and B are evaluated against the same measured overproduction
      And A and B are evaluated against the same observed demand
      And different actual service realities are not attributed to different chefs

  # ---------------------------------------------------------------------------
  # DUPLICATES / ELIGIBILITY
  # ---------------------------------------------------------------------------

  Rule: Admin selection uses the approved Kitchen Forecast eligibility contract

    @retrieval @eligibility
    Scenario: One selected eligible forecast per actor and targetDate
      Given stored chefForecast activities include eligible and ineligible duplicates
      When admin results are calculated for service date D
      Then each actor contributes at most one selected eligible forecast for D
      And later ineligible activities do not replace earlier eligible ones
      And submission instants are compared chronologically

  # ---------------------------------------------------------------------------
  # MISSING / MALFORMED DATA
  # ---------------------------------------------------------------------------

  Rule: Invalid activities must not corrupt otherwise valid results

    @availability @validation @partial
    Scenario: Closeout only shows service actuals and explains missing staff forecasts
      Given a finalized closeout exists for service date D
      And no eligible chefForecast exists for any staff member on D
      When admin results for D are requested
      Then the shared service actuals for D are shown
      And the dashboard explains that no eligible staff forecasts are available
      And the page does not collapse to a single empty paragraph
      And no fabricated staff forecast rows are invented as zero performance

    @availability @validation @partial
    Scenario: Forecast only shows available forecast state and explains pending closeout
      Given eligible forecasts exist for service date D
      And no finalized closeout exists for D
      When admin results for D are requested
      Then available forecast state for D may be shown
      And the dashboard explains that service closeout is pending
      And the page does not collapse to a single empty paragraph
      And no fabricated observed demand or simulated outcomes are shown as finalized results

    @availability @validation
    Scenario: No closeout and no forecasts yields a clear empty state
      Given service date D has neither eligible forecasts nor a finalized closeout
      When admin results for D are requested
      Then a clear empty state is shown
      And no fabricated staff rows are shown

    @availability @validation
    Scenario: A malformed forecast is rejected without destroying other staff results
      Given a valid eligible forecast for staff member A on D
      And a malformed chefForecast activity for staff member B on D
      And a valid finalized closeout for D
      When admin results for D are calculated
      Then A's result remains calculable
      And B's malformed activity does not produce a false result
      And the whole service is not discarded solely because B's activity is malformed

    @availability @validation
    Scenario: A malformed closeout does not invent a shared reality
      Given eligible forecasts exist for service date D
      And the wasteMeasurement / closeout activity for D is malformed
      When admin results for D are calculated
      Then no simulated staff results are invented from that malformed closeout

    @availability @validation
    Scenario: A wrong target date is never used as a fallback
      Given a closeout or forecast exists only for another service date
      When admin results are requested for service date D
      Then that other date's data is not substituted for D

    @availability @validation
    Scenario: Invalid units or missing actor do not silently coerce into false results
      Given an activity has invalid units, a non-numeric quantity, or a missing actor where
        actor identity is required for personal results
      When admin results are calculated
      Then that activity is rejected or ignored for personal rows
      And it does not silently coerce into a fabricated staff result

    @pending @availability @validation @edge
    Scenario: Duplicate closeouts for one targetDate are unresolved
      Given more than one wasteMeasurement / closeout activity claims the same targetDate
      Then the product team must decide which closeout is authoritative, whether the date is
        rejected, or how diagnostics are surfaced
      And the pilot must not invent a silent pick without an approved rule

  # ---------------------------------------------------------------------------
  # GROUP GAMEBUS DATA VS FIXTURES
  # ---------------------------------------------------------------------------

  Rule: Embedded production mode uses group data; fixtures are demo/test only

    @platform @data-source
    Scenario: Embedded mode waits while GameBus group input is not ready
      Given the admin dashboard is embedded in GameBus
      And INPUT_COLLECTIONS / group data has not arrived yet
      When the page is shown
      Then a loading or pending state is shown
      And fixture staff results are not silently used as production data

    @platform @data-source
    Scenario: Embedded mode uses group data when ready
      Given the admin dashboard is embedded in GameBus
      And group INPUT_COLLECTIONS data is ready
      When results are calculated
      Then group activity data is used
      And fixture data is not mixed into the production calculation

    @platform @data-source
    Scenario: Embedded mode does not fall back to fixtures when group data is empty or malformed
      Given the admin dashboard is embedded in GameBus
      And group data is ready but empty or unusable
      When results are calculated
      Then the dashboard does not silently substitute standalone fixture data

    @platform @data-source
    Scenario: Standalone mode may use fixtures
      Given the admin dashboard runs in standalone demo mode
      Then fixtures are permitted for local research and development viewing

    @platform @data-source
    Scenario: Equivalent fixture and group inputs share calculation semantics
      Given fixture source data and group source data describe the same forecasts, closeout,
        and portion weights
      When both adapters feed the shared calculation engine
      Then the resulting metrics are identical

  # ---------------------------------------------------------------------------
  # NO RANKING / SCORE
  # ---------------------------------------------------------------------------

  Rule: Admin staff rows are not a leaderboard

    @security @no-ranking
    Scenario: Competitive scoring language and mechanics are absent from the admin view
      When the management results dashboard is shown
      Then there is no leaderboard
      And there is no rank or ranking presented as evaluation
      And there is no winner, best staff, or worst staff framing
      And there is no composite score
      And alphabetical or service-date ordering is not presented as competitive ranking
