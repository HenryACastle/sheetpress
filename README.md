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
