# External integrations

**Documentation role:** Reference index for third-party / provider contracts that the SPA may integrate later.

| Path | Notes |
|------|--------|
| [`POWERESTA_PUBLIC_API_REFERENCE.md`](POWERESTA_PUBLIC_API_REFERENCE.md) | Canonical PoweResta public API reference (registered for future menu integration) |
| [`POWERESTA_PUBLIC_API_SOURCE_CAPTURE_2026-11-02.md`](POWERESTA_PUBLIC_API_SOURCE_CAPTURE_2026-11-02.md) | Source-capture notes for that reference (2026-11-02) |
| [`POWERESTA_MENU_INTEGRATION.md`](POWERESTA_MENU_INTEGRATION.md) | How sample menus relate to a future PoweResta-backed menu source |

## Status — PoweResta

- API access is **currently disabled** at the provider.
- Access must be **requested from the provider** before any live integration testing.
- Do **not** store API credentials in this repository.
- Do **not** call the API or implement authentication until access is enabled and a separate integration task is approved.
- Do **not** change GameBus integrations when preparing for PoweResta.

Future menu work must reuse these documented contracts rather than reconstructing the API from memory or partial captures.
