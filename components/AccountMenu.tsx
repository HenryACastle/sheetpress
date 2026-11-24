"use client";
import { useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";

// Account button for the signed-in header. Replaces Clerk's stock <UserButton/> (a purple placeholder
// image that cannot be restyled) so it matches the app: initials on slate, green focus ring, real photo
// when the person has one. Manage account and Sign out still go through Clerk.
function initialsOf(u: { firstName?: string | null; lastName?: string | null; username?: string | null; primaryEmailAddress?: { emailAddress: string } | null }) {
  const first = u.firstName?.trim()?.[0], last = u.lastName?.trim()?.[0];
  if (first || last) return `${first ?? ""}${last ?? ""}`.toUpperCase();
  const fallback = u.username?.trim()?.[0] ?? u.primaryEmailAddress?.emailAddress?.trim()?.[0] ?? "?";
  return fallback.toUpperCase();
}

const ring = "ring-2 ring-transparent transition hover:ring-[var(--brand-green)] focus-visible:outline-none focus-visible:ring-[var(--brand-green)]";

export default function AccountMenu() {
  const { isLoaded, user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (!isLoaded) return <span aria-hidden className="block h-9 w-9 animate-pulse rounded-full bg-[var(--line)]" />;
  if (!user) return <a href="/sign-in" className="text-sm font-semibold text-[var(--accent)]">Sign in</a>;

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Your account";
  const email = user.primaryEmailAddress?.emailAddress ?? "";
  const avatar = user.hasImage
    ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={user.imageUrl} alt="" className="h-full w-full rounded-full object-cover" />
    : <span aria-hidden className="text-xs font-semibold tracking-wide">{initialsOf(user)}</span>;

  return (
    <div ref={wrap} className="relative">
      <button ref={trigger} type="button" aria-haspopup="menu" aria-expanded={open} aria-label={`Account menu for ${name}`} onClick={() => setOpen((v) => !v)}
        className={`grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-[var(--ink)] text-white ${ring}`}>
        {avatar}
      </button>
      {open && (
        <div role="menu" aria-label="Account" className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--card)] py-1 shadow-lg">
          <div className="border-b border-[var(--line)] px-4 py-3">
            <p className="truncate text-sm font-semibold">{name}</p>
            {email && <p className="truncate text-xs text-[var(--mute)]">{email}</p>}
          </div>
          <button role="menuitem" type="button" onClick={() => { setOpen(false); openUserProfile(); }} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--bg)] focus-visible:bg-[var(--bg)] focus-visible:outline-none">Manage account</button>
          <button role="menuitem" type="button" onClick={() => { setOpen(false); signOut({ redirectUrl: "/" }); }} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--bg)] focus-visible:bg-[var(--bg)] focus-visible:outline-none">Sign out</button>
        </div>
      )}
    </div>
  );
}
