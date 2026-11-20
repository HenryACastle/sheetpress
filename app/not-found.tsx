import Link from "next/link";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <Logo />
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="text-[var(--mute)]">That link does not lead anywhere. If it was a report, it may have been deleted or the link was copied incorrectly.</p>
      <Link href="/" className="rounded-lg bg-[var(--accent)] px-5 py-2.5 font-semibold text-white hover:bg-[var(--accent-hover)]">Back to SheetPress</Link>
    </div>
  );
}
