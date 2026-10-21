# Session Review, Student Progress, and tutor assessment

> **Documentation role:** Explanation — feedback surfaces and tutor workflow.
> **APPROVED PRODUCT TARGET**. Implemented on `main` at `#/kitchen-day/review`, `#/kitchen-day-progress`, and `#/kitchen-day-tutor`.
>
> Filename is historical. Product wording is **Tutor** / **Tutor assessment**. The GameBus activity slug remains `wastePracticeReview`.
>
> Slugs / properties: [`GAMEBUS_SLUG_CONTRACT.md`](GAMEBUS_SLUG_CONTRACT.md). Routes: [`../../contracts/KITCHEN_SKILLS_CHALLENGE_ROUTES.md`](../../contracts/KITCHEN_SKILLS_CHALLENGE_ROUTES.md). Protocol: [`../../contracts/GAMEBUS.md`](../../contracts/GAMEBUS.md).

## 1. Two feedback layers

| Layer | Content |
|-------|---------|
| Objective Trim vs JAMIX | Recipe-ingredient Hävikki (`referenceWastePercent`) compared with recorded starting weight and removed grams. Not a tutor score. Not shown on the student Trim game. |
| Tutor assessment | One review per **recipe and evidenced module** (`sessionId` + `recipeId` + `reviewedGame`): Time efficiency 0–5, Preparation quality 0–5, optional feedback |
| Anonymous peer context | Progress-only. Group median of Trim **delta vs each person's own JAMIX**, and like-for-like tutor score medians. Never a new overall score. |

Objective Trim math (shared read-model): actual % = removed / starting × 100; reference grams = starting × JAMIX % / 100; delta pp = actual % − JAMIX %. Session totals weight by starting grams (Σ removed / Σ starting; Σ expected reference grams / Σ starting). Neutral copy: above / below / at reference — not “better”. Missing join → **Reference unavailable** (never guessed). 0% Hävikki is a valid reference.

System comparison never pre-fills tutor scores. Analytics are never stored as activity properties. There is no automatic combined Portion score or overall tutor score.

## 2. Student surfaces

| Surface | Route | Scope |
|---------|-------|-------|
| Session Review | `#/kitchen-day/review` | Current locked session only; read-only; per-module tutor readbacks; no student-facing waste % or Hävikki |
| Student Progress | `#/kitchen-day-progress` | Own history; Overview / Progress; Overview Trim card always shows Actual trim, Kitchen reference (or Reference unavailable), and Difference; module tabs default to **Recent** (last 8 sessions + span, Recent-only charts) with **History** archive (filters, ~10 rows/page); weighted Trim vs kitchen reference on results only; peer cards stay “Not enough peer data yet” until a privacy-safe anonymous aggregate exists; no leaderboard |

Neither posts measurement activities. Progress does not invent ranking or an overall tutor score.

## 3. Tutor dashboard — one assessment per recipe and evidenced module

`#/kitchen-day-tutor`: **staff list** → **To assess** / **Awaiting confirmation** / **Reviewed** session tabs → **session workspace** → recipe selector (only when the session has more than one recipe) → module tabs in trainer order **Portion → Trim → Rescue** (evidenced modules only; presentation order only, slugs unchanged).

