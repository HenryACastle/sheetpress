---
title: How to turn an Excel file into a website (no code)
description: How to turn an Excel file into a website, step by step: set up the workbook, upload it, lay it out with headings and charts, then share a link or password.
date: 2026-11-25
keyword: turn an excel file into a website
tags: [how-to, excel, website]
---

You can turn an Excel file into a website without writing code, and without moving your data into another tool first. The idea is simple: your workbook already holds the content, so a service reads each sheet and publishes it as a page with its own link. This guide walks through the whole process with SheetPress, from preparing the file to sharing it, and points out the mistakes that cause most of the confusion.

You need three things: an Excel file in .xlsx format, a free account, and about ten minutes. The free plan includes 3 reports and does not ask for a credit card.

## Step 1: Set up the workbook

Most problems come from the first row of a sheet, so get that right first. Put the column headers in row 1, starting in column A, with no blank rows or columns above or to the left. Each sheet should hold one table: no merged cells, no title banner above the headers.

### Name your sheets to control how they look

The name of a sheet decides how it is shown. You do not change any settings, you just name the sheet.

| Sheet name | What it becomes |
| --- | --- |
| Summary, Overview, KPIs or Dashboard | Big number tiles. Columns are label, value and an optional note. |
| Starts with Chart, for example Chart Visits | A line chart with the data table underneath |
| Page (with a Block column) | A web page laid out from elements, covered in step 3 |
| Settings | Title, logo and colors. It is not shown as a tab. |
| Anything else | A searchable, sortable table |

Some things happen on their own. A column named Status with values like Done, In progress or Blocked becomes colored chips with a filter bar. A column with Progress or a percent sign in its name becomes a progress bar. Full web addresses become clickable links.

## Step 2: Upload it

Sign in, choose the .xlsx file, give the report a title and press the upload button. You can also type a link name, such as acme-q4-report, which becomes the end of your address. Within a few seconds you get a link you can open and send to anyone.

Formulas work, with one catch: SheetPress shows the last result Excel saved. If you edited a formula, open the file in Excel and save it once before uploading, so the saved result is current.

## Step 3: Make it look like a website

By default each sheet is a tab. To make it feel like a real site, add a sheet named Page with three headers in row 1: Block, Content and Options. Every row below is one element, shown from top to bottom.

| Block | Content | Options |
| --- | --- | --- |
| heading | Welcome to Harbor Lane | level=1; align=center |
| text | Fresh bread every morning. | size=lg; muted=yes |
| kpi | KPIs | cols=4 |
| chart | Chart Visits | title=Website visits |
| table | Menu | limit=5; columns=Item,Price |

The Content column holds the text, or the name of another sheet. The Options column takes simple codes such as width=half to put two elements side by side, color=accent to follow your branding, or card=yes to wrap an element in a bordered box. A wrong row is skipped, so nothing breaks while you experiment.

Other blocks include image, button, stat, list, callout, divider and spacer. A button can open another website or jump to another tab, and a config row with tabs=hide removes the tab bar so the page behaves like a one-page site. To build several pages, name more sheets Page About, Page Pricing and so on, and link them with buttons.

The full list of blocks and options is in the [guide](/docs). To see a finished version, download [page-builder.xlsx](/examples/page-builder.xlsx) and open it next to the guide.

## Step 4: Add your logo and colors

Add a sheet named Settings with two columns, Setting and Value. You can set the title, subtitle, a logo address, an accent color such as #b4521f, a light or dark theme and a footer line. You can also set all of this from the Branding button on the report, and branding saved there overrides the sheet and survives re-uploads.

## Step 5: Decide who can see it

By default anyone with the link can open the page. For anything private, there are two tools that work together.

- Add a password to the whole report from its Access settings. Without the password, visitors see only a password box and no data.
- Hide parts of the data. Add `[private]` after a column header, for example Cost [private], or `(private)` after a sheet name, or use a column called Show with yes and no values. Hidden data is removed on the server before the page is sent, so it never reaches the visitor's browser.

For a closer look at passwords and what they do and do not protect, read [how to share an Excel report online with a password](/blog/share-excel-report-online-with-password).

## Step 6: Share it and keep it current

Copy the link from your dashboard and send it. When the numbers change, edit the workbook and press Update on the report. The link stays the same, so nobody has to ask which version is the latest.

## Common problems

| What you see | Why it happens | Fix |
| --- | --- | --- |
| Columns called Column 1 and Column 2 | A blank or title row sits above the headers | Move the headers to row 1 and column A |
| A sheet shows as a table, not a page | The sheet name or the first header does not match | Name it Page and make cell A1 say Block |
| A number shows an old value | The file was saved without recalculating | Open it in Excel, save, upload again |
| An image does not appear | The address does not start with https | Use a secure image address |

## Limits to know about

The free plan accepts an .xlsx file up to 2 MB, with up to 10 sheets, 40 columns per sheet and 1,000 rows per sheet. Only cell values are imported. Excel formatting, native Excel charts and pictures placed over cells are not carried over, which is why SheetPress has its own chart sheets and image blocks.

## Frequently asked questions

### Do I need to know how to code?

No. Everything in this guide is done with sheet names, column headers and short codes in cells.

### Can I use my own domain?

Your page always has a SheetPress address. Use a link name to make it short and readable.

### Is Excel to website different from Excel to web app?

Yes. A website shows your data to readers. A web app lets people change it. If you are unsure which you need, read [Excel to website or web app: how to choose](/blog/excel-to-website-or-web-app).
