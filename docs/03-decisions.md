# Decisions and trade-offs

Each entry gives what was chosen, what was given up, and when to revisit.

### 1. SQLite over Postgres

**Chosen:** SQLite (WAL mode) through Drizzle ORM.
**Why:** 10k employees and a handful of HR users is a small, read-heavy workload. SQLite needs no
infrastructure, tests get a fresh in-memory database each run, and the seed loads 10k rows in
~0.4s.
**Cost:** a single writer, and the database file needs a persistent disk in production.
**Revisit when:** there are multiple API instances or concurrent write-heavy workflows (bulk
imports, approvals). Drizzle keeps the switch to Postgres mostly mechanical: queries are written
against the query builder, not SQLite-specific SQL.

### 2. Salaries in local currency, compared in USD

**Chosen:** store the contract amount in the employee's local currency. Convert to USD only to
compare, using a fixed reference rate per country.
**Why:** the local figure is the legal truth. Converting at write time would change people's
"salary" whenever rates move. Pinned rates make reports reproducible: today's median matches
yesterday's unless someone changed pay.
**Cost:** USD figures are approximations, and the UI says so ("at reference rates from 1 Jan 2026").
**Revisit when:** finance needs period-accurate rates. Then add a dated `exchange_rates` table.

### 3. Whole-unit integers for money

**Chosen:** `annual_salary INTEGER` in whole currency units.
**Why:** annual contracts are quoted in whole units, and integers avoid float drift. It also
sidesteps the different minor-unit rules per currency (JPY has none).
**Cost:** cannot represent cents. That's acceptable for annual base salary, but not for payroll.

### 4. Salary changes are a separate, audited action

**Chosen:** `PATCH /employees/:id` takes profile fields plus an optional
`salaryChange { annualSalary, reason, effectiveDate }`. It writes the employee and a history row
in one transaction.
**Why:** "who changed this salary and why" is exactly what spreadsheets lose. Requiring a
reason makes the audit trail useful.
**Business rule:** moving someone to a country with a different currency without a new salary
is rejected (422). Otherwise €80,000 would silently become £80,000. The UI shows the salary
field the moment the currency changes.

### 5. Analytics in application code, not SQL

**Chosen:** the insights repository loads a lean projection (7 columns × 10k rows). Pure functions
compute the median, percentiles and histogram.
**Why:** SQLite has no `PERCENTILE_CONT`. Pure functions are easy to unit test against
spreadsheet results (PERCENTILE.INC). At this size it takes milliseconds.
**Revisit when:** headcount reaches the hundreds of thousands. See [performance](04-performance.md).

### 6. Offset pagination

**Chosen:** `page` / `pageSize` (max 100).
**Why:** HR wants "page 3 of 40" and jump-to-page. At 10k rows the offset cost is negligible.
**Revisit when:** tables grow to millions of rows. Keyset pagination on `(sort_key, id)` is the
next step (every sort already has `id` as a tiebreaker).

### 7. Authentication: added after the first deployment

**First call:** leave it out. There was one persona, and auth felt like standard plumbing.
**Why I changed it:** once the app was on a public URL, anyone with the link could read and edit
every salary. Salary data is too sensitive for that, even in a demo, so I moved auth into scope
before submission (see the [requirements revision](01-requirements.md#revision-authentication-moved-into-scope)).

**Chosen:**

- A single HR Manager account. Credentials come from environment variables, and the password is
  stored only as a **scrypt** hash.
- A **stateless signed session cookie**: HMAC-signed, `httpOnly` (scripts can't read it, so XSS
  can't steal it), `SameSite=Lax` (not sent on cross-site writes, so no CSRF), `Secure` in
  production, 8-hour expiry.
- **Every `/api` route is protected** by one `onRequest` hook on an encapsulated Fastify scope, so a
  new route is protected by default. Only `/health` is public.
- **Login hardening:** constant-time comparisons, one generic error message (no username
  probing), and rate limiting (10 attempts per 15 minutes per client).
- **The web app proxies `/api/*` through its own origin** (Next.js rewrites). The cookie is
  first-party, so it works where third-party cookies are blocked (Safari, Firefox), and CORS
  goes away entirely.

**Why not JWT in `localStorage`:** any XSS would expose the token. A cookie scripts can't read
is the safer default for a browser app.
**Why not server-side sessions:** they need a session store. A signed cookie keeps the API
stateless. The trade-off is that a single session can't be revoked early, but rotating
`SESSION_SECRET` signs everyone out.
**Not yet:** multiple users and roles, SSO via the company identity provider, password reset,
and an audit log of who _viewed_ which salary. All of these sit on top of the same
`requireSession` hook.

### 8. API types duplicated in the web app

**Chosen:** `apps/web/src/lib/types.ts` mirrors the API DTOs by hand.
**Why:** a shared package (or OpenAPI codegen) adds build wiring that isn't worth it for nine
endpoints. Keeping the types in one file makes drift easy to review.
**Revisit when:** the API grows or gets more consumers. Generate an OpenAPI spec from the zod
schemas and codegen the client.

### 9. Client-side data fetching in Next.js

**Chosen:** pages are thin server components. Features are client components using TanStack
Query.
**Why:** this is an internal, interactive tool behind (future) auth, so SEO and first-byte HTML
matter little. Caching, optimistic updates and invalidation matter a lot, and TanStack Query does
those well.
**Cost:** a loading skeleton on first paint.

### 10. Deterministic seed with faker

**Chosen:** seeded faker instances per locale, plus a job catalogue (US base pay per role) and
country pay factors.
**Why:** realistic data makes the insights meaningful: engineers out-earn support, and the US
out-pays India for the same role. Determinism makes demos and bug reports reproducible
(`--seed=42` always yields the same people). `--if-empty` lets every deploy seed safely.
