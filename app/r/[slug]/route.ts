import { getPublicBySlug } from "@/lib/reports";
import { renderHtml, type Payload } from "@/lib/report";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return new Response("Not found", { status: 404 });
  const r = await getPublicBySlug(slug);
  if (!r) return new Response("Report not found", { status: 404, headers: { "content-type": "text/plain" } });
  return new Response(renderHtml(r.title, r.payload as Payload), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=30, stale-while-revalidate=300",
      "x-robots-tag": "noindex, nofollow",
      "referrer-policy": "no-referrer",
    },
  });
}
