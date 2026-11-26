import { redirect } from "next/navigation";
import { currentGuest } from "@/lib/auth";
import { getConfig, recoveryClaims } from "@/lib/data";
import { Back, Footer, Topbar } from "@/components/chrome";
import { claimRecoveryAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function RecoveryPage() {
  const g = await currentGuest();
  if (!g) redirect("/join?next=/recovery");
  const cfg = await getConfig();
  if (!cfg.flags.recovery) redirect("/");
  const claims = await recoveryClaims();
  const mine = claims[g.id] || 0;
  const left = Math.max(0, cfg.recovery.limitPerGuest - mine);
  return (
    <main className="shell">
      <Topbar cfg={cfg} right={<Back />} />
      <section className="section silver">
        <span className="eyebrow" style={{ color: "var(--ink)" }}>Take-home</span>
        <h1 className="display">Recovery kit</h1>
        <p style={{ margin: 0 }}>{cfg.recovery.blurb}</p>
      </section>
      <section className="section" style={{ borderBottom: 0, flex: 1 }}>
        {cfg.recovery.items && (
          <>
            <h2 className="display">In the bag</h2>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
              {cfg.recovery.items.split("\n").filter((s) => s.trim()).map((s, i) => <li key={i}>{s.trim()}</li>)}
            </ul>
          </>
        )}
        {mine > 0 ? (
          <div className="card" style={{ borderColor: "var(--ink)", background: "var(--ink)", color: "var(--paper)" }}>
            <span className="eyebrow" style={{ color: "var(--silver)" }}>Claimed</span>
            <p className="display" style={{ fontSize: 30, margin: "4px 0" }}>Show this screen at the door</p>
            <p style={{ margin: 0, fontSize: 14 }}>{g.first} {g.last} · {g.team}</p>
          </div>
        ) : (
          <form action={claimRecoveryAction} className="field">
            <p className="muted small" style={{ margin: 0 }}>Tap when you&apos;re grabbing yours on the way out, then show the screen.</p>
            <button className="btn huge" disabled={left === 0} style={{ fontSize: 34 }}>Claim mine</button>
          </form>
        )}
      </section>
      <Footer cfg={cfg} />
    </main>
  );
}
