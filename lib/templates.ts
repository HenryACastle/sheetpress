import type { ReportData, Sheet } from "./report";

// Starter data for "Create from a template". The Show column is the public/private switch (see lib/visibility.ts).
export const SHOPPING_HEADERS = ["Item", "Qty", "Unit", "Category", "Price", "Store", "Status", "Notes", "Show"];

export function shoppingList(title = "Shopping list"): ReportData {
  const sheet: Sheet = {
    name: "Shopping list",
    kind: "table",
    headers: SHOPPING_HEADERS,
    rows: [
      ["Milk", 2, "gal", "Dairy", 4.5, "Publix", "Needed", "", "yes"],
      ["Bananas", 6, "ea", "Produce", 0.3, "Publix", "Needed", "", "yes"],
      ["Coffee", 1, "bag", "Pantry", 12, "Costco", "Bought", "Dark roast", "yes"],
    ],
  };
  return { title, subtitle: "Shared shopping list", generated: new Date().toISOString().slice(0, 10), sheets: [sheet], editable: true, template: "shopping" };
}
