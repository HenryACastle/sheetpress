import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { newPasswordAccess } from "@/lib/access";
import { UserError, type Access, type Payload } from "@/lib/report";
import { getOwned, ownedWhere } from "@/lib/reports";

type Ctx = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f-]{36}$/i;

// Who can open this report. Separate from the workbook: changing it never needs a re-upload.
// Body: { mode: "public" } or { mode: "password", password }. Per-email access will be another mode here.
export async function PUT(req: Request, { params }: Ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const row = await getOwned(id, userId);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const payload = row.payload as Payload;
    if (!("data" in payload)) throw new UserError("This report uses the old encrypted password, which cannot be changed from here. Upload the workbook again with a new password.");
    const body = (await req.json().catch(() => ({}))) as { mode?: string; password?: string };
    let access: Access;
    if (body.mode === "password") {
      const prevV = payload.access?.mode === "password" ? payload.access.v : 0;
      access = newPasswordAccess(String(body.password ?? ""), prevV); // validates length; bumps the version so old unlocks stop working
    } else if (body.mode === "public") {
      access = { mode: "public" };
    } else {
      throw new UserError("Choose public or password.");
    }
    await db().update(reports).set({ payload: { data: payload.data, access }, protectedByPassword: access.mode === "password", updatedAt: new Date() }).where(ownedWhere(id, userId));
    return NextResponse.json({ mode: access.mode });
  } catch (e) {
    if (e instanceof UserError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("set access failed", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
