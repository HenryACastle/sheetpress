# SheetPress

Upload an Excel (.xlsx), get a shareable, searchable report page. Production: https://sheetpress.org (the older sheetpress.yeve.dev address can redirect to it)

Stack: Next.js 16 + Clerk v7 (owner login) + Neon Postgres/Drizzle. Reports render from one self-contained HTML template (`lib/report-template.html`).

## How it works
- `/` marketing, `/sign-in` `/sign-up` Clerk, `/app` dashboard (publish, update, delete).
- `POST /api/reports` parses the workbook server-side (`lib/parse.ts`), stores the data as JSON in Neon. Access is separate from the workbook (see Access below); the password is never stored, only a hash.
- `GET /r/<slug>` serves the report HTML. Public by link, or a server-rendered password page until the visitor unlocks it.
- Free limits live in `lib/plans.ts` (3 reports, 1000 rows/sheet, 2 MB).

## Go-live checklist (Vercel)
1. Neon: create a DB, copy the pooled connection string, run `DATABASE_URL=... npm run db:push`.
2. Clerk: Production instance whose domain is the public domain (`sheetpress.org`). Add the 5 DNS records Clerk lists (DNS only). Changing the domain changes the `pk_live_`/`sk_live_` keys: update both in Vercel and redeploy.
3. Vercel env vars: `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_APP_URL=https://sheetpress.org`, optional `NEXT_PUBLIC_SUPPORT_EMAIL`. The public address comes only from `NEXT_PUBLIC_APP_URL` (see `lib/site.ts`), so a domain change needs no code change.
4. Vercel > Domains: add the apex domain and `www` (redirect www to apex), set the apex as primary, and set any old domain to redirect to it.
5. DNS at the registrar: apex A record and `www` CNAME to the values Vercel shows, plus the Clerk records.
6. `npm run seed:demo` publishes the two public demo reports (run once per database). `npm run examples` rebuilds the downloadable workbooks.
7. Smoke test: sign up, publish `public/examples/q4-site-rollout.xlsx`, open the link, try a password report.

## Local dev
`cp .env.example .env.local`, fill it in, `npm install`, `npm run dev`. Sample workbook generator and the original CLI live in the Harvis vault under `tools/sheetpress`.

## Roadmap
Google Sheets sync, custom domains per report, viewer logins (Clerk) for team-only reports, Stripe + Pro plan, rate limiting on `/r/*` unlock attempts (currently client-side PBKDF2 only).


