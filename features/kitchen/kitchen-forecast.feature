# DOCUMENTATION STATUS: APPROVED ACCEPTANCE SPECIFICATION
#
# The product owner approved this specification. Scenarios tagged @pending remain open
# product questions, not requirements, and are deliberately deferred for the pilot.
#
# Sources reconstructed from:
#   - confirmed product decisions recorded with the product owner
#   - docs/product/KITCHEN_FORECAST.md
#   - docs/product/RAISE_BARLAUREA_MASTER_PLAN.md (§2.2, §2.3)
#   - docs/contracts/KITCHEN_FORECAST_GAMEBUS.md
#   - docs/contracts/KITCHEN_FORECAST_ADMIN_SETUP.md
#   - docs/archive/SPEC_LEGACY.md §9 (HISTORICAL)
#   - docs/current-state/IMPLEMENTATION_STATUS.md, docs/current-state/ROADMAP.md
#
# PILOT / TEST CONFIGURATION — NOT PRODUCT BEHAVIOUR
#   During the pilot, GameBus is configured to allow the embedded task to be played
#   more than once so the integration can be retested. That is temporary operational
#   test configuration. It does not redefine the product: the intended behaviour is
#   one successful forecast per authenticated staff member per target service date.
#   No repeat-play allowance is specified as behaviour anywhere in this file.
#
@product @kitchen @kitchen-forecast @gamebus
Feature: Kitchen staff forecast the portions needed for a lunch service
  Authorized kitchen staff declare, for one operational lunch service, how many customers
  they expect and how many portions of each menu category they plan to produce.

  The forecast is an operational and research record. Each participant's own forecast is
  later compared with the same shared whole-canteen Service Closeout for that service
  date. Kitchen Forecast is never compared against Student Lunch declarations.

  Product principles:
    - The authenticated GameBus kitchen-staff account is the forecast owner.
    - Personal accounts only; no shared kitchen account and no staff identifier is typed.
    - Several kitchen-staff members may each submit their own forecast for one service date.
    - A staff member can never see or change another staff member's forecast.
    - Each staff member may create exactly one successful forecast per target service date.
    - A successful forecast is final for that staff member and that service date.
    - A failed submission created nothing, so it may be retried while the window is open.
    - Europe/Helsinki is the operational timezone regardless of device timezone.
    - The time of day resolves exactly one target service date; there is never a choice
      between two targets and there is no target-date picker.
    - Late forecasts are not accepted; once a service date's windows close, it can no
      longer be forecast.
    - Every forecast explicitly carries its target service date; the service date is never
      inferred from the submission time.
    - Expected customers is a headcount forecast; menu quantities are portion forecasts.
    - Those forecasts are independent and need not sum to the expected customers.
    - Soup and dessert are one soup-menu forecast entered once.
    - Blank means unanswered; an explicit 0 is a deliberate forecast.
    - Forecast quantities are whole numbers from 0 through 1000 inclusive.
    - Confidence and a note are optional research context, omitted when unanswered.
    - There is no separate review screen; staff complete the form and submit directly.
    - The forecast record carries no result, reward, or waste data.

  Background:
    Given the operational timezone is "Europe/Helsinki"
    And the kitchen-staff member is authenticated in GameBus
    And the authenticated GameBus identity is the authoritative forecast owner
    And the kitchen-staff member has been assigned the Kitchen Forecast task
    And the system has access to the operational service calendar and the published menu

  # ---------------------------------------------------------------------------
  # ENTRY, IDENTITY, AND OWNERSHIP
  # ---------------------------------------------------------------------------

  Rule: The forecast belongs to the authenticated kitchen-staff account

    @happy-path @platform
    Scenario: Kitchen staff open the forecast from their own GameBus account
      Given a kitchen-staff member is logged into GameBus with a personal account
      When the kitchen-staff member opens the assigned Kitchen Forecast task
      Then the Kitchen Forecast experience opens
      And the forecast is associated with that authenticated GameBus identity
      And the kitchen-staff member is not asked to type or select a staff identifier

    @security @identity
    Scenario: No shared kitchen account is used
      Then the Kitchen Forecast task is never completed from a shared kitchen login
      And every forecast is attributable to one personal authenticated account

    @security @identity
    Scenario: A kitchen-staff member cannot forecast on behalf of someone else
      When the kitchen-staff member opens the forecast
      Then there is no control for selecting another staff member as the owner
      And there is no supported action for submitting a forecast for another account

    @security @identity
    Scenario: No separate kitchen identifier is stored on the forecast record
      Given the kitchen-staff member submits a forecast
      Then the recorded forecast carries no separate kitchen or chef identifier
      And ownership is established solely by the authenticated GameBus account

  # ---------------------------------------------------------------------------
  # SEVERAL KITCHEN-STAFF MEMBERS PER SERVICE DATE
  # ---------------------------------------------------------------------------

  Rule: Several staff members may each forecast the same service date independently

    @multi-account
    Scenario: Two kitchen-staff members forecast the same service date
      Given kitchen-staff member A and kitchen-staff member B are both assigned the task
        for the same target service date
      When A submits their own forecast
      And B submits their own forecast
      Then both forecasts are valid independent records
      And both point to the same target service date
      And each record belongs to its own authenticated account

    @multi-account @security
    Scenario: One staff member cannot see or change another's forecast
      Given kitchen-staff member A has already submitted a forecast
      And kitchen-staff member B is authenticated
      When B opens the Kitchen Forecast task
      Then B cannot view A's entered quantities
      And B cannot modify A's forecast
      And B cannot resubmit A's forecast

    @multi-account @research
    Scenario: Each participant is compared against the shared service outcome
      Given several kitchen-staff members submitted forecasts for one service date
      Then each participant's own forecast is compared with the same shared whole-canteen
        Service Closeout for that service date
      And Kitchen Forecast is not compared against Student Lunch declarations

  # ---------------------------------------------------------------------------
  # TARGET SERVICE-DATE RESOLUTION
  # ---------------------------------------------------------------------------

  Rule: The forecast targets one automatically resolved operational lunch service

    @calendar
    Scenario: The target service date is resolved by the product, not chosen
      When the kitchen-staff member opens the forecast
      Then exactly one target service date is resolved automatically
      And the target service date is shown together with that day's menu items
      And there is no control for choosing a different service date

    @calendar @weekend
    Scenario: Weekends are never offered as a forecast target
      Given Saturday and Sunday are not operational lunch-service days
      When the target service date is resolved
      Then no Saturday or Sunday service is offered

    @calendar @closure
    Scenario: An explicitly closed day is skipped
      Given a candidate service day is explicitly closed
      And a later candidate day is an operational lunch-service day
      When the target service date is resolved
      Then the closed day is not offered as a forecast target
      And the later operational lunch service is used instead

    @calendar @unavailable
    Scenario: No usable service date can be resolved
      Given no upcoming operational lunch service can be resolved
      When the kitchen-staff member opens the forecast
      Then the forecast form is not shown
      And submission is unavailable
      And the kitchen-staff member sees a clear message explaining that the service date
        could not be resolved

    @timezone
    Scenario Outline: Device timezone does not change the target service date
      Given the same real instant is used in every example
      And the device timezone is "<deviceTimezone>"
      When the kitchen-staff member opens the forecast
      Then service-date resolution uses "Europe/Helsinki"
      And the resolved target service date is the same for every example

      Examples:
        | deviceTimezone   |
        | Europe/Amsterdam |
        | UTC              |
        | America/New_York |
        | Asia/Tokyo       |

  # ---------------------------------------------------------------------------
  # MENU AND CONFIGURATION AVAILABILITY
  # ---------------------------------------------------------------------------

  Rule: Missing menu data blocks entry without changing the resolved service date

    @menu
    Scenario: The published menu for the target service is visible
      Given a target service date has been resolved
      And a published menu exists for that service
      When the forecast form is shown
      Then the target service date is visible
      And the main, vegetarian, soup, and dessert item names for that service are visible

    @menu @technical
    Scenario: Missing menu data blocks the form and keeps the resolved service date
      Given a normal operational service date has been resolved
      And the menu or configuration data required for that service cannot be loaded
      When the kitchen-staff member opens the forecast
      Then the resolved target service date does not change
      And the kitchen-staff member is not moved to a later service date
      And the forecast form is not shown
      And submission is unavailable
      And the kitchen-staff member sees a clear unavailable or configuration message

    @menu @closure
    Scenario: A closed canteen day cannot be forecast
      Given the resolved service date is an explicitly closed canteen day
      When the kitchen-staff member opens the forecast
      Then the forecast form is not shown
      And submission is unavailable
      And the kitchen-staff member sees a clear closed-canteen message

    @menu @security
    Scenario: Kitchen staff cannot change the published menu
      Given the menu for the target service is shown
      Then menu content is read-only in this task
      And the kitchen-staff member cannot create, rename, remove, or replace menu items

  # ---------------------------------------------------------------------------
  # TARGET RESOLUTION AND SUBMISSION WINDOWS
  # ---------------------------------------------------------------------------

  Rule: The time of day determines exactly one target service date

    On an operational service day D, evaluated in Europe/Helsinki:

      - 00:00:00 to 07:59:59 — no target, forecast entry is closed.
      - 08:00:00 to 08:29:59 — the target is today, D. This is the same-day grace window.
      - 08:30:00 to 23:59:59 — the target is the next operational service after D, which
        skips weekends and explicitly closed days and is not changed merely because menu
        data is unavailable.

    The same-day grace window exists deliberately: the kitchen professional responsible
    for that service may only know the operational situation and menu requirements when
    arriving that morning — a Monday service being the typical case.

    There is never more than one selectable target, and there is no target-date picker.

    @cutoff @target @boundary
    Scenario: Entry is closed before 08:00 on an operational day
      Given today is an operational service day
      And the Helsinki time is 07:59:59
      Then forecast entry is closed
      And no forecast can be submitted
      And the page does not switch to the next service forecast merely because a later
        service exists

    @cutoff @grace-window @boundary
    Scenario: The grace window opens at exactly 08:00:00 and targets today
      Given today is an operational service day
      And the Helsinki time is exactly 08:00:00
      Then the target service date is today
      And forecast entry is open
      And submission is allowed once all required values are valid

    @cutoff @grace-window @boundary
    Scenario: The grace window still targets today at 08:29:59
      Given today is an operational service day
      And the Helsinki time is 08:29:59
      Then the target service date is today
      And forecast entry is open

    @cutoff @grace-window @advance-window @boundary
    Scenario: At exactly 08:30:00 today closes and the target switches to the next service
      Given today is an operational service day
      And the Helsinki time is exactly 08:30:00
      Then today's service can no longer be forecast
      And the target service date becomes the next operational service after today
      And forecast entry is open for that next service

    @cutoff @advance-window @boundary
    Scenario: After 08:30 the target is the next operational service
      Given today is an operational service day
      And the Helsinki time is 08:30:01
      Then the target service date is the next operational service after today
      And forecast entry is open

    @cutoff @advance-window @boundary
    Scenario: The advance window stays open until the end of the operational day
      Given today is an operational service day
      And the Helsinki time is 23:59:59
      Then the target service date is the next operational service after today
      And forecast entry is open

    @cutoff @grace-window @friday
    Scenario: Friday at 08:29:59 targets Friday's own service
      Given today is Friday and an operational service day
      And the Helsinki time is 08:29:59
      Then the target service date is Friday

    @cutoff @advance-window @friday
    Scenario: Friday at 08:30:00 targets Monday
      Given today is Friday and an operational service day
      And Saturday and Sunday are not operational lunch-service days
      And Monday is the next operational service day
      And the Helsinki time is exactly 08:30:00
      Then the target service date is Monday

    @cutoff @advance-window @friday
    Scenario: Friday at 23:59:59 still targets Monday
      Given today is Friday and an operational service day
      And Monday is the next operational service day
      And the Helsinki time is 23:59:59
      Then the target service date is Monday
      And forecast entry is open

    @cutoff @advance-window @closure
    Scenario: Friday's advance window skips an explicitly closed Monday
      Given today is Friday and an operational service day
      And Monday is explicitly closed
      And Tuesday is an operational service day
      And the Helsinki time is 15:00:00
      Then the target service date is Tuesday
      And Monday is not offered as a forecast target

    @cutoff @weekend
    Scenario: No forecast window is open on a weekend
      Given today is Saturday
      And Saturday and Sunday are not operational lunch-service days
      Then forecast entry is closed
      And no weekend date is ever a target service date

    @cutoff @timezone
    Scenario: Target and windows are evaluated in Helsinki time rather than device-local time
      Given the device-local time and Helsinki time are different
      When Helsinki time reaches 08:30:00 on an operational service day
      Then today's forecast closes and the target switches regardless of the device-local clock

    @cutoff @validation
    Scenario: The window cannot be bypassed from an already-open page
      Given the kitchen-staff member completed the form while a window was open
      When the window closes before the submission is sent
      Then no forecast is recorded for that service date

  Rule: Late forecasts are not accepted

    @cutoff @late
    Scenario: Today's service cannot be forecast once its grace window has closed
      Given the Helsinki time on an operational service day is past 08:30:00
      Then that day's own service can no longer be forecast
      And no late forecast for it is accepted or recorded

    @cutoff @late @data
    Scenario: Normal successful forecasts are recorded as on-time
      Given a forecast is successfully submitted while entry is open
      Then the recorded timing status is "on-time"
      And the product never produces an accepted late forecast, even though the external
        schema may retain a late value for compatibility

  # ---------------------------------------------------------------------------
  # TARGET DATE IS ALWAYS EXPLICIT
  # ---------------------------------------------------------------------------

  Rule: Every forecast explicitly carries its target service date

    @data @target-date
    Scenario: The target service date is recorded explicitly
      Given a forecast is successfully submitted
      Then the record explicitly carries the target service date
      And the target service date is not inferred from the submission time

    @data @target-date
    Scenario: An advance submission still records the service date it targets
      Given the forecast is submitted after 08:30 on the previous operational service day
      When the forecast is recorded
      Then the recorded target service date is the service date being forecast
      And it is not the day on which the forecast was entered

    @data @target-date
    Scenario: A forecast is never matched to a different service date
      Given a forecast is needed for a particular service date
      Then only forecasts explicitly carrying that service date are used
      And no forecast for another service date is ever substituted

  # ---------------------------------------------------------------------------
  # FORECAST INPUTS
  # ---------------------------------------------------------------------------

  Rule: The forecast is expected customers plus the menu portion forecasts

    @inputs
    Scenario: The forecast inputs are presented
      When the forecast form is shown
      Then an expected total customers input is presented
      And a Main portion forecast input is presented
      And a Vegetarian portion forecast input is presented
      And a soup-menu portion forecast input is presented
      And the Dessert forecast is shown as part of the soup menu rather than as a separate input

    @inputs @blank-vs-zero
    Scenario: All forecast values start unanswered
      When the forecast form is first shown
      Then expected customers is unanswered
      And every menu forecast is unanswered
      And no value is pre-filled, suggested, or auto-distributed by the product

    @inputs @blank-vs-zero
    Scenario: Blank and zero mean different things
      Given the kitchen-staff member enters 0 for Main
      And the kitchen-staff member leaves Vegetarian unanswered
      Then Main is treated as a deliberate forecast of zero
      And Vegetarian is treated as unanswered
      And the unanswered value blocks submission until it is answered

    @inputs @completeness
    Scenario: Every required editable forecast must be answered before submission
      Given at least one required editable forecast is unanswered
      Then submission is unavailable
      And the kitchen-staff member is told which information is still needed

  Rule: Soup and dessert are one soup-menu forecast

    @inputs @soup-menu
    Scenario: The soup-menu quantity is entered once
      When the kitchen-staff member enters the soup-menu quantity
      Then the dessert forecast takes the same quantity
      And dessert is not offered as a separate editable forecast

    @inputs @soup-menu @data
    Scenario: Soup and dessert are recorded with the same quantity
      Given the kitchen-staff member entered a soup-menu quantity
      When the forecast is submitted
      Then the recorded soup forecast and the recorded dessert forecast hold the same quantity

    @inputs @soup-menu
    Scenario: Clearing the soup-menu quantity clears the dessert forecast
      Given the kitchen-staff member entered a soup-menu quantity
      When the kitchen-staff member clears that quantity
      Then both the soup and dessert forecasts become unanswered

  Rule: Headcount and portion forecasts are independent

    @inputs @independence
    Scenario: Main and vegetarian remain independent forecasts
      Given the kitchen-staff member enters a Main quantity
      When the kitchen-staff member enters a Vegetarian quantity
      Then neither value changes the other
      And neither value changes the soup-menu quantity
      And neither value changes expected customers

    @inputs @no-arithmetic
    Scenario: Portions do not have to add up to expected customers
      Given expected customers and all menu forecasts are answered
      And the portion forecasts do not sum to the expected customers
      Then no total, difference, or balancing figure is presented as a rule
      And no error or warning claims the forecast is inconsistent
      And submission is not blocked
      And the product recognises that one customer may take more than one portion or category

  Rule: Confidence and notes are optional research context

    @inputs @optional
    Scenario: Confidence is optional
      When the forecast form is shown
      Then a confidence choice is offered with clearly labelled levels
      And no confidence level is selected by default
      And the forecast can be submitted without answering confidence

    @inputs @optional
    Scenario: A note is optional
      When the forecast form is shown
      Then a note field for this service day is offered
      And the forecast can be submitted with the note left empty

  # ---------------------------------------------------------------------------
  # VALIDATION
  # ---------------------------------------------------------------------------

  Rule: Forecast quantities are whole numbers from 0 through 1000 inclusive

    @validation
    Scenario Outline: Valid whole-number forecasts are accepted
      When the kitchen-staff member enters <quantity> for "<field>"
      Then the value is accepted as valid

      Examples:
        | field              | quantity |
        | Expected customers | 0        |
        | Expected customers | 120      |
        | Expected customers | 1000     |
        | Main               | 0        |
        | Main               | 1000     |
        | Vegetarian         | 30       |
        | Soup menu          | 40       |

    @validation @boundary
    Scenario Outline: Values above the maximum are rejected
      When the kitchen-staff member enters <quantity> for "<field>"
      Then the value is rejected
      And the allowed whole-number range 0 to 1000 is communicated
      And submission stays unavailable until the value is corrected

      Examples:
        | field              | quantity |
        | Expected customers | 1001     |
        | Main               | 1001     |
        | Vegetarian         | 1001     |
        | Soup menu          | 1001     |

    @validation
    Scenario Outline: Negative forecasts are rejected
      When the kitchen-staff member enters -1 for "<field>"
      Then the value is rejected
      And submission stays unavailable until the value is corrected

      Examples:
        | field              |
        | Expected customers |
        | Main               |
        | Vegetarian         |
        | Soup menu          |

    @validation
    Scenario Outline: Fractional forecasts are rejected
      When the kitchen-staff member enters 12.5 for "<field>"
      Then the value is rejected
      And submission stays unavailable until the value is corrected

      Examples:
        | field              |
        | Expected customers |
        | Main               |
        | Vegetarian         |
        | Soup menu          |

  # ---------------------------------------------------------------------------
  # SUBMISSION — NO SEPARATE REVIEW STEP
  # ---------------------------------------------------------------------------

  Rule: Staff submit directly from the form

    @submit @no-review
    Scenario: There is no separate review screen
      Given all required forecasts are answered and valid
      Then the kitchen-staff member can submit directly from the form
      And no separate review or confirm-summary screen is required
      And the Student Lunch review flow is not applied to Kitchen Forecast

    @submit @happy-path
    Scenario: Kitchen staff submit a complete forecast
      Given all required forecasts are answered and valid
      And the deadline for the target service date has not passed
      When the kitchen-staff member submits the forecast
      Then exactly one forecast is recorded for that staff member and service date
      And the recorded forecast belongs to the authenticated kitchen-staff account
      And the kitchen-staff member sees confirmation naming the target service date

  Rule: An all-zero forecast is valid but requires explicit confirmation

    @submit @all-zero
    Scenario: Submitting an all-zero forecast asks for confirmation
      Given expected customers and every menu forecast are deliberately 0
      When the kitchen-staff member submits
      Then an explicit confirmation is requested before anything is recorded

    @submit @all-zero
    Scenario: Cancelling the all-zero confirmation records nothing
      Given the all-zero confirmation is shown
      When the kitchen-staff member cancels
      Then no forecast is recorded
      And the form remains editable with the entered values intact

    @submit @all-zero
    Scenario: Confirming the all-zero forecast submits it normally
      Given the all-zero confirmation is shown
      When the kitchen-staff member confirms
      Then the all-zero forecast is submitted like any other valid forecast
      And each zero is recorded as the number zero

  # ---------------------------------------------------------------------------
  # ONE SUCCESSFUL FORECAST PER STAFF MEMBER AND SERVICE DATE
  # ---------------------------------------------------------------------------

  Rule: A successful forecast is final for that staff member and service date

    @submit @finality
    Scenario: A successful forecast cannot be followed by a second one
      Given the kitchen-staff member successfully submitted a forecast for the target service date
      Then the Kitchen Forecast experience offers no way to create a second successful
        forecast for that staff member and service date
      And the submitted state is clearly shown

    @submit @finality
    Scenario: A successful forecast cannot be replaced or corrected
      Given a forecast was successfully recorded for the target service date
      Then there is no supported product flow for replacing, correcting, or overwriting it
      And no "latest forecast wins" behaviour is offered

    @submit @finality @platform
    Scenario: Replay availability is governed by the GameBus task, not by the minigame
      Given production intent is one successful forecast per participant and service date
      Then the GameBus task and play configuration governs whether the task can be opened again
      And the minigame does not have to retrieve and display an earlier forecast on a fresh
        page purely to enforce that finality
      And no edit or replace workflow is offered

    @submit @finality @pilot
    Scenario: Pilot replay does not change the product rule
      Given the pilot configuration deliberately allows the task to be replayed for testing
      When more than one activity is left behind for the same participant and service date
      Then the product rule remains one successful forecast per participant and service date
      And downstream selection uses the latest eligible activity
      And no replay allowance is encoded as product behaviour

    @submit @duplicate
    Scenario: Repeated submit attempts create at most one forecast
      Given the kitchen-staff member has a complete valid forecast
      When the kitchen-staff member activates submit repeatedly before the first attempt finishes
      Then at most one forecast is recorded for that staff member and service date

  # ---------------------------------------------------------------------------
  # FAILURE AND RETRY
  # ---------------------------------------------------------------------------

  Rule: A failed submission creates nothing and may be retried

    @network @retry
    Scenario: A failed submission keeps the entered forecast on screen
      Given the kitchen-staff member has a complete valid forecast
      When the submission fails because the forecast cannot be recorded
      Then all entered values remain on screen
      And the kitchen-staff member sees a clear failure message
      And the kitchen-staff member can retry while the submission window is still open

    @network @state
    Scenario: A failed submission is not treated as a successful forecast
      Given the submission failed
      Then no forecast is recorded for that staff member and service date
      And the task is not presented as successfully completed
      And the final submitted state is not shown

    @network @retry @duplicate
    Scenario: Retrying after a genuine failure creates exactly one forecast
      Given a previous attempt failed without recording a forecast
      And the entered values are still present
      When the kitchen-staff member retries
      And the retry succeeds
      Then exactly one forecast exists for that staff member and service date
      And the failed attempt is not counted as a second forecast

    @network @retry @cutoff
    Scenario: Retry is no longer possible once the window closes
      Given a submission attempt failed
      When the eligible window for the target service date closes
      Then the kitchen-staff member can no longer retry for that service date

    @platform
    Scenario: Submission waits until the GameBus task is ready
      Given the experience is embedded in GameBus
      And the GameBus task information has not arrived yet
      Then submission is unavailable
      And the kitchen-staff member is told the task is still loading

  # ---------------------------------------------------------------------------
  # BUSINESS DATA THAT MUST BE RECORDED
  # ---------------------------------------------------------------------------

  Rule: A recorded forecast preserves the facts needed for operations and research

    @data
    Scenario: The recorded forecast preserves the essential business facts
      Given the kitchen-staff member submits a valid forecast
      Then the completed record preserves:
        | business fact                              |
        | authenticated kitchen-staff owner          |
        | target service date                        |
        | expected total customers                   |
        | main menu item and its portion forecast    |
        | vegetarian menu item and its forecast      |
        | soup menu item and its forecast            |
        | dessert menu item and its forecast         |
        | timing status                              |
        | submission timestamp                       |
      And the record matches the agreed GameBus forecast contract

    @data @optional
    Scenario: Optional context is recorded only when it was entered
      Given the kitchen-staff member answered confidence and wrote a note
      When the forecast is submitted
      Then the recorded forecast preserves the confidence answer
      And the recorded forecast preserves the note text

    @data @optional
    Scenario: Unanswered optional context is omitted rather than emptied
      Given the kitchen-staff member left confidence unanswered
      And the kitchen-staff member left the note empty
      When the forecast is submitted
      Then no confidence value is included in the record
      And no note value is included in the record
      And no empty or null placeholder is recorded for them

    @data
    Scenario: Deliberate zero forecasts are recorded as zero
      Given one or more forecasts were deliberately set to zero
      When the forecast is submitted
      Then each zero is recorded as the number zero
      And no zero is recorded as missing data

    @data @boundary
    Scenario: The submission time is recorded as an absolute instant
      Given a forecast is submitted
      Then the submission time is recorded as an absolute timestamp
      And it remains interpretable independently of the device timezone

  # ---------------------------------------------------------------------------
  # FORBIDDEN ACTIONS AND DATA
  # ---------------------------------------------------------------------------

  Rule: Kitchen staff cannot manipulate identity, dates, menu, or outcome data

    @security @forbidden
    Scenario: Kitchen staff cannot forecast for a past service
      Then there is no supported control for choosing a past service date

    @security @forbidden
    Scenario: Kitchen staff cannot choose an arbitrary service date
      Then there is no supported control for replacing the automatically resolved
        service date with an arbitrary date

    @security @forbidden
    Scenario: Kitchen staff cannot submit outside an eligible window
      Given the current Helsinki time falls outside both eligible windows for the target
        service date
      Then no forecast for that service date can be submitted from the task

    @security @forbidden @data
    Scenario: The forecast record carries no identity, result, or reward data
      Given a forecast is recorded
      Then the record contains none of:
        | forbidden data      |
        | chef identifier     |
        | actors              |
        | provider            |
        | result              |
        | accuracy            |
        | waste               |
        | points              |
        | badge               |
      And no result is calculated or displayed inside the forecast task

    @scope
    Scenario: Actual production and waste are not collected here
      When the kitchen-staff member completes the forecast
      Then the form does not collect actual customers served
      And the form does not collect prepared portions
      And the form does not collect measured waste

  # ---------------------------------------------------------------------------
  # RETRIEVAL AND ANALYSIS — SELECTING A PARTICIPANT'S FORECAST
  # ---------------------------------------------------------------------------

  Rule: Selecting a stored forecast for one participant and service date

    An activity for exact target service date D is eligible only when its submission time
    falls in one of these two windows, evaluated in Europe/Helsinki:

      1. on the immediately previous operational service day P, 08:30:00 through 23:59:59;
      2. on D itself, 08:00:00 through 08:29:59.

    Anything outside those windows is ineligible for D.

    These scenarios describe how stored forecasts are READ for operations and research.
    They exist because the pilot GameBus configuration can leave more than one activity
    behind while the integration is being retested. They are NOT permission for a
    production user to intentionally submit more than one forecast: the product behaviour
    remains one successful forecast per staff member per target service date.

    @retrieval @target-date
    Scenario: Only forecasts explicitly carrying the requested service date are considered
      Given stored forecasts exist for several service dates
      When a forecast is selected for one authenticated participant and one service date
      Then only activities whose target service date exactly matches are considered
      And a forecast for any other service date is never used as a fallback

    @retrieval @eligibility
    Scenario: An activity submitted in the previous day's advance window is eligible
      Given an activity carries target service date D
      And it was submitted on the immediately previous operational service day at 16:00:00
      Then that activity is eligible for D

    @retrieval @eligibility
    Scenario: An activity submitted in the same-day grace window is eligible
      Given an activity carries target service date D
      And it was submitted on D at 08:15:00
      Then that activity is eligible for D

    @retrieval @eligibility
    Scenario Outline: Activities submitted outside both windows are ineligible
      Given an activity carries target service date D
      And it was submitted <when>
      Then that activity is ineligible for D
      And it is ignored when selecting a forecast for D

      Examples:
        | when                                                              |
        | on the previous operational service day at 07:00:00               |
        | on the previous operational service day at 08:29:59               |
        | on a weekend day between the previous operational day and D       |
        | on D at 07:59:59                                                  |
        | on D at 08:30:00                                                  |
        | on D at 12:00:00                                                  |
        | several operational days before the previous operational day      |

    @retrieval @pilot
    Scenario: The latest eligible activity is selected when the pilot left several behind
      Given the pilot configuration allowed the task to be replayed
      And several eligible activities exist for the same participant and service date
      When a forecast is selected
      Then the activity with the latest submission time is selected
      And the earlier eligible activities are not used

    @retrieval @pilot
    Scenario: A later ineligible activity does not replace an earlier eligible one
      Given an eligible activity exists for the participant and service date
      And a later activity exists for the same participant and service date but was
        submitted outside both eligible windows
      When a forecast is selected
      Then the earlier eligible activity is selected
      And the later ineligible activity is ignored

    @retrieval
    Scenario: No eligible activity means no forecast for that participant
      Given the participant has no activity inside an eligible window for the service date
      When a forecast is selected
      Then no forecast is returned for that participant and service date
      And no substitute forecast is invented from another date or another participant

  # ---------------------------------------------------------------------------
  # GAMEBUS COMPLETION AND RETURN
  # ---------------------------------------------------------------------------

  Rule: A successful forecast completes the GameBus task

    @gamebus @mission-chain
    Scenario: A successful forecast returns control to GameBus
      Given the kitchen-staff member successfully submits the forecast
      Then the forecast is recorded as a completed GameBus activity rather than a silent one
      And GameBus can complete and close the embedded task as intended
      And the kitchen-staff member returns to the GameBus experience

    @gamebus @configuration
    Scenario: A misconfigured task does not produce a partial record
      Given the GameBus task is missing information required to record the forecast
      When the kitchen-staff member submits
      Then no incomplete forecast record is created
      And the kitchen-staff member sees a clear failure state

  # ---------------------------------------------------------------------------
  # PRODUCT DECISIONS INTENTIONALLY LEFT OPEN
  # ---------------------------------------------------------------------------

  Rule: Unresolved product questions must not be silently invented during implementation

    @pending @rollover
    Scenario: Open-page service-date rollover is deferred for the pilot
      Given the forecast page stays open long enough for its resolved target service date
        to change
      Then the product team must later decide what happens to entered values, to an already
        submitted state, and how the change is communicated
      And the pilot does not resolve this edge case
