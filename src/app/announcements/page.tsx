import { redirect } from "next/navigation";
import { currentGuest } from "@/lib/auth";
import { getConfig, listAnnouncements } from "@/lib/data";
import { Back, Footer, Topbar } from "@/components/chrome";
import { time } from "@/lib/format";
import { AutoRefresh } from "@/components/auto-refresh";
import { PushOptIn } from "@/components/push-opt-in";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const g = await currentGuest();
  if (!g) redirect("/join?next=/announcements");
  const cfg = await getConfig();
  const list = await listAnnouncements(50);
  return (
    <main className="shell">
      <AutoRefresh seconds={15} />
      <Topbar cfg={cfg} right={<Back />} />
      <section className="section" style={{ borderBottom: 0 }}>
        <h1 className="display">Updates</h1>
        <PushOptIn />
        {list.length === 0 && <p className="notice">Nothing yet. Updates and clues land here the moment Anth or Dylan post them.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map((a) => (
            <div key={a.id} className="card" style={{ borderColor: a.kind === "clue" ? "var(--ink)" : "var(--line)" }}>
              <span className="eyebrow">
                {a.kind === "clue" ? "Clue" : "Update"} · {time(a.at)}
              </span>
              <p style={{ margin: "6px 0 0", fontSize: 16, lineHeight: 1.4 }}>{a.text}</p>
            </div>
          ))}
        </div>
      </section>
      <Footer cfg={cfg} />
    </main>
  );
}
