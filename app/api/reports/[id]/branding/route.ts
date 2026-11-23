import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { sanitizeBranding, type BrandingInput } from "@/lib/branding";
import { UserError, type Payload } from "@/lib/report";
import { getOwned, ownedWhere } from "@/lib/reports";

type Ctx = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f-]{36}$/i;

// Dashboard branding for a report: logo, colors, footer, hide the SheetPress line.
// Body: BrandingInput, or { reset: true } to fall back to the workbook's Settings sheet.
export async function PUT(req: Request, { params }: Ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const row = await getOwned(id, userId);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const payload = row.payload as Payload;
    if (!("data" in payload)) throw new UserError("This report uses the old encrypted password. Upload it again to change branding.");
    const body = (await req.json().catch(() => ({}))) as BrandingInput & { reset?: boolean };
    const brand = body.reset ? {} : sanitizeBranding(body);
    const { branding: _old, ...rest } = payload;
    void _old;
    const next: Payload = Object.keys(brand).length ? { ...rest, branding: brand } : rest;
    await db().update(reports).set({ payload: next, updatedAt: new Date() }).where(ownedWhere(id, userId));
    return NextResponse.json({ branding: brand });
  } catch (e) {
    if (e instanceof UserError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("set branding failed", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
