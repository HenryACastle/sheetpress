import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { checkDomain, connectDomain, disconnectDomain } from "@/lib/domain-service";
import { DomainError } from "@/lib/domains";
import { vercelConfigured } from "@/lib/vercel-domains";

type Ctx = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f-]{36}$/i;

// Every handler: signed in, valid id, feature configured. Ownership is enforced inside lib/domain-service.
async function guard(ctx: Ctx) {
  const { userId } = await auth();
  if (!userId) return { res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  const { id } = await ctx.params;
  if (!UUID.test(id)) return { res: NextResponse.json({ error: "Not found" }, { status: 404 }) } as const;
  if (!vercelConfigured()) return { res: NextResponse.json({ error: "Custom domains are not enabled on this server yet." }, { status: 503 }) } as const;
  return { userId, id } as const;
}
const fail = (e: unknown) => {
  if (e instanceof DomainError) return NextResponse.json({ error: e.message }, { status: 400 });
  console.error("domain route failed", e);
  return NextResponse.json({ error: "Something went wrong talking to our hosting provider. Try again in a minute." }, { status: 502 });
};

export async function POST(req: Request, ctx: Ctx) {
  const g = await guard(ctx); if ("res" in g) return g.res;
  try {
    const body = (await req.json().catch(() => ({}))) as { domain?: string };
    return NextResponse.json({ status: await connectDomain(g.userId, g.id, String(body.domain ?? "")) });
  } catch (e) { return fail(e); }
}

export async function GET(_req: Request, ctx: Ctx) {
  const g = await guard(ctx); if ("res" in g) return g.res;
  try { return NextResponse.json({ status: await checkDomain(g.userId, g.id) }); } catch (e) { return fail(e); }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const g = await guard(ctx); if ("res" in g) return g.res;
  try { await disconnectDomain(g.userId, g.id); return NextResponse.json({ ok: true }); } catch (e) { return fail(e); }
}
