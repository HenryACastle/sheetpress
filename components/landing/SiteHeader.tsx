import Link from "next/link";
import Logo from "@/components/Logo";
import MobileMenu from "./MobileMenu";

// Sticky site header shared by the landing page and the legal pages. Hash links are absolute
// ("/#examples") so they also work from /privacy and /terms. No Clerk code in here (public page rule).
export const NAV_LINKS: [string, string][] = [
  ["Examples", "/#examples"], ["Use cases", "/#use-cases"], ["How it works", "/#how"], ["Pricing", "/#pricing"], ["FAQ", "/#faq"],
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--bg)]/85">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav className="flex items-center gap-5 text-sm" aria-label="Main">
          {NAV_LINKS.map(([l, h]) => <a key={h} href={h} className="hidden text-[var(--mute)] hover:text-[var(--ink)] md:block">{l}</a>)}
          <Link href="/sign-in" className="hidden text-[var(--mute)] hover:text-[var(--ink)] sm:block">Sign in</Link>
          <Link href="/sign-up" className="rounded-lg bg-[var(--accent)] px-3.5 py-2 font-semibold text-white hover:bg-[var(--accent-hover)]">Start free</Link>
          <MobileMenu links={[...NAV_LINKS, ["Sign in", "/sign-in"]]} />
        </nav>
      </div>
    </header>
  );
}
