"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { time } from "@/lib/format";

export function Chat({ open }: { open: boolean }) {
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const firstLoad = useRef(true);

  async function load() {
    const r = await fetch("/api/chat", { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    setMsgs(d.messages);
    setMe(d.me);
    setAdmin(d.admin);
  }
  useEffect(() => {
    void load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: firstLoad.current ? "instant" : "smooth" });
    firstLoad.current = false;
  }, [msgs.length]);

  async function send() {
    if (!text.trim()) return;
    setBusy(true);
    const r = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
    setBusy(false);
    if (r.ok) {
      setText("");
      await load();
    }
  }
  async function del(id: string) {
    if (!confirm("Delete this message?")) return;
    await fetch("/api/chat", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    await load();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
        {msgs.length === 0 && <p className="muted small">Quiet in here. Say hi.</p>}
        {msgs.map((m) => (
          <div key={m.id} className={`msg ${m.guestId === me ? "mine" : ""}`}>
            <span className="who">
              {m.name} · {time(m.at)}
              {(admin || m.guestId === me) && (
                <button onClick={() => del(m.id)} style={{ background: "none", border: 0, marginLeft: 8, cursor: "pointer", color: "inherit", opacity: 0.7, fontSize: 11 }} aria-label="Delete message">
                  delete
                </button>
              )}
            </span>
            <span className="txt">{m.text}</span>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="row"
        style={{ padding: "12px 20px", borderTop: "1px solid var(--ink)", background: "var(--paper)", position: "sticky", bottom: 0 }}
      >
        <input
          className="input"
          placeholder={open ? "Say something…" : "Chat is closed"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!open}
          maxLength={500}
          enterKeyHint="send"
        />
        <button className="btn sm" disabled={!open || busy || !text.trim()} style={{ minHeight: 52 }}>
          Send
        </button>
      </form>
    </div>
  );
}
