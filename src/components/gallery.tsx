"use client";

import { useEffect, useRef, useState } from "react";
import type { Photo } from "@/lib/types";

async function shrink(file: File, max = 1600, quality = 0.8): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/heic") return file;
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  if (scale === 1 && file.size < 1.2 * 1024 * 1024) return file;
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob((b) => res(b || file), "image/jpeg", quality));
}

export function Gallery({ canUpload, source = "guest" }: { canUpload: boolean; source?: "guest" | "camera" }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [open, setOpen] = useState<Photo | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function load() {
    const r = await fetch("/api/photos", { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    setPhotos(d.photos);
    setMe(d.me);
    setAdmin(d.admin);
  }
  useEffect(() => {
    void load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    let n = 0;
    for (const f of arr) {
      n++;
      setProgress(`Uploading ${n} of ${arr.length}…`);
      try {
        const blob = await shrink(f);
        const fd = new FormData();
        fd.set("file", blob, "photo.jpg");
        fd.set("source", source);
        const r = await fetch("/api/photos/upload", { method: "POST", body: fd });
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
      } catch (e) {
        setProgress(`Couldn't upload ${f.name}: ${(e as Error).message}`);
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    setProgress("");
    if (input.current) input.current.value = "";
    await load();
  }

  async function remove(p: Photo) {
    if (!confirm("Remove this photo?")) return;
    await fetch("/api/photos", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: p.id }) });
    setOpen(null);
    await load();
  }

  return (
    <>
      {canUpload && (
        <div className="field" style={{ padding: "0 20px 16px" }}>
          <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          <button className="btn" onClick={() => input.current?.click()} disabled={!!progress}>
            {progress || (source === "camera" ? "Upload from SD card" : "Add photos")}
          </button>
          <p className="muted small" style={{ margin: 0, textAlign: "center" }}>Photos are shrunk on your phone before upload, so it&apos;s quick on venue wifi.</p>
        </div>
      )}
      {photos.length === 0 && <p className="notice" style={{ margin: "0 20px" }}>No photos yet. Be the first to ruin someone&apos;s night.</p>}
      <div className="photo-grid">
        {photos.map((p) => (
          <div key={p.id} onClick={() => setOpen(p)} role="button" tabIndex={0} style={{ cursor: "pointer" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" loading="lazy" />
          </div>
        ))}
      </div>
      {open && (
        <div onClick={() => setOpen(null)} style={{ position: "fixed", inset: 0, background: "rgba(14,14,14,.96)", zIndex: 10, display: "flex", flexDirection: "column", color: "var(--paper)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px" }}>
            <span className="small">{open.by} · {new Date(open.at).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", timeZone: "Australia/Melbourne" })}</span>
            <button className="btn ghost sm" style={{ color: "var(--paper)", borderColor: "var(--paper)" }} onClick={() => setOpen(null)}>Close</button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={open.url} alt="" style={{ flex: 1, minHeight: 0, objectFit: "contain", width: "100%" }} onClick={(e) => e.stopPropagation()} />
          <div className="row" style={{ padding: 16 }} onClick={(e) => e.stopPropagation()}>
            <a className="btn paper" href={open.url} download target="_blank" rel="noreferrer">Save</a>
            {(admin || open.guestId === me) && <button className="btn danger" onClick={() => remove(open)}>Remove</button>}
          </div>
        </div>
      )}
    </>
  );
}