- Every evidenced recipe–module pair has exactly one of three states: **Needs assessment** (no assessment submitted), **Awaiting confirmation** (assessment dispatched but not yet in the trainer feed / no `persistId`), **Reviewed** (confirmed in the feed). Each saved Portion recipe needs its own Portion assessment; Trim/Reuse assessments are required only when that recipe has Trim/Reuse evidence (recipes with only Trim/Reuse evidence are listed too). Modules without evidence create **no** review requirement.
- Recipe and session status roll up the same way: **Needs assessment** while any evidenced pair has no assessment; otherwise **Awaiting confirmation** while any is unconfirmed; **Reviewed** only when every pair is confirmed. Counts are shown separately as “X confirmed · Y awaiting confirmation · Z outstanding”. Legacy Trim/Rescue rows without `recipeId` attach only when the session has exactly one Portion recipe; otherwise they stay unattributed, count as outstanding, and are shown as **Evidence without a recipe link** (no guessed association, no assessment form).
- The GameBus trainer feed is fetched only when the task is opened; there is no refresh API or ACK. The awaiting state explains this (close and reopen the task to check). If a reopened feed still lacks an assessment sent more than 60 s before that feed loaded, the tutor sees a warning and may choose **Assess again** after a confirmation dialog. This discards only the local unconfirmed row and its dispatch marker; nothing is re-posted automatically.
- Kitchen Management keeps its own labels (**Awaiting assessment** / **Partially reviewed** / **Reviewed**); “partially” there means some pairs are confirmed or awaiting while the session is not fully reviewed.
- Review identity is `sessionId` + `recipeId` + `reviewedGame` (plus student actor when attaching from the feed). Merge/dedupe must never collapse multi-recipe Portion reviews that share only `sessionId` + `reviewedGame`.
- `postMessage` success is **not** persistence. UI states: not submitted → sending → sent awaiting confirmation → confirmed saved (feed/`persistId`). A definite **pre-dispatch** failure (client validation / build) may retry and must name missing property slugs when links are incomplete. An already-dispatched assessment with unknown persistence must **not** post again — GameBus does not document a reliable iframe rejection ACK or idempotency key. A non-authoritative `sessionStorage` dispatch marker may block accidental reload duplicates; it is never evidence of persistence. Never mark **Reviewed** from an awaiting local row alone.
- Close / leave confirmation examines **all** unsaved recipe–module drafts for the tutor session map (not only the active tab). Pending dispatched assessments are not unsaved drafts.
- Staff overview: compact rows (name · sessions · to assess · awaiting · reviewed) with search. Session history: one row per session (date · time, recipe count, modules, confirmed / awaiting / to-assess counts, status, **Open session →**).
- Session workspace: student, date and time only in the sticky header (with **Back** / **Close**); one progress line (status + counts); recipe chips with “N recipes · R of N reviewed” only for multi-recipe sessions; module tabs with per-module status; two columns (evidence without repeated headings | assessment) stacking below ~52rem. The assessment column shows the form (needs assessment), the sent values without a submit button (awaiting), or a compact confirmed readback (reviewed). The workspace opens on the first pair needing assessment, else the first awaiting pair, and never switches module on its own after that. Historical session-level reviews stay in a collapsible secondary section.
- Independent draft per student + `sessionId` + `recipeId` + module; accessible **0–5** score selectors (unselected ≠ `0`). Switching recipe/module must not lose or mix unsaved drafts.
- Submit one `wastePracticeReview` per recipe–module pair with evidence as `SILENT_ACTIVITY` + RAISE `actors: [selectedStudentActorId]`, with `recipeId` and `reviewedGame`. Exact properties: slug contract. Outbound payload does **not** include `selectedTaskOfMission` (platform/mission linking if that error appears live).
- **Close** posts `{ type: 'EXIT' }` only (no review). Confirm if the active draft is dirty.
- Duplicate posts for the same confirmed `sessionId` + `recipeId` + `reviewedGame` are rejected. Failed or unconfirmed attempts must not permanently block retry.
- **Historical compatibility:** older `wastePracticeReview` rows without `recipeId` remain readable as **Historical session-level assessment**. They do not invent a recipe association, do not mark every recipe reviewed, and do not block new recipe-specific reviews.

**DEPRECATED property names:** see slug contract (`reviewedActivityId`, `reasonCode`, `freeTextNote`, `unusualEvent`, `serviceDate`, …).

## 4. Retrieval (product rules)

| Who | Product rule | Feed |
|-----|--------------|------|
| Student | Progress shows Trim / Reuse / Portion before tutor review exists; keep only activities whose `actor.id` matches the authenticated user; attach reviews by `sessionId` + `recipeId` + `reviewedGame` (legacy rows without `recipeId` stay session-level) for that same actor | `kitchenGroupInputSelf` |
| Student Progress peers | Anonymous aggregate only. Raw peer activities, identities, reviews, and chef feedback must never reach the participant client. Blocked until a verified privacy-safe GameBus projection exists; UI shows “Not enough peer data yet”. Do not attach trainer-style `GET /api/groups/activities` | none |
| Tutor | Group by actor; actor match when attaching reviews | `kitchenSkillsTrainerInput` |
| Session Review | May hydrate reviews from both self and trainer feeds (dedupe) | both |

Do **not** reuse `kitchenGroupInput`. Do **not** invent child REST pagination — UX windowing consumes whatever INPUT_COLLECTIONS delivers. Students with zero Kitchen Skills activity are not listed (no group-members collection in this phase). Peer cards never show names, actor ids, or raw peer activities.

Debug: with `?gamebusDebug=1` (or DEV), Progress can log `kitchen-skills-progress.self-feed-reviews`.

## 5. Non-goals

Automatic score from waste % or Portion metrics; competitive leaderboard; reuse verification; inventing an overall tutor score across modules.
