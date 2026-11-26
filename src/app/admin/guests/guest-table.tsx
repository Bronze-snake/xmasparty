"use client";

import { useMemo, useState } from "react";

type Row = { id: string; name: string; team: string; rsvp: "yes" | "no" | null; checkedIn: string | null; hasPin: boolean };

export function GuestTable({ guests, op }: { guests: Row[]; op: (fd: FormData) => Promise<void> }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "in" | "out" | "yes" | "no">("all");
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return guests.filter((g) => {
      if (s && !`${g.name} ${g.team}`.toLowerCase().includes(s)) return false;
      if (filter === "in") return !!g.checkedIn;
      if (filter === "out") return !g.checkedIn;
      if (filter === "yes") return g.rsvp === "yes";
      if (filter === "no") return g.rsvp === "no";
      return true;
    });
  }, [guests, q, filter]);

  return (
    <>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <input className="input" placeholder="Search name or store" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1, minWidth: 180, height: 44 }} />
        <select className="input" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} style={{ width: "auto", height: 44 }}>
          <option value="all">Everyone</option>
          <option value="in">Checked in</option>
          <option value="out">Not checked in</option>
          <option value="yes">RSVP yes</option>
          <option value="no">RSVP no</option>
        </select>
      </div>
      <div className="scroll-x">
        <table className="tbl">
          <thead>
            <tr><th>Name</th><th>Team</th><th>RSVP</th><th>Checked in</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((g) => (
              <tr key={g.id}>
                <td style={{ fontWeight: 600 }}>{g.name}{!g.hasPin && <span className="muted"> · no PIN yet</span>}</td>
                <td>{g.team}</td>
                <td>{g.rsvp === "yes" ? "Yes" : g.rsvp === "no" ? "No" : "—"}</td>
                <td>{g.checkedIn || "—"}</td>
                <td>
                  <form action={op} className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                    <input type="hidden" name="id" value={g.id} />
                    {g.checkedIn ? (
                      <button name="op" value="undo-checkin" className="btn ghost sm">Undo</button>
                    ) : (
                      <button name="op" value="checkin" className="btn sm">Check in</button>
                    )}
                    <button name="op" value="reset-pin" className="btn ghost sm" title="Lets them set a new PIN">PIN</button>
                    <button name="op" value="delete" className="btn danger ghost sm" onClick={(e) => { if (!confirm(`Remove ${g.name}?`)) e.preventDefault(); }}>✕</button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="muted">Nobody matches.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
