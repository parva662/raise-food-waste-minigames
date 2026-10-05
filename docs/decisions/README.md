# Recorded decisions (ADRs)

**Documentation role:** Repository lifecycle / governance (not a Diátaxis type).

Use this folder for short Architecture Decision Records when a choice needs a durable, citable rationale beyond chat history or a single product brief.

## When an ADR is appropriate

- Cross-cutting architecture (SPA boundaries, GameBus transport vs product adapters, shared calendar/menu ownership).
- A lasting integration convention (e.g. which Input Collection a family of surfaces may read).
- A deliberate trade-off that future developers must not reverse casually.

## When an ADR is not appropriate

- Ordinary product acceptance rules → approved `.feature` files (+ product explanation pages).
- Locked slugs, schemas, hashes → `docs/contracts/` / slug contract.
- “What ships on `main` today” → `docs/current-state/`.
- One-off bug fixes or implementation details with no lasting decision.
- Study narrative → charter / demoted master plan (explanation only).

Do **not** invent ADRs for past decisions retrospectively unless the team explicitly wants a historical record. Prefer writing ADRs when a **new** decision is agreed.

## Naming / numbering

- Files: `NNNN-short-kebab-title.md` (four-digit zero-padded sequence).
- Next number = highest existing `NNNN` + 1. If none exist yet, start at `0001`.
- Title in the file matches the decision in one line.

## Minimal template

Copy into a new file:

```markdown
# NNNN — Short title

**Status:** Proposed | Accepted | Superseded by NNNN
**Date:** YYYY-MM-DD

## Context

What forces the decision? What constraints matter (GameBus, research pilot, one-SPA, …)?

## Decision

What we will do. Be specific enough that implementers and agents can follow it.

## Consequences

What becomes easier, harder, or forbidden. Note follow-ups (docs/contracts/features) if needed.
```

Accepted ADRs should be linked from `docs/architecture/` or the relevant contract/product page when they affect day-to-day work. Status changes (especially **Superseded**) stay in this folder — do not silently delete history.
