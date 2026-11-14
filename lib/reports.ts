import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { reports } from "@/db/schema";

// All owner-facing queries live here and are ALWAYS scoped by userId.
export const listReports = (userId: string) =>
  db().select({
    id: reports.id, slug: reports.slug, title: reports.title, subtitle: reports.subtitle,
    protectedByPassword: reports.protectedByPassword, sheetCount: reports.sheetCount,
    rowCount: reports.rowCount, updatedAt: reports.updatedAt,
  }).from(reports).where(eq(reports.userId, userId)).orderBy(desc(reports.updatedAt));

export async function countReports(userId: string) {
  const [r] = await db().select({ n: sql<number>`count(*)::int` }).from(reports).where(eq(reports.userId, userId));
  return r.n;
}

export const ownedWhere = (id: string, userId: string) => and(eq(reports.id, id), eq(reports.userId, userId));

export async function getPublicBySlug(slug: string) {
  const [r] = await db().select({ title: reports.title, payload: reports.payload }).from(reports).where(eq(reports.slug, slug)).limit(1);
  return r ?? null;
}
