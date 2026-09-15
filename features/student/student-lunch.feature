# APPROVED PRODUCT TARGET
# Current implementation may differ.
# Do not rewrite this specification merely to match existing code.
# Implementation gaps are resolved separately.
#
@product @student @student-lunch @gamebus @e2e
Feature: Student declares attendance and intended lunch for the next operational service
  The student mission collects a declaration of presence or absence for the next
  operational lunch service and, when attending, the meal components and quantities
  the student intends to take.

  The declaration is currently a research/data-collection activity and an awareness
  intervention. It must not claim to be a reliable kitchen-production forecast unless
  participation is sufficiently complete for that purpose.

  A successfully completed declaration is final. The student then returns to GameBus,
  where the next configured student mission can become available.

  Product principles:
    - The authenticated GameBus student is the person making the declaration.
    - A student can submit only for themself.
    - The target is the next operational service, not simply the next calendar day.
    - Weekends and explicitly closed service days are skipped.
    - Europe/Helsinki is the operational timezone regardless of device timezone.
    - A declaration instance is open until 23:59:00 Europe/Helsinki on its declaration day.
    - Exactly at 23:59:00 the declaration is closed.
    - Before final submission the student may change their choices freely.
    - After successful final submission the declaration cannot be changed or submitted again.
    - Blank and zero are different: blank means unanswered; 0 is a valid whole-number quantity.
    - Quantities use a configured maximum because the final business maximum is not yet fixed.
    - The existing Student Lunch mission must remain separate from the later plate-photo/weight mission.

  Background:
    Given the canteen operational timezone is "Europe/Helsinki"
    And the student is authenticated in GameBus
    And the authenticated GameBus identity is the authoritative student identity
    And the student has been assigned the Student Lunch declaration mission
    And the declaration has not already been completed
    And the system has access to the operational service calendar
    And the system has access to the menu data required to resolve the next service

  # ---------------------------------------------------------------------------
  # ENTRY, LOGIN, IDENTITY, AND OWNERSHIP
  # ---------------------------------------------------------------------------

  Rule: The journey begins from the student's own authenticated GameBus account

    @happy-path @platform
    Scenario: Student A completes the journey from GameBus login to the declaration mission
      Given Student A is logged out of GameBus
      When Student A logs into GameBus using Student A's valid test credentials
      And Student A opens the assigned Student Lunch declaration mission
      Then the Student Lunch experience opens for Student A
      And the declaration is associated with Student A's authenticated GameBus identity
      And the student is not asked to type or select a student identifier

    @multi-account @platform
    Scenario: Student B receives an independent declaration experience
      Given Student B is logged into GameBus
      When Student B opens the assigned Student Lunch declaration mission
      Then the Student Lunch experience opens for Student B
      And the declaration is associated with Student B's authenticated GameBus identity
      And Student B cannot see Student A's declaration

    @security @identity
    Scenario: A student cannot choose another student as the declaration owner
      When the student opens the declaration
      Then there is no control for selecting another student
      And there is no supported action for submitting on behalf of another student

    @security @identity
    Scenario: A student cannot alter another student's declaration
      Given Student A has already submitted a declaration
      And Student B is authenticated
      When Student B opens Student B's own mission
      Then Student B cannot view Student A's meal choices
      And Student B cannot modify Student A's declaration
      And Student B cannot resubmit Student A's declaration

  # ---------------------------------------------------------------------------
  # TARGET SERVICE-DATE RESOLUTION
  # ---------------------------------------------------------------------------

  Rule: The declaration targets the next operational lunch service

    @calendar @happy-path
    Scenario: A normal weekday resolves to the next operational service
      Given today is an open canteen day
      And a later operational service exists
      And that service has a valid menu
      When the student opens the declaration
      Then the target service date is the next operational lunch service
      And the target date is shown to the student

    @calendar @friday
    Scenario: Friday skips the weekend and targets Monday
      Given today is Friday
      And Saturday and Sunday are not operational lunch-service days
      And Monday is open
      And Monday has a valid menu
      When the student opens the declaration
      Then the target service date is Monday
      And no Saturday or Sunday service is offered

    @calendar @closure
    Scenario: A closed Monday is skipped and Tuesday becomes the target
      Given today is Friday
      And Saturday and Sunday are not operational lunch-service days
      And Monday is explicitly closed
      And Tuesday is open
      And Tuesday has a valid menu
      When the student opens the declaration
      Then the target service date is Tuesday
      And Monday is not offered as a declaration target

    @calendar @closure
    Scenario: Consecutive closed days are skipped until an operational service with a menu is found
      Given the next three candidate service days are unavailable or closed
      And the following candidate day is open
      And the following candidate day has a valid menu
      When the student opens the declaration
      Then the target service date is the first later operational service with a valid menu

    @calendar @menu
    Scenario: A service without a valid menu is not presented as a valid declaration target
      Given the next candidate operational service has no valid menu
      And a later operational service with a valid menu exists
      When the student opens the declaration
      Then the service without a valid menu is not used as the target
      And the later operational service with a valid menu is used

    @calendar @unavailable
    Scenario: No upcoming operational service with a valid menu can be resolved
      Given no upcoming operational service with a valid menu can be resolved
      When the student opens the declaration
      Then the declaration form is not shown
      And submission is unavailable
      And the student sees:
        """
        Lunch declaration is unavailable right now.
        We couldn't find an upcoming service with an available menu.
        Please check again later.
        """

    @timezone
    Scenario Outline: Device timezone does not change the operational service date
      Given the same real instant is used in every example
      And the student's device timezone is "<deviceTimezone>"
      When the student opens the declaration
      Then service-date resolution uses "Europe/Helsinki"
      And the resolved target service date is the same for every example

      Examples:
        | deviceTimezone         |
        | Europe/Amsterdam       |
        | UTC                    |
        | America/New_York       |
        | Asia/Tokyo             |

  # ---------------------------------------------------------------------------
  # DECLARATION WINDOW AND DEADLINE
  # ---------------------------------------------------------------------------

  Rule: The declaration is editable only before the 23:59 Helsinki cutoff

    @cutoff @boundary
    Scenario: Submission is allowed immediately before the cutoff
      Given the current Helsinki time is 23:58:59
      When the student is editing the declaration
      Then the declaration remains editable
      And final submission is allowed when all other validation rules pass

    @cutoff @boundary
    Scenario: Submission is closed exactly at 23:59:00
      Given the current Helsinki time is exactly 23:59:00
      When the student is viewing the declaration
      Then the declaration is closed
      And the student cannot submit

    @cutoff @boundary
    Scenario: Submission remains closed after the cutoff
      Given the current Helsinki time is 23:59:01
      When the student is viewing the declaration
      Then the declaration is closed
      And the student cannot submit

    @cutoff @live-page
    Scenario: A page left open across the cutoff becomes non-editable without a reload
      Given the student opened the declaration before 23:59:00 Helsinki time
      And the declaration is still open in the browser
      When Helsinki time reaches 23:59:00
      Then the declaration becomes non-editable
      And final submission becomes unavailable
      And the student does not need to reload the page for the cutoff to take effect

    @cutoff @validation
    Scenario: A student cannot bypass the cutoff using an already-open review screen
      Given the student completed the form before the cutoff
      And the student is viewing the review step
      When Helsinki time reaches 23:59:00 before final confirmation
      Then the final submission is rejected
      And no declaration is created

    @timezone @cutoff
    Scenario: Deadline uses Helsinki time instead of device-local time
      Given the device-local time and Helsinki time are different
      When Helsinki time reaches 23:59:00
      Then the declaration closes regardless of the device-local clock

  # ---------------------------------------------------------------------------
  # MENU PRESENTATION
  # ---------------------------------------------------------------------------

  Rule: The student sees the menu context for the resolved target service

    @menu
    Scenario: Target service date and available meal items are visible before selection
      Given a target service date has been resolved
      And a valid menu exists for that service
      When the declaration form is shown
      Then the target service date is visible
      And the relevant menu item names are visible
      And the student is not asked to change the menu

    @menu @future-enhancement
    Scenario: Menu images are optional enrichment rather than a submission requirement
      Given the menu contains item names
      And menu images may or may not be available
      When the student uses the declaration
      Then missing images do not prevent the declaration from being completed
      And item names remain sufficient to identify the choices

    @menu @security
    Scenario: Student cannot change the canteen menu
      Given the menu for the target service is shown
      Then menu content is read-only
      And the student cannot create, rename, remove, or replace menu items

  # ---------------------------------------------------------------------------
  # ATTENDANCE AND MEAL CHOICE
  # ---------------------------------------------------------------------------

  Rule: The declaration represents either attendance with one meal package or absence

    @meal-choice
    Scenario: Student chooses Regular lunch
      Given the student has not made a final submission
      When the student selects "Regular lunch"
      Then the Regular lunch controls become active
      And the Soup lunch controls are not active
      And the No lunch state is not active

    @meal-choice
    Scenario: Student chooses Soup lunch
      Given the student has not made a final submission
      When the student selects "Soup lunch"
      Then the Soup and Dessert components are presented together as the Soup lunch package
      And the Regular lunch controls are not active
      And the No lunch state is not active

    @meal-choice
    Scenario: Student cannot combine Regular lunch and Soup lunch
      Given the student selected "Regular lunch"
      When the student selects "Soup lunch"
      Then the active meal package becomes "Soup lunch"
      And Regular lunch is no longer active
      And the final declaration contains only one meal package

    @meal-choice @editing
    Scenario: Student can change meal package before final submission
      Given the student selected "Regular lunch"
      When the student changes the selection to "Soup lunch" before final submission
      Then Soup lunch becomes the active meal package
      And the student can continue editing

  # ---------------------------------------------------------------------------
  # REGULAR LUNCH
  # ---------------------------------------------------------------------------

  Rule: Regular lunch contains Main and Vegetarian quantity choices

    @regular @quantity
    Scenario: Main and Vegetarian quantities are shown for Regular lunch
      When the student selects "Regular lunch"
      Then a Main quantity control is visible
      And a Vegetarian quantity control is visible
      And both controls show that quantities are whole numbers

    @regular @quantity
    Scenario Outline: A Regular lunch component may have a measured quantity of zero
      Given the student selected "Regular lunch"
      When the student enters <mainQuantity> for Main
      And the student enters <vegetarianQuantity> for Vegetarian
      Then each entered zero is treated as the number zero
      And no zero is treated as an unanswered field

      Examples:
        | mainQuantity | vegetarianQuantity |
        | 1            | 0                  |
        | 0            | 1                  |
        | 2            | 0                  |
        | 0            | 2                  |

    @regular @quantity
    Scenario: Student can request positive quantities of both Regular lunch components
      Given the student selected "Regular lunch"
      When the student enters a valid positive whole-number quantity for Main
      And the student enters a valid positive whole-number quantity for Vegetarian
      Then both quantities are retained for review

  # ---------------------------------------------------------------------------
  # SOUP LUNCH
  # ---------------------------------------------------------------------------

  Rule: Soup lunch presents Soup and Dessert as one linked package

    @soup @quantity
    Scenario: Soup and Dessert are shown together
      When the student selects "Soup lunch"
      Then a Soup quantity control is visible
      And a Dessert quantity control is visible
      And the package is presented as one meal choice rather than two independent meal packages

    @soup @quantity
    Scenario: Zero remains a valid quantity for a Soup lunch component
      Given the student selected "Soup lunch"
      When the student enters 1 for Soup
      And the student enters 0 for Dessert
      Then Dessert quantity is treated as measured zero
      And Dessert quantity is not treated as blank

  # ---------------------------------------------------------------------------
  # NO LUNCH
  # ---------------------------------------------------------------------------

  Rule: No lunch represents absence from the next service

    @no-lunch
    Scenario: Selecting No lunch deactivates food quantities
      Given the student previously selected a meal package
      And the student entered one or more food quantities
      When the student selects "No lunch"
      Then all food quantity controls become inactive
      And the previously active meal quantities are cleared from the editable state
      And the declaration represents absence

    @no-lunch @editing
    Scenario: Student can change back from No lunch before final submission
      Given the student selected "No lunch"
      When the student selects "Regular lunch" before final submission
      Then the declaration represents attendance again
      And Regular lunch controls become active
      And the student can enter new quantities

    @no-lunch @review
    Scenario: Review summary clearly states that the student will not attend
      Given the student selected "No lunch"
      When the student proceeds to review
      Then the review states that the student will not attend the target service
      And no active meal quantities are shown as intended food choices

  # ---------------------------------------------------------------------------
  # QUANTITY VALIDATION
  # ---------------------------------------------------------------------------

  Rule: Quantities are whole numbers from zero through a configured maximum

    @validation @quantity
    Scenario Outline: Valid whole-number quantities are accepted
      Given the student selected a meal package containing "<item>"
      And the configured maximum for "<item>" is <max>
      When the student enters <quantity> for "<item>"
      Then the quantity is accepted as valid

      Examples:
        | item        | max | quantity |
        | Main        | 5   | 0        |
        | Main        | 5   | 1        |
        | Main        | 5   | 5        |
        | Vegetarian  | 5   | 0        |
        | Soup        | 5   | 3        |
        | Dessert     | 5   | 5        |

    @validation @quantity
    Scenario Outline: Blank quantity is not the same as zero
      Given the student selected a meal package containing "<item>"
      When the "<item>" quantity is left blank
      Then the "<item>" field is considered unanswered
      And the declaration cannot be finally submitted while that required quantity remains unanswered

      Examples:
        | item        |
        | Main        |
        | Vegetarian  |
        | Soup        |
        | Dessert     |

    @validation @quantity
    Scenario Outline: Negative quantities are rejected
      Given the student selected a meal package containing "<item>"
      When the student enters -1 for "<item>"
      Then the value is rejected
      And final submission is unavailable until the value is corrected

      Examples:
        | item        |
        | Main        |
        | Vegetarian  |
        | Soup        |
        | Dessert     |

    @validation @quantity
    Scenario Outline: Decimal quantities are rejected
      Given the student selected a meal package containing "<item>"
      When the student enters 1.5 for "<item>"
      Then the value is rejected
      And final submission is unavailable until the value is corrected

      Examples:
        | item        |
        | Main        |
        | Vegetarian  |
        | Soup        |
        | Dessert     |

    @validation @quantity
    Scenario Outline: Quantity above the configured maximum is rejected
      Given the student selected a meal package containing "<item>"
      And the configured maximum for "<item>" is <max>
      When the student enters <invalidQuantity> for "<item>"
      Then the value is rejected
      And the configured maximum is communicated to the student
      And final submission is unavailable until the value is corrected

      Examples:
        | item        | max | invalidQuantity |
        | Main        | 5   | 6               |
        | Vegetarian  | 5   | 6               |
        | Soup        | 5   | 6               |
        | Dessert     | 5   | 6               |

    @validation @quantity
    Scenario: No reset or clear-all action is required
      Given the student has entered valid choices
      Then the form does not need a dedicated Reset or Clear-all action
      And the student can change individual choices directly before final submission

  # ---------------------------------------------------------------------------
  # REVIEW BEFORE FINAL SUBMISSION
  # ---------------------------------------------------------------------------

  Rule: The student reviews the declaration before making the one final submission

    @review
    Scenario: Review shows the target service and exact intended lunch
      Given the student has completed a valid declaration
      When the student proceeds to review
      Then the target service date is shown
      And the attendance choice is shown
      And the selected meal package is shown when attending
      And each intended component quantity is shown
      And no data is submitted merely by opening the review

    @review @editing
    Scenario: Student can return from review and change the declaration before final submission
      Given the student is on the review step
      And the declaration deadline has not passed
      When the student chooses to edit the declaration
      Then the student returns to the editable declaration
      And the previously entered values are preserved
      And no activity has yet been submitted

  # ---------------------------------------------------------------------------
  # SUCCESSFUL FINAL SUBMISSION
  # ---------------------------------------------------------------------------

  Rule: Successful final submission is one-shot and final

    @submit @happy-path
    Scenario: Student successfully submits an attendance declaration
      Given the student has a valid declaration
      And the deadline has not passed
      When the student confirms the final submission
      Then exactly one student declaration is successfully recorded
      And the recorded declaration belongs to the authenticated student
      And the declaration is final
      And GameBus can mark the mission complete
      And the student is returned to the GameBus experience

    @submit @no-lunch
    Scenario: Student successfully submits an absence declaration
      Given the student selected "No lunch"
      And the deadline has not passed
      When the student confirms the final submission
      Then exactly one absence declaration is successfully recorded
      And no active food quantities are recorded as intended food choices
      And the declaration is final
      And GameBus can mark the mission complete

    @submit @confirmation
    Scenario: Success confirmation contains the key declaration facts before or as the student returns to GameBus
      Given the final submission succeeds
      Then the success state communicates the target service date
      And the success state communicates the exact meal/absence summary
      And the success state communicates the submission time
      And the submission time is recorded as an absolute timestamp
      And the student is returned to GameBus

    @submit @finality
    Scenario: A successful declaration cannot be edited
      Given the student has successfully submitted the declaration
      Then there is no supported product flow for changing the finalized declaration
      And no correction mechanism is available in the current version

    @submit @duplicate
    Scenario: A successful declaration cannot be submitted twice
      Given the student's final declaration was successfully recorded
      When another submit action is attempted for the same completed declaration
      Then no second successful declaration is created

  # ---------------------------------------------------------------------------
  # NETWORK, RETRY, AND DUPLICATE-TAP SAFETY
  # ---------------------------------------------------------------------------

  Rule: Submission failures must not lose the student's work or create duplicates

    @network @retry
    Scenario: Network failure keeps the entered declaration on screen
      Given the student has a valid declaration ready to submit
      When the submission fails because the activity cannot be recorded
      Then the student's meal/absence choice remains available
      And the student's entered quantities remain available
      And the student sees a clear failed state
      And the student can retry

    @network @state
    Scenario: Submission communicates sending, success, and failure states
      Given the student confirms final submission
      When the submission is in progress
      Then the student sees a sending state
      When the submission succeeds
      Then the student sees a successful sent state before returning to GameBus

    @network @state
    Scenario: Failed submission is not presented as completed
      Given the student confirms final submission
      When the submission fails
      Then the mission is not presented as successfully completed by the Student Lunch experience
      And the student sees a retry option
      And the entered data is preserved

    @network @duplicate
    Scenario: Repeated rapid taps create at most one successful declaration
      Given the student has a valid declaration
      When the student activates final submit repeatedly before the first request finishes
      Then the product processes the action as one submission attempt
      And at most one successful declaration is created

    @network @retry @duplicate
    Scenario: Retrying after a genuine failed attempt can create one successful declaration
      Given a previous submission attempt failed without creating a declaration
      And the entered values are still present
      When the student retries
      And the retry succeeds
      Then exactly one successful declaration exists
      And the failed attempt is not counted as a second declaration

  # ---------------------------------------------------------------------------
  # BUSINESS DATA OUTCOMES
  # ---------------------------------------------------------------------------

  Rule: A completed declaration preserves the business facts required for research and later feedback

    @data
    Scenario: Attendance declaration records the essential business facts
      Given the student submits a valid attending declaration
      Then the completed record preserves:
        | business fact               |
        | authenticated student       |
        | target service date         |
        | attendance/presence choice  |
        | selected meal package       |
        | intended component quantities |
        | submission timestamp        |

    @data @no-lunch
    Scenario: Absence declaration records the essential business facts
      Given the student submits "No lunch"
      Then the completed record preserves:
        | business fact               |
        | authenticated student       |
        | target service date         |
        | absence choice              |
        | submission timestamp        |
      And the record does not falsely represent inactive meal quantities as intended food

  # ---------------------------------------------------------------------------
  # FORBIDDEN ACTIONS
  # ---------------------------------------------------------------------------

  Rule: The student cannot manipulate dates, identity, menu, or finalized declarations

    @security @forbidden
    Scenario: Student cannot submit for a past service
      Then the student has no supported control for choosing a past service date

    @security @forbidden
    Scenario: Student cannot choose an arbitrary future service
      Then the student has no supported control for replacing the automatically resolved next operational service with an arbitrary future date

    @security @forbidden
    Scenario: Student cannot see other students' declarations
      Then peer declaration details are not shown in the Student Lunch mission

    @security @forbidden
    Scenario: Student cannot submit after the cutoff
      Given Helsinki time is at or after 23:59:00
      Then no final student declaration can be submitted from the mission

    @security @forbidden
    Scenario: Student cannot reopen the completed GameBus task for another declaration
      Given the mission was successfully completed
      When the student returns to GameBus
      Then the completed mission follows GameBus completion rules
      And the Student Lunch experience does not offer a second declaration path

  # ---------------------------------------------------------------------------
  # MULTI-STUDENT END-TO-END ISOLATION
  # ---------------------------------------------------------------------------

  Rule: Different students create independent declarations

    @e2e @multi-account
    Scenario: Student A and Student B submit different valid declarations independently
      Given Student A is logged into Student A's GameBus account
      And Student A submits a valid "Regular lunch" declaration
      And Student A is returned to GameBus
      When Student A logs out
      And Student B logs into Student B's GameBus account
      And Student B submits a valid "No lunch" declaration
      Then Student A has exactly one declaration belonging to Student A
      And Student B has exactly one declaration belonging to Student B
      And the declarations retain their different choices
      And neither student can see or alter the other's declaration

    @e2e @multi-account @same-service
    Scenario: Two students can submit different choices for the same target service
      Given Student A and Student B are both assigned the declaration mission for the same target service
      When Student A submits "Regular lunch"
      And Student B submits "Soup lunch"
      Then both declarations are valid independent records
      And both point to the same target service date
      And each retains the authenticated student's own meal choice

  # ---------------------------------------------------------------------------
  # HANDOFF TO THE NEXT STUDENT MISSION
  # ---------------------------------------------------------------------------

  Rule: Completing the declaration can lead to the later plate-observation mission

    @gamebus @mission-chain
    Scenario: Successful declaration completes the first mission in the student journey
      Given the student successfully submits the declaration
      When the Student Lunch experience returns control to GameBus
      Then GameBus can mark the declaration mission complete
      And the next configured student mission can become available according to GameBus task rules

    @scope
    Scenario: Plate photo and before/after weight collection are not part of this declaration form
      When the student completes the Student Lunch declaration
      Then the declaration form does not collect the later plate photo
      And the declaration form does not collect the later before-consumption plate weight
      And the declaration form does not collect the later after-consumption plate weight

  # ---------------------------------------------------------------------------
  # PRODUCT DECISIONS INTENTIONALLY LEFT OPEN
  # ---------------------------------------------------------------------------

  Rule: Unresolved product ideas must not be silently invented during implementation

    @pending @quantity
    Scenario: Final maximum item quantities are configurable until the business maximum is agreed
      Given the final maximum quantity has not yet been decided by the product team
      Then implementation must use an explicit configured maximum
      And no undocumented arbitrary maximum should become a permanent business rule

    @pending @meal-semantics
    Scenario: All-zero attending meal semantics require a future explicit decision
      Given zero is valid for individual meal components
      Then the product team must explicitly decide whether an attending meal package with all of its component quantities equal to zero is valid
      And implementation must not infer a permanent rule from test data alone

    @pending @midnight
    Scenario: Behaviour of an already-open page across midnight requires an explicit product decision
      Given the page remains open across midnight Europe/Helsinki
      Then implementation must not silently change the resolved target service inside the same declaration without an approved rule

    @pending @gamification
    Scenario: Student dashboard and gamification are a separate future product feature
      Then the future product should consider:
        | desired capability |
        | personal progress over time |
        | anonymized peer/community comparison |
        | linking declared intent to later plate observations |
        | showing the student's relationship to overall canteen food waste |
        | meaningful gamification beyond fixed GameBus points |
      But these ideas are not acceptance criteria for the current Student Lunch declaration mission
