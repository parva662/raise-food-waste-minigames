# Kitchen Skills Challenge — GameBus TASK architecture

**Status:** Implemented on `main`. Production routes are ready for Custom Embed Pages.
**Active GameBus environment:** `https://foodtracker.gamebus.eu`
**Student schemas:** Manually verified on foodtracker. Student `trimSmart` / `rescueAndReuse` / `portionPrecision` posting is enabled.
**Tutor review:** `wastePracticeReview` posts `SILENT_ACTIVITY` with `actors: [selectedStudentActorId]`. Live trainer posting is enabled. The tutor iframe stays open after submit.

## Decision

**One Custom Embed TASK contains all three Kitchen Day activity templates:**

- `trimSmart`
- `rescueAndReuse`
- `portionPrecision`

The iframe receives **one** `TASK` (later TASK messages are ignored by `src/platform/gamebus/bridge.ts`).

Student Trim / Reuse / Portion each post **`SILENT_ACTIVITY`** with the same activity `data` as before (`template`, `start`, `end`, `properties`). That matches GameBus custom-task behaviour: silent posts store `/api/me/activities` and **do not close** the task dialog. After each successful silent post the SPA keeps the entry in local session state and continues Portion → Trim → Reuse → summary. **Add more ingredients** keeps the iframe open. **Finish challenge** then posts `{ type: 'EXIT' }` (`src/platform/gamebus/exit.ts`). Official protocol: [`GAMEBUS.md`](GAMEBUS.md).

Tutor `wastePracticeReview` posts **`SILENT_ACTIVITY`** with review properties including required `reviewedGame` plus `actors: [selectedStudentActorId]`. Do **not** add a `studentId` property. One review per `sessionId` + `reviewedGame` (up to three per Kitchen Day when each module has evidence). After submit the tutor iframe stays open so the chef can review another student or module.

Do **not** split Kitchen Day into three embeds. Embedded `sessionId` is one student + one Kitchen Day: `kitchen-day:<taskId>:<actorId>:<sessionDate>`. Do not persist actor id as a Kitchen Day activity property.

`wastePracticeReview` stays on the tutor TASK. It is not required on the student Kitchen Day TASK. Review posts validate that template on the current TASK before building the silent activity. Trainer listing uses dedicated `kitchenSkillsTrainerInput.activities`. GameBus request:

`/api/groups/activities?where={"activity":{"template":{"$in":["trimSmart","rescueAndReuse","portionPrecision","wastePracticeReview"]}}}`

Do not reuse `kitchenGroupInput` (that collection is `chefForecast` / `wasteMeasurement`). Student Progress uses `kitchenGroupInputSelf.activities` (`GET /api/me/activities`) and does not wait for tutor review. Do **not** attach `kitchenSkillsTrainerInput` or any raw `GET /api/groups/activities` Kitchen Skills feed to student Progress. Anonymous peer comparison is blocked until a privacy-safe GameBus aggregate exists.

## Evidence (inspected, not inferred)

1. Live foodtracker TASK payloads already use `activityTemplates: TaskActivityTemplate[]`.
2. Live chef-mission **service-closeout** embed `01a081a9-4fee-7772-b1c6-bdfc7a362ecb` lists **three** templates on one `USER_TRIGGERED_EMBEDDED` task: `chefForecast`, `kitchenServiceCloseout`, `wasteMeasurement`.
3. Existing Trim Smart v1 still posts **`ACTIVITY`** from `#/waste/trim-smart`. Kitchen Skills Challenge student modules on `#/kitchen-day*` post **`SILENT_ACTIVITY`** instead so the iframe is not destroyed between Trim, Reuse, and Portion. Trainer `wastePracticeReview` also posts **`SILENT_ACTIVITY`** so the chef can continue to the next student.

## Client rules

- Embedded Kitchen Day waits for a valid TASK **and** `inputCollectionPari.me`, then locks `sessionId` / `sessionDate` once. Later TASK or INPUT_COLLECTIONS refreshes cannot replace them.
- Embedded student hydration and Student Progress use `getRawKitchenSelfActivitiesInput` (no actor-id equality filter).
- Embedded trainer listing and persisted tutor reviews use `getRawKitchenSkillsTrainerActivitiesInput`. Do not read `kitchenGroupInput` on Kitchen Skills trainer.
- Builders call `selectKitchenSkillsActivityTemplate(task, slug)` and fail if any of the three templates is missing.
- Review builders call `selectWastePracticeReviewTemplate(task)` and fail if `wastePracticeReview` is missing.
- `KITCHEN_SKILLS_STUDENT_LIVE_INTEGRATION_READY` is `true` after manual verification of the student activity/property setup on foodtracker.
- `KITCHEN_SKILLS_TRAINER_LIVE_INTEGRATION_READY` is `true` after confirmation of trainer on-behalf-of-student posting (`actors: [selectedStudentActorId]`).
