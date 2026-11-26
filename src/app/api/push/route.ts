import { NextResponse } from "next/server";
import { currentGuest } from "@/lib/auth";
import { removePushSub, savePushSub } from "@/lib/data";
import { vapidKeys } from "@/lib/push";

export async function GET() {
  const k = await vapidKeys();
  return NextResponse.json({ publicKey: k.publicKey });
}

export async function POST(req: Request) {
  const g = await currentGuest();
  if (!g) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  const sub = await req.json().catch(() => null);
  if (!sub || !sub.endpoint) return NextResponse.json({ error: "bad subscription" }, { status: 400 });
  await savePushSub(g.id, sub);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const g = await currentGuest();
  if (!g) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  await removePushSub(g.id);
  return NextResponse.json({ ok: true });
}
