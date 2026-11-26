import { redirect } from "next/navigation";
import { currentGuest } from "@/lib/auth";
import { getConfig } from "@/lib/data";
import { Back, Footer, Topbar } from "@/components/chrome";
import { Gallery } from "@/components/gallery";

export const dynamic = "force-dynamic";

export default async function PhotosPage() {
  const g = await currentGuest();
  if (!g) redirect("/join?next=/photos");
  const cfg = await getConfig();
  const open = cfg.flags.photos;
  return (
    <main className="shell">
      <Topbar cfg={cfg} right={<Back />} />
      <section className="section" style={{ borderBottom: 0, paddingBottom: 12 }}>
        <h1 className="display">Party photos</h1>
        <p className="muted small" style={{ margin: 0 }}>
          {open ? "Grab a camera, take a few shots, pass it on. Phone pics go here too." : "The gallery opens on the night. Photos from the vintage cams land here after."}
        </p>
        {cfg.dropboxUrl && cfg.stage === "after" && (
          <a href={cfg.dropboxUrl} target="_blank" rel="noreferrer" className="small" style={{ fontWeight: 600 }}>Full camera roll on Dropbox →</a>
        )}
      </section>
      <Gallery canUpload={open} />
      <div style={{ height: 24 }} />
      <Footer cfg={cfg} />
    </main>
  );
}
