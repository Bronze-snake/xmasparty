import { requireAdminPage } from "../guard";
import { getAwards, getConfig, getVotes, listGuests } from "@/lib/data";
import { saveAwardsAction, toggleFlagAction } from "../actions";
import { AutoRefresh } from "@/components/auto-refresh";

export default async function AwardsAdmin() {
  await requireAdminPage();
  const [cfg, awards, guests] = await Promise.all([getConfig(), getAwards(), listGuests()]);
  const name = (id: string) => {
    const g = guests.find((x) => x.id === id);
    return g ? `${g.first} ${g.last}` : "?";
  };
  const tallies = [];
  for (const a of awards) {
    const v = await getVotes(a.id);
    const t: Record<string, number> = {};
    for (const c of Object.values(v)) t[c] = (t[c] || 0) + 1;
    tallies.push({ a, total: Object.keys(v).length, top: Object.entries(t).sort((x, y) => y[1] - x[1]).slice(0, 3) });
  }
  return (
    <>
      <AutoRefresh seconds={15} />
      <section className="section">
        <h1 className="display" style={{ fontSize: 36 }}>Best of the Night</h1>
        <div className="grid2">
          <form action={toggleFlagAction}>
            <input type="hidden" name="key" value="voting" />
            <button className={`btn ${cfg.flags.voting ? "danger" : ""}`}>{cfg.flags.voting ? "Close voting" : "Open voting"}</button>
          </form>
          <form action={toggleFlagAction}>
            <input type="hidden" name="key" value="winnersRevealed" />
            <button className={`btn ${cfg.flags.winnersRevealed ? "ghost" : "silver"}`}>{cfg.flags.winnersRevealed ? "Hide winners" : "Reveal winners on site"}</button>
          </form>
        </div>
        <p className="muted small" style={{ margin: 0 }}>
          Voting is <b>{cfg.flags.voting ? "open" : "closed"}</b>. Ballot: <b>{cfg.flags.ballot === "all" ? "everyone invited" : "checked-in guests only"}</b> (switch on the run sheet). Announce winners out loud first, then tap Reveal.
        </p>
      </section>

      <section className="section">
        <h2 className="display">Live tally (private)</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tallies.map(({ a, total, top }) => (
            <div key={a.id} className="card">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <b>{a.title}</b>
                <span className="muted small">{total} votes</span>
              </div>
              {top.length === 0 ? (
                <p className="muted small" style={{ margin: "6px 0 0" }}>No votes yet.</p>
              ) : (
                <ol style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                  {top.map(([id, n]) => (
                    <li key={id}>{name(id)} <span className="muted">· {n}</span></li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ borderBottom: 0 }}>
        <h2 className="display">Edit categories</h2>
        <form action={saveAwardsAction} className="field">
          <p className="muted small" style={{ margin: 0 }}>One per line. Renaming a category resets its votes, so settle these before voting opens.</p>
          <textarea name="awards" className="input" rows={8} defaultValue={awards.map((a) => a.title).join("\n")} />
          <button className="btn sm">Save categories</button>
        </form>
      </section>
    </>
  );
}
