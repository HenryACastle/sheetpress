import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { isOwnHost } from "@/lib/domains";
import { slugForHost } from "@/lib/domain-service";

// Clerk runs ONLY where it is needed. The marketing page (/) and published reports (/r/*) never
// trigger Clerk's session handshake or load Clerk scripts.
const isPage = createRouteMatcher(["/app(.*)"]);
const isApi = createRouteMatcher(["/api/reports(.*)"]);
const needsClerk = createRouteMatcher(["/app(.*)", "/sign-in(.*)", "/sign-up(.*)", "/api/reports(.*)"]);

const clerk = clerkMiddleware(
  async (auth, req) => {
    if (isApi(req)) {
      const { userId } = await auth();
      if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else if (isPage(req)) {
      await auth.protect();
    }
  },
  // Pinned so Clerk redirects to our own pages, never its hosted Account Portal.
  { signInUrl: "/sign-in", signUpUrl: "/sign-up" },
);

// Report domains: REPORT_DOMAINS="seo.example.com=report-slug,reports.other.com=other-slug".
// A listed host shows that one report at its root and nothing else of the app (no dashboard, no sign-in).
// Add the domain in Vercel and point its DNS at Vercel; the slug is the part after /r/ in the report link.
function reportHosts(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of (process.env.REPORT_DOMAINS ?? "").split(",")) {
    const [h, s] = pair.split("=").map((x) => x?.trim().toLowerCase());
    if (h && s && /^[a-z0-9.-]+$/.test(h) && /^[a-z0-9-]{1,60}$/.test(s)) out[h] = s;
  }
  return out;
}

// Customer domains added from the dashboard (reports.custom_domain). Served only while verified.
// Tiny per-instance cache so a busy report does not hit the database on every request.
const hostCache = new Map<string, { slug: string | null; exp: number }>();
async function customDomainSlug(host: string): Promise<string | null> {
  const hit = hostCache.get(host);
  if (hit && hit.exp > Date.now()) return hit.slug;
  const slug = await slugForHost(host);
  hostCache.set(host, { slug, exp: Date.now() + (slug ? 20_000 : 10_000) });
  if (hostCache.size > 500) hostCache.clear();
  return slug;
}

// A host that is not ours serves one report at its root and nothing else of the app.
function serveReportHost(req: NextRequest, slug: string | null) {
  const { pathname } = req.nextUrl;
  if (!slug) return new NextResponse("This domain is not connected to a report.", { status: 404, headers: { "x-robots-tag": "noindex" } });
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = `/r/${slug}`;
    return NextResponse.rewrite(url);
  }
  if (pathname === `/r/${slug}` || pathname === "/robots.txt" || pathname === "/favicon.ico") return NextResponse.next();
  return new NextResponse("Not found", { status: 404 });
}

export default async function proxy(req: NextRequest, evt: NextFetchEvent) {
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").toLowerCase().split(":")[0];
  // 1) Operator override from the REPORT_DOMAINS env var (checked first, no database).
  const fixed = reportHosts()[host];
  if (fixed) return serveReportHost(req, fixed);
  // 2) Any host that is not one of ours is a customer domain: look it up.
  if (!isOwnHost(host)) {
    try {
      return serveReportHost(req, await customDomainSlug(host));
    } catch (e) {
      console.error("custom domain lookup failed", e);
      return new NextResponse("Temporarily unavailable. Please try again.", { status: 503, headers: { "retry-after": "10" } });
    }
  }
  if (needsClerk(req)) return clerk(req, evt);
  return NextResponse.next();
}

export const config = {
  // Everything except Next internals and files with an extension (images, fonts, downloads).
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
