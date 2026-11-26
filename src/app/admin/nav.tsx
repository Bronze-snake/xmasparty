"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["/admin", "Run sheet"],
  ["/admin/guests", "Guests"],
  ["/admin/awards", "Awards"],
  ["/admin/prize", "Prize & updates"],
  ["/admin/chat", "Chat"],
  ["/admin/photos", "Photos"],
  ["/admin/event", "Event"],
  ["/admin/extras", "Extras"],
];

export function AdminNav() {
  const p = usePathname();
  return (
    <nav className="admin-nav" aria-label="Admin">
      {items.map(([href, label]) => (
        <Link key={href} href={href} className={p === href ? "on" : ""}>
          {label}
        </Link>
      ))}
      <Link href="/" style={{ marginLeft: "auto" }}>Guest view ↗</Link>
    </nav>
  );
}
