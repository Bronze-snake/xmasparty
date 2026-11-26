import { requireAdminPage } from "../guard";
import { getConfig } from "@/lib/data";
import { toggleFlagAction } from "../actions";
import { Gallery } from "@/components/gallery";

export default async function PhotosAdmin() {
  await requireAdminPage();
  const cfg = await getConfig();
  return (
    <>
      <section className="section">
        <h1 className="display" style={{ fontSize: 36 }}>Photos</h1>
        <form action={toggleFlagAction}>
          <input type="hidden" name="key" value="photos" />
          <button className={`btn ${cfg.flags.photos ? "ghost" : ""}`} style={{ width: "auto" }}>{cfg.flags.photos ? "Guest uploads ON · tap to close" : "Open guest uploads"}</button>
        </form>
        <p className="muted small" style={{ margin: 0 }}>Bulk-upload the SD card shots below (select many at once). Tap any photo to remove it. Dropbox link lives under Event.</p>
      </section>
      <Gallery canUpload source="camera" />
      <div style={{ height: 24 }} />
    </>
  );
}
