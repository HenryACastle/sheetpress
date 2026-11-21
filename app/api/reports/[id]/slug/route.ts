import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { renameSlug } from "@/lib/domain-service";
import { DomainError } from "@/lib/domains";

type Ctx = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f-]{36}$/i;

// Rename a report's link name (/r/<slug>). The old link stops working. Ownership is enforced in renameSlug.
export async function PUT(req: Request, { params }: Ctx) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const body = (await req.json().catch(() => ({}))) as { slug?: string };
    return NextResponse.json({ slug: await renameSlug(userId, id, String(body.slug ?? "")) });
  } catch (e) {
    if (e instanceof DomainError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("rename failed", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
