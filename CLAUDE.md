# SheetPress

Excel (.xlsx) to shareable report site. Next.js 16 (proxy.ts, async params) + Clerk v7 + Neon/Drizzle. See README.md.
- Read `node_modules/next/dist/docs/` before using Next APIs from memory; this version has breaking changes.
- Every owner query is scoped by Clerk userId (lib/reports.ts). Keep it that way.
- `lib/report-template.html` is the report page; `npm run build` regenerates `lib/report-template.generated.ts`.
