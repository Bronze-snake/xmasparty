import { requireAdminPage } from "../guard";
import { listGuests } from "@/lib/data";
import { addGuestAction, guestOpAction, uploadGuestsAction } from "../actions";
import { time } from "@/lib/format";
import { GuestTable } from "./guest-table";

export default async function GuestsAdmin({ searchParams }: { searchParams: Promise<{ added?: string; skipped?: string }> }) {
  await requireAdminPage();
  const sp = await searchParams;
  const guests = await listGuests();
  return (
    <>
      <section className="section">
        <h1 className="display" style={{ fontSize: 36 }}>Guests · {guests.length}</h1>
        {sp.added !== undefined && <p className="ok">Added {sp.added}, skipped {sp.skipped} already on the list.</p>}
        <div className="grid2" style={{ alignItems: "start" }}>
          <form action={uploadGuestsAction} className="card field" encType="multipart/form-data">
            <b>Upload the invite list</b>
            <p className="muted small" style={{ margin: 0 }}>CSV with <code>First, Last, Team</code> (or <code>Full name, Team</code>). Header row optional. Names already on the list are skipped.</p>
            <input type="file" name="file" accept=".csv,.txt,text/csv" className="small" />
            <textarea name="pasted" className="input" placeholder={"…or paste rows here\nJess,Nguyen,Prahran\nSam,Kaur,Warehouse"} rows={4} />
            <button className="btn sm">Import</button>
          </form>
          <form action={addGuestAction} className="card field">
            <b>Add a last-minute guest</b>
            <input name="first" className="input" placeholder="First name" required />
            <input name="last" className="input" placeholder="Last name" />
            <input name="team" className="input" placeholder="Store or team" />
            <label className="small" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" name="checkin" /> Check them in now
            </label>
            <button className="btn sm">Add</button>
          </form>
        </div>
        <p className="notice">How guests get in: they open the guest link, type the party code, tap their name and <b>choose their own 4-digit PIN</b>. Nothing is emailed or texted. “Reset PIN” wipes it so they can pick a new one.</p>
        <a className="btn ghost sm" href="/admin/guests/export" download>Export CSV (RSVP + check-in)</a>
      </section>
      <section className="section" style={{ borderBottom: 0 }}>
        <GuestTable
          guests={guests.map((g) => ({
            id: g.id,
            name: `${g.first} ${g.last}`,
            team: g.team,
            rsvp: g.rsvp,
            checkedIn: g.checkedInAt ? time(g.checkedInAt) : null,
            hasPin: !!g.pinHash,
          }))}
          op={guestOpAction}
        />
      </section>
    </>
  );
}
