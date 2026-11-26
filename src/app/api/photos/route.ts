import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { currentGuest, isAdmin } from "@/lib/auth";
import { addPhoto, getConfig, listPhotos, removePhoto } from "@/lib/data";

export async function GET() {
  const [g, admin] = await Promise.all([currentGuest(), isAdmin()]);
  if (!g && !admin) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const photos = await listPhotos(1000);
  return NextResponse.json({ photos, me: g?.id || null, admin });
}

export async function POST(req: Request) {
  const [g, admin] = await Promise.all([currentGuest(), isAdmin()]);
  const cfg = await getConfig();
  if (!admin && (!g || !cfg.flags.photos)) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const { url, source } = (await req.json().catch(() => ({}))) as { url?: string; source?: "guest" | "camera" };
  if (!url || !/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(url)) {
    return NextResponse.json({ error: "bad url" }, { status: 400 });
  }
  const p = await addPhoto({
    url,
    by: admin && !g ? "Vintage cams" : g ? `${g.first} ${g.last.slice(0, 1)}.` : "Organisers",
    guestId: g?.id || null,
    source: admin && source === "camera" ? "camera" : "guest",
  });
  return NextResponse.json({ photo: p });
}

export async function DELETE(req: Request) {
  const [g, admin] = await Promise.all([currentGuest(), isAdmin()]);
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "id" }, { status: 400 });
  const all = await listPhotos(5000);
  const p = all.find((x) => x.id === id);
  if (!p) return NextResponse.json({ ok: true });
  if (!admin && (!g || p.guestId !== g.id)) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  await removePhoto(id);
  try {
    await del(p.url);
  } catch {}
  return NextResponse.json({ ok: true });
}
