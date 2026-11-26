import { requireAdminPage } from "./guard";
import { getAwards, getClues, getConfig, getVotes, listGuests, listPhotos } from "@/lib/data";
import { kv } from "@/lib/kv";
import { setStageAction, toggleFlagAction, adminLogoutAction } from "./actions";
import type { Flags } from "@/lib/types";
import { AutoRefresh } from "@/components/auto-refresh";

const FLAGS: { key: keyof Flags; label: string; help: string }[] = [
  { key: "rsvp", label: "RSVP buttons", help: "Shown on the before-the-party homepage." },
  { key: "chat", label: "Guest chat", help: "Off = read-only. Messages stay." },
  { key: "voting", label: "Voting open", help: "Guests can tap a name per award." },
  { key: "photos", label: "Photo uploads", help: "Gallery and uploads for guests." },
  { key: "prize", label: "Prize hunt live", help: "Shows the prize and released clues." },
  { key: "cocktail", label: "Welcome drink page", help: "Needs details under Extras." },
  { key: "recovery", label: "Recovery kits", help: "Guests tap Claim and show the screen." },
  { key: "luckydip", label: "Lucky dip", help: "Random prize from your list under Extras." },
  { key: "winnersRevealed", label: "Reveal winners", help: "Shows winners on the site and closes voting." },
];

export default async function RunSheet() {
  await requireAdminPage();
  const cfg = await getConfig();
  const [guests, awards, clues, photos] = await Promise.all([listGuests(), getAwards(), getClues(), listPhotos(5000)]);
  const yes = guests.filter((g) => g.rsvp === "yes").length;
  const no = guests.filter((g) => g.rsvp === "no").length;
  const inCount = guests.filter((g) => g.checkedInAt).length;
  let votesCast = 0;
  for (const a of awards) votesCast += Object.keys(await getVotes(a.id)).length;
  const memory = kv().isMemory;

  return (
    <>
      <AutoRefresh seconds={20} />
      <section className="section" style={{ borderBottom: 0 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <h1 className="display" style={{ fontSize: 36 }}>Run sheet</h1>
          <form action={adminLogoutAction}><button className="btn ghost sm">Log out</button></form>
        </div>
        {memory && (
          <p className="err" style={{ border: "1.5px solid #b3261e", padding: 10, borderRadius: 4 }}>
            Redis isn&apos;t connected, so nothing is being saved permanently. In Vercel → Storage, add Upstash Redis to this project and redeploy.
          </p>
        )}
        <div className="grid3">
          <div className="stat"><span className="eyebrow">Guests</span><b>{guests.length}</b></div>
          <div className="stat"><span className="eyebrow">RSVP yes / no</span><b>{yes}<span style={{ fontSize: 18, color: "var(--muted)" }}> / {no}</span></b></div>
          <div className="stat"><span className="eyebrow">Checked in</span><b>{inCount}</b></div>
          <div className="stat"><span className="eyebrow">Votes cast</span><b>{votesCast}</b></div>
          <div className="stat"><span className="eyebrow">Clues out</span><b>{clues.filter((c) => c.releasedAt).length}<span style={{ fontSize: 18, color: "var(--muted)" }}>/{clues.length}</span></b></div>
          <div className="stat"><span className="eyebrow">Photos</span><b>{photos.length}</b></div>
        </div>
      </section>

      <section className="section">
        <h2 className="display">Stage</h2>
        <p className="muted small" style={{ margin: 0 }}>This changes what the homepage shows everyone. Switch to <b>On the night</b> when doors open.</p>
        <form action={setStageAction} className="grid3">
          {(["before", "night", "after"] as const).map((st) => (
            <button key={st} name="stage" value={st} className={`btn ${cfg.stage === st ? "" : "ghost"}`} style={{ fontSize: 13 }}>
              {st === "before" ? "Before" : st === "night" ? "On the night" : "After"}
            </button>
          ))}
        </form>
      </section>

      <section className="section" style={{ borderBottom: 0 }}>
        <h2 className="display">Features</h2>
        <div>
          {FLAGS.map((f) => (
            <form key={f.key} action={toggleFlagAction} className="toggle">
              <span>
                <div style={{ fontWeight: 600 }}>{f.label}</div>
                <div className="muted small">{f.help}</div>
              </span>
              <input type="hidden" name="key" value={f.key} />
              <button className={`switch ${cfg.flags[f.key] ? "on" : ""}`} aria-label={`${f.label} ${cfg.flags[f.key] ? "on" : "off"}`} aria-pressed={!!cfg.flags[f.key]} />
            </form>
          ))}
          <form action={toggleFlagAction} className="toggle">
            <span>
              <div style={{ fontWeight: 600 }}>Ballot</div>
              <div className="muted small">Who can be voted for.</div>
            </span>
            <input type="hidden" name="key" value="ballot" />
            <button className="btn ghost sm">{cfg.flags.ballot === "all" ? "Everyone invited" : "Checked-in only"} · switch</button>
          </form>
        </div>
      </section>

      <section className="section" style={{ borderBottom: 0 }}>
        <h2 className="display">Share</h2>
        <p className="small" style={{ margin: 0 }}>
          Guest link: <code>{process.env.NEXT_PUBLIC_SITE_URL || "https://xmasparty-ruddy.vercel.app"}/join?code={cfg.partyCode}</code>
        </p>
        <p className="muted small" style={{ margin: 0 }}>Party code <b>{cfg.partyCode}</b>. Change it under Event. The entry QR should point at that link.</p>
      </section>
    </>
  );
}
