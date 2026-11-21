import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { canAddDomain, deriveStatus, DomainError, normalizeDomain, normalizeSlug, type DomainStatus } from "./domains";
import { vercelApi, vercelEnv, type VercelApi } from "./vercel-domains";

const CLAIM_TTL_MS = 24 * 60 * 60 * 1000;
const api = (): VercelApi => {
  const env = vercelEnv();
  if (!env) throw new DomainError("Custom domains are not enabled on this server yet.");
  return vercelApi(env);
};

async function owned(userId: string, id: string) {
  const [r] = await db().select({ id: reports.id, slug: reports.slug, customDomain: reports.customDomain, domainVerified: reports.domainVerified })
    .from(reports).where(and(eq(reports.id, id), eq(reports.userId, userId))).limit(1);
  if (!r) throw new DomainError("Report not found.");
  return r;
}

async function statusFor(v: VercelApi, domain: string): Promise<DomainStatus> {
  let d = (await v.getProjectDomain(domain)) ?? (await v.addDomain(domain));
  if (!d.verified) {
    if ((await v.verifyDomain(domain)).verified) d = (await v.getProjectDomain(domain)) ?? d;
  }
  const cfg = await v.getConfig(domain);
  return deriveStatus(domain, d, cfg);
}

async function persist(id: string, domain: string, live: boolean) {
  await db().update(reports).set({ domainVerified: live, updatedAt: new Date() }).where(and(eq(reports.id, id), eq(reports.customDomain, domain)));
}

export async function connectDomain(userId: string, reportId: string, input: string, v: VercelApi = api()): Promise<DomainStatus> {
  const domain = normalizeDomain(input);
  const rep = await owned(userId, reportId);
  if (rep.customDomain === domain) return (await checkDomain(userId, reportId, v)) as DomainStatus;
  if (rep.customDomain) throw new DomainError("This report already has a domain. Remove it first to connect a different one.");

  const [{ n }] = await db().select({ n: sql<number>`count(*)::int` }).from(reports).where(and(eq(reports.userId, userId), isNotNull(reports.customDomain)));
  if (!canAddDomain(n)) throw new DomainError("The free plan includes 1 custom domain. Remove the existing one to connect another.");

  // Someone else may already hold a claim on this name.
  const [other] = await db().select({ id: reports.id, userId: reports.userId, verified: reports.domainVerified, claimedAt: reports.domainClaimedAt })
    .from(reports).where(eq(reports.customDomain, domain)).limit(1);
  if (other) {
    const stale = !other.verified && other.claimedAt && Date.now() - other.claimedAt.getTime() > CLAIM_TTL_MS;
    if (other.userId === userId) throw new DomainError("That domain is already connected to another one of your reports.");
    if (!stale) throw new DomainError("That domain is already connected to another SheetPress report.");
    // An unfinished claim older than 24h can be taken over by whoever actually controls the DNS.
    await db().update(reports).set({ customDomain: null, domainVerified: false, domainClaimedAt: null }).where(eq(reports.id, other.id));
  }

  await v.addDomain(domain); // validates with Vercel first, so a bad name never reaches our table
  try {
    await db().update(reports).set({ customDomain: domain, domainVerified: false, domainClaimedAt: new Date(), updatedAt: new Date() }).where(eq(reports.id, reportId));
  } catch {
    throw new DomainError("That domain was just connected to another report. Try a different one.");
  }
  const status = await statusFor(v, domain);
  await persist(reportId, domain, status.state === "live");
  return status;
}

export async function checkDomain(userId: string, reportId: string, v: VercelApi = api()): Promise<DomainStatus | null> {
  const rep = await owned(userId, reportId);
  if (!rep.customDomain) return null;
  const status = await statusFor(v, rep.customDomain);
  await persist(reportId, rep.customDomain, status.state === "live");
  return status;
}

export async function disconnectDomain(userId: string, reportId: string, v: VercelApi = api()): Promise<void> {
  const rep = await owned(userId, reportId);
  if (!rep.customDomain) return;
  await v.removeDomain(rep.customDomain);
  await db().update(reports).set({ customDomain: null, domainVerified: false, domainClaimedAt: null, updatedAt: new Date() }).where(eq(reports.id, reportId));
}

// ---- link names ----
export async function renameSlug(userId: string, reportId: string, input: string): Promise<string> {
  const slug = normalizeSlug(input);
  const rep = await owned(userId, reportId);
  if (rep.slug === slug) return slug;
  try {
    const res = await db().update(reports).set({ slug, updatedAt: new Date() }).where(and(eq(reports.id, reportId), eq(reports.userId, userId))).returning({ slug: reports.slug });
    if (!res.length) throw new DomainError("Report not found.");
  } catch (e) {
    if (e instanceof DomainError) throw e;
    throw new DomainError("That link name is taken. Try another.");
  }
  return slug;
}

// ---- lookups used by the proxy ----
export async function slugForHost(host: string): Promise<string | null> {
  const [r] = await db().select({ slug: reports.slug }).from(reports).where(and(eq(reports.customDomain, host), eq(reports.domainVerified, true))).limit(1);
  return r?.slug ?? null;
}
