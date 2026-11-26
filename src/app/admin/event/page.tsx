import { requireAdminPage } from "../guard";
import { getConfig } from "@/lib/data";
import { saveEventAction } from "../actions";

export default async function EventAdmin() {
  await requireAdminPage();
  const cfg = await getConfig();
  const F = ({ name, label, value, help, type = "text" }: { name: string; label: string; value: string; help?: string; type?: string }) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} className="input" defaultValue={value} type={type} />
      {help && <span className="muted small">{help}</span>}
    </div>
  );
  return (
    <section className="section" style={{ borderBottom: 0 }}>
      <h1 className="display" style={{ fontSize: 36 }}>Event details</h1>
      <p className="muted small" style={{ margin: 0 }}>Blank venue, address or dress code show as “Coming soon” to guests.</p>
      <form action={saveEventAction} className="field" style={{ gap: 14 }}>
        <F name="name" label="Event name" value={cfg.name} />
        <div className="field">
          <label htmlFor="tagline">Tagline</label>
          <textarea id="tagline" name="tagline" className="input" rows={2} defaultValue={cfg.tagline} />
        </div>
        <div className="grid2">
          <F name="dateLabel" label="Date (as shown)" value={cfg.dateLabel} />
          <F name="timeLabel" label="Time (as shown)" value={cfg.timeLabel} />
        </div>
        <F name="startsAt" label="Start (for countdown)" value={cfg.startsAt} help="ISO format, Melbourne offset. 2026-12-05T19:00:00+11:00" />
        <F name="venue" label="Venue" value={cfg.venue} />
        <F name="address" label="Address" value={cfg.address} />
        <F name="mapUrl" label="Map link" value={cfg.mapUrl} help="Paste a Google Maps share link." />
        <F name="dressCode" label="Dress code" value={cfg.dressCode} />
        <F name="dropboxUrl" label="Dropbox link (camera photos)" value={cfg.dropboxUrl} />
        <hr style={{ border: 0, borderTop: "1px solid var(--line)" }} />
        <div className="grid2">
          <F name="partyCode" label="Party code" value={cfg.partyCode} help="What guests type to get in. Changing it logs nobody out." />
          <F name="adminPin" label="New admin PIN" value="" help="Leave blank to keep the current one. 4–8 digits." type="password" />
        </div>
        <button className="btn">Save</button>
      </form>
    </section>
  );
}
