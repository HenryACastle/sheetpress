import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { buildFromForm } from "@/lib/form";
import { validateSheets } from "@/lib/lists";
import { UserError, type Payload } from "@/lib/report";
import { getOwned, ownedWhere } from "@/lib/reports";

type Ctx = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f-]{36}$/i;

// Replace a report's workbook (and title/subtitle/password) in place. The link stays the same.
export async function PUT(req: Request, { params }: Ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const built = await buildFromForm(await req.formData(), true);
    if (!built) throw new UserError("Choose an .xlsx file.");
    // An upload into a list keeps it a list: still editable on the dashboard (never when password protected).
    const before = await getOwned(id, userId);
    const prev = before?.payload as Payload | undefined;
    if (prev && "data" in prev && prev.data.editable && "data" in built.payload) {
      built.payload = { data: { ...built.payload.data, editable: true, ...(prev.data.template ? { template: prev.data.template } : {}) } };
    }
    const res = await db().update(reports).set({ ...built, updatedAt: new Date() }).where(ownedWhere(id, userId)).returning({ slug: reports.slug });
    if (!res.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ slug: res[0].slug });
  } catch (e) {
    if (e instanceof UserError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("update report failed", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// Save edits made in the dashboard editor (JSON). Owner only; same limits as an upload.
export async function PATCH(req: Request, { params }: Ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const row = await getOwned(id, userId);
    const payload = row?.payload as Payload | undefined;
    if (!row || !payload || !("data" in payload) || !payload.data.editable) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const body = await req.json();
    const sheets = validateSheets(body?.sheets);
    const data = { ...payload.data, sheets, generated: new Date().toISOString().slice(0, 10) };
    await db().update(reports).set({
      payload: { data }, sheetCount: sheets.length, rowCount: sheets.reduce((n, s) => n + s.rows.length, 0), updatedAt: new Date(),
    }).where(ownedWhere(id, userId));
    return NextResponse.json({ ok: true, generated: data.generated });
  } catch (e) {
    if (e instanceof UserError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("save list failed", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const res = await db().delete(reports).where(ownedWhere(id, userId)).returning({ id: reports.id });
  return res.length ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}
