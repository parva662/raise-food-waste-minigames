# Sample menus and future PoweResta integration

**Documentation role:** Explanation — why the app currently ships cycled sample menus, and how PoweResta fits later.

## Current state (sample menus)

Student Lunch, Kitchen Forecast, and Service Closeout resolve dishes from generated JSON under `src/data/generated/`, produced by:

```text
npm run menu:convert
```

from `reference/Example_menu.xlsx` via `scripts/menu/`.

The runtime schedule:

1. Preserves the historical continuous weekday remap through **2026-10-30**.
2. Extends **sample** coverage for operational weekdays from **2026-11-02** through **2027-04-30** by cycling open workbook menu days.
3. Skips weekends and any explicitly configured canteen closure overrides (`src/shared/menu/menuOverrides.ts`).
4. Does **not** invent holidays or closure dates.

These extended days are **temporary sample menus**, not verified operational menus from PoweResta or BarLaurea production systems.

## Future state (PoweResta)

PoweResta is intended to become the authoritative live menu data source when provider access is enabled.

Until then:

- Keep using the Excel → generated JSON pipeline for demos and pilot embeds (currently through **2027-04-30** sample coverage).
- Treat [`POWERESTA_PUBLIC_API_REFERENCE.md`](POWERESTA_PUBLIC_API_REFERENCE.md) and [`POWERESTA_PUBLIC_API_SOURCE_CAPTURE_2026-11-02.md`](POWERESTA_PUBLIC_API_SOURCE_CAPTURE_2026-11-02.md) as the contract to implement against.
- Use the offline client under `scripts/poweresta/` for request/response preparation; live network stays disabled by default.
- See [`POWERESTA_MENU_ADAPTER.md`](POWERESTA_MENU_ADAPTER.md), [`POWERESTA_RECIPE_KITCHEN_SKILLS_MAPPING.md`](POWERESTA_RECIPE_KITCHEN_SKILLS_MAPPING.md), and [`POWERESTA_SYNC_ARCHITECTURE.md`](POWERESTA_SYNC_ARCHITECTURE.md).
- Request API access from the provider before integration testing.
- Do not implement automatic switching to PoweResta until authorized.
- Do not reconstruct the API contract from informal notes when the registered docs already exist.

GameBus activity posting, Input Collections, and mission structure stay independent of the menu provider swap.
