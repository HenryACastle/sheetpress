import { getPublicBySlug } from "@/lib/reports";
import { renderHtml, type Payload } from "@/lib/report";

const MISSING = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Report not found</title><body style="font-family:system-ui,sans-serif;background:#f0f2f5;color:#2a4451;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center"><div style="max-width:380px;padding:24px"><h1 style="margin:0 0 8px">Report not found</h1><p style="color:#566b75">This link may have been deleted or copied incorrectly.</p><a href="/" style="color:#2a7f63">Back to SheetPress</a></div>`;

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  const missing = () => new Response(MISSING, { status: 404, headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" } });
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return missing();
  const r = await getPublicBySlug(slug);
  if (!r) return missing();
  return new Response(renderHtml(r.title, r.payload as Payload), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=30, stale-while-revalidate=300",
      "x-robots-tag": "noindex, nofollow",
      "referrer-policy": "no-referrer",
    },
  });
}
