import Link from "next/link";
import type { EventConfig } from "@/lib/types";

export function Topbar({ cfg, right }: { cfg: EventConfig; right?: React.ReactNode }) {
  return (
    <header className="topbar">
      <Link href="/" className="logo" aria-label="Home">
        Bronze Snake
      </Link>
      {right ?? (
        <span className={`tag ${cfg.stage === "night" ? "live" : ""}`}>
          {cfg.stage === "night" ? "Live now" : cfg.stage === "after" ? "Thanks for coming" : "Xmas '26"}
        </span>
      )}
    </header>
  );
}

export function Footer({ cfg, left }: { cfg: EventConfig; left?: string }) {
  return (
    <footer className="footer">
      <span>{left ?? "Invite only. Don't share the link."}</span>
      <span style={{ fontWeight: 600 }}>
        {cfg.dateLabel} · {cfg.timeLabel}
      </span>
    </footer>
  );
}

export function Back({ href = "/", label = "Back" }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="tag" style={{ textDecoration: "none", display: "inline-flex", gap: 6, alignItems: "center" }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <path d="M19 12H5M11 6l-6 6 6 6" />
      </svg>
      {label}
    </Link>
  );
}

export function Arrow() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
