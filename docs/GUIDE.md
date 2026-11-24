# SheetPress guide

SheetPress turns an Excel workbook into a web page you can share. Each sheet becomes a tab, or you can lay the sheets out as a real page with headings, text, images, buttons, numbers, charts and tables. This guide covers everything you can put in the workbook.

Download a finished example: [page-builder.xlsx](/examples/page-builder.xlsx). Open it in Excel next to this guide.

## Quick start

1. Make a workbook. Put the column headers in **row 1, column A** of every sheet, with no blank rows or columns above or to the left.
2. Sign in, press **Upload**, choose the .xlsx file and give the report a title.
3. Share the link. Change the look under **Branding**, who can open it under **Access**, and your own address under **Link & domain**.
4. To update, edit the workbook and press **Update** on the report. The link stays the same.

Formulas work. SheetPress shows the last result Excel saved, so open and save the file in Excel once after editing.

## What a sheet becomes

The **name** of a sheet decides how it looks.

| Sheet name | Becomes |
| --- | --- |
| Page, Layout, Home, Site or Builder (with a Block column) | A web page built from elements. See the page builder below. |
| Summary, Overview, KPIs, Dashboard, or starts with `KPI ` | Number tiles. Columns: label, value, optional note. One tile per row. |
| Starts with `Chart ` (for example `Chart Visits`) | A line chart with the table underneath. First column is the horizontal axis (dates work best), each number column is a line. |
| Settings | Title, logo and colors. Not shown as a tab. |
| Anything else | A searchable, sortable table. |

