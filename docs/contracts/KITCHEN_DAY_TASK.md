# Kitchen Day — GameBus TASK architecture

**Status:** Encoded on `feature/kitchen-day-v1`. Not production-activated.  
**LIVE E2E BLOCKED BY GAMEBUS ADMIN ALIGNMENT.**

## Decision

**One Custom Embed TASK contains all three Kitchen Day activity templates:**

- `trimSmart`
- `rescueAndReuse`
- `portionPrecision`

The iframe receives **one** `TASK` (later TASK messages are ignored by `src/gamebus/bridge.ts`). The child posts multiple `ACTIVITY` messages, each naming the matching template.

Do **not** split Kitchen Day into three embeds. Embedded `sessionId` is one student + one Kitchen Day: `kitchen-day:<taskId>:<actorId>:<sessionDate>`. Do not persist actor id as a Kitchen Day activity property.

`wastePracticeReview` stays on the tutor TASK. It is not required on the student Kitchen Day TASK. Review posts validate that template on the current TASK before building the ACTIVITY. Tutor on-behalf-of-student GameBus registration is unresolved until the live mechanism is inspected.

## Evidence (inspected, not inferred)

1. Live foodtracker TASK payloads already use `activityTemplates: TaskActivityTemplate[]`.
2. Live chef-mission **service-closeout** embed `01a081a9-4fee-7772-b1c6-bdfc7a362ecb` lists **three** templates on one `USER_TRIGGERED_EMBEDDED` task: `chefForecast`, `kitchenServiceCloseout`, `wasteMeasurement`.
3. Existing Trim Smart v1 already posts **multiple** `ACTIVITY` messages from one TASK (`tryPostTrimSmartActivity` + per-attempt keys). There is no GameBus ACK; parent modal close is not treated as required for every post.

## Client rules

- Embedded Kitchen Day waits for a valid TASK **and** `inputCollectionPari.me`, then locks `sessionId` / `sessionDate` once. Later TASK or INPUT_COLLECTIONS refreshes cannot replace them.
- Builders call `selectKitchenDayActivityTemplate(task, slug)` and fail if any of the three templates is missing.
- Review builders call `selectWastePracticeReviewTemplate(task)` and fail if `wastePracticeReview` is missing.
- `KITCHEN_DAY_LIVE_INTEGRATION_READY` remains `false` until live property schemas match the slug contract.
