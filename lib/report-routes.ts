import { allowAttempt, clearFails, cookieHeader, cookieName, gate, lockPage, readCookie, recordFail, signCookie, verifyPassword } from "./access";
import { isOwnHost } from "./domains";
import { renderHtml, type Payload } from "./report";
import { SITE_URL } from "./site";
import { publicView } from "./visibility";
import { effectiveBrand, withBrand } from "./branding";

// The public report endpoints, with the data lookup injected so the security-critical logic can be tested
// without a database. app/r/[slug]/route.ts and .../unlock/route.ts are thin wrappers around these.
// customDomain + domainVerified: once a verified domain exists it is the report's main address.
export type Row = { id: string; title: string; payload: unknown; customDomain?: string | null; domainVerified?: boolean | null };
export type Lookup = (slug: string) => Promise<Row | null>;

const MISSING = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Report not found</title><body style="font-family:system-ui,sans-serif;background:#f0f2f5;color:#2a4451;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center"><div style="max-width:380px;padding:24px"><h1 style="margin:0 0 8px">Report not found</h1><p style="color:#566b75">This link may have been deleted or copied incorrectly.</p><a href="/" style="color:#2a7f63">Back to SheetPress</a></div>`;
const SLUG = /^[a-z0-9-]{1,60}$/;
const html = (body: string, extra: Record<string, string> = {}, status = 200) =>
  new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex, nofollow", "referrer-policy": "no-referrer", ...extra } });
const hostOf = (req: Request) => (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").toLowerCase().split(":")[0];

export async function handleView(req: Request, slug: string, lookup: Lookup): Promise<Response> {
  const missing = () => new Response(MISSING, { status: 404, headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" } });
  if (!SLUG.test(slug)) return missing();
  const r = await lookup(slug);
  if (!r) return missing();
  const payload = r.payload as Payload;

  // A report with a live custom domain has ONE main address: the SheetPress link forwards visitors to it.
  // Temporary redirect, so removing the domain brings the SheetPress link straight back.
  if (r.customDomain && r.domainVerified && isOwnHost(hostOf(req))) {
    return new Response(null, { status: 307, headers: { location: `https://${r.customDomain}/`, "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });
  }

  // Old browser-encrypted reports still unlock in the page itself.
  if ("enc" in payload) return html(renderHtml(r.title, payload), { "cache-control": "public, max-age=0, s-maxage=30, stale-while-revalidate=300" });

  // Server-side access: a locked report sends NO data until the password has been given.
  const cookie = readCookie(req.headers.get("cookie"), cookieName(r.id));
  if (gate(payload.access, cookie, r.id) === "lock") {
    const next = isOwnHost(hostOf(req)) ? `/r/${slug}` : "/";
    return html(lockPage({ title: r.title, slug, next, brand: effectiveBrand(payload.data.brand, payload.branding), siteUrl: SITE_URL }), { "cache-control": "private, no-store" });
  }
  // A visitor only ever gets the public view: hidden sheets, columns and rows are removed here, on the server.
  const locked = payload.access?.mode === "password";
  return html(renderHtml(r.title, { data: withBrand(publicView(payload.data), payload.branding) }), {
    "cache-control": locked ? "private, no-store" : "public, max-age=0, s-maxage=30, stale-while-revalidate=300",
  });
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
export async function handleUnlock(req: Request, slug: string, lookup: Lookup, delayMs = 400): Promise<Response> {
  if (!SLUG.test(slug)) return new Response("Not found", { status: 404 });
  const r = await lookup(slug);
  if (!r) return new Response("Not found", { status: 404 });
  const payload = r.payload as Payload;
  const form = await req.formData().catch(() => null);
  const pw = String(form?.get("password") ?? "");
  const nextRaw = String(form?.get("next") ?? "");
  const next = nextRaw === "/" || nextRaw === `/r/${slug}` ? nextRaw : `/r/${slug}`; // never redirect anywhere else
  if ("enc" in payload || payload.access?.mode !== "password") return new Response(null, { status: 303, headers: { location: next } });

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const key = `${ip}|${slug}`;
  const page = (error: string, status: number) => html(lockPage({ title: r.title, slug, next, error, brand: effectiveBrand(payload.data.brand, payload.branding), siteUrl: SITE_URL }), { "cache-control": "private, no-store" }, status);
  if (!allowAttempt(key)) return page("Too many attempts. Please wait 10 minutes and try again.", 429);
  if (!pw || pw.length > 128 || !verifyPassword(pw, payload.access.hash)) {
    recordFail(key);
    await wait(delayMs); // slows guessing; scrypt already costs time
    return page("That password is not right.", 401);
  }
  clearFails(key);
  return new Response(null, { status: 303, headers: { location: next, "set-cookie": cookieHeader(r.id, signCookie(r.id, payload.access)), "cache-control": "private, no-store" } });
}
