# Requirements — ACME Salary Management

## Goal

Replace the spreadsheets ACME's HR team uses to manage pay for ~10,000 employees across
multiple countries with a web application that lets an **HR Manager**:

1. keep salary records accurate (find, add, edit, remove employees and their pay), and
2. answer *"how does the org pay people?"* without building a pivot table.

Success means the HR Manager can find any employee in seconds, change a salary with a recorded
reason, and answer questions such as *"what is the median Software Engineer salary in Germany?"* or
*"which country has the highest payroll cost?"* straight from the UI.

## Users

| Persona    | Needs                                                                                 |
| ---------- | ------------------------------------------------------------------------------------- |
| HR Manager | Fast lookup across 10k records, safe edits, trustworthy cross-country pay comparisons |

## Scope & Features (in)

**Employee directory**
- Paginated, server-side searchable list (name, email, employee code).
- Filter by country, department and job title; sort by name, salary and hire date.
- Create, edit and delete an employee, with validation on the client and the server.

**Salary management**
- Each salary is stored in the employee's **local currency** (the actual contract amount).
- Changing a salary requires a reason and writes a **salary history** entry (old → new, date,
  reason), so pay changes are auditable, which spreadsheets do badly.

**Pay insights**
- Org overview: headcount, annual payroll cost, median and average salary (normalised to USD).
- Breakdown by **country** and by **department**: headcount, min / median / average / max.
- Breakdown by **job title within a country**, which is the comparison HR actually makes when
  benchmarking a role.
- Salary distribution chart, so outliers and banding are visible.

**Platform**
- REST API with typed request validation and consistent error responses.
- Deterministic seed script that generates 10,000 realistic employees.
- Unit and integration tests for the domain logic and the API.

## Deliberately left out (and why)

| Left out                                       | Reasoning                                                                                                                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authentication / role-based access             | One persona and no multi-user requirement. It is critical for a real launch (salary data is sensitive), but it is a known, solved layer (SSO/OIDC) that adds no signal here. |
| Live exchange rates                            | Rates are stored in a reference table with an "as of" date. Analytics need *stable* comparisons, and a live feed would make yesterday's report disagree with today's.        |
| Payroll processing (tax, deductions, payslips) | A different product. The problem is *managing and understanding* pay, not paying people.                                                                                      |
| Bonuses, equity, benefits                      | Base salary answers the core question. The schema leaves room to add compensation components later.                                                                          |
| Excel import / export                          | Valuable for migration, but a one-off. The seed script shows bulk loading works.                                                                                              |
| Approval workflows for pay changes             | Needs multiple roles (manager, finance). The salary history provides the audit trail in the meantime.                                                                       |
| Multi-tenancy, i18n                            | A single organisation and an English-speaking HR team.                                                                                                                        |

## Assumptions

- Salaries are **annual base pay**, stored as integers in minor units (cents) to avoid float errors.
- ~10k employees and a handful of HR users: a single relational database (SQLite) is plenty, and
  the data-access layer is isolated so Postgres can be swapped in if scale demands it.
- Cross-country figures are converted to USD purely for comparison, and the original currency is
  always shown alongside.
