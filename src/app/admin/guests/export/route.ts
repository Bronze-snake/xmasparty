import { isAdmin } from "@/lib/auth";
import { listGuests } from "@/lib/data";

export async function GET() {
  if (!(await isAdmin())) return new Response("unauthorised", { status: 401 });
  const guests = await listGuests();
  const esc = (v: string | null) => `"${(v || "").replace(/"/g, '""')}"`;
  const lines = [
    ["First", "Last", "Team", "RSVP", "RSVP at", "Checked in at", "Checked in by", "Added by"].join(","),
    ...guests.map((g) => [g.first, g.last, g.team, g.rsvp || "", g.rsvpAt || "", g.checkedInAt || "", g.checkedInBy || "", g.addedBy].map(esc).join(",")),
  ];
  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/csv", "content-disposition": `attachment; filename="xmas-party-guests.csv"` },
  });
}
