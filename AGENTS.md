# Agent Patterns

## Employee Analytics Filtering

When changing employee-facing analytics, pipeline, website, or lead tables, keep the filtering model metric-first:

- Provide a metric selector when the table can be sorted by more than one meaningful date or performance field.
- Provide an explicit sort direction control with latest first and earliest first options for date metrics.
- If the chosen metric is also visible as a table column, make that column header toggle the same sort direction instead of creating a separate sort behavior.
- Keep filters, metric sorting, pagination, bulk actions, and column visibility working together on the same loaded dataset.
- Prefer adding focused views, such as "Has Website", as pre-filtered states of the main employee table when employees still need the same filters and metrics.
- Do not create a separate page with a weaker filter set when the main table already has the right analytics controls.
