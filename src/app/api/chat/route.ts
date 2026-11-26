import { NextResponse } from "next/server";
import { currentGuest, isAdmin } from "@/lib/auth";
import { deleteChat, getConfig, listChat, postChat } from "@/lib/data";

export async function GET() {
  const [g, admin] = await Promise.all([currentGuest(), isAdmin()]);
  if (!g && !admin) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const msgs = await listChat(200);
  return NextResponse.json({ messages: msgs, me: g?.id || null, admin });
}

export async function POST(req: Request) {
  const g = await currentGuest();
  if (!g) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const cfg = await getConfig();
  if (!cfg.flags.chat) return NextResponse.json({ error: "Chat is closed" }, { status: 403 });
  const { text } = (await req.json().catch(() => ({}))) as { text?: string };
  if (!text || !text.trim()) return NextResponse.json({ error: "Say something" }, { status: 400 });
  const m = await postChat(g, text);
  return NextResponse.json({ message: m });
}

export async function DELETE(req: Request) {
  const [g, admin] = await Promise.all([currentGuest(), isAdmin()]);
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "id" }, { status: 400 });
  if (!admin) {
    // guests may delete their own
    const msgs = await listChat(1000);
    const m = msgs.find((x) => x.id === id);
    if (!g || !m || m.guestId !== g.id) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }
  await deleteChat(id);
  return NextResponse.json({ ok: true });
}
