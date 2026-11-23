import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { buildFromForm } from "@/lib/form";
import { validateSheets } from "@/lib/lists";
import { UserError, type Access, type Payload } from "@/lib/report";
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
    const built0 = await buildFromForm(await req.formData(), true);
    if (!built0) throw new UserError("Choose an .xlsx file.");
    const { access: formAccess, ...built } = built0; // access lives inside the payload, not in a column
    const before = await getOwned(id, userId);
    if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const prev = before.payload as Payload;
    if (!("data" in built.payload)) throw new UserError("Something went wrong.");
    let data = built.payload.data;
    // An upload into a list keeps it a list: still editable on the dashboard.
    if ("data" in prev && prev.data.editable) data = { ...data, editable: true, ...(prev.data.template ? { template: prev.data.template } : {}) };
    // Replacing the workbook never changes who can open the report: the Access panel owns that.
    let access: Access | undefined;
    if ("data" in prev) access = prev.access;
    else {
      // Old browser-encrypted protection cannot be carried over (we cannot read it), so a new choice is needed.
      if (!formAccess) throw new UserError("This report used the old encrypted password. Enter a new password to keep it private, then Access can change it any time.");
      access = formAccess;
    }
    built.payload = { data, ...(access ? { access } : {}) };
    built.protectedByPassword = access?.mode === "password";
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
      payload: { data, ...(payload.access ? { access: payload.access } : {}) }, sheetCount: sheets.length, rowCount: sheets.reduce((n, s) => n + s.rows.length, 0), updatedAt: new Date(),
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
