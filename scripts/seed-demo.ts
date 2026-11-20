// Publishes (or refreshes) the public demo reports. Idempotent. Run: npm run seed:demo
import { config } from "dotenv"; config({ path: [".env.local", ".env"], quiet: true });
import { inArray } from "drizzle-orm";
import { db } from "../db";
import { reports } from "../db/schema";
import { directory, rollout } from "./demo-data";

const DEMO_USER = "sheetpress_demo"; // not a real Clerk user, so these never show in anyone's dashboard
const demos = [rollout, directory];
async function main() {
  await db().delete(reports).where(inArray(reports.slug, demos.map((d) => d.slug)));
  for (const d of demos) {
    const data = { title: d.title, subtitle: d.subtitle, generated: new Date().toISOString().slice(0, 10), sheets: d.sheets };
    await db().insert(reports).values({
      userId: DEMO_USER, slug: d.slug, title: d.title, subtitle: d.subtitle, protectedByPassword: false,
      payload: { data }, sheetCount: d.sheets.length, rowCount: d.sheets.reduce((n, s) => n + s.rows.length, 0),
    });
    console.log("seeded /r/" + d.slug);
  }
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