## Workbook conventions (sheet names decide how a sheet is shown)
- **KPI tiles:** `Summary`, `Overview`, `KPIs`, `Dashboard`, or a name starting `KPI `. Columns: label, value, note.
- **Line graph:** a name starting `Chart ` (e.g. `Chart Network daily`). First column = x axis, each number column = a line, table underneath. Series more than 8x smaller than the biggest get a right-hand axis.
- **Table:** anything else.
- **Settings sheet** (not shown): `Setting | Value` rows: Title, Subtitle, Logo (https image), Logo link, Accent (#hex), Theme (light/dark), Footer, Hide SheetPress (yes). Dashboard Branding (`PUT /api/reports/:id/branding`, stored in `payload.branding`) overrides it and survives re-uploads. Validated in `lib/parse.ts`; bad values are ignored.
- **Formulas** are fine: the parser reads the saved result, so write files with the results cached (Excel does; `tools/barcrawlerz-seo-audit/make_sheetpress_report.py` does via xlsxwriter).

## Report domains and link names
Two ways to put a report on its own address.

**1. Self-service custom domains (database-backed).** In the dashboard a user opens a report, chooses **Link & domain**, and enters e.g. `reports.theircompany.com`. `lib/domain-service.ts` adds it to our Vercel project through the Vercel REST API (`lib/vercel-domains.ts`), the UI shows the exact DNS record (CNAME for a subdomain, A for a root domain, plus a TXT if Vercel asks for ownership proof), polls until Vercel reports the domain verified AND correctly configured, then sets `reports.domain_verified`. `proxy.ts` serves a verified host as that one report at its root and 404s everything else on the host. Rules: unverified domains never serve; one domain per report; free plan = 1 per account (`FREE.maxCustomDomains`); an unfinished claim older than 24h can be taken over by whoever really controls the DNS, a verified one never can.
- Needs these server-only env vars in Vercel (without them the panel says "coming soon" and the API returns 503): `VERCEL_API_TOKEN` (token for the team that owns the project), `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID` (omit for a personal account).
- After a real end-to-end test, set `NEXT_PUBLIC_CUSTOM_DOMAINS=1` so the landing page advertises it.
- Tests: `npm run test:domains` (validators, DNS-instruction logic, Vercel client request shapes, and the full service flow against the database with a simulated Vercel; it creates and deletes `e2e_dom_*` rows).

**2. `REPORT_DOMAINS` operator override** (no database). `REPORT_DOMAINS="seo.example.com=report-slug"` (comma separated pairs) makes that host show one report. Checked first in `proxy.ts`. Add the domain in Vercel and point DNS at it yourself. Good for client domains you manage by hand.

**Link names.** `/r/<name>` is chosen when publishing (optional) or renamed later (`PUT /api/reports/:id/slug`). Reserved names and `demo-*` are blocked; renaming breaks the old link.

## Editable lists and show codes (shopping list template)
- Dashboard > **New shopping list** creates an editable list (no Excel needed). `/app/lists/<id>` is the editor: quick add, edit cells, tick Bought, per-row **On site**, per-column **public/private**, totals, Save (PATCH `/api/reports/:id`), **Download Excel** (`GET /api/reports/:id/xlsx`, everything including private data) and **Upload Excel** (PUT, replaces the list, stays editable).
- `public/examples/shopping-list.xlsx` is the Excel template (built by `tools/sheetpress/make_shopping_list_template.py` in the vault): Show column, `Notes [private]`, a `Help (private)` sheet, status/Show dropdowns, a formula column.
- **Show codes** (`lib/visibility.ts`, enforced server-side in `/r/[slug]`; hidden data is not in the page source): a `Show`/`Public`/`Visible`/`On site` column (yes/no per row, blank = shown), `[private]`/`[hide]` (or round brackets) on a column header, `(private)`/`(hide)` on a sheet name (Excel forbids `[ ]` in sheet names). `npm test` checks them.
- Editable lists live in the existing `reports.payload` (`data.editable`), so there is no schema change. Lists can now be password protected too.
- Settings sheet also takes `Currency` (shown before the estimated total).


## Access (who can open a report)
Separate from the workbook. Dashboard card > **Access**: Public or Password now; per-email access later (another mode behind `gate()` in `lib/access.ts`; it will need an allow-list/sign-in-link table).
- Stored beside the data in `reports.payload.access` (`{mode:"public"}` or `{mode:"password", hash, v, setAt}`); `protectedByPassword` is kept in step. No schema change.
- Password: salted scrypt hash, never the password. Min 8 characters. A correct password sets a signed HttpOnly cookie (7 days) tied to the hash, so changing the password signs everyone out. `PUT /api/reports/:id/access`.
- `/r/<slug>` sends no report data until `gate()` says open; wrong passwords go to `POST /r/<slug>/unlock` (400 ms delay, 8 tries per 10 minutes per IP per instance; not shared across servers, so a shared limit needs a store later).
- Needs `ACCESS_COOKIE_SECRET` (falls back to `CLERK_SECRET_KEY`) to sign cookies.
- Replacing the workbook keeps the access setting. Reports protected with the older browser encryption keep working; replacing one asks for a new password (we cannot read the old data).
- Tests: `npm test` (`scripts/test-access.ts`: hashing, cookies, expiry, tampering, password change, brute-force brake, page escaping).
