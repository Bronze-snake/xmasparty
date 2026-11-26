"use client";

import { useEffect, useState } from "react";

type State = "checking" | "unsupported" | "ios-needs-homescreen" | "off" | "on" | "denied";

function b64ToU8(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushOptIn() {
  const [st, setSt] = useState<State>("checking");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = (navigator as unknown as { standalone?: boolean }).standalone || matchMedia("(display-mode: standalone)").matches;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setSt(isIOS && !standalone ? "ios-needs-homescreen" : "unsupported");
        return;
      }
      if (isIOS && !standalone) return setSt("ios-needs-homescreen");
      if (Notification.permission === "denied") return setSt("denied");
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      setSt(sub ? "on" : "off");
    })().catch(() => setSt("unsupported"));
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setSt("denied");
      const reg = await navigator.serviceWorker.ready;
      const { publicKey } = await (await fetch("/api/push")).json();
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(publicKey) });
      await fetch("/api/push", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sub) });
      setSt("on");
    } finally {
      setBusy(false);
    }
  }
  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      await sub?.unsubscribe();
      await fetch("/api/push", { method: "DELETE" });
      setSt("off");
    } finally {
      setBusy(false);
    }
  }

  if (st === "checking") return null;
  if (st === "on")
    return (
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="small" style={{ fontWeight: 600 }}>✓ You&apos;ll get a buzz when a clue drops</span>
        <button className="btn ghost sm" onClick={disable} disabled={busy}>Turn off</button>
      </div>
    );
  if (st === "off")
    return (
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <span className="small">Want a buzz when a clue drops?</span>
        <button className="btn sm" onClick={enable} disabled={busy}>{busy ? "…" : "Notify me"}</button>
      </div>
    );
  if (st === "ios-needs-homescreen")
    return (
      <div className="notice">
        <b>iPhone:</b> to get a buzz when a clue drops, tap <b>Share</b> → <b>Add to Home Screen</b>, then open the party from there and come back to this page.
      </div>
    );
  if (st === "denied") return <div className="notice">Notifications are blocked for this site in your phone settings. The clues still show up here, just keep an eye on it.</div>;
  return <div className="notice">Your browser can&apos;t do notifications. Clues still land on this page.</div>;
}
