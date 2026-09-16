# Testing documentation

Automated tests today: **Vitest** + Testing Library (see `package.json` and `.github/workflows/test.yml`). Gherkin files under [`../../features/`](../../features/) are acceptance **contracts**, not executed scenarios in CI.

## Kitchen Forecast

Traceability from the approved Gherkin to Vitest coverage:

[`KITCHEN_FORECAST_ACCEPTANCE_COVERAGE.md`](KITCHEN_FORECAST_ACCEPTANCE_COVERAGE.md)

The `.feature` file remains the product source of truth. That matrix only maps implementation tests to it. Live GameBus ingest is out of scope for those repository tests.
