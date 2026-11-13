# How AI was used

The solution was built with **Claude Code** (an agentic coding tool) working in this repository,
with me directing scope, architecture and review. The commit history shows the order in which
things were built.

## Working agreement given to the agent

The brief was the assessment PDF plus these instructions (paraphrased):

> Follow every guideline in the assessment document. The code must be easy to understand and
> read like it was written by an experienced developer. Make it look good. Ask me about
> architecture rather than guessing. Make incremental commits, but never commit the assessment
> PDF itself.

Before writing code, the agent asked me four questions, and I chose:

| Question           | Decision                                                     |
| ------------------ | ------------------------------------------------------------ |
| Backend stack      | Node + TypeScript (Fastify, Drizzle, SQLite)                 |
| What not to commit | Only the assessment PDF (gitignored); commit everything else |
| Hosting            | Frontend on Vercel; backend on Render or Railway             |
| Repository         | Public `salary-management` repository                        |

## Process

1. **Requirements first.** The one-page [requirements](01-requirements.md) were written and
   committed before any code, including what is deliberately left out.
2. **Inside-out build.** Schema → pure domain helpers (with tests) → seed → employees module
   → insights → UI. Each step was committed once its tests passed.
3. **Design pass before UI code.** The agent proposed a palette, type and layout direction and
   checked it against generic "AI-looking" defaults. It settled on one signature element (the pay
   band) rather than decorative cards. Chart colours were checked with a palette validator, not
   by eye.
4. **Verify in the real app, not just tests.** Both servers were run and every flow was exercised
   in a browser.

## Where verification caught real problems

These came from running the software, not from the model's first draft:

- **CORS blocked edits and deletes.** `@fastify/cors` allows only simple methods by default.
  Unit tests passed because `inject()` bypasses CORS. Saving a salary in the browser failed.
  Fixed, and a preflight regression test was added (`fix(api)` commit).
- **Prerender error from `usePathname()`.** Next.js 16 Cache Components need URL-reading hooks
  inside a Suspense boundary. The navigation was split into a small client component.
- **React Compiler lint.** react-hook-form's `watch()` blocks memoisation, so it was replaced with
  `useWatch`.
- **Layering smells found in review.** Runtime modules importing from `seed/`, a duplicated
  country lookup and type casts in aggregation code were refactored before commit.

## A decision I revisited: authentication

The agent and I first agreed to leave authentication out, and the requirements say so. After
deploying, I reviewed the live app as a reviewer would and didn't like what I saw: a public URL
where anyone could read and change every salary. I asked for every endpoint to be protected
behind a login. The agent proposed the design, and I reviewed it against the threats that
matter here:

- a same-origin proxy so the session cookie stays first-party;
- an httpOnly, SameSite, signed cookie rather than a token in `localStorage`;
- scrypt password hashing;
- rate-limited login;
- a test asserting a 401 on every protected endpoint.

The original decision and its reversal are both kept in the
[requirements](01-requirements.md#revision-authentication-moved-into-scope), because changing my
mind on evidence is part of the process.

## Principles applied to AI output

- Nothing was accepted without a passing test or a visual check.
- Read the framework's current docs (bundled with Next.js 16) instead of relying on memory of
  older APIs.
- Prefer small, explicit code over clever abstractions. Every non-obvious choice is explained in a
  comment or in [decisions](03-decisions.md).
