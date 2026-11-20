import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Service | SheetPress" };

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="November 20, 2026">
      <p>By creating an account or using SheetPress you agree to these terms.</p>

      <h2>The service</h2>
      <p>SheetPress lets you upload Excel workbooks and publish them as web pages. The service is provided as is, and features, limits and pricing can change. The free plan has limits on reports, rows and file size that are listed on our pricing section.</p>

      <h2>Your content</h2>
      <p>You keep ownership of what you upload. You give us permission to store, process and display it as needed to run the service, including serving public reports to anyone who has the link. You are responsible for your content and for having the right to share it.</p>

      <h2>Acceptable use</h2>
      <p>Do not use SheetPress to:</p>
      <ul>
        <li>publish anything unlawful, infringing, deceptive or harmful, including phishing, malware or impersonation;</li>
        <li>publish other people&rsquo;s personal or confidential information without permission;</li>
        <li>store sensitive data such as payment card numbers, government ID numbers or medical records;</li>
        <li>interfere with the service or try to access other users&rsquo; data.</li>
      </ul>
      <p>We may remove content or suspend accounts that break these rules.</p>

      <h2>Public links</h2>
      <p>Anything you publish without a password can be viewed by anyone with the link. Use a password for anything private, and do not rely on SheetPress as your only copy of your data. Keep your original workbook.</p>

      <h2>Availability and liability</h2>
      <p>We work to keep SheetPress running but do not guarantee it will always be available or error free. To the extent the law allows, SheetPress is not liable for indirect or consequential losses, or for loss of data, arising from your use of the service.</p>

      <h2>Ending your use</h2>
      <p>You can stop using SheetPress and delete your reports at any time. We may suspend or end access if these terms are broken or the service is discontinued.</p>

      <h2>Changes</h2>
      <p>We may update these terms and will change the date above when we do. Continuing to use SheetPress after a change means you accept it.</p>
    </LegalPage>
  );
}
