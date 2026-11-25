import { requiresOptIn } from "@/lib/regions";

// Tells the browser whether analytics needs a prior opt-in for this visitor. Reads the country that Vercel adds
// to the request; stores nothing, sets no cookie, and is never cached (the answer differs per visitor).
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const country = req.headers.get("x-vercel-ip-country");
  return Response.json(
    { optin: requiresOptIn(country) },
    { headers: { "cache-control": "no-store, max-age=0", "x-robots-tag": "noindex" } },
  );
}
