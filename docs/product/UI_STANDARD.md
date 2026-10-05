# Application UI and UX standard

**Documentation role:** Reference (shared visual / UX rules).

**Source:** existing production screens in this repository (`src/app/styles.css` tokens, chef results dashboards, chef forecast, service closeout, Kitchen Skills Challenge). Kitchen Skills Challenge must reuse this language (public hashes remain `#/kitchen-day*`). Do not invent a second design system.

**Practice references (behaviour, not brand):**

- [GOV.UK Design System](https://design-system.service.gov.uk/) for form efficiency, input width by expected value, question-page density, and layout that uses horizontal space when the task needs it.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) for accessibility: perceivable labels, keyboard use, reflow, and touch target size.

Keep the existing visual tokens, colour, type, and radius. Do **not** restyle the product to look like GOV.UK (no GDS crown palette, no GDS type scale, no GDS component chrome).

---

## Tokens (`:root` in `src/app/styles.css`)

- Colour: `--color-primary`, `--color-primary-dark`, `--color-primary-light`, `--color-bg`, `--color-surface`, `--color-border`, `--color-text`, `--color-text-secondary`, `--color-success-bg`, `--color-success-text`
- Spacing: `--spacing-xs` … `--spacing-2xl`
- Radius: `--radius-sm` / `--md` / `--lg`
- Shadow: `--shadow-sm` / `--md`
- Type: `--font-family`, `--font-size-xs` … `--font-size-2xl`

---

## Visual language

### Page width

- Dashboards: `.kitchen-mgmt-page` (max-width `77.5rem`)
- Prose / one-question steps: a readable line (~`42rem`) is enough
- Repeated data-entry (recipe lines, tables): widen on tablet/desktop (~`64rem`) so columns can sit in a row
- Global `--max-width: 1200px` for app shell

### Typography

- Page title: `.kitchen-mgmt-header__title`
- Lead: `.kitchen-mgmt-header__lead` (secondary colour)
- Module title: `.kitchen-mgmt-module-title`
- Eyebrow: uppercase, primary colour, extra-small

### Surfaces

- White surface, light border, small shadow, `--radius-lg` cards
- Metric tiles on `--color-bg`
- Status chips: `.chef-results-status-chip--ready|waiting|neutral`

### Buttons and fields (appearance)

- Primary fill `--color-primary`, disabled `--color-disabled-*`
- Unit attached inside the gram control, not as a detached label
- Primary actions: 3rem min-height
- Compact repeating controls (technique chips, in-row gram fields): at least 2.75rem / 44px hit area (WCAG 2.2 target size), without inflating the surrounding layout

### Status / feedback

- Success: `.kitchen-day-success` / `--color-success-*`
- Error: meat/red text, not a banner of internal codes
- Empty: `.chef-results-empty`

### Dashboards

- Header + lead + date/status meta
- Overview / Progress primary tabs (`.kitchen-mgmt-primary-tabs`)
- Charts: `.chef-results-week-chart` / sparkline
- Tables/cards from chef-results staff/metric patterns

### Numbers

- Waste %: one decimal (`17.6%`)
- Duration: `10 sec`, `1 min 24 sec`
- Weights: clean grams, no raw floats

### Production UI rule

Never show internal/debug strings: live-block reasons, raw `sessionId`, machine timer states (`idle` / `running` / `finished`), percentile/leaderboard copy, implementation notes.

---

## Density and form efficiency

These rules apply to Kitchen Skills Challenge first. They are the default for any new practical form.

### Input width matches the expected value

Size the control to the data, not to leftover page width (GOV.UK text-input width guidance).

- A gram field holds a short number plus a unit. Use `.kitchen-day-input-row--grams` (~`9.5rem`). It must not stretch to half the page because space exists.
- Do not set gram rows to `max-width: none` on small screens.
- Names, destinations, and search fields may use the full content column — those values are long.
- Native `<select>` is acceptable for short in-session lists (this session’s ingredients). Use search/autocomplete when the option list is long (Finnish recipe catalogue).

### Repeated rows stay compact

Do not create a large vertical card or stacked field block for every ingredient.

- Desktop / tablet (~768px and up): one row per item, using horizontal space.
- Portion Precision entry: **Ingredient | Target | Actual [g] | Result**.
- Mobile (~390px): the same four facts may stack, but they stay a tight block (name, target, compact gram control, result). No large padding between those facts.
- Related fields sit next to or immediately under each other. Do not insert `--spacing-lg` / `--spacing-xl` between a label and its control, or between Target and Actual.

### Empty space

- Avoid excessive empty vertical space inside a work card.
- Card padding for practical forms: `--spacing-md`, not a dashboard-sized `--spacing-lg` around a single short field.
- Closely related controls share `--spacing-xs` / `--spacing-sm`, not `--spacing-md` / `--spacing-lg`.
- “Large touch target” means a usable hit area on the control. It does **not** mean large empty layout, full-bleed gram inputs, or a tall card per row.

### Long workflows and primary actions

- Minimise scrolling through blank areas. Prefer one compact repeating table/grid over a stack of cards.
- Trim Smart already uses one question per step — keep that. Compact the fields inside each step.
- On long forms (Portion Precision with many lines), keep the primary action easy to reach: a sticky or fixed **Save** / **Continue** bar on small viewports.
- Primary actions stay in the work card; do not hide them behind extra navigation.

### Progressive disclosure

- Review, finish, and evidence screens **summarise first** (headlines, counts, status).
- Line-level recipe tables and full measurement lists are secondary: collapsed `<details>` or equivalent until the student opens them.
- Do not dump every derived figure above the fold when a one-line result is enough during entry (Portion **Result** column). Extra comparison copy belongs on review.

### Control size follows the task

- Gram inputs: compact numeric control + attached unit.
- Technique chips: compact grid; ten options must remain one tap each.
- Destination: a short textarea (about two rows), not a large empty box.
- Recipe combobox: full width of the form column (long names).

### Use horizontal space from tablet up

At ~768px and ~1200px, do not force data-entry into a single long vertical column when a row or two-column meta layout fits.

- Portion lines: four columns.
- Reuse: ingredient picker and actual-waste readout on one row when width allows.
- Trim one-question steps may stay a single column (question-page pattern); the gram control itself still stays content-width.

### Validate at the input boundary

- Gram fields accept digits and one decimal only. Letters and negatives never appear in the field.
- Impossible values (over starting weight, empty required fields) disable Continue/Save and show a short field error.
- Recipe selection requires an exact list option, not free text.

### Accessibility (WCAG 2.2, applied here)

- Every input has a visible or programmatically associated label.
- Keyboard order follows the visual order of the row/grid.
- Touch targets for actionable controls are at least 24×24 CSS pixels (WCAG 2.2 **2.5.8**); kitchen primary actions stay at 44px / 3rem where they are the only control on the step.
- Layout reflows at 320px-equivalent without requiring two-dimensional scrolling for the main task (WCAG **1.4.10**). Prefer stacking compact rows over horizontal scroll.
- Do not rely on colour alone for Exact / over / under — keep the text result.

---

## Viewport checks (required)

Before calling a Kitchen Skills UI change done, check the important student screens at approximately:

| Width | Intent |
|-------|--------|
| **390px** | Phone: compact stack, gram fields stay short, sticky save reachable, no huge blank cards |
| **768px** | Tablet: Portion uses the four-column row; Reuse uses a horizontal meta row |
| **1200px** | Desktop: use the wider activity column; do not leave a skinny form floating in empty space |

Screens to include: Trim (a field step + technique), Reuse, Portion with a multi-line recipe, Session review, Finish summary.

---

## Kitchen Skills application of this standard

| Surface | Layout |
|---------|--------|
| Trim Smart | One step at a time. Content-width gram fields. Compact technique grid. Sticky Continue/Save on small screens. |
| Reuse | Short form. Ingredient + actual waste on one row from tablet up. Compact reusable grams. Two-row destination. |
| Portion Precision | Searchable recipe combobox. Compact ingredient table/grid. Sticky Save recipe. Final weight is a short gram field, not a full-width block. |
| Session review / Finish | Status or headlines first; evidence and recipe line tables second (collapsed where they are long). |
