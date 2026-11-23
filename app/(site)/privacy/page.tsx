import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy | SheetPress" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="November 20, 2026">
      <p>SheetPress turns the Excel workbooks you upload into web pages. This page explains what we collect, where it lives and what you can control.</p>

      <h2>What we collect</h2>
      <ul>
        <li><b>Account details</b> (such as your email address and name) when you sign up. Sign-in is handled by our authentication provider, Clerk.</li>
        <li><b>Your workbooks.</b> The cell values from the .xlsx files you upload, plus the title and subtitle you give each report.</li>
        <li><b>Basic server logs</b> (such as IP address and browser type) created by our hosting provider when pages are requested.</li>
      </ul>

      <h2>What we do not do</h2>
      <ul>
        <li>We do not sell your data and we do not run advertising.</li>
        <li>We do not currently use analytics or advertising trackers on this site.</li>
        <li>We do not set cookies on the home page or on published reports. Cookies are used only to keep you signed in when you use your account.</li>
      </ul>

      <h2>Public and password-protected reports</h2>
      <p>A public report can be opened by anyone who has its link. Reports ask search engines not to index them, but a link can still be shared or found, so only publish what you are comfortable sharing.</p>
      <p>If you add a password, nobody sees the report until they enter it: the page sends no report data before then. We store only a salted hash of the password, so we cannot show it or recover it. If you forget it, set a new one under Access. Your report data itself is stored on our servers and is readable by SheetPress; it is not encrypted with your password. Reports published before 23 November 2026 with an older password use browser encryption, which we cannot read, until you move them to the new setting.</p>

      <h2>Who processes your data</h2>
      <ul>
        <li><b>Clerk</b> for sign-in and account management.</li>
        <li><b>Neon</b> for the database that stores your reports.</li>
        <li><b>Vercel</b> for hosting the website.</li>
      </ul>
      <p>These providers handle data only to run the service for us.</p>

      <h2>Keeping and deleting your data</h2>
      <p>When you delete a report from your dashboard it is removed from our database and its link stops working. Backups kept by our providers may hold a copy for a limited time. To delete your account and everything in it, contact us using the details below.</p>

      <h2>Children</h2>
      <p>SheetPress is not intended for children under 13.</p>

      <h2>Changes</h2>
      <p>If this policy changes we will update the date at the top of this page.</p>
    </LegalPage>
  );
}
