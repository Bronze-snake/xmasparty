import { redirect } from "next/navigation";
import { currentGuest } from "@/lib/auth";
import { getClues, getConfig } from "@/lib/data";
import { Back, Footer, Topbar } from "@/components/chrome";
import { time } from "@/lib/format";
import { AutoRefresh } from "@/components/auto-refresh";

export const dynamic = "force-dynamic";

export default async function PrizePage() {
  const g = await currentGuest();
  if (!g) redirect("/join?next=/prize");
  const cfg = await getConfig();
  const clues = (await getClues()).sort((a, b) => a.order - b.order);
  const live = cfg.flags.prize;
  const released = clues.filter((c) => c.releasedAt);
  return (
    <main className="shell">
      <AutoRefresh seconds={15} />
      <Topbar cfg={cfg} right={<Back />} />
      <section className="section dark">
        <span className="eyebrow">{cfg.prize.closed ? "Hunt over" : live ? "The hunt is on" : "Classified"}</span>
        <h1 className="display">{cfg.prize.closed ? "Someone found it." : "Something's hidden in the venue"}</h1>
        {cfg.prize.closed ? (
          <p style={{ margin: 0, color: "#c9d3bf" }}>
            {cfg.prize.foundBy || "A legend"} found it{cfg.prize.foundAt ? ` at ${time(cfg.prize.foundAt)}` : ""}. Better luck next year.
          </p>
        ) : (
          <p style={{ margin: 0, color: "#c9d3bf" }}>
            Clues drop one at a time. First to find it and show Anth or Dylan keeps it. No digging through bins.
          </p>
        )}
      </section>
      {live && (cfg.prize.title || cfg.prize.imageUrl) && (
        <section className="section">
          <span className="eyebrow">What you&apos;re looking for</span>
          {cfg.prize.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cfg.prize.imageUrl} alt={cfg.prize.title} style={{ width: "100%", borderRadius: 6, border: "1px solid var(--line)" }} />
          )}
          {cfg.prize.title && <h2 className="display">{cfg.prize.title}</h2>}
          {cfg.prize.description && <p style={{ margin: 0 }}>{cfg.prize.description}</p>}
        </section>
      )}
      <section className="section" style={{ borderBottom: 0, flex: 1 }}>
        <h2 className="display">Clues</h2>
        {!live && <p className="notice">Clues unlock on the night. This page will update by itself.</p>}
        {live && clues.length === 0 && <p className="notice">No clues loaded yet. Stay close to your phone.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {clues.map((c, i) =>
            c.releasedAt && live ? (
              <div key={c.id} className="card" style={{ borderColor: "var(--ink)" }}>
                <span className="eyebrow">
                  Clue {i + 1} · {time(c.releasedAt)}
                </span>
                <p style={{ margin: "6px 0 0", fontSize: 17, lineHeight: 1.4, fontWeight: 500 }}>{c.text}</p>
              </div>
            ) : (
              <div key={c.id} className="card" style={{ borderStyle: "dashed", color: "var(--muted)" }}>
                <span className="eyebrow">Clue {i + 1}</span>
                <p style={{ margin: "6px 0 0", fontSize: 15 }}>Locked</p>
              </div>
            ),
          )}
        </div>
        {live && released.length > 0 && !cfg.prize.closed && <p className="muted small" style={{ margin: 0 }}>Found it? Don&apos;t post it in the chat, go find Anth or Dylan.</p>}
      </section>
      <Footer cfg={cfg} />
    </main>
  );
}
