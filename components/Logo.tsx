import Link from "next/link";
export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--accent)] text-white" aria-hidden>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M2 6h12M2 10h12M6 2v12"/></svg>
      </span>
      Sheetpress
    </Link>
  );
}
