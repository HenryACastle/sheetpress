import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Clerk user id. EVERY query must be scoped by this (see lib/reports.ts).
  userId: text("user_id").notNull(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  // true => payload holds {enc}, the data is only readable with the password.
  protectedByPassword: boolean("protected_by_password").notNull().default(false),
  // Either {data: ReportData} or {enc: EncBlob}.
  payload: jsonb("payload").notNull(),
  sheetCount: integer("sheet_count").notNull().default(0),
  rowCount: integer("row_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type Report = typeof reports.$inferSelect;
