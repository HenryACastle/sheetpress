# SheetPress

Upload an Excel (.xlsx), get a shareable, searchable report page. Live target: https://sheetpress.yeve.dev

Stack: Next.js 16 + Clerk v7 (owner login) + Neon Postgres/Drizzle. Reports render from one self-contained HTML template (`lib/report-template.html`).

## How it works
- `/` marketing, `/sign-in` `/sign-up` Clerk, `/app` dashboard (publish, update, delete).
- `POST /api/reports` parses the workbook server-side (`lib/parse.ts`), stores the data as JSON in Neon. With a password, only an AES-GCM encrypted blob is stored (the password is never stored; updating a protected report means re-entering it).
- `GET /r/<slug>` serves the report HTML. Public by link, or locked behind the password.
- Free limits live in `lib/plans.ts` (3 reports, 1000 rows/sheet, 2 MB).

## Go-live checklist (Vercel)
1. Neon: create a DB, copy the pooled connection string, run `DATABASE_URL=... npm run db:push`.
2. Clerk: create an app, **Production** instance, domain `sheetpress.yeve.dev`. Add the DNS records Clerk lists (in Cloudflare, DNS only / grey cloud).
3. Vercel: import this repo. Env vars: `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_APP_URL=https://sheetpress.yeve.dev`.
4. Vercel > Domains: add `sheetpress.yeve.dev`. Cloudflare: CNAME `sheetpress` to `cname.vercel-dns.com` (DNS only). Do NOT touch the shared `_vercel` TXT record on yeve.dev; add the new verification TXT alongside it.
5. Smoke test: sign up, publish `examples/barcrawlerz-progress.xlsx`, open the link, try a password report.

## Local dev
`cp .env.example .env.local`, fill it in, `npm install`, `npm run dev`. Sample workbook generator and the original CLI live in the Harvis vault under `tools/sheetpress`.

## Roadmap
Google Sheets sync, custom domains per report, viewer logins (Clerk) for team-only reports, Stripe + Pro plan, rate limiting on `/r/*` unlock attempts (currently client-side PBKDF2 only).
