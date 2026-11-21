# SheetPress

Upload an Excel (.xlsx), get a shareable, searchable report page. Production: https://sheetpress.org (the older sheetpress.yeve.dev address can redirect to it)

Stack: Next.js 16 + Clerk v7 (owner login) + Neon Postgres/Drizzle. Reports render from one self-contained HTML template (`lib/report-template.html`).

## How it works
- `/` marketing, `/sign-in` `/sign-up` Clerk, `/app` dashboard (publish, update, delete).
- `POST /api/reports` parses the workbook server-side (`lib/parse.ts`), stores the data as JSON in Neon. With a password, only an AES-GCM encrypted blob is stored (the password is never stored; updating a protected report means re-entering it).
- `GET /r/<slug>` serves the report HTML. Public by link, or locked behind the password.
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
- **Settings sheet** (not shown): `Setting | Value` rows: Title, Subtitle, Logo (https image), Logo link, Accent (#hex), Theme (light/dark), Footer. Validated in `lib/parse.ts`; bad values are ignored.
- **Formulas** are fine: the parser reads the saved result, so write files with the results cached (Excel does; `tools/barcrawlerz-seo-audit/make_sheetpress_report.py` does via xlsxwriter).

## Report domains
`REPORT_DOMAINS="seo.example.com=report-slug"` (comma separated pairs) makes that host show one report at its root and nothing else of the app. Add the domain in Vercel, point DNS at Vercel, redeploy. The slug is the part after `/r/` in the report link. Implemented in `proxy.ts` (404 for everything else on that host).


## Editable lists and show codes (shopping list template)
- Dashboard > **New shopping list** creates an editable list (no Excel needed). `/app/lists/<id>` is the editor: quick add, edit cells, tick Bought, per-row **On site**, per-column **public/private**, totals, Save (PATCH `/api/reports/:id`), **Download Excel** (`GET /api/reports/:id/xlsx`, everything including private data) and **Upload Excel** (PUT, replaces the list, stays editable).
- `public/examples/shopping-list.xlsx` is the Excel template (built by `tools/sheetpress/make_shopping_list_template.py` in the vault): Show column, `Notes [private]`, a `Help (private)` sheet, status/Show dropdowns, a formula column.
- **Show codes** (`lib/visibility.ts`, enforced server-side in `/r/[slug]`; hidden data is not in the page source): a `Show`/`Public`/`Visible`/`On site` column (yes/no per row, blank = shown), `[private]`/`[hide]` (or round brackets) on a column header, `(private)`/`(hide)` on a sheet name (Excel forbids `[ ]` in sheet names). `npm test` checks them.
- Editable lists live in the existing `reports.payload` (`data.editable`), so there is no schema change. Not password-protectable (the server cannot re-encrypt without the password); password uploads keep only the public view.
- Settings sheet also takes `Currency` (shown before the estimated total).
