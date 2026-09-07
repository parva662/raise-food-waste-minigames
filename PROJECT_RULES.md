# RAISE / GameBus Engineering Rules

These rules apply to all technical work in the RAISE / GameBus food-waste minigames repository.

## Repository source of truth

- Repository: `parva662/raise-food-waste-minigames`
- Local repository: `C:\Users\20184558\gamebus-lunch-dnd-v2`
- Default working branch: `main`
- The current repository implementation is the source of truth.

Before giving any repository-specific diagnosis, implementation advice, or Cursor prompt:

1. Inspect the relevant current files on `main`.
2. Do not rely only on chat history, memory, screenshots, summaries, or assumptions.
3. If GitHub access is available, verify the current code before claiming how the application behaves.
4. When local runtime behaviour matters, verify that the running dev server is actually using this repository and the expected commit. Do not assume `localhost` is current simply because it is open.
5. Check `git status`, current branch, current commit, and whether local `main` is behind `origin/main` when relevant.
6. Never destroy or overwrite uncommitted work to make the repository match remote state.

## Required diagnosis process

Never answer a repository-specific **“what happened?”**, **“why is this happening?”**, or **“is this expected?”** question from memory alone.

Before diagnosing, reconstruct the exact scenario:

- current operational date and time
- `Europe/Helsinki` timezone
- current route
- current service date
- relevant cutoff/deadline
- current branch and commit when relevant
- whether the page was freshly loaded or remained open across a time boundary
- whether the local dev server/build may be stale

Always separate:

1. **Intended product logic**
2. **Current implementation**
3. **Observed behaviour**

Never assume they are the same.

Before saying **“this is expected behaviour”**, verify both the current code and the agreed business rules.

## Date and time logic

The operational timezone is always:

`Europe/Helsinki`

For all date/time-dependent behaviour:

- test before a cutoff
- test exactly at the cutoff
- test after the cutoff
- test a fresh page load
- test a page that remains open across the cutoff
- test weekends and explicitly closed service days when relevant
- test the next valid operational/service day

Dates or service dates derived from the current time must not be stored as stale state when they need to change as time advances.

Prefer one clear source of truth:

`current operational instant -> derived service date -> dependent data/UI`

Do not maintain competing date sources unless there is a deliberate product reason.

## Bug-fixing rules

When fixing a bug:

1. Reproduce the exact reported scenario first.
2. Identify the root cause before proposing the fix.
3. Do not patch only the visible symptom.
4. Check for:
   - stale React state
   - duplicated sources of truth
   - stale builds
   - stale dev servers
   - wrong repository/branch/commit
   - timezone errors
   - boundary-condition errors
5. Add a regression test that reproduces the exact reported scenario.
6. Preserve unrelated behaviour.

A passing existing test suite does not prove the reported scenario is covered. Add the missing scenario explicitly.

## Existing games

Do not change existing games unless the requested change genuinely requires it.

Current product areas include:

- Student Lunch Declaration
- Chef Forecast
- Service Closeout
- Chef Results
- new kitchen/practical-session challenges as they are agreed and implemented

Avoid broad refactors that alter unrelated games while fixing one game.

## GameBus integration rules

- Games run as Custom Embed Pages in GameBus.
- GameBus sends `INPUT_COLLECTIONS` to the iframe.
- Persisted game data is submitted using GameBus `ACTIVITY` messages.
- Current GameBus integration uses property/activity **slugs**, not the legacy `reference` naming where the current code has migrated.
- Never hard-code GameBus user IDs in React.
- Authenticated user identity comes from `inputCollectionPari.me`.
- Shared kitchen/group activities may come from `kitchenGroupInput.activities`.
- Preserve existing GameBus submission semantics unless a product requirement explicitly requires a change.
- Do not infer GameBus capabilities that are not present in the current implementation or documented contract.

## Product workflow

For new games or product changes:

1. Discuss and agree the product/game logic first.
2. Clearly mark unresolved decisions.
3. Do not turn a recommendation into an agreed requirement without confirmation.
4. Do not write implementation code or Cursor prompts until the logic is agreed.
5. Once the logic is agreed, provide one consolidated Cursor prompt.
6. Keep scientific/performance metrics separate from GameBus gamification mechanics when they are conceptually different.

## Uncertainty

If information is uncertain:

- state exactly what is uncertain
- verify it before recommending a change
- do not fill gaps with assumptions
- do not present guesses as repository facts

## Verification before completion

For implementation work, use the repository's relevant checks. Unless the task clearly requires otherwise, verify at least:

- TypeScript compilation
- relevant automated tests
- production build
- any project-specific validation commands affected by the change

Do not weaken, delete, or bypass tests merely to make the suite pass.

## AI assistant instruction

Any AI assistant working on this repository should read this file before performing repository-specific technical analysis or proposing implementation changes.

When this file conflicts with an old chat summary or prior assumption, inspect the current repository and ask for clarification if the intended product rule is still ambiguous.
