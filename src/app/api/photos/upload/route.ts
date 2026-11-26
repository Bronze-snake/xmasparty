import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { currentGuest, isAdmin } from "@/lib/auth";
import { addPhoto, getConfig } from "@/lib/data";
import { blobToken } from "@/lib/blob-token";

// Server-side upload: works with Vercel's default OIDC Blob auth (no static token needed).
export async function POST(req: Request) {
  const [g, admin] = await Promise.all([currentGuest(), isAdmin()]);
  const cfg = await getConfig();
  if (!admin && (!g || !cfg.flags.photos)) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const source = String(form?.get("source") || "guest");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: "Photo too large" }, { status: 413 });
  try {
    const name = `party/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const res = await put(name, file, { access: "public", contentType: file.type || "image/jpeg", token: blobToken() });
    const photo = await addPhoto({
      url: res.url,
      by: admin && !g ? "Vintage cams" : g ? `${g.first} ${g.last.slice(0, 1)}.` : "Organisers",
      guestId: g?.id || null,
      source: admin && source === "camera" ? "camera" : "guest",
    });
    return NextResponse.json({ photo });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
