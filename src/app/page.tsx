import Link from "next/link";
import { redirect } from "next/navigation";
import { currentGuest } from "@/lib/auth";
import { getAwards, getClues, getConfig, getVotes, listAnnouncements, listChat, listPhotos, myVotes } from "@/lib/data";
import { Arrow, Footer, Topbar } from "@/components/chrome";
import { checkInAction, rsvpAction } from "./actions";
import { Countdown } from "@/components/countdown";
import { time } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const guest = await currentGuest();
  const sp = await searchParams;
  if (!guest) redirect(sp.code ? `/join?code=${encodeURIComponent(sp.code)}` : "/join");
  const cfg = await getConfig();
  const f = cfg.flags;

  if (cfg.stage === "before") {
    const [chat, awards] = await Promise.all([listChat(1), getAwards()]);
    const last = chat[0];
    return (
      <main className="shell">
        <Topbar cfg={cfg} />
        <section className="section dark" style={{ gap: 18 }}>
          <span className="eyebrow live" style={{ color: "var(--silver)" }}>
            You&apos;re on the list, {guest.first}
          </span>
          <h1 className="display">{cfg.name}</h1>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.45, color: "#dad7d0" }}>{cfg.tagline}</p>
          <div className="grid3" style={{ borderTop: "1px solid #3a3a3a", borderBottom: "1px solid #3a3a3a", gap: 0 }}>
            <Cell label="Date" value={cfg.dateLabel} />
            <Cell label="Time" value={cfg.timeLabel} left />
            <Cell label="Countdown" value={<Countdown iso={cfg.startsAt} />} left />
          </div>
          {f.rsvp && (
            <form action={rsvpAction} className="field">
              <span className="small" style={{ fontWeight: 600 }}>
                {guest.rsvp === "yes" ? "You're in. Change of plans?" : guest.rsvp === "no" ? "You said no. Reconsidering?" : `Coming, ${guest.first}?`}
              </span>
              <div className="grid2">
                <button className={`btn ${guest.rsvp === "yes" ? "silver" : "paper"}`} name="rsvp" value="yes">
                  {guest.rsvp === "yes" ? "✓ I'm in" : "I'm in"}
                </button>
                <button className="btn ghost" name="rsvp" value="no" style={{ color: "var(--paper)", borderColor: "#6a6c6f" }}>
                  {guest.rsvp === "no" ? "✓ Can't make it" : "Can't make it"}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="section">
          <h2 className="display">The details</h2>
          <div className="list">
            <Row k="Venue" v={cfg.venue || "Coming soon"} />
            <Row k="Address" v={cfg.address || "Coming soon"} />
            <Row k="Dress code" v={cfg.dressCode || "Coming soon"} />
          </div>
          {cfg.mapUrl && (
            <a className="btn ghost" href={cfg.mapUrl} target="_blank" rel="noreferrer">
              Open in Maps
            </a>
          )}
        </section>

        <section className="section">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
            <h2 className="display">Best of the Night</h2>
            <span className="pill">Opens on the night</span>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            {awards.length} awards. Bronze Snake vouchers for the winners. Start campaigning.
          </p>
          <ol className="list" style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {awards.map((a, i) => (
              <li key={a.id} style={{ justifyContent: "flex-start", gap: 14, fontWeight: 500 }}>
                <span style={{ fontWeight: 700, color: "var(--silver-dark)", width: 22 }}>{String(i + 1).padStart(2, "0")}</span>
                {a.title}
              </li>
            ))}
          </ol>
        </section>

        <section className="section dark" style={{ margin: 20, borderRadius: 6, border: "1px solid var(--silver)" }}>
          <span className="eyebrow">Classified</span>
          <h2 className="display">Something&apos;s hidden in the venue</h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "#dad7d0" }}>
            Clues drop one at a time on the night. Find it, show Anth or Dylan, it&apos;s yours.
          </p>
        </section>

        {f.chat && (
          <section className="section" style={{ borderBottom: 0, paddingTop: 4 }}>
            <h2 className="display">Party chat</h2>
            {last ? (
              <div className="msg">
                <span className="who">{last.name}</span>
                <span className="txt">{last.text}</span>
              </div>
            ) : (
              <p className="muted small" style={{ margin: 0 }}>
                Nobody&apos;s said anything yet. Be the first.
              </p>
            )}
            <Link href="/chat" className="btn">
              Join the chat
            </Link>
          </section>
        )}
        <Footer cfg={cfg} />
      </main>
    );
  }

  if (cfg.stage === "night") {
    const [ann, clues, photos, votes] = await Promise.all([listAnnouncements(1), getClues(), listPhotos(1000), myVotes(guest.id)]);
    const released = clues.filter((c) => c.releasedAt).length;
    const awards = await getAwards();
    const voted = Object.values(votes).filter(Boolean).length;
    return (
      <main className="shell">
        <Topbar cfg={cfg} />
        {ann[0] && (
          <Link href={ann[0].kind === "clue" ? "/prize" : "/announcements"} className="banner">
            <span className="eyebrow" style={{ color: "var(--ink)" }}>
              Latest · {time(ann[0].at)}
            </span>
            <span className="b">{ann[0].text}</span>
          </Link>
        )}
        {!guest.checkedInAt ? (
          <section className="section" style={{ flex: 1, gap: 20, borderBottom: 0 }}>
            <h1 className="display">You made it.</h1>
            <p className="muted" style={{ margin: 0, fontSize: 16 }}>
              Check in so you can vote, grab the photos and get in on the hunt.
            </p>
            <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderColor: "var(--ink)" }}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>
                {guest.first} {guest.last} · {guest.team}
              </span>
              <Link href="/signout" className="small muted">
                Not you?
              </Link>
            </div>
            <form action={checkInAction}>
              <button className="btn huge">Check in</button>
            </form>
            <p className="muted small" style={{ margin: 0, textAlign: "center" }}>
              Not on the list? Find Anth or Dylan at the door.
            </p>
          </section>
        ) : (
          <>
            <section className="section" style={{ borderBottom: 0, paddingBottom: 6 }}>
              <span className="eyebrow">Checked in · {time(guest.checkedInAt)}</span>
              <h1 className="display" style={{ fontSize: 46 }}>
                Go on then, {guest.first}.
              </h1>
            </section>
            <section className="section" style={{ borderBottom: 0, gap: 10, paddingTop: 10 }}>
              <Link href="/awards" className="tile dark">
                <span>
                  <div className="t">Vote</div>
                  <div className="s">{f.voting ? `${voted} of ${awards.length} awards done` : "Opens soon"}</div>
                </span>
                <Arrow />
              </Link>
              <Link href="/photos" className="tile">
                <span>
                  <div className="t">Party photos</div>
                  <div className="s">{f.photos ? `${photos.length} shots so far · add yours` : "Opens soon"}</div>
                </span>
                <Arrow />
              </Link>
              <Link href="/prize" className="tile silver">
                <span>
                  <div className="t">Find the prize</div>
                  <div className="s">
                    {cfg.prize.closed ? "Found!" : f.prize ? `Clue ${released} of ${clues.length} is out` : "Not yet…"}
                  </div>
                </span>
                <Arrow />
              </Link>
            </section>
            <section className="section" style={{ borderBottom: 0, paddingTop: 6 }}>
              <div className="grid3">
                {f.chat && <Link href="/chat" className="btn ghost sm" style={{ width: "100%" }}>Chat</Link>}
                {f.cocktail && <Link href="/drink" className="btn ghost sm" style={{ width: "100%" }}>The drink</Link>}
                {f.recovery && <Link href="/recovery" className="btn ghost sm" style={{ width: "100%" }}>Recovery kit</Link>}
                {f.luckydip && <Link href="/luckydip" className="btn ghost sm" style={{ width: "100%" }}>Lucky dip</Link>}
                <Link href="/announcements" className="btn ghost sm" style={{ width: "100%" }}>Updates</Link>
              </div>
            </section>
          </>
        )}
        <Footer cfg={cfg} left={cfg.venue || undefined} />
      </main>
    );
  }

  // after
  const [photos, awards] = await Promise.all([listPhotos(6), getAwards()]);
  const winners = f.winnersRevealed ? await winnersFor(awards) : null;
  return (
    <main className="shell">
      <Topbar cfg={cfg} />
      <section className="section dark" style={{ gap: 12 }}>
        <h1 className="display">That&apos;s a wrap.</h1>
        <p style={{ margin: 0, fontSize: 15, color: "#dad7d0" }}>Drink water. Check the photos before your mum does.</p>
        <Link href="/photos" className="btn paper" style={{ marginTop: 6 }}>
          See the photos
        </Link>
      </section>
      {photos.length > 0 && (
        <section className="section" style={{ borderBottom: 0, paddingBottom: 0 }}>
          <div className="photo-grid">
            {photos.map((p) => (
              <Link key={p.id} href="/photos">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" loading="lazy" />
              </Link>
            ))}
          </div>
        </section>
      )}
      {cfg.dropboxUrl && (
        <section className="section" style={{ borderBottom: 0, paddingBottom: 0 }}>
          <a href={cfg.dropboxUrl} target="_blank" rel="noreferrer" className="small" style={{ fontWeight: 600 }}>
            Camera roll from the vintage cams → Dropbox
          </a>
        </section>
      )}
      <section className="section">
        <h2 className="display">Best of the Night</h2>
        <div className="list">
          {awards.map((a) => (
            <div key={a.id}>
              <span className="small" style={{ color: "#3e4043" }}>{a.title}</span>
              <span style={{ fontWeight: 700, textAlign: "right" }}>{winners ? winners[a.id] || "—" : "Announcing soon"}</span>
            </div>
          ))}
        </div>
      </section>
      {cfg.prize.foundBy && (
        <section className="section silver" style={{ margin: "0 20px 24px", borderRadius: 6, borderBottom: 0 }}>
          <span className="eyebrow" style={{ color: "var(--ink)" }}>Prize found</span>
          <span className="display" style={{ fontSize: 26 }}>
            {cfg.prize.foundBy} found it{cfg.prize.foundAt ? ` at ${time(cfg.prize.foundAt)}` : ""}
          </span>
        </section>
      )}
      <Footer cfg={cfg} left="This link stays live for your photos." />
    </main>
  );
}

async function winnersFor(awards: { id: string }[]) {
  const { listGuests } = await import("@/lib/data");
  const guests = await listGuests();
  const name = (id: string) => {
    const g = guests.find((x) => x.id === id);
    return g ? `${g.first} ${g.last}` : "";
  };
  const out: Record<string, string> = {};
  for (const a of awards) {
    const v = await getVotes(a.id);
    const tally: Record<string, number> = {};
    for (const c of Object.values(v)) tally[c] = (tally[c] || 0) + 1;
    const top = Object.entries(tally).sort((x, y) => y[1] - x[1])[0];
    out[a.id] = top ? name(top[0]) : "";
  }
  return out;
}

function Cell({ label, value, left }: { label: string; value: React.ReactNode; left?: boolean }) {
  return (
    <div style={{ padding: left ? "12px 0 12px 12px" : "12px 0", borderLeft: left ? "1px solid #3a3a3a" : 0, display: "flex", flexDirection: "column", gap: 2 }}>
      <span className="eyebrow" style={{ color: "#a9abae" }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700 }}>{value}</span>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <span className="muted">{k}</span>
      <span style={{ fontWeight: 600, textAlign: "right" }}>{v}</span>
    </div>
  );
}
