import { requireAdminPage } from "../guard";
import { getClues, getConfig, listAnnouncements, listPushSubs } from "@/lib/data";
import { closeHuntAction, deleteAnnouncementAction, postAnnouncementAction, releaseClueAction, saveCluesAction, toggleFlagAction } from "../actions";
import { time } from "@/lib/format";
import { AutoRefresh } from "@/components/auto-refresh";

export default async function PrizeAdmin() {
  await requireAdminPage();
  const [cfg, clues, ann, subs] = await Promise.all([getConfig(), getClues(), listAnnouncements(30), listPushSubs()]);
  const sorted = [...clues].sort((a, b) => a.order - b.order);
  const nextClue = sorted.find((c) => !c.releasedAt);
  const subCount = Object.keys(subs).length;
  return (
    <>
      <AutoRefresh seconds={20} />
      <section className="section">
        <h1 className="display" style={{ fontSize: 36 }}>Find the prize</h1>
        <form action={toggleFlagAction}>
          <input type="hidden" name="key" value="prize" />
          <button className={`btn ${cfg.flags.prize ? "ghost" : ""}`}>{cfg.flags.prize ? "Hunt is LIVE · tap to hide" : "Make the hunt live"}</button>
        </form>
        <p className="muted small" style={{ margin: 0 }}>{subCount} guest{subCount === 1 ? "" : "s"} opted in to phone notifications. Everyone else sees updates when they open the site.</p>
      </section>

      <section className="section">
        <h2 className="display">Release a clue</h2>
        {nextClue ? (
          <form action={releaseClueAction} className="card field" style={{ borderColor: "var(--ink)" }}>
            <span className="eyebrow">Next up · clue {sorted.indexOf(nextClue) + 1} of {sorted.length}</span>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>{nextClue.text}</p>
            <input type="hidden" name="id" value={nextClue.id} />
            <input name="text" className="input" defaultValue={`Still looking? Clue ${sorted.indexOf(nextClue) + 1} just dropped 👀`} />
            <label className="small" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" name="push" defaultChecked /> Also send a phone notification
            </label>
            <button className="btn">Release clue</button>
          </form>
        ) : (
          <p className="notice">{sorted.length === 0 ? "No clues yet. Add them below." : "All clues are out."}</p>
        )}
        <div className="list">
          {sorted.map((c, i) => (
            <div key={c.id}>
              <span className="small">{i + 1}. {c.text}</span>
              <span className={`pill ${c.releasedAt ? "" : "off"}`}>{c.releasedAt ? `Out ${time(c.releasedAt)}` : "Locked"}</span>
            </div>
          ))}
        </div>
        <details>
          <summary className="small" style={{ cursor: "pointer", fontWeight: 600 }}>Edit clue list</summary>
          <form action={saveCluesAction} className="field" style={{ marginTop: 10 }}>
            <p className="muted small" style={{ margin: 0 }}>One per line, in order. Released clues keep their status if the text is unchanged.</p>
            <textarea name="clues" className="input" rows={6} defaultValue={sorted.map((c) => c.text).join("\n")} placeholder={"It's somewhere you'd never look sober\nWarm, not hot\nAsk the bartender nicely"} />
            <button className="btn sm">Save clues</button>
          </form>
        </details>
      </section>

      <section className="section">
        <h2 className="display">{cfg.prize.closed ? "Hunt closed" : "Someone found it?"}</h2>
        {cfg.prize.closed ? (
          <form action={closeHuntAction} className="field">
            <p style={{ margin: 0 }}>Found by <b>{cfg.prize.foundBy}</b>{cfg.prize.foundAt ? ` at ${time(cfg.prize.foundAt)}` : ""}.</p>
            <input type="hidden" name="reopen" value="1" />
            <button className="btn ghost sm">Reopen hunt</button>
          </form>
        ) : (
          <form action={closeHuntAction} className="field">
            <input name="foundBy" className="input" placeholder="Winner's name" required />
            <label className="small" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" name="push" defaultChecked /> Send a phone notification
            </label>
            <button className="btn silver">Close hunt and announce</button>
          </form>
        )}
      </section>

      <section className="section" style={{ borderBottom: 0 }}>
        <h2 className="display">Announcements</h2>
        <form action={postAnnouncementAction} className="field">
          <input name="text" className="input" placeholder="e.g. Welcome drinks are at the bar for the next 20 min" required maxLength={200} />
          <label className="small" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" name="push" /> Also send a phone notification
          </label>
          <button className="btn sm">Post</button>
        </form>
        <div className="list">
          {ann.map((a) => (
            <div key={a.id}>
              <span className="small"><span className="muted">{time(a.at)} · </span>{a.text}</span>
              <form action={deleteAnnouncementAction}><input type="hidden" name="id" value={a.id} /><button className="btn ghost sm">✕</button></form>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
