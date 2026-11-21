import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import writeXlsxFile from "write-excel-file/node";
import { getOwned } from "@/lib/reports";
import type { Payload } from "@/lib/report";

type Ctx = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f-]{36}$/i;

// Download the report as an .xlsx, EVERYTHING including private rows and columns (the owner's copy).
// Upload it again to the same report to update it. Sheet names and header codes are kept.
export async function GET(_req: Request, { params }: Ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const row = await getOwned(id, userId);
  const payload = row?.payload as Payload | undefined;
  if (!row || !payload || !("data" in payload)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const d = payload.data;
  const prefix = (kind: string, name: string) => (kind === "chart" ? `Chart ${name}` : name);
  const book = [
    ...d.sheets.map((s) => ({
      sheet: prefix(s.kind, s.name).slice(0, 31),
      data: [s.headers.map((h) => ({ value: h, fontWeight: "bold" as const })), ...s.rows.map((r) => r.map((v) => ({ value: v })))],
    })),
    { sheet: "Settings", data: [[{ value: "Setting", fontWeight: "bold" as const }, { value: "Value", fontWeight: "bold" as const }],
      [{ value: "Title" }, { value: d.title }], [{ value: "Subtitle" }, { value: d.subtitle }],
      ...Object.entries({ Logo: d.brand?.logo, "Logo link": d.brand?.link, Accent: d.brand?.accent, Theme: d.brand?.theme, Footer: d.brand?.footer })
        .filter(([, v]) => v).map(([k, v]) => [{ value: k }, { value: String(v) }])] },
  ];
  const buf = await writeXlsxFile(book as never).toBuffer();
  const name = row.slug.replace(/[^a-z0-9-]/g, "") + ".xlsx";
  return new Response(buf as unknown as BodyInit, {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "private, no-store",
    },
  });
}
