# Application UI standard

**Source:** existing production screens in this repository (`src/styles.css` tokens, chef results dashboards, chef forecast, service closeout, Trim Smart v1). Kitchen Day must reuse this language. Do not invent a second design system.

## Tokens (`:root` in `src/styles.css`)

- Colour: `--color-primary`, `--color-primary-dark`, `--color-primary-light`, `--color-bg`, `--color-surface`, `--color-border`, `--color-text`, `--color-text-secondary`, `--color-success-bg`, `--color-success-text`
- Spacing: `--spacing-xs` … `--spacing-2xl`
- Radius: `--radius-sm` / `--md` / `--lg`
- Shadow: `--shadow-sm` / `--md`
- Type: `--font-family`, `--font-size-xs` … `--font-size-2xl`

## Page width

- Dashboards: `.kitchen-mgmt-page` (max-width `77.5rem`)
- Practical activity forms: narrower reading line (~`42rem`)
- Global `--max-width: 1200px` for app shell

## Typography

- Page title: `.kitchen-mgmt-header__title`
- Lead: `.kitchen-mgmt-header__lead` (secondary colour)
- Module title: `.kitchen-mgmt-module-title`
- Eyebrow: uppercase, primary colour, extra-small

## Surfaces

- White surface, light border, small shadow, `--radius-lg` cards
- Metric tiles on `--color-bg`
- Status chips: `.chef-results-status-chip--ready|waiting|neutral`

## Buttons and fields

- Primary fill `--color-primary`, disabled `--color-disabled-*`
- Inputs: 3rem min-height, unit attached inside the control
- Tap targets ≥ 3rem for kitchen use

## Status / feedback

- Success: `.kitchen-day-success` / `--color-success-*`
- Error: meat/red text, not a banner of internal codes
- Empty: `.chef-results-empty`

## Dashboards

- Header + lead + date/status meta
- Overview / Progress primary tabs (`.kitchen-mgmt-primary-tabs`)
- Charts: `.chef-results-week-chart` / sparkline
- Tables/cards from chef-results staff/metric patterns

## Responsive

- Check ~390px, ~768px, ~1200px
- Stack nav and chip grids on small screens
- No floating detached units, no five-tab wrap on the activity page

## Numbers

- Waste %: one decimal (`17.6%`)
- Duration: `10 sec`, `1 min 24 sec`
- Weights: clean grams, no raw floats

## Production UI rule

Never show internal/debug strings: live-block reasons, raw `sessionId`, machine timer states (`idle` / `running` / `finished`), percentile/leaderboard copy, implementation notes.
