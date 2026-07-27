# Next steps — GameBus integration

**Contract (authoritative for GameBus):** [`GAMEBUS_LUNCH_CONTRACT.md`](./GAMEBUS_LUNCH_CONTRACT.md)

**Product spec (React app):** [`SPEC.md`](./SPEC.md)

**Live GameBus test config audit (external):** `gamebus-minigame-demo-main` → `GAMEBUS_TEMPLATE_EXPORT.json`, `GAMEBUS_CONFIG_SNAPSHOT.md`

## Completed (documentation)

1. Align `SPEC.md` and `IMPLEMENTATION_INVENTORY.json` with the three-section meal model and one-shot submit.
2. Define GameBus property migration and `ACTIVITY` payloads in `GAMEBUS_LUNCH_CONTRACT.md`.

## Implementation (not started)

1. **GameBus admin** — Update `studentLunchCheckin` linked properties per contract section C (manual; not from this repo).
2. **`src/gamebus/`** — Bridge, mapper, embed detection, submit guard (see contract section G).
3. **Wire submit** — In embed mode: one `ACTIVITY`, no `SILENT_ACTIVITY`, duplicate protection; standalone keeps localStorage.
4. **Hosting** — Serve this React build at the URL configured on Pari’s task (origin `providerPari`); protocol does not require Svelte.
5. **Verify** — Test account: submit once in embedded task; confirm activity in GameBus and modal close.
6. **Menu** — Import real menu when ready (keep `menuSchedule` / catalogue until then).
