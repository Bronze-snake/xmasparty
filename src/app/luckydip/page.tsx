import { redirect } from "next/navigation";
import { currentGuest } from "@/lib/auth";
import { getConfig, luckydipClaims } from "@/lib/data";
import { Back, Footer, Topbar } from "@/components/chrome";
import { claimLuckydipAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function LuckyDipPage() {
  const g = await currentGuest();
  if (!g) redirect("/join?next=/luckydip");
  const cfg = await getConfig();
  if (!cfg.flags.luckydip) redirect("/");
  const claims = await luckydipClaims();
  const mine = claims[g.id];
  return (
    <main className="shell">
      <Topbar cfg={cfg} right={<Back />} />
      <section className="section dark">
        <span className="eyebrow">One go each</span>
        <h1 className="display">Lucky dip</h1>
        <p style={{ margin: 0, color: "#c9d3bf" }}>{cfg.luckydip.blurb || "Tap the button. Get what you get. No swaps."}</p>
      </section>
      <section className="section" style={{ borderBottom: 0, flex: 1 }}>
        {mine ? (
          <div className="card" style={{ borderColor: "var(--ink)", textAlign: "center", padding: 28 }}>
            <span className="eyebrow">You got</span>
            <p className="display" style={{ fontSize: 40, margin: "8px 0" }}>{mine}</p>
            <p className="muted small" style={{ margin: 0 }}>Show Anth or Dylan to collect.</p>
          </div>
        ) : (
          <form action={claimLuckydipAction}>
            <button className="btn huge">Dip in</button>
          </form>
        )}
      </section>
      <Footer cfg={cfg} />
    </main>
  );
}
