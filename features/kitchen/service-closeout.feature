# APPROVED PRODUCT TARGET
# Do not rewrite this specification merely to match existing code.
# Implementation gaps are resolved separately.
#
# Sources reconstructed from:
#   - docs/product/SERVICE_CLOSEOUT.md
#   - docs/contracts/SERVICE_CLOSEOUT_GAMEBUS.md
#   - docs/product/RAISE_BARLAUREA_MASTER_PLAN.md (§2.3, §3–4)
#   - docs/contracts/KITCHEN_FORECAST_GAMEBUS.md (inbound eligibility)
#   - features/kitchen/kitchen-forecast.feature (eligible forecast selection)
#   - docs/current-state/ROADMAP.md / IMPLEMENTATION_STATUS.md
#   - docs/archive/SPEC_LEGACY.md §10 (HISTORICAL only; must not override)
#
# Route: #/service-closeout
# Operational timezone: Europe/Helsinki
# Outbound ACTIVITY: wasteMeasurement
#
# Product principles:
#   - One BarLaurea lunch service per service date; one shared whole-canteen closeout.
#   - Closeout records operational actuals, not a personal chef result.
#   - Authenticated GameBus activity.actor owns the ACTIVITY; no headChefUserId / chefId.
#   - Forecast values are read-only context and are never copied into wasteMeasurement.
#   - Portion weights are application reference data and are never posted to GameBus.
#   - Overproduction UI is grams; GameBus persistence is kilograms (grams / 1000).
#   - Measured overproduction cannot exceed prepared weight.
#   - Missing chef forecast must not block a valid actual closeout.
#   - No scoring, ranking, or composite score.
#
@product @kitchen @service-closeout @gamebus
Feature: Kitchen staff record the shared Service Closeout for one lunch service
  Authorized kitchen staff finalize the whole-canteen actual customers, prepared portions,
  and measured overproduction waste for one BarLaurea lunch service date.

  Background:
    Given the operational timezone is "Europe/Helsinki"
    And the Service Closeout experience opens at "#/service-closeout"
    And the outbound GameBus activity template is "wasteMeasurement"
    And Service Closeout is separate from Student Lunch, Kitchen Forecast entry, and Results dashboards

  # ---------------------------------------------------------------------------
  # PURPOSE / SEPARATION
  # ---------------------------------------------------------------------------

  Rule: Service Closeout is the shared observed service reality

    @happy-path @domain
    Scenario: Closeout captures whole-canteen actuals for one service date
      When authorized kitchen staff open Service Closeout
      Then the page records operational actuals for one lunch service date
      And it does not create a personal chef score or ranking

    @domain @separation
    Scenario: Closeout does not use unrelated GameBus templates
      Then the workflow does not post "actualServiceData"
      And the workflow does not post "productionPlan"
      And the workflow does not post "wasteReflection"
      And the workflow does not post "kitchenServiceCloseout"
      And the workflow does not use SILENT_ACTIVITY

  # ---------------------------------------------------------------------------
  # SERVICE DATE
  # ---------------------------------------------------------------------------

  Rule: Closeout service date is the current Europe/Helsinki calendar service day

    Closeout is an end-of-service recording workflow. It does NOT use Kitchen Forecast
    08:00 / 08:30 target-date switching.

    @calendar @timezone
    Scenario: Service date uses Europe/Helsinki
      Given the current Europe/Helsinki calendar date is D
      When Service Closeout resolves its service date
      Then the service date is D
      And device timezone must not redefine D

    @calendar @weekend
    Scenario Outline: Weekend dates remain the calendar date and cannot finalize
      Given the current Europe/Helsinki calendar date is a <day>
      When Service Closeout opens
      Then the service date shown is that <day>
      And Finalize is not available as a usable operational closeout for a non-service day

      Examples:
        | day      |
        | Saturday |
        | Sunday   |

    @calendar @closure
    Scenario: An explicitly closed weekday cannot be finalized
      Given the current Europe/Helsinki calendar date is an explicitly closed weekday
      When Service Closeout opens
      Then the service date remains that weekday
      And Finalize is blocked because the day is closed

    @calendar @menu
    Scenario: Missing menu does not silently change the service date
      Given the current Europe/Helsinki calendar date is an ordinary weekday D
      And menu data for D is unavailable
      When Service Closeout opens
      Then the service date remains D
      And Finalize is blocked because required menu or item identity is unavailable
      And the service date is not moved to another day

    @demo @calendar
    Scenario: Development date override is development-only
      Given the application is running in development mode
      When an explicit "?date=YYYY-MM-DD" override is provided on the closeout hash route
      Then that override may select the closeout service date for local testing
      And that override is not production GameBus behaviour

    @pending @calendar @midnight @open-page
    Scenario: Whether an open closeout page auto-rolls the service date at Helsinki midnight is unresolved
      Given canonical docs require Europe/Helsinki service dating and do not define open-page
        midnight rollover for Service Closeout
      Then the product team must decide whether an already-open closeout page updates its
        service date at 00:00:00 Helsinki without reload, or keeps the date resolved at open
      And the pilot must not invent that rule solely from current application code

  # ---------------------------------------------------------------------------
  # IDENTITY / RECORDER
  # ---------------------------------------------------------------------------

  Rule: Authenticated GameBus actor owns the closeout ACTIVITY

    @security @identity
    Scenario: Recorded-by display is read-only authenticated identity
      Given the kitchen-staff member is authenticated in GameBus
      When Service Closeout is shown
      Then "Recorded by" shows the authenticated identity read-only
      And there is no Head chef today selector
      And there is no local control to choose another recorder

    @security @identity @data
    Scenario: Persisted ACTIVITY uses activity.actor only
      When Finalize posts a wasteMeasurement ACTIVITY
      Then GameBus activity.actor owns the activity
      And no chefId property is posted
      And no headChefUserId property is posted
      And no recorder name or recorder id property is posted

  # ---------------------------------------------------------------------------
  # AUTHORIZATION
  # ---------------------------------------------------------------------------

  Rule: Only authorized kitchen staff may finalize Service Closeout

    @security @authorization
    Scenario: Unauthorized users must not finalize closeout
      Given a user is not authorized to finalize Service Closeout
      When the closeout page is shown
      Then Finalize must not create a wasteMeasurement ACTIVITY

    @pending @security @authorization @platform
    Scenario: Exact live GameBus authorization signal for closeout is unresolved
      Given product requires authorized kitchen staff only
      And the repository currently ships a development access policy that allows local finalization
      And no reliable GameBus permission signal is defined in the INPUT_COLLECTIONS contract
      Then the exact production authorization mechanism remains a platform decision
      And frontend development policy must not be claimed as production-safe authorization

  # ---------------------------------------------------------------------------
  # ACTUAL CUSTOMERS
  # ---------------------------------------------------------------------------

  Rule: Actual customers is a required whole integer in the approved business range

    @inputs @customers @blank-vs-zero
    Scenario Outline: Actual customers validation
      Given the actual customers field is set to <raw>
      When the field is validated
      Then the result is <outcome>

      Examples:
        | raw  | outcome                          |
        | blank| invalid — required               |
        | 0    | valid                            |
        | 1    | valid                            |
        | 1000 | valid                            |
        | 1001 | invalid — above maximum          |
        | -1   | invalid                          |
        | 1.5  | invalid — not a whole number     |

  # ---------------------------------------------------------------------------
  # CATEGORIES / PREPARED / WASTE
  # ---------------------------------------------------------------------------

  Rule: Main, Vegetarian, Soup and Dessert are four independent closeout categories

    For each category the closeout records:
      - exact resolved menu item ID for this service date
      - prepared quantity in portions
      - standard portion weight from application reference data
      - measured overproduction in grams in the UI/domain

    Prepared quantity and overproduction are independent user-entered actuals.
    Forecast quantities shown beside them are read-only context only.

    @inputs @prepared @blank-vs-zero
    Scenario Outline: Prepared quantity validation for every category
      Given prepared quantity for a category is set to <raw>
      When the field is validated
      Then the result is <outcome>

      Examples:
        | raw  | outcome                          |
        | blank| invalid — required               |
        | 0    | valid                            |
        | 1    | valid                            |
        | 1000 | valid                            |
        | 1001 | invalid — above maximum          |
        | -1   | invalid                          |
        | 1.5  | invalid — not a whole number     |

    @inputs @waste @blank-vs-zero
    Scenario Outline: Overproduction waste validation for every category
      Given overproduction grams for a category is set to <raw>
      And prepared weight is high enough that physical-weight limits are not the failing reason
      When the field is validated
      Then the result is <outcome>

      Examples:
        | raw   | outcome                          |
        | blank | invalid — required               |
        | 0     | valid                            |
        | 1     | valid                            |
        | -1    | invalid                          |
        | 1.5   | invalid — not a whole number     |

    @inputs @independence
    Scenario: Forecast context is never auto-copied into actual fields
      Given a read-only submitted forecast is visible
      When the staff enter actual customers, prepared quantities, and overproduction
      Then those actual fields are not prefilled from the forecast
      And forecast values are not posted into wasteMeasurement

  # ---------------------------------------------------------------------------
  # PHYSICAL VALIDITY
  # ---------------------------------------------------------------------------

  Rule: Measured overproduction cannot exceed prepared weight

    preparedWeightGrams = preparedQuantity × portionWeightGrams
    overproductionGrams must be <= preparedWeightGrams
    Do not clamp waste. Do not invent negative observed demand. Reject before submission.

    @validation @waste @physical
    Scenario Outline: Overproduction against prepared weight
      Given prepared quantity is <prepared> portions
      And portion weight is <portionWeight> grams
      And overproduction is <waste> grams
      When physical validity is checked
      Then the result is <outcome>

      Examples:
        | prepared | portionWeight | waste | outcome                                      |
        | 10       | 120           | 0     | valid                                        |
        | 10       | 120           | 400   | valid                                        |
        | 10       | 120           | 1200  | valid — waste equals prepared weight         |
        | 10       | 120           | 1201  | invalid — waste exceeds prepared weight      |
        | 0        | 120           | 0     | valid                                        |
        | 0        | 120           | 1     | invalid — waste exceeds prepared weight      |

  # ---------------------------------------------------------------------------
  # PORTION WEIGHTS
  # ---------------------------------------------------------------------------

  Rule: Portion weights are application reference data and are never posted

    @units @portion-weights @data
    Scenario: Portion weights are not included in wasteMeasurement
      When Finalize builds the ACTIVITY
      Then no portionWeightGrams property is posted
      And portion weights remain application reference / calculation data only

    @pending @units @portion-weights @edge
    Scenario: Handling of missing, zero, NaN, or negative portion weights is unresolved
      Given scientifically valid closeout and results require a positive portion weight
      And current development fixtures always supply a positive category default weight
      Then the product team must decide how missing or invalid portion-weight reference data
        blocks Finalize or surfaces a diagnostic
      And the pilot must not invent a hidden fallback weight as approved product behaviour

  # ---------------------------------------------------------------------------
  # MENU ITEM IDENTITY
  # ---------------------------------------------------------------------------

  Rule: Closeout item IDs come from resolved menu slots for the exact service date

    @menu @identity
    Scenario: Item IDs are the actual menu slot IDs for the service date
      Given the published menu for service date D resolves Main, Vegetarian, Soup and Dessert slots
      When wasteMeasurement is built
      Then mainItemId, vegetarianItemId, soupItemId and dessertItemId are those slot IDs
      And item IDs are not derived from display labels
      And another date's items are not substituted

    @pending @menu @identity @forecast
    Scenario: Forecast item-ID mismatch with closeout menu item ID is unresolved
      Given a submitted forecast for the same targetDate has a different item ID for a category
        than the resolved closeout menu slot
      Then the product team must decide whether forecast context for that category is hidden,
        shown with a mismatch warning, or compared at category level despite ID mismatch
      And closeout must never mutate actual item identity to match the forecast

  # ---------------------------------------------------------------------------
  # INBOUND FORECAST CONTEXT
  # ---------------------------------------------------------------------------

  Rule: Chef forecast is read-only context retrieved from kitchenGroupInput.activities

    Retrieval uses approved Kitchen Forecast eligibility:
      - exact targetDate only
      - eligible submission windows only
      - latest eligible activity wins for an actor
      - later ineligible activity cannot replace earlier eligible
      - no cross-date fallback
      - malformed chefForecast ignored safely
      - unrelated templates ignored

    @forecast @retrieval
    Scenario: Exact-date eligible forecast may be shown as read-only context
      Given an eligible chefForecast exists for the closeout service date
      When Service Closeout loads forecast context
      Then matching forecast values may be shown read-only
      And those values are not copied into wasteMeasurement fields

    @forecast @availability
    Scenario: Missing forecast does not block actual closeout
      Given no eligible chefForecast exists for the closeout service date
      When Service Closeout opens
      Then an appropriate "No submitted forecast" context is shown
      And actual customers, prepared, and waste fields remain usable
      And Finalize remains possible when all actual closeout data are valid
      And no fabricated forecast zeroes are invented as real submissions

    @pending @forecast @display
    Scenario: Whether closeout shows only the recorder's forecast or all staff forecasts is unresolved
      Given the GameBus contract text says all exact-date staff forecasts are shown
      And the master plan and current UI describe authenticated-user "Submitted forecast" context
      And current implementation resolves only the authenticated user's eligible forecast
      Then the product team must decide the approved display set
      And this task must not redesign the UI without that decision

    @demo @forecast @synthetic
    Scenario: Synthetic forecast fallback is pilot/dev support only
      Given synthetic forecast fallback is enabled in configuration
      And no real eligible forecast exists for the authenticated user and service date
      When Service Closeout shows forecast context
      Then a clearly labelled synthetic forecast may appear
      And the synthetic forecast is never posted
      And it must not be mistaken for a real participant submission
      And the configuration must be set false before production data collection

  # ---------------------------------------------------------------------------
  # FINALIZE LIFECYCLE
  # ---------------------------------------------------------------------------

  Rule: One successful Finalize posts exactly one wasteMeasurement ACTIVITY

    @submit @happy-path
    Scenario: Successful embedded Finalize posts one ACTIVITY
      Given the form is complete and valid
      And the menu is available
      And access policy permits finalization
      And the GameBus task is ready
      When the staff click Finalize service
      Then exactly one wasteMeasurement ACTIVITY is posted
      And the page enters a finalized state
      And a second Finalize cannot post another ACTIVITY in the same session

    @submit @standalone
    Scenario: Standalone Finalize does not post ACTIVITY
      Given the experience is not embedded in GameBus
      When Finalize succeeds locally
      Then local finalized state is stored
      And no ACTIVITY is posted

    @submit @failure
    Scenario: Failed post preserves draft and is retryable
      Given Finalize is attempted in embed mode
      And the ACTIVITY post fails
      Then the user sees an error
      And draft values are preserved
      And the form is not falsely marked finalized
      And a later retry may post when still valid

    @submit @guard
    Scenario: GameBus task not ready blocks Finalize
      Given the experience is embedded
      And the GameBus task is not ready
      Then Finalize is disabled or blocked

    @submit @guard
    Scenario: Rapid double click does not create duplicate successful closeouts
      Given Finalize is clicked more than once in quick succession after a successful post path
      Then at most one wasteMeasurement ACTIVITY is posted for that successful finalize

  # ---------------------------------------------------------------------------
  # ONE CLOSEOUT PER DATE
  # ---------------------------------------------------------------------------

  Rule: Product intends one shared closeout per service date

    @domain @uniqueness
    Scenario: Intended workflow is one shared closeout per targetDate
      Then the product model is one shared whole-canteen closeout for each service date

    @pending @domain @uniqueness @platform
    Scenario: Cross-session / multi-user uniqueness enforcement is unresolved
      Given the frontend session prevents a second successful Finalize after one success
      And the repository has no approved reliable readback gate that blocks reopen/finalize when
        a wasteMeasurement already exists for the date
      Then global uniqueness across page reopen and multiple authorized users remains a
        GameBus / platform verification concern
      And the pilot must not invent a frontend-only uniqueness mechanism as approved product

    @pending @domain @duplicates @consumers
    Scenario: Duplicate existing wasteMeasurement selection for consumers is unresolved
      Given pilot or test data may contain more than one wasteMeasurement for the same serviceDate
      And current results consumers currently pick one measurement by latest submission instant
      Then the product team must approve whether latest-wins, earliest-wins, reject-all, or
        another rule is the consumer selection policy
      And that rule must not be treated as approved solely because code already sorts by time

  # ---------------------------------------------------------------------------
  # OUTBOUND CONTRACT
  # ---------------------------------------------------------------------------

  Rule: wasteMeasurement posts exactly the fifteen required properties

    @data @contract
    Scenario: Required property set is exact
      When a successful wasteMeasurement ACTIVITY is built
      Then it includes exactly these property references:
        | ref                         |
        | serviceDate                 |
        | actualCustomers             |
        | mainItemId                  |
        | preparedMainQuantity        |
        | vegetarianItemId            |
        | preparedVegetarianQuantity  |
        | soupItemId                  |
        | preparedSoupQuantity        |
        | dessertItemId               |
        | preparedDessertQuantity     |
        | overproductionMeatKg        |
        | overproductionVegetarianKg  |
        | overproductionSoupKg        |
        | overproductionDessertKg     |
        | submittedAt                 |
      And there are no missing required refs
      And there are no duplicate refs
      And property shape is template plus obj.value
      And activity type is ACTIVITY
      And activity template is wasteMeasurement

    @units @contract
    Scenario Outline: Grams convert to kilograms exactly once at the mapper boundary
      Given overproduction for a category is <grams> grams in the domain closeout
      When wasteMeasurement is mapped
      Then the corresponding overproduction kilogram property is <kg>

      Examples:
        | grams | kg    |
        | 0     | 0     |
        | 1     | 0.001 |
        | 500   | 0.5   |
        | 1000  | 1     |

    @security @contract
    Scenario: Forbidden fields are absent from wasteMeasurement
      When wasteMeasurement is built
      Then it does not include portionWeightGrams
      And it does not include headChefUserId
      And it does not include chefId
      And it does not include chefForecast fields
      And it does not include student fields
      And it does not include scoring or ranking fields
