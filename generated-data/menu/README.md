# Generated menu data

Files in this directory are produced by `npm run menu:convert` from `reference/Example_menu.xlsx`.

**Do not edit these JSON files manually.** Re-run the conversion pipeline after workbook changes.

- `food-catalogue.json`, `daily-menus.json`, `conversion-manifest.json` — canonical export
- `missing-images.json` — items without `public/images/menu/items/<id>.webp`
- Runtime copies for the React app live in `src/data/generated/` (same content, without `sourceName` on catalogue entries)
