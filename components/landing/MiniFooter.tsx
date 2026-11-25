import Link from "next/link";
import CookieSettingsButton from "@/components/analytics/CookieSettingsButton";
import { GOOGLE_TAG_ID } from "@/lib/site";

// Small footer for pages that have no footer of their own (blog, guide, legal). Gives every public page a way
// to reach the privacy policy and, when analytics is on, the Cookie settings.
export default function MiniFooter() {
  return (
    <footer className="border-t border-[var(--line)] py-6 text-center text-sm text-[var(--mute)]">
      <p className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
        <span>&copy; {new Date().getFullYear()} SheetPress</span>
        <Link href="/privacy" className="hover:text-[var(--ink)]">Privacy</Link>
        <Link href="/terms" className="hover:text-[var(--ink)]">Terms</Link>
        {GOOGLE_TAG_ID && <CookieSettingsButton className="hover:text-[var(--ink)]" />}
      </p>
    </footer>
  );
}
