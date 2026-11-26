"use client";

import { useState, useTransition } from "react";
import type { Award } from "@/lib/types";
import { voteAction } from "../actions";

type B = { id: string; name: string; team: string };

export function VoteForm({ awards, ballot, mine, selfId }: { awards: Award[]; ballot: B[]; mine: Record<string, string | null>; selfId: string }) {
  const [open, setOpen] = useState<string | null>(awards.find((a) => !mine[a.id])?.id || null);
  const [q, setQ] = useState("");
  const [local, setLocal] = useState(mine);
  const [pending, start] = useTransition();
  const nameOf = (id: string | null) => (id ? ballot.find((b) => b.id === id)?.name || "—" : null);

  function pick(awardId: string, candidateId: string) {
    setLocal((l) => ({ ...l, [awardId]: candidateId }));
    const fd = new FormData();
    fd.set("awardId", awardId);
    fd.set("candidateId", candidateId);
    start(async () => {
      await voteAction(fd);
      const next = awards.find((a) => a.id !== awardId && !local[a.id] && a.id !== awardId);
      setOpen(next ? next.id : null);
      setQ("");
    });
  }

  const done = awards.filter((a) => local[a.id]).length;
  return (
    <section className="section" style={{ borderBottom: 0, gap: 10 }}>
      <p className="muted small" style={{ margin: 0 }}>
        {done} of {awards.length} done{pending ? " · saving…" : ""}
      </p>
      {awards.map((a, i) => {
        const isOpen = open === a.id;
        const chosen = nameOf(local[a.id]);
        const s = q.trim().toLowerCase();
        const list = ballot.filter((b) => b.id !== selfId && (!s || `${b.name} ${b.team}`.toLowerCase().includes(s)));
        return (
          <div key={a.id} className="card" style={{ borderColor: isOpen ? "var(--ink)" : "var(--line)", padding: 0 }}>
            <button
              onClick={() => {
                setOpen(isOpen ? null : a.id);
                setQ("");
              }}
              style={{ width: "100%", background: "none", border: 0, textAlign: "left", padding: 14, cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}
            >
              <span>
                <span className="eyebrow">{String(i + 1).padStart(2, "0")}</span>
                <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.25 }}>{a.title}</div>
                <div className="small" style={{ color: chosen ? "var(--ink)" : "var(--muted)", marginTop: 2 }}>
                  {chosen ? `✓ ${chosen}` : "Tap to vote"}
                </div>
              </span>
              <span className="pill" style={{ background: chosen ? "var(--ink)" : "transparent", color: chosen ? "var(--paper)" : "var(--muted)", border: chosen ? 0 : "1px solid var(--line)" }}>
                {chosen ? "Done" : "Open"}
              </span>
            </button>
            {isOpen && (
              <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                <input className="input" placeholder="Search a name" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
                <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                  {list.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => pick(a.id, b.id)}
                      style={{ background: local[a.id] === b.id ? "var(--ink)" : "none", color: local[a.id] === b.id ? "var(--paper)" : "inherit", border: 0, borderTop: "1px solid var(--line)", textAlign: "left", padding: "12px 8px", cursor: "pointer", display: "flex", justifyContent: "space-between" }}
                    >
                      <span style={{ fontWeight: 600 }}>{b.name}</span>
                      <span className="small" style={{ opacity: 0.7 }}>{b.team}</span>
                    </button>
                  ))}
                  {list.length === 0 && <p className="muted small">Nobody matches.</p>}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
