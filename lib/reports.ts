import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { reports } from "@/db/schema";

// All owner-facing queries live here and are ALWAYS scoped by userId.
export const listReports = (userId: string) =>
  db().select({
    id: reports.id, slug: reports.slug, title: reports.title, subtitle: reports.subtitle,
    protectedByPassword: reports.protectedByPassword, sheetCount: reports.sheetCount,
    rowCount: reports.rowCount, updatedAt: reports.updatedAt,
    customDomain: reports.customDomain, domainVerified: reports.domainVerified,
    editable: sql<boolean>`coalesce(${reports.payload}->'data'->>'editable', 'false') = 'true'`,
    branding: sql<Record<string, unknown> | null>`${reports.payload}->'branding'`,
    workbookBrand: sql<Record<string, unknown> | null>`${reports.payload}->'data'->'brand'`,
    // public | password | legacy (the older browser-encrypted protection)
    accessMode: sql<string>`coalesce(${reports.payload}->'access'->>'mode', case when ${reports.payload}->'enc' is not null then 'legacy' else 'public' end)`,
  }).from(reports).where(eq(reports.userId, userId)).orderBy(desc(reports.updatedAt));

export async function countReports(userId: string) {
  const [r] = await db().select({ n: sql<number>`count(*)::int` }).from(reports).where(eq(reports.userId, userId));
  return r.n;
}

export const ownedWhere = (id: string, userId: string) => and(eq(reports.id, id), eq(reports.userId, userId));

export async function getPublicBySlug(slug: string) {
  const [r] = await db().select({ id: reports.id, title: reports.title, payload: reports.payload }).from(reports).where(eq(reports.slug, slug)).limit(1);
  return r ?? null;
}

export async function getOwned(id: string, userId: string) {
  const [r] = await db().select().from(reports).where(ownedWhere(id, userId)).limit(1);
  return r ?? null;
}
