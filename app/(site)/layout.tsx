import { Analytics } from "@vercel/analytics/next";
import { ANALYTICS_ON } from "@/lib/site";

// Wraps ONLY the public marketing pages: home, blog, guide, privacy, terms.
// Published reports (/r/*), sign-in, sign-up and the signed-in app are in other route groups or handlers,
// so visits to customers' reports and to accounts are never counted.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {ANALYTICS_ON && <Analytics />}
    </>
  );
}