Table extras that happen on their own: a **Status** column with values like Done, In progress or Blocked becomes colored chips with a filter bar. A column with **Progress** or **%** in its name becomes a progress bar. Full web addresses (https://...) become links.

## The page builder

Make a sheet named **Page** with three column headers in row 1: **Block**, **Content** and **Options**. Each row below is one element, shown top to bottom. The sheet also needs the word Block (or Type, or Element) as its first header, so a normal sheet that happens to be called Home stays a table.

| Block | Content | Options |
| --- | --- | --- |
| heading | Welcome to Harbor Lane | level=1; align=center |
| text | Fresh bread every morning. | size=lg; muted=yes |
| kpi | KPIs | cols=4 |
| chart | Chart Visits | title=Website visits |
| table | Menu | limit=5; columns=Item,Price |

The **Content** column holds the text, or the name of another sheet in the workbook. The **Options** column is the config code described next. Rows with an unknown block name, or no content, are skipped. Nothing breaks when a row is wrong.

The page opens first. The other sheets stay available as tabs unless you hide the tabs (see the config block). A page can have up to 200 elements.

### Config codes

Options are written as `key=value`, separated by semicolons: `width=half; align=center; color=accent`. Capital letters and spaces do not matter. Unknown keys are ignored.

**Options every element understands**

| Option | Values | What it does |
| --- | --- | --- |
| width | full, half, third, quarter, two-thirds, three-quarters, or a percent like 40% | How wide the element is. Elements that fit side by side sit on one row. On a phone everything is full width. |
| align | left, center, right | Text and button alignment. |
| color | accent, ink, mute, ok, bad, warn, prog, or a hex code like #b4521f | Text color (button color for buttons). `accent` follows your branding. |
| card | yes, no | Puts the element in a bordered card. |
| pad | none, sm, md, lg | Space inside a card. |
| hide | yes | Keeps the row in the sheet but off the page. Handy for drafts. |

### Elements

| Block | Content | Extra options |
| --- | --- | --- |
| heading (also h1, h2, h3, title) | The heading text | level=1, 2 or 3 (default 2) |
| text (also paragraph) | The paragraph. Line breaks are kept and https:// links become clickable. | size=sm, md, lg, xl; muted=yes |
| image (also img, photo) | An https:// image address | alt=description; height=40 to 900 (pixels); fit=cover or contain; round=yes; link=https://... |
| button (also link, cta) | The button label | link=https://... to open a site, or tab=Sheet name to jump to another tab; style=solid or outline |
| kpi (also kpis, tiles, metrics) | The name of a sheet. Its rows become tiles (label, value, note). | cols=1 to 6; limit=number of tiles |
| stat (also metric) | The label of a single number | value=1,250; note=up 8% |
| table (also grid, data) | The name of a sheet | limit=rows to show; columns=Name,Price (which columns, in order); search=yes; title=heading above |
| chart (also graph) | The name of a Chart sheet | title=heading above; table=yes to show the data table under it |
| list (also bullets, checklist) | Items separated by semicolons or line breaks | style=bullet, number or check |
| callout (also note, banner) | The message | tone=info, success, warn or bad; title=bold first line |
| divider (also line) | Nothing | None |
| spacer (also space) | Nothing | height=4 to 200 (pixels) |
| config (also page, settings) | Nothing | maxwidth=480 to 1600 (pixels); gap=0 to 48 (pixels between elements); tabs=hide to remove the tab bar so the page feels like a website |

A sheet name in Content can be written with or without its `Chart ` or `KPI ` prefix. `Chart Visits` and `Visits` both work. Names are not case sensitive.

### Layout recipes

Two columns of text next to each other: give both rows `width=half`.

A hero: a `heading` with `level=1; align=center`, a `text` with `size=lg; muted=yes; align=center`, then a `button`.

Three numbers across: a `kpi` block pointing at a sheet with three rows, `cols=3`.

A chart beside a checklist: `chart` with `width=two-thirds; card=yes` and `list` with `width=third; card=yes`.

A multi page site: make more layout sheets named `Page About`, `Page Pricing` and so on. The words after Page become the tab name. Use `button` with `tab=About` to link between them, and `config` with `tabs=hide` so visitors only move with your buttons.

## Settings sheet

A sheet named **Settings** with two columns, **Setting** and **Value**. It is not shown as a tab.

| Setting | Value |
| --- | --- |
| Title, Subtitle | Replace the title boxes on the upload form |
| Logo | An https:// image address. It is also the browser tab icon. |
| Logo link | Where the logo goes when clicked |
| Accent | A hex color like #b4521f |
| Theme | light or dark |
| Footer | Up to 140 characters under the page |
| Currency | A symbol such as $ or EUR |
| Hide SheetPress | yes removes the "Built with SheetPress" line |

You can also set all of this on the report with the **Branding** button. Branding saved on the dashboard overrides the Settings sheet and survives re-uploads.

## Keeping things private

Hidden data is removed on the server before the page is sent, so visitors never receive it. You always see everything in your dashboard and in the .xlsx download.

| Code | Where | Effect |
| --- | --- | --- |
| Show column | A column named Show, Public, Visible or On site | yes shows the row, no hides it, blank shows it |
| `[private]` or `[hide]` | After a column header, for example `Cost [private]` | The column is hidden |
| `(private)` | After a sheet name, for example `Budget (private)` | The whole sheet is hidden |

Excel does not allow square brackets in a sheet name, so sheet names use round brackets. Headers accept either.

A page element that points at a hidden sheet shows nothing. It never leaks the data. To show only part of a sheet, use a Show column or `[private]` columns on that sheet, then point the element at it.

To require a password for the whole report, use **Access** on the report. Anyone without the password sees only a password box and no data.

## Editable lists

The **New list** button creates a shopping list or checklist you manage in SheetPress itself: add rows, edit, check items off, and see totals. You can still upload a workbook over it, and the list stays editable.

## Limits

An .xlsx up to 2 MB, 10 sheets, 40 columns per sheet and 1,000 rows per sheet on the free plan.

## If something looks wrong

| You see | Why | Fix |
| --- | --- | --- |
| Columns called Column 1, Column 2 and the real headers as the first row | There is a blank or title row above the headers | Move the headers to row 1 and column A |
| A sheet shows as a table instead of a page | The sheet name or the first header does not match | Name it Page (or Layout, Home, Site, Builder) and make cell A1 say Block |
| An element is missing from the page | Unknown block name, empty content, `hide=yes`, a sheet name that does not match, or the sheet is private | Check the spelling against the tables above |
| An image does not show | The address must start with https:// | Use a secure address |
| A number shows an old value | The file was saved without recalculating | Open it in Excel, save, upload again |
| A color is hard to read | Low contrast with the theme | Pick a lighter accent for dark themes and a darker one for light themes |
