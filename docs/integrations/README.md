# External integrations

**Documentation role:** Reference index for third-party / provider contracts that the SPA may integrate later.

| Path | Notes |
|------|--------|
| [`POWERESTA_PUBLIC_API_REFERENCE.md`](POWERESTA_PUBLIC_API_REFERENCE.md) | Canonical PoweResta public API reference (registered for future menu integration) |
| [`POWERESTA_PUBLIC_API_SOURCE_CAPTURE_2026-11-02.md`](POWERESTA_PUBLIC_API_SOURCE_CAPTURE_2026-11-02.md) | Source-capture notes for that reference (2026-11-02) |
| [`POWERESTA_MENU_INTEGRATION.md`](POWERESTA_MENU_INTEGRATION.md) | How sample menus relate to a future PoweResta-backed menu source |
| [`POWERESTA_MENU_ADAPTER.md`](POWERESTA_MENU_ADAPTER.md) | Design-only Classic/Vegetarian/Soup/Dessert adapter; mapping blocked on live confirmation |
| [`POWERESTA_RECIPE_KITCHEN_SKILLS_MAPPING.md`](POWERESTA_RECIPE_KITCHEN_SKILLS_MAPPING.md) | Design-only recipe/loss-field notes for Kitchen Skills |
| [`POWERESTA_SYNC_ARCHITECTURE.md`](POWERESTA_SYNC_ARCHITECTURE.md) | Proposed server-side GitHub Actions sync (not enabled) |
| Offline client | [`../../scripts/poweresta/`](../../scripts/poweresta/) — injectable transport; live network disabled by default |

## Status — PoweResta

- API access is **currently disabled** at the provider (paid activation).
- Offline TypeScript client + documentation fixtures exist under `scripts/poweresta/`.
- Access must be **requested from the provider** before any live integration testing.
- Do **not** store API credentials in this repository (see `.env.poweresta.example` for variable names only).
- Do **not** enable `POWERESTA_LIVE_NETWORK=1` or scheduled Actions against PoweResta without explicit authorization.
- Do **not** change GameBus integrations or the production menu resolver during preparation.

Future menu work must reuse these documented contracts rather than reconstructing the API from memory or partial captures.
