"use client";
import { OPEN_EVENT } from "./GoogleAnalytics";

// Reopens the analytics choice so a visitor can accept or withdraw at any time.
export default function CookieSettingsButton({ className = "" }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))} className={className || "underline hover:text-[var(--ink)]"}>
      Cookie settings
    </button>
  );
}
