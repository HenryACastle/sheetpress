import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { FREE } from "@/lib/plans";
import { makeSlug, UserError } from "@/lib/report";
import { countReports } from "@/lib/reports";
import { shoppingList } from "@/lib/templates";

// Create a ready-to-edit list from a template (no Excel needed). Counts toward the free report limit.
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    if ((await countReports(userId)) >= FREE.maxReports) throw new UserError(`Free accounts can publish ${FREE.maxReports} reports. Delete one first.`);
    const body = await req.json().catch(() => ({}));
    const title = String(body?.title ?? "").trim().slice(0, 80) || "Shopping list";
    const data = shoppingList(title);
    const [row] = await db().insert(reports).values({
      userId, slug: makeSlug(title), title, subtitle: data.subtitle, payload: { data }, protectedByPassword: false,
      sheetCount: data.sheets.length, rowCount: data.sheets.reduce((n, s) => n + s.rows.length, 0),
    }).returning({ id: reports.id, slug: reports.slug });
    return NextResponse.json({ id: row.id, slug: row.slug });
  } catch (e) {
    if (e instanceof UserError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("create list failed", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
