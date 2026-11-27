import Link from "next/link";
import { redirect } from "next/navigation";
import { currentGuest } from "@/lib/auth";
import { getAwards, getConfig, getVotes, listGuests, myVotes } from "@/lib/data";
import { Back, Footer, Topbar } from "@/components/chrome";
import { VoteForm } from "./vote-form";

export const dynamic = "force-dynamic";

export default async function AwardsPage() {
  const g = await currentGuest();
  if (!g) redirect("/join?next=/awards");
  const cfg = await getConfig();
  const awards = await getAwards();
  const f = cfg.flags;

  if (f.winnersRevealed) {
    const guests = await listGuests();
    const rows = [];
    for (const a of awards) {
      const v = await getVotes(a.id);
      const tally: Record<string, number> = {};
      for (const c of Object.values(v)) tally[c] = (tally[c] || 0) + 1;
      const top = Object.entries(tally).sort((x, y) => y[1] - x[1])[0];
      const w = top ? guests.find((x) => x.id === top[0]) : null;
      rows.push({ a, w: w ? `${w.first} ${w.last}` : "—" });
    }
    return (
      <main className="shell">
        <Topbar cfg={cfg} right={<Back />} />
        <section className="section dark">
          <span className="eyebrow">Best of the Night</span>
          <h1 className="display">The winners</h1>
          <p style={{ margin: 0, color: "#c9d3bf" }}>Vouchers are on their way. No recounts.</p>
        </section>
        <section className="section" style={{ borderBottom: 0 }}>
          <div className="list">
            {rows.map(({ a, w }) => (
              <div key={a.id}>
                <span className="small muted">{a.title}</span>
                <span style={{ fontWeight: 700, textAlign: "right" }}>{w}</span>
              </div>
            ))}
          </div>
        </section>
        <Footer cfg={cfg} />
      </main>
    );
  }

  if (!f.voting) {
    return (
      <main className="shell">
        <Topbar cfg={cfg} right={<Back />} />
        <section className="section" style={{ borderBottom: 0, flex: 1 }}>
          <span className="pill" style={{ alignSelf: "flex-start" }}>Voting not open yet</span>
          <h1 className="display">Best of the Night</h1>
          <p className="muted" style={{ margin: 0 }}>Anth and Dylan will open voting on the night. Here&apos;s what you&apos;re voting on.</p>
          <ol className="list" style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {awards.map((a, i) => (
              <li key={a.id} style={{ justifyContent: "flex-start", gap: 14, fontWeight: 500 }}>
                <span style={{ fontWeight: 700, color: "var(--silver-dark)", width: 22 }}>{String(i + 1).padStart(2, "0")}</span>
                {a.title}
              </li>
            ))}
          </ol>
          <Link href="/" className="btn ghost">Back to the party</Link>
        </section>
        <Footer cfg={cfg} />
      </main>
    );
  }

  const [guests, mine] = await Promise.all([listGuests(), myVotes(g.id)]);
  const ballot = (f.ballot === "checkedin" ? guests.filter((x) => x.checkedInAt) : guests).map((x) => ({
    id: x.id,
    name: `${x.first} ${x.last}`,
    team: x.team,
  }));
  return (
    <main className="shell">
      <Topbar cfg={cfg} right={<Back />} />
      <section className="section" style={{ borderBottom: 0, paddingBottom: 0 }}>
        <span className="eyebrow">One vote per award · you can change it until voting closes</span>
        <h1 className="display">Best of the Night</h1>
      </section>
      <VoteForm awards={awards} ballot={ballot} mine={mine} selfId={g.id} />
      <Footer cfg={cfg} />
    </main>
  );
}
