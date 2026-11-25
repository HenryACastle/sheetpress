---
title: Share an Excel report online with a password
description: Emailing spreadsheets creates version chaos. Compare ways to share an Excel report online and how to put a real password on the page, not just the file.
date: 2026-11-25
keyword: share an excel report online
tags: [security, excel, sharing]
---

If you need to share an Excel report online, the usual routes all have a catch. Attachments get out of date the moment you send them, a password on the file stops mattering once someone has a copy, and some publishing options make the data public to everyone. This post compares the common ways to share a spreadsheet report, explains what a password really protects, and shows how to put one on a web page instead of a file.

## Why attachments go wrong

An emailed workbook is a snapshot. The day after you send it, the numbers change and now two versions exist. People forward it to colleagues you never meant to include, and you cannot take it back. Large files bounce, and the one person who needs the latest figures is always the one holding the old copy.

A link to a page avoids most of this, because everyone opens the same current version and you decide who gets the link.

## Ways to share an Excel report

| Method | Strength | Catch |
| --- | --- | --- |
| Email attachment | Familiar, nothing to set up | Versions drift, no way to revoke it, easy to forward |
| PDF export | Looks the same everywhere | Static, so it is out of date at once and cannot be searched or filtered |
| OneDrive or SharePoint link | Keeps the file in one place | Access depends on your Microsoft permissions, and people may need an account to open it |
| Password on the Excel file | Protects the file itself | Once someone can download the file, the protection can be worked around, as [Microsoft community answers](https://techcommunity.microsoft.com/discussions/excelgeneral/put-an-excel-document-online/1601476/replies/1603768) point out |
| Power BI publish to web | Interactive dashboards | Makes the report visible to anyone on the internet, so it is not for private data, as [Power BI forum threads](https://community.fabric.microsoft.com/t5/Service/Can-I-add-password-when-publishing-to-public-web/td-p/894283) explain |
| A web page with a password | One current version, no accounts for viewers | One shared password, not one per person |

The right choice depends on who the audience is. For a handful of known colleagues inside one company, a shared OneDrive or SharePoint location is often enough. For a client or a partner outside your organization, a page behind a password is usually simpler.

## What a password really protects

There is a big difference between protecting a file and protecting a page.

A password on an Excel file protects the file. The person still receives the file, and a determined person can try to get around the protection.

A password on a web page works differently. The server checks the password before it sends anything. A visitor without it gets a password box and no data at all, so there is nothing in the page to inspect. That is the model SheetPress uses: the password is stored only as a salted hash, never as the password itself, and a correct password sets a secure sign-in cookie for seven days. Changing the password signs everyone else out, and repeated wrong guesses are slowed down.

Hiding part of the data is a separate tool. Add `[private]` after a column header such as Cost [private], or `(private)` after a sheet name, and that data is removed on the server before the page is sent, even for visitors who know the password.

## Set it up in SheetPress

1. Upload your .xlsx file and give the report a title.
2. Open the report's Access settings and choose Password. Passwords need at least 8 characters, and there is a generator if you want one.
3. Send the link, and send the password through a different channel, for example a text message instead of the same email.
4. To update the numbers later, upload a new workbook. The link and the password stay the same.
5. When the project ends, remove the password to make the report public, or delete the report and the link stops working.

If you have not made a page from Excel before, [turning an Excel file into a website](/blog/turn-excel-into-a-website) covers the whole process.

## Good habits for sharing reports

- Use a password you do not use anywhere else, and share it separately from the link.
- Hide columns that visitors do not need, such as costs, notes and internal comments.
- Keep your original workbook. A published page is a copy, not a backup.
- Do not publish payment card numbers, government ID numbers or medical records.
- Delete reports when the work is finished.

## The limits of one shared password

A shared password is simple, and it has a clear limit: everyone with the password sees the same thing, and you cannot tell people apart. If you need each person to log in with their own account, or to see only their own records, you need an app with user accounts, which is a different kind of tool. Our guide to [choosing between a website and a web app](/blog/excel-to-website-or-web-app) explains when that is worth the extra work.

## Frequently asked questions

### Is a password on a web page more secure than a password on the file?

For sharing, yes, because the data never leaves the server until the password is correct. For storing your own files, keep using normal file protection. They solve different problems.

### Can I share a report with a client without giving them an account?

Yes. With a password-protected page, the client opens a link and types the password. They do not sign up for anything.

### What happens if I forget the password?

Set a new one from the report's Access settings. The old password stops working and anyone who was signed in has to enter the new one.
