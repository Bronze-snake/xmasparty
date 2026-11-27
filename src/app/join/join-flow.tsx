"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type G = { id: string; first: string; last: string; team: string; hasPin: boolean };

export function JoinFlow({ eventName }: { eventName: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const next = params.get("next") || "/";
  const [code, setCode] = useState(params.get("code") || "");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [guests, setGuests] = useState<G[]>([]);
  const [requirePin, setRequirePin] = useState(true);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<G | null>(null);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (params.get("code")) void submitCode(params.get("code")!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitCode(c: string) {
    setErr("");
    setBusy(true);
    const r = await fetch(`/api/join?code=${encodeURIComponent(c.trim())}`);
    setBusy(false);
    if (!r.ok) {
      setErr((await r.json()).error || "Wrong code");
      return;
    }
    const d = await r.json();
    setGuests(d.guests);
    setRequirePin(!!d.requirePin);
    setStep(2);
  }

  async function submitPin(g: G | null = picked) {
    if (!g) return;
    setErr("");
    setBusy(true);
    const r = await fetch("/api/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: code.trim(), guestId: g.id, pin }),
    });
    setBusy(false);
    if (!r.ok) {
      setErr((await r.json()).error || "Something went wrong");
      setPin("");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return guests.filter((g) => !s || `${g.first} ${g.last} ${g.team}`.toLowerCase().includes(s));
  }, [guests, q]);

  return (
    <section className="section" style={{ borderBottom: 0, flex: 1, gap: 20 }}>
      {step === 1 && (
        <>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 14, padding: "24px 0 8px" }}>
            <p className="eyebrow" style={{ margin: 0 }}>Welcome to the</p>
            <h1 className="display" style={{ letterSpacing: "0.22em", marginLeft: "0.22em" }}>Bronze Snake</h1>
            <p className="eyebrow" style={{ margin: 0 }}>2026 End of Year<br />Christmas Celebration</p>
          </div>
          <p className="muted" style={{ margin: 0 }}>
            Pop in the party code from your invite.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitCode(code);
            }}
            className="field"
          >
            <label htmlFor="code">Party code</label>
            <input
              id="code"
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              autoCapitalize="characters"
              autoComplete="off"
              placeholder="e.g. SNAKE26"
              required
            />
            {err && <p className="err">{err}</p>}
            <button className="btn" disabled={busy || !code.trim()} style={{ marginTop: 8 }}>
              {busy ? "Checking…" : "Let me in"}
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <div>
            <p className="eyebrow">{requirePin ? "Step 2 of 3" : "Last step"}</p>
            <h1 className="display" style={{ fontSize: 24 }}>
              Which one are you?
            </h1>
          </div>
          <input
            className="input"
            placeholder="Search your name or store"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
          {guests.length === 0 && <p className="notice">The guest list hasn't been loaded yet. Ask Anth or Dylan.</p>}
          <div className="list" style={{ maxHeight: "50dvh", overflowY: "auto" }}>
            {filtered.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setPicked(g);
                  if (requirePin) setStep(3);
                  else void submitPin(g);
                }}
                style={{ background: "none", border: 0, textAlign: "left", cursor: "pointer", padding: "14px 0" }}
              >
                <span style={{ fontWeight: 600, fontSize: 16 }}>
                  {g.first} {g.last}
                </span>
                <span className="muted small">{g.team}</span>
              </button>
            ))}
            {guests.length > 0 && filtered.length === 0 && <p className="muted small">No one by that name. Try fewer letters.</p>}
          </div>
          <p className="muted small" style={{ margin: 0 }}>
            Not on the list? Grab Anth or Dylan and they'll add you.
          </p>
        </>
      )}

      {step === 3 && picked && (
        <>
          <div>
            <p className="eyebrow">Step 3 of 3 · {picked.first} {picked.last}</p>
            <h1 className="display" style={{ fontSize: 24 }}>
              {picked.hasPin ? "Your PIN" : "Set a 4-digit PIN"}
            </h1>
          </div>
          <p className="muted" style={{ margin: 0 }}>
            {picked.hasPin
              ? "The one you set up last time."
              : "So nobody else can vote as you. Anything you'll remember after a few drinks."}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitPin();
            }}
            className="field"
          >
            <label htmlFor="pin" className="eyebrow">
              PIN
            </label>
            <input
              id="pin"
              className="input pin"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              autoFocus
              autoComplete="one-time-code"
            />
            {err && <p className="err">{err}</p>}
            <button className="btn" disabled={busy || pin.length !== 4} style={{ marginTop: 8 }}>
              {busy ? "One sec…" : picked.hasPin ? "Let's go" : "Save PIN and go"}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setPicked(null);
                setPin("");
                setErr("");
                setStep(2);
              }}
            >
              Not me, go back
            </button>
          </form>
        </>
      )}
    </section>
  );
}
