# Performance considerations

## Measured (local, Apple Silicon, 10,000 employees)

| Operation                                        | Result |
| ------------------------------------------------ | ------ |
| Seed 10,000 employees + ~15.6k history rows      | ~0.4 s |
| `GET /api/employees?search=smith&country=US`     | ~3 ms  |
| Full API test suite (67 tests, in-memory SQLite) | < 1 s  |
| Web test suite (28 tests)                        | ~1 s   |

## What keeps it fast

- **Server-side search, filters, sorting and pagination.** The browser never holds more than one
  page (≤ 100 rows).
- **Indexes for every filter and sort** the UI exposes, plus `(employee_id, effective_date)`
  for history.
- **Batched, transactional seeding.** 500 rows per `INSERT`, all in one transaction.
- **Lean analytics projection.** Insights read 7 columns, not whole rows.
- **SQLite WAL mode.** Readers don't block the writer.
- **UI:** `keepPreviousData` keeps the current page visible while the next loads, search is
  debounced (300 ms), reference data is cached for 10 minutes, and `Intl` formatters are
  cached.

## Known limits and the next step for each

| Limit                                            | When it matters                      | Next step                                                     |
| ------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------- |
| `LIKE '%term%'` search scans the table           | ~100k+ employees                     | SQLite FTS5 (or Postgres trigram index) on name/email/code    |
| Insights load all rows and aggregate in JS       | ~500k+ employees, or many dashboards | Pre-aggregate on write, or move to Postgres `percentile_cont` |
| Insights recomputed per request                  | Heavy concurrent dashboard use       | Cache the summary, invalidated on employee writes             |
| Offset pagination                                | Millions of rows, deep pages         | Keyset pagination on `(sort_key, id)`                         |
| Single SQLite writer                             | Concurrent bulk imports              | Postgres                                                      |
| USD salary sort computes `salary * rate` per row | ~100k+ rows                          | Persist a generated `annual_salary_usd` column with an index  |
