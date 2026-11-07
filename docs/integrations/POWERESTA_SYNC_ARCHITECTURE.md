# PoweResta synchronization architecture (proposal only)

**Documentation role:** Explanation / operations proposal.  
**Status:** **Not enabled.** No GitHub Action in this change contacts PoweResta.

## Intended future flow

```text
PoweResta (authorized)
  → server-side sync job (GitHub Actions or equivalent)
  → validate + version snapshot
  → commit/publish approved RAISE menu artefacts
  → GitHub Pages SPA reads static JSON only
```

Credentials and JWTs stay in **repository secrets / Actions environment**, never in frontend bundles, GameBus client collections, committed `.env`, logs, or fixtures.

## Proposed Action design (disabled)

When authorized later, a workflow could:

1. Read `POWERESTA_TENANT`, `POWERESTA_PUBLIC_API_USERNAME`, `POWERESTA_PASSWORD`, site/menu names from secrets.
2. Run `scripts/poweresta` with `POWERESTA_LIVE_NETWORK=1` on the runner only.
3. Fetch published menus for a bounded date window.
4. Validate structure; fail closed on missing/malformed days.
5. Write versioned snapshots under a non-public or reviewable path first.
6. Produce RAISE runtime JSON only after human/product approval gates.
7. Preserve Excel sample menus until an explicit migration cutover flag is set.

**Do not** add `schedule:` cron or workflow_dispatch live sync in the same change that only prepares offline code.

## Safety requirements

| Requirement | Approach |
|-------------|----------|
| No secrets in Pages assets | Sync server-side; SPA keeps reading static files |
| Protect sample menus | Keep `menu:convert` Excel pipeline until cutover ADR |
| Incomplete menus | Fail the job; do not silently invent slots |
| Confidential recipes | Do not publish full recipe detail JSON to public Pages |
| Explicit authorization | Require documented provider enablement + RAISE owner approval before enabling live network |

## Offline foundation already in repo

- Client: `scripts/poweresta/`
- Env template: `.env.poweresta.example`
- Docs: menu adapter, recipe mapping, this architecture note
