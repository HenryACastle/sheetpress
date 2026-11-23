// Run: npm run test:domains   (uses .env.local DATABASE_URL; creates and removes rows owned by e2e_* users)
import { config } from "dotenv"; config({ path: [".env.local", ".env"], quiet: true });
import { and, eq, like } from "drizzle-orm";
import { db } from "../db";
import { reports } from "../db/schema";
import { applyHttps, deriveStatus, dnsHostName, isOwnHost, nextVerified, normalizeDomain, normalizeSlug, DomainError } from "../lib/domains";
import { vercelApi, type FetchLike } from "../lib/vercel-domains";
import { checkDomain, connectDomain, disconnectDomain, renameSlug, slugForHost } from "../lib/domain-service";

let pass = 0, fail = 0;
const UP = async () => true;   // pretend the HTTPS address already answers
const ok = (name: string, cond: boolean, extra = "") => { cond ? pass++ : fail++; console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  " + extra}`); };
const throws = async (name: string, fn: () => unknown, match: RegExp) => {
  try { await fn(); ok(name, false, "did not throw"); } catch (e) { ok(name, e instanceof DomainError && match.test(e.message), String((e as Error).message)); }
};

// ---------- in-memory fake of the Vercel API ----------
type D = { name: string; apexName: string; verified: boolean; verification: { type: string; domain: string; value: string; reason: string }[] };
function fakeVercel() {
  const domains = new Map<string, D>(); const calls: { method: string; url: string; auth?: string; body?: string }[] = [];
  const knobs = { txtOk: new Set<string>(), dnsOk: new Set<string>() };
  const apex = (n: string) => n.split(".").slice(-2).join(".");
  const fetchImpl: FetchLike = async (url, init) => {
    const u = new URL(url); const method = init?.method ?? "GET"; const path = u.pathname;
    calls.push({ method, url, auth: init?.headers?.Authorization, body: init?.body });
    const reply = (status: number, body: unknown) => ({ status, json: async () => body });
    let m: RegExpMatchArray | null;
    if (method === "POST" && (m = path.match(/^\/v10\/projects\/[^/]+\/domains$/))) {
      const name = JSON.parse(init!.body!).name as string;
      if (name.startsWith("taken.")) return reply(409, { error: { code: "domain_already_in_use", message: "The domain is already assigned to another Vercel project" } });
      if (name.startsWith("foreign.")) return reply(403, { error: { code: "forbidden", message: "You don't have access to the domain you are adding" } });
      if (domains.has(name)) return reply(400, { error: { code: "domain_already_exists", message: "Domain already exists on the project" } });
      const needsTxt = name.startsWith("tx.");
      const d: D = { name, apexName: apex(name), verified: !needsTxt, verification: needsTxt ? [{ type: "TXT", domain: `_vercel.${apex(name)}`, value: "vc-domain-verify=abc123", reason: "pending_domain_verification" }] : [] };
      domains.set(name, d); return reply(200, d);
    }
    if (method === "GET" && (m = path.match(/^\/v9\/projects\/[^/]+\/domains\/([^/]+)$/))) { const d = domains.get(decodeURIComponent(m[1])); return d ? reply(200, d) : reply(404, { error: { code: "not_found" } }); }
    if (method === "POST" && (m = path.match(/^\/v9\/projects\/[^/]+\/domains\/([^/]+)\/verify$/))) {
      const n = decodeURIComponent(m[1]); const d = domains.get(n); if (!d) return reply(404, {});
      if (knobs.txtOk.has(n)) { d.verified = true; d.verification = []; return reply(200, d); }
      return reply(400, { error: { code: "missing_txt_record", message: "The domain does not have a TXT record" } });
    }
    if (method === "GET" && (m = path.match(/^\/v6\/domains\/([^/]+)\/config$/))) {
      const n = decodeURIComponent(m[1]); const good = knobs.dnsOk.has(n);
      return reply(200, { acceptedChallenges: [], configuredBy: good ? "CNAME" : null, misconfigured: !good, recommendedCNAME: [{ rank: 2, value: "cname.vercel-dns.com." }, { rank: 1, value: "abc123def.vercel-dns-016.com." }], recommendedIPv4: [{ rank: 1, value: ["76.76.21.21"] }] });
    }
    if (method === "DELETE" && (m = path.match(/^\/v9\/projects\/[^/]+\/domains\/([^/]+)$/))) { const n = decodeURIComponent(m[1]); return domains.delete(n) ? reply(200, {}) : reply(404, {}); }
    return reply(500, { error: { message: "unhandled " + method + " " + path } });
  };
  return { domains, calls, knobs, api: vercelApi({ token: "tok_test", project: "prj_sheetpress", team: "team_1" }, fetchImpl) };
}

async function main() {
  // ---------- normalizeDomain ----------
  ok("normalize: pasted URL", normalizeDomain(" https://Reports.Acme.com/path?x=1#h ") === "reports.acme.com");
  ok("normalize: apex + port + trailing dot", normalizeDomain("Acme.com.:8080") === "acme.com");
  ok("normalize: punycode ok", normalizeDomain("xn--bcher-kva.example") === "xn--bcher-kva.example");
  for (const [bad, re] of [["", /Enter a domain/], ["localhost", /full domain/], ["192.168.1.1", /IP address/], ["foo", /full domain/], ["a b.com", /not look like/], ["bad_domain.com", /valid domain/], ["-bad.com", /valid domain/], ["*.acme.com", /Wildcard/], ["sheetpress.org", /belongs to SheetPress/], ["x.sheetpress.org", /belongs to SheetPress/], ["sheetpress.yeve.dev", /belongs to SheetPress/], ["my-app.vercel.app", /belongs to SheetPress/], ["acme.123", /extension/], ["user@acme.com", /not look like/]] as [string, RegExp][])
    await throws(`normalize rejects "${bad}"`, () => normalizeDomain(bad), re);

  // ---------- slugs ----------
  ok("slug: cleans spaces/case/symbols", normalizeSlug("  My Q4 Report!! ") === "my-q4-report");
  ok("slug: collapses dashes", normalizeSlug("a---b---c") === "a-b-c");
  for (const bad of ["ab", "--", "api", "sign-in", "demo-anything", "x".repeat(61)]) await throws(`slug rejects "${bad.slice(0, 12)}"`, () => normalizeSlug(bad), /.*/);

  // ---------- own hosts ----------
  ok("isOwnHost: ours", ["sheetpress.org", "WWW.sheetpress.org:443", "sheetpress.yeve.dev", "localhost:3000", "foo-abc.vercel.app"].every((h) => isOwnHost(h)));
  ok("isOwnHost: customer + empty", !isOwnHost("reports.acme.com") && !isOwnHost("evil-sheetpress.org") && isOwnHost(""));

  // ---------- status derivation ----------
  const cfgBad = { configuredBy: null, misconfigured: true, recommendedCNAME: [{ rank: 2, value: "cname.vercel-dns.com." }, { rank: 1, value: "abc123def.vercel-dns-016.com." }], recommendedIPv4: [{ rank: 1, value: ["76.76.21.21"] }] };
  const sub = deriveStatus("reports.acme.com", { name: "reports.acme.com", apexName: "acme.com", verified: true }, cfgBad);
  ok("status: subdomain => CNAME rank-1 value, host 'reports'", sub.state === "needs_dns" && sub.records.length === 1 && sub.records[0].type === "CNAME" && sub.records[0].name === "reports" && sub.records[0].value === "abc123def.vercel-dns-016.com");
  const apx = deriveStatus("acme.com", { name: "acme.com", apexName: "acme.com", verified: true }, cfgBad);
  ok("status: apex => A record @ 76.76.21.21", apx.isApex && apx.records[0].type === "A" && apx.records[0].name === "@" && apx.records[0].value === "76.76.21.21");
  const tx = deriveStatus("reports.acme.com", { name: "reports.acme.com", apexName: "acme.com", verified: false, verification: [{ type: "TXT", domain: "_vercel.acme.com", value: "vc-domain-verify=zzz", reason: "x" }] }, cfgBad);
  ok("status: unverified => TXT first (_vercel) then CNAME", tx.state === "needs_txt" && tx.records[0].type === "TXT" && tx.records[0].name === "_vercel" && tx.records[1].type === "CNAME");
  ok("status: live => no records", deriveStatus("reports.acme.com", { name: "reports.acme.com", apexName: "acme.com", verified: true }, { ...cfgBad, misconfigured: false, configuredBy: "CNAME" }).state === "live");
  ok("status: no config yet => needs_dns", deriveStatus("a.b.com", { name: "a.b.com", apexName: "b.com", verified: true }, null).state === "needs_dns");
  ok("dnsHostName: nested sub + apex", dnsHostName("a.b.acme.com", "acme.com") === "a.b" && dnsHostName("acme.com", "acme.com") === "@");

  // ---------- Vercel client: request shapes + error mapping ----------
  const fv = fakeVercel();
  await fv.api.addDomain("reports.acme.com");
  const add = fv.calls[0];
  ok("client: POST /v10/projects/{id}/domains?teamId", add.method === "POST" && add.url === "https://api.vercel.com/v10/projects/prj_sheetpress/domains?teamId=team_1", add.url);
  ok("client: bearer token + JSON body", add.auth === "Bearer tok_test" && add.body === JSON.stringify({ name: "reports.acme.com" }));
  await fv.api.getConfig("reports.acme.com");
  ok("client: config uses v6 + projectIdOrName", fv.calls.at(-1)!.url === "https://api.vercel.com/v6/domains/reports.acme.com/config?projectIdOrName=prj_sheetpress&teamId=team_1", fv.calls.at(-1)!.url);
  const again = await fv.api.addDomain("reports.acme.com");
  ok("client: re-adding existing domain is idempotent (400 -> GET)", again.name === "reports.acme.com");
  await throws("client: 409 -> friendly", () => fv.api.addDomain("taken.example.com"), /already in use/);
  await throws("client: 403 foreign -> friendly", () => fv.api.addDomain("foreign.example.com"), /another account/);
  ok("client: verify wrong TXT is not an error", (await fv.api.verifyDomain("reports.acme.com")).verified === false);
  await fv.api.removeDomain("reports.acme.com"); await fv.api.removeDomain("never-added.com");
  ok("client: remove is idempotent (404 ok)", !fv.domains.has("reports.acme.com"));

  // ---------- HTTPS readiness: "configured at Vercel" is not "reachable" ----------
  const liveStatus = deriveStatus("reports.acme.com", { name: "reports.acme.com", apexName: "acme.com", verified: true }, { ...cfgBad, misconfigured: false, configuredBy: "CNAME" });
  ok("https: probe ok keeps live", applyHttps(liveStatus, true).state === "live");
  const sec = applyHttps(liveStatus, false);
  ok("https: probe fails => securing, with the wait explained", sec.state === "securing" && /certificate/.test(sec.message) && /up to an hour/.test(sec.message));
  ok("https: only a live status is downgraded", applyHttps(tx, false).state === "needs_txt" && applyHttps(sub, false).state === "needs_dns");
  ok("verified flag: live => true", nextVerified("live", false) === true);
  ok("verified flag: securing never switches a serving domain off", nextVerified("securing", true) === true);
  ok("verified flag: securing never switches an unfinished one on", nextVerified("securing", false) === false);
  ok("verified flag: DNS lost => off", nextVerified("needs_dns", true) === false && nextVerified("needs_txt", true) === false);

  // ---------- service against the real database ----------
  const A = "e2e_dom_userA", B = "e2e_dom_userB";
  const clean = async () => { await db().delete(reports).where(like(reports.userId, "e2e_dom_%")); };
  await clean();
  const mk = async (userId: string, slug: string) => (await db().insert(reports).values({ userId, slug, title: slug, payload: { data: { title: slug, subtitle: "", generated: "2026-01-01", sheets: [] } } }).returning())[0];
  const a1 = await mk(A, "e2e-dom-a1"), a2 = await mk(A, "e2e-dom-a2"), b1 = await mk(B, "e2e-dom-b1");
  const v = fakeVercel();
  try {
    await throws("service: other user's report -> not found", () => connectDomain(B, a1.id, "reports.acme.com", v.api, UP), /not found/i);
    const s1 = await connectDomain(A, a1.id, "https://Reports.Acme.com/", v.api, UP);
    ok("connect: needs_dns + CNAME instruction", s1.state === "needs_dns" && s1.records[0].type === "CNAME" && s1.records[0].name === "reports");
    let row = (await db().select().from(reports).where(eq(reports.id, a1.id)))[0];
    ok("connect: saved normalized, NOT live yet", row.customDomain === "reports.acme.com" && row.domainVerified === false && !!row.domainClaimedAt);
    ok("proxy lookup ignores unverified domain", (await slugForHost("reports.acme.com")) === null);

    await throws("limit: free plan = 1 domain per account", () => connectDomain(A, a2.id, "other.acme.com", v.api, UP), /free plan includes 1/);
    await throws("conflict: same domain, other user, fresh claim", () => connectDomain(B, b1.id, "reports.acme.com", v.api, UP), /already connected to another/);

    const s2 = await checkDomain(A, a1.id, v.api, UP);
    ok("check: still waiting before DNS exists", s2?.state === "needs_dns");
    v.knobs.dnsOk.add("reports.acme.com");
    const s3 = await checkDomain(A, a1.id, v.api, UP);
    row = (await db().select().from(reports).where(eq(reports.id, a1.id)))[0];
    ok("check: live once DNS is right, flag persisted", s3?.state === "live" && row.domainVerified === true);
    ok("proxy lookup serves the verified domain", (await slugForHost("reports.acme.com")) === "e2e-dom-a1");
    ok("lookup is exact-match only", (await slugForHost("acme.com")) === null && (await slugForHost("evil.reports.acme.com")) === null);

    // TXT challenge path (domain already known to another Vercel account/project)
    await disconnectDomain(A, a1.id, v.api);
    row = (await db().select().from(reports).where(eq(reports.id, a1.id)))[0];
    ok("disconnect: cleared in DB and removed from Vercel", row.customDomain === null && row.domainVerified === false && !v.domains.has("reports.acme.com"));
    ok("disconnect: stops serving", (await slugForHost("reports.acme.com")) === null);
    const t1 = await connectDomain(A, a1.id, "tx.acme.com", v.api, UP);
    ok("txt path: TXT first, nothing live", t1.state === "needs_txt" && t1.records[0].type === "TXT" && t1.records[0].value === "vc-domain-verify=abc123");
    v.knobs.txtOk.add("tx.acme.com"); v.knobs.dnsOk.add("tx.acme.com");
    ok("txt path: verifies then goes live on check", (await checkDomain(A, a1.id, v.api, UP))?.state === "live");
    await disconnectDomain(A, a1.id, v.api);

    // stale unfinished claim can be taken over by the real owner
    await connectDomain(A, a1.id, "stale.acme.com", v.api, UP);
    await db().update(reports).set({ domainClaimedAt: new Date(Date.now() - 25 * 3600 * 1000) }).where(eq(reports.id, a1.id));
    const take = await connectDomain(B, b1.id, "stale.acme.com", v.api, UP);
    const [ra, rb] = [(await db().select().from(reports).where(eq(reports.id, a1.id)))[0], (await db().select().from(reports).where(eq(reports.id, b1.id)))[0]];
    ok("takeover: >24h unfinished claim is released to new owner", ra.customDomain === null && rb.customDomain === "stale.acme.com" && take.state === "needs_dns");
    await disconnectDomain(B, b1.id, v.api);

    // a VERIFIED claim is never taken over
    await connectDomain(A, a1.id, "solid.acme.com", v.api, UP); v.knobs.dnsOk.add("solid.acme.com"); await checkDomain(A, a1.id, v.api, UP);
    await db().update(reports).set({ domainClaimedAt: new Date(Date.now() - 99 * 3600 * 1000) }).where(eq(reports.id, a1.id));
    await throws("takeover: verified claims are protected", () => connectDomain(B, b1.id, "solid.acme.com", v.api, UP), /already connected to another/);
    await throws("service: Vercel conflict surfaces as friendly error", () => connectDomain(B, b1.id, "taken.example.com", v.api, UP), /already in use/);
    row = (await db().select().from(reports).where(eq(reports.id, b1.id)))[0];
    ok("failed add leaves no claim behind", row.customDomain === null);
    await disconnectDomain(A, a1.id, v.api);

    // HTTPS readiness: DNS right, certificate not issued yet
    const DOWN = async () => false;
    v.knobs.dnsOk.add("slow.acme.com");
    const sl1 = await connectDomain(A, a1.id, "slow.acme.com", v.api, DOWN);
    ok("https: no certificate yet => securing, not live", sl1.state === "securing");
    ok("https: a securing domain is not served yet", (await slugForHost("slow.acme.com")) === null);
    const sl2 = await checkDomain(A, a1.id, v.api, UP);
    ok("https: certificate arrives => live and served", sl2?.state === "live" && (await slugForHost("slow.acme.com")) !== null);
    const sl3 = await checkDomain(A, a1.id, v.api, DOWN);
    ok("https: a failed probe later reports securing but keeps serving", sl3?.state === "securing" && (await slugForHost("slow.acme.com")) !== null);
    await disconnectDomain(A, a1.id, v.api);

    // slugs
    ok("rename: success", (await renameSlug(A, a1.id, "Acme Q4 Report")) === "acme-q4-report");
    await throws("rename: taken by another report", () => renameSlug(B, b1.id, "acme-q4-report"), /taken/);
    await throws("rename: other user's report", () => renameSlug(B, a1.id, "whatever-name"), /not found/i);
    await throws("rename: reserved", () => renameSlug(A, a1.id, "sign-in"), /reserved/);
  } finally { await clean(); }
  const left = (await db().select({ id: reports.id }).from(reports).where(like(reports.userId, "e2e_dom_%"))).length;
  ok("cleanup: no test rows left", left === 0);
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error("CRASH", e); process.exit(2); });
