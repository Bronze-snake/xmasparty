import { NextResponse } from "next/server";
import { getConfig, getGuest, listGuests, saveGuest } from "@/lib/data";
import { checkPin, hashPin, setGuestSession } from "@/lib/auth";

// GET /api/join?code=XXX  -> guest names for the picker (no PINs)
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code") || "";
  const cfg = await getConfig();
  if (code.trim().toUpperCase() !== cfg.partyCode.toUpperCase()) {
    return NextResponse.json({ error: "Wrong party code" }, { status: 401 });
  }
  const guests = await listGuests();
  return NextResponse.json({
    guests: guests.map((g) => ({ id: g.id, first: g.first, last: g.last, team: g.team, hasPin: !!g.pinHash })),
  });
}

// POST /api/join { code, guestId, pin }  -> sets PIN on first use, verifies after
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { code?: string; guestId?: string; pin?: string };
  const cfg = await getConfig();
  if ((body.code || "").trim().toUpperCase() !== cfg.partyCode.toUpperCase()) {
    return NextResponse.json({ error: "Wrong party code" }, { status: 401 });
  }
  const pin = (body.pin || "").trim();
  if (!/^\d{4}$/.test(pin)) return NextResponse.json({ error: "PIN must be 4 digits" }, { status: 400 });
  const g = body.guestId ? await getGuest(body.guestId) : null;
  if (!g) return NextResponse.json({ error: "Pick your name first" }, { status: 400 });

  if (!g.pinHash) {
    g.pinHash = hashPin(pin);
    await saveGuest(g);
  } else if (!checkPin(pin, g.pinHash)) {
    return NextResponse.json({ error: "That PIN doesn't match. Forgotten it? Ask Anth or Dylan to reset it." }, { status: 401 });
  }
  await setGuestSession(g.id);
  return NextResponse.json({ ok: true, first: g.first });
}
