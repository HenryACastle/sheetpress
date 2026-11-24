// Writes public/examples/page-builder.xlsx: a small business page built from a Page (layout) sheet. Run: npx tsx scripts/make-page-example.ts
import writeXlsxFile from "write-excel-file/node";

const sheet = (name: string, rows: (string | number)[][]) => ({
  sheet: name,
  data: rows.map((r, i) => r.map((v) => ({ value: v, ...(i === 0 ? { fontWeight: "bold" as const } : {}) }))),
});

const days = Array.from({ length: 28 }, (_, i) => { const d = new Date(Date.UTC(2026, 9, 1 + i)); return d.toISOString().slice(0, 10); });
const book = [
  sheet("Page", [
    ["Block", "Content", "Options"],
    ["config", "", "maxwidth=1000; gap=18; tabs=hide"],
    ["heading", "Harbor Lane Bakery", "level=1; align=center"],
    ["text", "Fresh bread, pastries and custom cakes. Baked every morning in Fort Lauderdale.", "size=lg; muted=yes; align=center"],
    ["button", "See the menu", "tab=Menu; align=center"],
    ["button", "Order a cake", "link=https://example.com/order; style=outline; align=center"],
    ["spacer", "", "height=8"],
    ["kpi", "KPIs", "cols=4"],
    ["callout", "Holiday orders close December 18. Order early for pickup on the 24th.", "tone=warn; title=Holiday hours"],
    ["heading", "Visits this month", "level=2; width=full"],
    ["chart", "Chart Visits", "title=Website visits; width=two-thirds; card=yes"],
    ["list", "Open at 6am every day; Free parking behind the shop; Gluten-free options daily", "style=check; width=third; card=yes; pad=lg"],
    ["divider", "", ""],
    ["heading", "Popular right now", "level=2"],
    ["table", "Menu", "limit=5; columns=Item,Price; width=half"],
    ["image", "https://sheetpress.org/logo.png", "width=half; height=220; fit=contain; alt=Logo; card=yes"],
  ]),
  sheet("KPIs", [
    ["Label", "Value", "Note"],
    ["Loaves a day", 220, "Average"],
    ["Cakes this month", 64, "Up from 51"],
    ["Rating", "4.9", "312 reviews"],
    ["Team", 11, "Full and part time"],
  ]),
  sheet("Chart Visits", [["Day", "Visits", "Orders"], ...days.map((d, i) => [d, 180 + Math.round(60 * Math.sin(i / 3)) + i * 4, 22 + Math.round(6 * Math.cos(i / 4))])]),
  sheet("Menu", [
    ["Item", "Price", "Category", "Show"],
    ["Sourdough loaf", 8, "Bread", "yes"],
    ["Butter croissant", 4.5, "Pastry", "yes"],
    ["Guava pastelito", 3.75, "Pastry", "yes"],
    ["Birthday cake (8 in)", 48, "Cakes", "yes"],
    ["Cinnamon roll", 5, "Pastry", "yes"],
    ["Secret test recipe", 99, "Cakes", "no"],
  ]),
  sheet("Settings", [["Setting", "Value"], ["Title", "Harbor Lane Bakery"], ["Accent", "#b4521f"], ["Theme", "light"], ["Footer", "Open daily 6am to 6pm"]]),
];
writeXlsxFile(book as never).toFile("public/examples/page-builder.xlsx").then(() => { console.log("wrote public/examples/page-builder.xlsx"); process.exit(0); });
