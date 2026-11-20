// Writes the downloadable example workbooks from the same data as the live demos. Run: npm run examples
import writeXlsxFile from "write-excel-file/node";
import { directory, rollout } from "./demo-data";

async function main() {
  for (const d of [rollout, directory]) {
    const book = d.sheets.map((s) => ({
      sheet: s.name,
      data: [
        s.headers.map((h) => ({ value: h, fontWeight: "bold" as const })),
        ...s.rows.map((r) => r.map((v) => ({ value: v }))),
      ],
    }));
    await writeXlsxFile(book as never).toFile(`public/examples/${d.file}`);
    console.log("wrote public/examples/" + d.file);
  }
}
main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
