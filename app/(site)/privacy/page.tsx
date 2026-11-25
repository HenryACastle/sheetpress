import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import CookieSettingsButton from "@/components/analytics/CookieSettingsButton";
import { ANALYTICS_ON, GOOGLE_TAG_ID, GOOGLE_TAG_IS_GTM } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy | SheetPress", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="November 25, 2026">
      <p>SheetPress turns the Excel workbooks you upload into web pages. This page explains what we collect, where it lives and what you can control.</p>

      <h2>What we collect</h2>
      <ul>
        <li><b>Account details</b> (such as your email address and name) when you sign up. Sign-in is handled by our authentication provider, Clerk.</li>
        <li><b>Your workbooks.</b> The cell values from the .xlsx files you upload, plus the title and subtitle you give each report.</li>
        <li><b>Basic server logs</b> (such as IP address and browser type) created by our hosting provider when pages are requested.</li>
        {GOOGLE_TAG_ID && <li><b>Visit statistics from Google Analytics</b>, only if you accept analytics cookies: the pages you view, how you arrived, clicks on our sign-up button and sample downloads, and a rough location, device and browser type. See Cookies and Google Analytics below.</li>}
        {ANALYTICS_ON && <li><b>Anonymous visit counts</b> for our public pages (home, blog, guide, legal pages): the page address, where the visit came from, and a rough location, device and browser type. See below.</li>}
      </ul>

      <h2>What we do not do</h2>
      <ul>
        <li>We do not sell your data and we do not run advertising.</li>
        <li>We do not use advertising trackers, and we do not follow you across other websites.{GOOGLE_TAG_ID ? " We turn off Google's advertising features, so Google Analytics is not used to show you ads." : ""}</li>
        {ANALYTICS_ON ? (
          <li>We use Vercel Web Analytics to count visits to our public pages so we can see which guides help people. It does not use third-party cookies and does not follow you across other websites. A visit is recognized only by a hash made from the request, which is discarded after 24 hours. It is not used on published reports or inside your account, so we do not count who opens a report.</li>
        ) : GOOGLE_TAG_ID ? null : (
          <li>We do not currently use analytics on this site.</li>
        )}
        {GOOGLE_TAG_ID ? (
          <li>We do not set cookies on published reports. Apart from the optional analytics cookies described below, cookies are used only to keep you signed in when you use your account.</li>
        ) : (
          <li>We do not set cookies on the home page or on published reports{ANALYTICS_ON ? ", and our analytics does not use cookies to identify visitors" : ""}. Cookies are used only to keep you signed in when you use your account.</li>
        )}
      </ul>

      {GOOGLE_TAG_ID && (
        <>
          <h2>Cookies and Google Analytics</h2>
          <p>On our public pages (home, blog, guide and legal pages) we would like to use Google Analytics{GOOGLE_TAG_IS_GTM ? " (loaded through Google Tag Manager)" : ""} to see which guides help people. It stays off until you choose Accept. If you accept, Google sets two cookies in your browser: <code>_ga</code> (up to 2 years, tells visitors apart) and a second one starting <code>_ga_</code> (up to 2 years, keeps a visit together). Google receives the technical details your browser sends with any request, such as your IP address, together with the pages you view and your clicks on our sign-up button and sample downloads. We keep this data for at most 14 months and have turned off Google&rsquo;s advertising features.</p>
          <p>If you decline, or your browser sends a Do Not Track or Global Privacy Control signal, nothing is loaded from Google and no analytics cookies are set. Analytics is never used on published reports or inside your account, so we do not count who opens a report. You can change your choice at any time: <CookieSettingsButton />. Google&rsquo;s own privacy policy is at <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">policies.google.com/privacy</a>.</p>
        </>
      )}

      <h2>Public and password-protected reports</h2>
      <p>A public report can be opened by anyone who has its link. Reports ask search engines not to index them, but a link can still be shared or found, so only publish what you are comfortable sharing.</p>
      <p>If you add a password, nobody sees the report until they enter it: the page sends no report data before then. We store only a salted hash of the password, so we cannot show it or recover it. If you forget it, set a new one under Access. Your report data itself is stored on our servers and is readable by SheetPress; it is not encrypted with your password. Reports published before 23 November 2026 with an older password use browser encryption, which we cannot read, until you move them to the new setting.</p>

      <h2>Who processes your data</h2>
      <ul>
        <li><b>Clerk</b> for sign-in and account management.</li>
        <li><b>Neon</b> for the database that stores your reports.</li>
        <li><b>Vercel</b> for hosting the website.</li>
        {GOOGLE_TAG_ID && <li><b>Google</b> for Google Analytics{GOOGLE_TAG_IS_GTM ? " and Google Tag Manager" : ""}, only if you accept analytics cookies.</li>}
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
