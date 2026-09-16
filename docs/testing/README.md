# Testing documentation

Automated tests today: **Vitest** + Testing Library (see `package.json` and `.github/workflows/test.yml`). Gherkin files under [`../../features/`](../../features/) are acceptance **contracts**, not executed scenarios in CI.

## Kitchen Forecast

Traceability from the approved Gherkin to Vitest coverage:

[`KITCHEN_FORECAST_ACCEPTANCE_COVERAGE.md`](KITCHEN_FORECAST_ACCEPTANCE_COVERAGE.md)

The `.feature` file remains the product source of truth. That matrix only maps implementation tests to it. Live GameBus ingest is out of scope for those repository tests.

## Kitchen Results

| Surface | Gherkin | Coverage matrix |
|---------|---------|-----------------|
| Participant `#/chef-results` | [`../../features/kitchen/kitchen-results-participant.feature`](../../features/kitchen/kitchen-results-participant.feature) | [`KITCHEN_RESULTS_PARTICIPANT_ACCEPTANCE_COVERAGE.md`](KITCHEN_RESULTS_PARTICIPANT_ACCEPTANCE_COVERAGE.md) |
| Admin `#/chef-results-admin` | [`../../features/kitchen/kitchen-results-admin.feature`](../../features/kitchen/kitchen-results-admin.feature) | [`KITCHEN_RESULTS_ADMIN_ACCEPTANCE_COVERAGE.md`](KITCHEN_RESULTS_ADMIN_ACCEPTANCE_COVERAGE.md) |
