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
#   - docs/archive/SPEC_LEGACY.md §11 (HISTORICAL context only; must not override
#     canonical docs where they disagree)
#
# Route: #/chef-results
# Operational timezone: Europe/Helsinki
#
# Product principles:
#   - Student Lunch is never the baseline for chef forecast accuracy.
#   - Each chef forecast is personal to the authenticated GameBus actor.
#   - One shared Service Closeout is the observed service reality for a targetDate.
#   - Simulated overproduction / shortage answers: "What would have happened if this
#     staff member's forecast had been used as the production plan?" — not attribution
#     of the restaurant's measured waste to that individual.
#   - Customer forecast error is separate from food-category simulation.
#   - No composite score, ranking, leaderboard, points, or winner/best/worst language.
#   - Missing participation is not zero-performance.
#
@product @kitchen @kitchen-results @kitchen-results-participant
Feature: Kitchen staff review their own forecast simulation results
  Authenticated kitchen staff open a read-only participant dashboard that shows their
  own forecast compared with the shared whole-canteen Service Closeout for each service
  date they participated in, plus optional anonymous peer benchmarks.

  Background:
    Given the operational timezone is "Europe/Helsinki"
    And the kitchen-staff member is authenticated in GameBus
    And the authenticated GameBus identity is the authoritative results owner
    And Kitchen Forecast is compared with whole-canteen Service Closeout, never with Student Lunch

  # ---------------------------------------------------------------------------
  # ENTRY / IDENTITY / PRIVACY
  # ---------------------------------------------------------------------------

  Rule: The participant dashboard belongs to the authenticated kitchen-staff account

    @happy-path @platform @identity
    Scenario: Kitchen staff open their own results dashboard
      Given a kitchen-staff member is logged into GameBus with a personal account
      When the kitchen-staff member opens the Kitchen Staff Dashboard
      Then the participant results experience opens at "#/chef-results"
      And the dashboard uses that authenticated GameBus identity
      And there is no control for selecting another staff member as the owner in embedded mode

    @security @privacy @identity
    Scenario: The participant can see their own identifiable forecast and result
      Given the authenticated kitchen-staff member has a calculable result for a service date
      When the participant opens the results dashboard
      Then their own forecast values and simulated outcomes are shown as identifiable to them

    @security @privacy
    Scenario: Another chef's identity is never exposed on the participant dashboard
      Given other kitchen-staff members also have results for the same service date
      When the participant opens the results dashboard
      Then no other chef's name is shown
      And no other chef's user ID is shown
      And no other chef's individual forecast quantities are shown

    @security @privacy @peers
    Scenario: Other-staff comparison may appear when at least one other staff result exists
      Given at least one other participating staff member has a result for the service date
      When the participant opens the results dashboard
      Then a de-identified other-staff comparison may be shown
      And no individual peer rows, peer names, or peer user IDs are shown

    @demo @platform
    Scenario: Standalone fixture profile selection is development behaviour only
      Given the experience is running in standalone demo mode
      Then a fixture profile selector may exist for local calculation testing
      And that selector is not production participant behaviour in GameBus embed mode

  # ---------------------------------------------------------------------------
  # RESULT AVAILABILITY
  # ---------------------------------------------------------------------------

  Rule: Missing data is never treated as a zero-performance result

    @availability @data
    Scenario: Forecast and finalized closeout together produce a calculable result
      Given the authenticated kitchen-staff member has an eligible forecast for service date D
      And a finalized Service Closeout exists for D
      When the participant opens results for D
      Then a calculable personal result is shown for D

    @availability @data
    Scenario: Forecast without finalized closeout waits while preserving structure and history
      Given the authenticated kitchen-staff member has an eligible forecast for service date D
      And no finalized Service Closeout exists for D
      When the participant opens results for D
      Then the dashboard structure remains available
      And submitted forecast information may be shown where meaningful
      And result-dependent simulation metrics are pending
      And historical Progress remains visible when earlier completed results exist
      And the incomplete current service is excluded from historical Progress calculations

    @availability @data
    Scenario: Finalized closeout without the participant's eligible forecast still shows actual kitchen outcome
      Given a finalized Service Closeout exists for service date D
      And the authenticated kitchen-staff member has no eligible forecast for D
      When the participant opens results for D
      Then the actual kitchen / service outcome for D is still shown
      And personal simulated forecast comparison is unavailable
      And the dashboard clearly explains why
      And zero overproduction, zero shortage, and zero customer error are not invented as personal metrics

    @availability @data
    Scenario: Neither forecast nor closeout yields no result yet
      Given service date D has no eligible forecast for the authenticated kitchen-staff member
      And D has no finalized Service Closeout
      When the participant opens results for D
      Then an appropriate waiting or empty state is shown
      And no zero-performance metrics are invented
      And historical Progress remains visible when earlier completed results exist

    @availability @data @validation
    Scenario: Malformed activities do not silently create false results
      Given a malformed chefForecast or wasteMeasurement activity exists for service date D
      When results are calculated for D
      Then that malformed activity does not produce a false personal result
      And valid activities for other staff or other dates remain usable

  # ---------------------------------------------------------------------------
  # SERVICE DATE SHOWN
  # ---------------------------------------------------------------------------

  Rule: The participant dashboard date is the current Europe/Helsinki calendar day

    The Kitchen Results participant dashboard is not the Kitchen Forecast entry game.
    Dashboard date semantics are independent of Kitchen Forecast 08:00 / 08:30 windows.

    At any instant:
      dashboardCalendarDate = current Europe/Helsinki calendar date

    Boundary:
      23:59:59.999 Helsinki → still the old calendar date
      00:00:00.000 Helsinki → new calendar date immediately

    There is no 08:30 transition for the dashboard date.

    @calendar @service-date @timezone
    Scenario: Dashboard date is the current Europe/Helsinki calendar date
      Given the participant opens the Kitchen Staff Dashboard
      Then the dashboard service date is the current Europe/Helsinki calendar date
      And device timezone must not redefine that calendar date

    @calendar @service-date @midnight
    Scenario Outline: Dashboard date rolls at Helsinki midnight and ignores the 08:30 forecast switch
      Given the current Europe/Helsinki wall-clock is <helsinkiTime> on <calendarDay>
      When the participant dashboard date is resolved
      Then the dashboard calendar date is "<expectedDate>"
      And the Kitchen Forecast 08:30 target-date rule is not used for that resolution

      Examples:
        | calendarDay | helsinkiTime | expectedDate |
        | Monday      | 23:59:59     | Monday       |
        | Tuesday     | 00:00:00     | Tuesday      |
        | Tuesday     | 08:29:59     | Tuesday      |
        | Tuesday     | 08:30:00     | Tuesday      |
        | Tuesday     | 23:59:59     | Tuesday      |

    @calendar @service-date @weekend
    Scenario Outline: Weekend calendar dates show No service today
      Given the current Europe/Helsinki calendar date is <day>
      When the participant opens the Kitchen Staff Dashboard
      Then the dashboard header shows that calendar date
      And the status is "No service today"
      And Overview explains that no kitchen service is scheduled for this date
      And Progress remains available for earlier completed results
      And yesterday is not presented as today

      Examples:
        | day      |
        | Saturday |
        | Sunday   |

    @calendar @service-date @closure
    Scenario: An explicitly closed weekday shows No service today for that date
      Given Monday is explicitly configured as closed
      And the current Europe/Helsinki calendar date is that Monday
      When the participant opens the Kitchen Staff Dashboard
      Then the dashboard header shows that Monday
      And the status is "No service today"
      And Overview explains that no kitchen service is scheduled for this date
      And Progress remains available

    @calendar @service-date @menu
    Scenario: Missing menu data does not make an operational weekday a non-service day
      Given the current Europe/Helsinki calendar date is an ordinary weekday
      And menu data for that weekday is unavailable
      When the participant dashboard date and service-day status are resolved
      Then the dashboard calendar date remains that weekday
      And the day is still treated as an operational service day
      And the status is not "No service today" merely because menu data is missing

    @calendar @service-date @midnight @open-page
    Scenario: An open dashboard updates across Helsinki midnight without reload
      Given the participant dashboard is open on Monday at 23:59:59 Europe/Helsinki
      And historical Progress contains completed services
      When the Europe/Helsinki clock advances to Tuesday 00:00:00 without a page reload
      Then the header date changes from Monday to Tuesday
      And Overview reevaluates Tuesday
      And historical Progress remains visible
      And no stale Monday dashboard-date state remains

    @availability @service-date
    Scenario: Waiting for closeout is required when the shown date has forecast but no finalized closeout
      Given the participant dashboard is showing service date D
      And D is an operational service day
      And the authenticated kitchen-staff member has an eligible forecast for D
      And D has no finalized Service Closeout
      Then the waiting-for-closeout state is shown
      And no simulated finalized result is invented for D

  # ---------------------------------------------------------------------------
  # DAILY CUSTOMER FORECAST
  # ---------------------------------------------------------------------------

  Rule: Customer forecast error is signed difference and absolute error, separate from food simulation

    customerForecastDifference = forecastTotalCustomers - actualCustomers
    customerForecastAbsoluteError = |customerForecastDifference|

    @metrics @customers
    Scenario Outline: Signed customer forecast difference is calculated correctly
      Given the participant's eligible forecast for service date D expects <forecastCustomers> customers
      And the finalized closeout for D records <actualCustomers> actual customers
      When the daily customer metrics are calculated
      Then customerForecastDifference is <difference>
      And customerForecastAbsoluteError is <absoluteError>
      And those customer metrics are shown separately from category food simulation

      Examples:
        | forecastCustomers | actualCustomers | difference | absoluteError | meaning        |
        | 120               | 100             | 20         | 20            | overforecast   |
        | 100               | 100             | 0          | 0             | exact          |
        | 80                | 100             | -20        | 20            | underforecast  |
        | 0                 | 0               | 0          | 0             | zero customers |

  # ---------------------------------------------------------------------------
  # OBSERVED SERVICE REALITY
  # ---------------------------------------------------------------------------

  Rule: Observed demand is derived from prepared portions minus measured overproduction

    For each independent category Main, Vegetarian, Soup, and Dessert:

      actualPreparedWeight = preparedQuantity × standardPortionWeight
      observedDemandWeight = actualPreparedWeight − measuredOverproductionWaste

    Prepared quantities are portions. Portion weight converts portions to grams.
    Measured overproduction is grams for calculation (GameBus may persist kg at the boundary).
    observedDemandWeight estimates consumed/needed amount from actual production minus waste.

    @metrics @observed-reality @categories
    Scenario Outline: Observed demand is derived for every category
      Given the finalized closeout for service date D records prepared quantity <prepared> portions
        for category "<category>"
      And the standard portion weight for that category is <portionWeight> grams
      And measured overproduction waste for that category is <wasteGrams> grams
      When observed service reality is calculated
      Then actualPreparedWeight is <preparedWeight> grams
      And observedDemandWeight is <demand> grams

      Examples:
        | category    | prepared | portionWeight | wasteGrams | preparedWeight | demand | case                          |
        | Main        | 100      | 200           | 2000       | 20000          | 18000  | normal                        |
        | Vegetarian  | 40       | 180           | 0          | 7200           | 7200   | zero measured overproduction  |
        | Soup        | 0        | 250           | 0          | 0              | 0      | zero prepared quantity        |
        | Dessert     | 50       | 100           | 5000       | 5000           | 0      | waste equals prepared weight  |

    @pending @metrics @observed-reality @edge
    Scenario: Measured overproduction greater than prepared weight is unresolved for results
      Given Service Closeout validation intends overproduction grams ≤ preparedQuantity × portionWeight
      And a results calculation nevertheless receives measured overproduction greater than
        actualPreparedWeight
      Then the product team must decide whether to reject the closeout, clamp demand at zero,
        allow negative demand, or surface a diagnostic
      And the pilot must not invent that rule silently

    @units @metrics
    Scenario: Calculation units stay consistent across grams and kilograms
      Given overproduction may be persisted on GameBus as kilograms
      And the dashboard calculation uses grams internally
      When observed demand and simulated outcomes are calculated
      Then kg values are converted to grams before arithmetic
      And forecast production weight and observed demand use the same gram unit
      And kilograms and grams are never mixed in one formula

  # ---------------------------------------------------------------------------
  # STAFF FORECAST SIMULATION
  # ---------------------------------------------------------------------------

  Rule: Simulated overproduction and shortage are counterfactual production-plan outcomes

    For each independent category Main, Vegetarian, Soup, and Dessert:

      forecastProductionWeight = forecastQuantity × portionWeight
      delta = forecastProductionWeight − observedDemandWeight
      simulatedOverproduction = max(delta, 0)
      simulatedShortage = max(−delta, 0)

    These answer: "What would have happened if this participant's forecast had been used
    as the production plan?" They do not mean the participant caused the restaurant's
    measured waste.

    @metrics @simulation @categories
    Scenario Outline: Exact match produces neither simulated overproduction nor shortage
      Given observedDemandWeight for category "<category>" is <demand> grams
      And the participant's forecast production weight for that category is <forecastWeight> grams
      When the forecast simulation is calculated
      Then simulatedOverproduction is 0
      And simulatedShortage is 0
      And the dashboard communicates that the outcome is simulated

      Examples:
        | category    | demand | forecastWeight |
        | Main        | 18000  | 18000          |
        | Vegetarian  | 7200   | 7200           |
        | Soup        | 5000   | 5000           |
        | Dessert     | 3000   | 3000           |

    @metrics @simulation @categories
    Scenario Outline: Forecast above observed demand produces simulated overproduction only
      Given observedDemandWeight for category "<category>" is <demand> grams
      And the participant's forecast production weight for that category is <forecastWeight> grams
      When the forecast simulation is calculated
      Then simulatedOverproduction is <overproduction>
      And simulatedShortage is 0

      Examples:
        | category    | demand | forecastWeight | overproduction |
        | Main        | 18000  | 20000          | 2000           |
        | Vegetarian  | 7200   | 9000           | 1800           |
        | Soup        | 5000   | 6250           | 1250           |
        | Dessert     | 3000   | 4000           | 1000           |

    @metrics @simulation @categories
    Scenario Outline: Forecast below observed demand produces simulated shortage only
      Given observedDemandWeight for category "<category>" is <demand> grams
      And the participant's forecast production weight for that category is <forecastWeight> grams
      When the forecast simulation is calculated
      Then simulatedOverproduction is 0
      And simulatedShortage is <shortage>

      Examples:
        | category    | demand | forecastWeight | shortage |
        | Main        | 18000  | 16000          | 2000     |
        | Vegetarian  | 7200   | 5400           | 1800     |
        | Soup        | 5000   | 4000           | 1000     |
        | Dessert     | 3000   | 2500           | 500      |

    @metrics @simulation
    Scenario: No eligible forecast means no simulated result for that person
      Given the authenticated kitchen-staff member has no eligible forecast for service date D
      When simulation is requested for D
      Then no simulated overproduction or shortage is calculated for that person on D

  # ---------------------------------------------------------------------------
  # PORTION WEIGHTS AND CATEGORY IDENTITY
  # ---------------------------------------------------------------------------

  Rule: Portion weights convert forecast and prepared portions into comparable grams

    @units @portion-weights
    Scenario: Forecast and actual use the intended category portion weight
      Given standard portion weights exist for Main, Vegetarian, Soup, and Dessert
      When forecast production weight and actual prepared weight are calculated
      Then each category uses its intended portion weight in grams
      And Main, Vegetarian, Soup, and Dessert remain separate result categories

    @pending @units @portion-weights @edge
    Scenario: Missing or zero portion weight is unresolved
      Given a category required for calculation has a missing or zero portion weight
      Then the product team must decide whether to reject that category, reject the service
        result, or surface a configuration error
      And the pilot must not invent silent defaults

    @pending @units @identity @edge
    Scenario: Forecast item or category identity disagreeing with closeout identity is unresolved
      Given the participant's forecast item IDs or category mapping disagree with the closeout
        item IDs for the same service date
      Then the product team must decide whether results still join by category, reject the
        mismatch, or surface a diagnostic
      And the pilot must not invent cross-item substitution

  # ---------------------------------------------------------------------------
  # DUPLICATE FORECASTS — APPROVED UPSTREAM CONTRACT
  # ---------------------------------------------------------------------------

  Rule: Eligible Kitchen Forecast selection feeds the results calculation

    Selection follows the approved Kitchen Forecast retrieval contract for actor + exact
    targetDate. These rules are already approved upstream and are not reopened here.

    @retrieval @eligibility
    Scenario: Only eligible forecasts for the exact actor and targetDate count
      Given stored chefForecast activities exist for several actors and dates
      When a personal result is calculated for one authenticated participant and service date D
      Then only eligible activities for that actor with exact targetDate D are considered
      And an activity for another targetDate is never substituted
      And an activity for another actor is never substituted

    @retrieval @eligibility
    Scenario: Latest eligible forecast wins when the pilot left duplicates
      Given several eligible chefForecast activities exist for the same actor and targetDate D
      When the personal result for D is calculated
      Then the activity with the latest submission instant is used
      And submission instants are compared chronologically, independent of ISO offset formatting

    @retrieval @eligibility
    Scenario: A later ineligible forecast cannot replace an earlier eligible one
      Given an eligible forecast exists for the actor and targetDate D
      And a later forecast for the same actor and D was submitted outside both eligible windows
      When the personal result for D is calculated
      Then the earlier eligible forecast is used
      And the later ineligible forecast is ignored

  # ---------------------------------------------------------------------------
  # PARTICIPATION / MISSING DAYS
  # ---------------------------------------------------------------------------

  Rule: Missing participation is not perfect performance

    @participation
    Scenario: A service without an eligible forecast does not invent zero metrics
      Given the kitchen-staff member did not submit an eligible forecast for service date D
      When participation and results are aggregated
      Then D has no individual result for that staff member
      And D is not assigned zero overproduction
      And D is not assigned zero shortage
      And D is not assigned zero customer error
      And D does not count toward that staff member's participated-service count

  # ---------------------------------------------------------------------------
  # WEEKLY / PROGRESS AGGREGATION
  # ---------------------------------------------------------------------------

  Rule: Progress aggregates only services the participant actually joined

    Approved aggregation metrics across participated services only:
      - participated service count
      - total simulated overproduction
      - total simulated shortage
      - mean absolute customer forecast error
    Absent / non-participating days are omitted, never zero-filled.
    No ranking or winner language.

    @progress @aggregation
    Scenario Outline: Progress aggregates only participated services
      Given the participant has the following calculable results:
        | serviceDate | participated | absoluteCustomerError | simulatedOverproduction | simulatedShortage |
        | <row1>      | <p1>         | <e1>                  | <o1>                    | <s1>              |
        | <row2>      | <p2>         | <e2>                  | <o2>                    | <s2>              |
        | <row3>      | <p3>         | <e3>                  | <o3>                    | <s3>              |
      When progress aggregation is calculated
      Then participated service count is <count>
      And total simulated overproduction is <totalOver>
      And total simulated shortage is <totalShort>
      And mean absolute customer forecast error is <meanError>
      And non-participating days are omitted rather than zero-filled

      Examples:
        | row1       | p1 | e1 | o1 | s1 | row2       | p2 | e2 | o2 | s2 | row3       | p3 | e3 | o3 | s3 | count | totalOver | totalShort | meanError | case |
        | 2026-08-17 | yes| 10 | 100| 0  |            |    |    |    |    |            |    |    |    |    | 1     | 100       | 0          | 10        | one service |
        | 2026-08-17 | yes| 10 | 100| 50 | 2026-08-18 | yes| 20 | 200| 0  | 2026-08-19 | yes| 0  | 0  | 100| 3     | 300       | 150        | 10        | multiple services |
        | 2026-08-17 | yes| 10 | 100| 0  | 2026-08-18 | no |    |    |    | 2026-08-19 | yes| 30 | 50 | 25 | 2     | 150       | 25         | 20        | missing day between |
        | 2026-08-17 | yes| 0  | 0  | 0  |            |    |    |    |    |            |    |    |    |    | 1     | 0         | 0          | 0         | zero-error service |

    @progress @aggregation
    Scenario: No participated services yields an empty progress state
      Given the authenticated kitchen-staff member has no calculable participated services
      When progress aggregation is calculated
      Then participated service count is 0
      And no zero-performance progress totals are presented as if the person had taken part

    @progress @aggregation
    Scenario: Different chefs participating on different dates do not invent each other's days
      Given kitchen-staff member A participated on Monday only
      And kitchen-staff member B participated on Tuesday only
      When each participant's progress is aggregated
      Then A's participated services include Monday and exclude Tuesday
      And B's participated services include Tuesday and exclude Monday

    @progress @history
    Scenario: Historical Progress is independent of the current service waiting state
      Given the participant has earlier completed calculable results
      And the current service date is waiting for service closeout
      When the participant opens the Progress tab
      Then previously completed Week / Month / Year results remain visible
      And the incomplete current service is excluded from those historical calculations
      And Progress is not erased merely because today's result is unavailable

    @progress @chart
    Scenario Outline: Progress chart availability depends on completed observation count
      Given the participant has <count> completed observation(s) in the selected period
      When the Progress chart is shown
      Then the UI behaviour is "<behaviour>"

      Examples:
        | count | behaviour                                                                 |
        | 0     | proper no-history state                                                   |
        | 1     | show the available chart or data point without claiming a trend or change |
        | 2     | show the chart plus trend or comparison                                   |

    @progress @calendar-week
    Scenario: Week / Month / Year tabs aggregate completed participated services in calendar periods
      Given Progress uses Week, Month and Year views over completed participated services
      Then each tab aggregates only completed observations in that calendar period
      And missing participation days are omitted rather than zero-filled

  # ---------------------------------------------------------------------------
  # OTHER-STAFF COMPARISON
  # ---------------------------------------------------------------------------

  Rule: Other-staff comparison is de-identified and available from one peer onward

    Comparison is allowed as soon as ONE other staff result exists.
    With exactly one other staff member, label the comparison "Other staff", not "median".
    With two or more other staff, use "Other staff median".
    Never expose peer names or user IDs. Do not suppress comparison because the group is small.

    @privacy @peers
    Scenario: Peer comparison never exposes identifiable peer data
      When other-staff comparison is shown
      Then peer names are not shown
      And peer user IDs are not shown
      And individual peer forecast rows are not shown

    @privacy @peers @threshold
    Scenario: Comparison is allowed with exactly one other staff result
      Given exactly one other participating staff member has a result for the service date
      And the current participant also has a result
      When other-staff comparison is shown
      Then comparison is available
      And the comparison column is labelled "Other staff"
      And the label is not "Other staff median"
      And the comparison is described as compared with other staff

    @privacy @peers @threshold
    Scenario: Comparison uses other-staff median when two or more peers exist
      Given two or more other participating staff have results for the service date
      When other-staff comparison is shown
      Then the comparison column is labelled "Other staff median"

    @privacy @peers @metrics
    Scenario: Median of an odd number of other participating staff
      Given three other participating staff have peer metric values 10, 20 and 40
      And the current participant is excluded from that peer set
      When the other-staff median is calculated
      Then the median is 20

    @privacy @peers @metrics
    Scenario: Median of an even number of other participating staff
      Given four other participating staff have peer metric values 10, 20, 30 and 40
      And the current participant is excluded from that peer set
      When the other-staff median is calculated
      Then the median is the mid-point of the two central values

    @privacy @peers @metrics
    Scenario: Peer comparison when actualCustomers is greater than zero
      Given actualCustomers for the service is greater than 0
      And at least one other participating staff result exists
      When peer comparison is calculated
      Then other-staff aggregates may be shown without division-by-zero errors

    @privacy @peers @metrics
    Scenario: Peer comparison avoids division by zero when actualCustomers is 0
      Given actualCustomers for the service is 0
      When peer comparison relative rates would divide by actualCustomers
      Then the calculation does not produce Infinity or NaN
      And the UI does not present a corrupted comparison

    @privacy @peers
    Scenario: Peer wording describes other-staff comparison, not a team including the participant
      When other-staff aggregates are shown
      Then the wording must not claim a team median that includes the current participant
      And the copy must correctly describe other-staff comparison

  # ---------------------------------------------------------------------------
  # NO COMPETITIVE SCORING
  # ---------------------------------------------------------------------------

  Rule: The participant dashboard has no competitive scoring

    @security @no-ranking
    Scenario: Competitive scoring language and mechanics are absent
      When the participant results dashboard is shown
      Then there is no leaderboard
      And there is no rank or ranking
      And there is no winner, best chef, or worst chef framing
      And there are no points, composite score, score weights, or penalties
      And there is no "you beat X" competitive framing
      And neutral factual comparison with other staff remains allowed
