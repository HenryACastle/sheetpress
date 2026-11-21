import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { buildFromForm } from "@/lib/form";
import { FREE } from "@/lib/plans";
import { DomainError, normalizeSlug } from "@/lib/domains";
import { makeSlug, UserError } from "@/lib/report";
import { countReports } from "@/lib/reports";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    if ((await countReports(userId)) >= FREE.maxReports) {
      throw new UserError(`Free accounts can publish ${FREE.maxReports} reports. Delete one or wait for paid plans.`);
    }
    const form = await req.formData();
    const wanted = String(form.get("slug") ?? "").trim();
    const slug = wanted ? normalizeSlug(wanted) : null; // throws DomainError with a friendly message
    const built = await buildFromForm(form, true);
    if (!built) throw new UserError("Choose an .xlsx file.");
    let row: { slug: string };
    try {
      [row] = await db().insert(reports).values({ userId, slug: slug ?? makeSlug(built.title), ...built }).returning({ slug: reports.slug });
    } catch (e) {
      if (slug) throw new DomainError("That link name is taken. Try another.");
      throw e;
    }
    return NextResponse.json({ slug: row.slug });
  } catch (e) {
    if (e instanceof UserError || e instanceof DomainError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("create report failed", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
