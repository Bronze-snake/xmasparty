"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addGuest,
  deleteAnnouncement,
  deleteChat,
  deleteGuest,
  getAwards,
  getClues,
  getConfig,
  getGuest,
  listGuests,
  postAnnouncement,
  saveAwards,
  saveClues,
  saveConfig,
  saveGuest,
} from "@/lib/data";
import { clearAdminSession, getAdminPin, isAdmin, setAdminPin, setAdminSession } from "@/lib/auth";
import { broadcastPush } from "@/lib/push";
import type { Award, Clue, EventConfig, Flags, Stage } from "@/lib/types";

async function guard() {
  if (!(await isAdmin())) redirect("/admin/login");
}
function s(fd: FormData, k: string) {
  return String(fd.get(k) ?? "").trim();
}

export async function adminLoginAction(_: unknown, fd: FormData) {
  const pin = s(fd, "pin");
  if (pin !== (await getAdminPin())) return { error: "Wrong PIN" };
  await setAdminSession();
  redirect("/admin");
}
export async function adminLogoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

// ---- Event settings ----
export async function saveEventAction(fd: FormData) {
  await guard();
  const patch: Partial<EventConfig> = {
    name: s(fd, "name"),
    tagline: s(fd, "tagline"),
    dateLabel: s(fd, "dateLabel"),
    timeLabel: s(fd, "timeLabel"),
    startsAt: s(fd, "startsAt"),
    venue: s(fd, "venue"),
    address: s(fd, "address"),
    mapUrl: s(fd, "mapUrl"),
    dressCode: s(fd, "dressCode"),
    partyCode: s(fd, "partyCode").toUpperCase() || "SNAKE26",
    dropboxUrl: s(fd, "dropboxUrl"),
  };
  await saveConfig(patch);
  const newPin = s(fd, "adminPin");
  if (/^\d{4,8}$/.test(newPin)) await setAdminPin(newPin);
  revalidatePath("/", "layout");
}

export async function setStageAction(fd: FormData) {
  await guard();
  const stage = s(fd, "stage") as Stage;
  if (!["before", "night", "after"].includes(stage)) return;
  await saveConfig({ stage });
  revalidatePath("/", "layout");
}

export async function toggleFlagAction(fd: FormData) {
  await guard();
  const key = s(fd, "key") as keyof Flags;
  const cfg = await getConfig();
  if (key === "ballot") {
    await saveConfig({ flags: { ...cfg.flags, ballot: cfg.flags.ballot === "all" ? "checkedin" : "all" } });
  } else if (key in cfg.flags) {
    await saveConfig({ flags: { ...cfg.flags, [key]: !cfg.flags[key] } });
  }
  revalidatePath("/", "layout");
}

export async function saveExtrasAction(fd: FormData) {
  await guard();
  const cfg = await getConfig();
  await saveConfig({
    cocktail: { name: s(fd, "cName"), ingredients: s(fd, "cIngredients"), imageUrl: s(fd, "cImage"), blurb: s(fd, "cBlurb") },
    recovery: { blurb: s(fd, "rBlurb") || cfg.recovery.blurb, items: s(fd, "rItems"), limitPerGuest: Math.max(1, Number(s(fd, "rLimit")) || 1) },
    luckydip: { blurb: s(fd, "lBlurb"), prizes: s(fd, "lPrizes") },
    prize: { ...cfg.prize, title: s(fd, "pTitle"), description: s(fd, "pDesc"), imageUrl: s(fd, "pImage") },
  });
  revalidatePath("/", "layout");
}

// ---- Guests ----
function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows = lines.map((l) => l.split(/[,\t;]/).map((c) => c.replace(/^"|"$/g, "").trim()));
  if (rows.length && /first/i.test(rows[0][0] || "")) rows.shift(); // header
  return rows
    .map((r) => {
      // Accept "First,Last,Team" or "Full Name,Team"
      if (r.length >= 3) return { first: r[0], last: r[1], team: r[2] };
      const [name = "", team = ""] = r;
      const parts = name.split(/\s+/);
      return { first: parts[0] || "", last: parts.slice(1).join(" "), team };
    })
    .filter((r) => r.first);
}

export async function uploadGuestsAction(fd: FormData) {
  await guard();
  const file = fd.get("file") as File | null;
  const pasted = s(fd, "pasted");
  const text = file && file.size > 0 ? await file.text() : pasted;
  const rows = parseCsv(text);
  const existing = await listGuests();
  const key = (f: string, l: string) => `${f} ${l}`.toLowerCase();
  const have = new Set(existing.map((g) => key(g.first, g.last)));
  let added = 0;
  for (const r of rows) {
    if (have.has(key(r.first, r.last))) continue;
    await addGuest(r.first, r.last, r.team, "upload");
    have.add(key(r.first, r.last));
    added++;
  }
  revalidatePath("/admin/guests");
  redirect(`/admin/guests?added=${added}&skipped=${rows.length - added}`);
}

export async function addGuestAction(fd: FormData) {
  await guard();
  const first = s(fd, "first"), last = s(fd, "last"), team = s(fd, "team");
  if (!first) return;
  const g = await addGuest(first, last, team, "admin");
  if (fd.get("checkin")) {
    g.checkedInAt = new Date().toISOString();
    g.checkedInBy = "admin";
    await saveGuest(g);
  }
  revalidatePath("/admin/guests");
}

export async function guestOpAction(fd: FormData) {
  await guard();
  const g = await getGuest(s(fd, "id"));
  if (!g) return;
  const op = s(fd, "op");
  if (op === "checkin") {
    g.checkedInAt = new Date().toISOString();
    g.checkedInBy = "admin";
  } else if (op === "undo-checkin") {
    g.checkedInAt = null;
    g.checkedInBy = null;
  } else if (op === "reset-pin") {
    g.pinHash = null;
  } else if (op === "delete") {
    await deleteGuest(g.id);
    revalidatePath("/admin/guests");
    return;
  }
  await saveGuest(g);
  revalidatePath("/admin/guests");
}

// ---- Chat moderation ----
export async function deleteChatAction(fd: FormData) {
  await guard();
  await deleteChat(s(fd, "id"));
  revalidatePath("/admin/chat");
}

// ---- Awards ----
export async function saveAwardsAction(fd: FormData) {
  await guard();
  const lines = s(fd, "awards").split("\n").map((l) => l.trim()).filter(Boolean);
  const cur = await getAwards();
  const awards: Award[] = lines.map((title) => {
    const same = cur.find((a) => a.title === title);
    return same || { id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || `a${Date.now()}`, title };
  });
  await saveAwards(awards);
  revalidatePath("/", "layout");
}

// ---- Clues & announcements ----
export async function saveCluesAction(fd: FormData) {
  await guard();
  const lines = s(fd, "clues").split("\n").map((l) => l.trim()).filter(Boolean);
  const cur = await getClues();
  const clues: Clue[] = lines.map((text, i) => {
    const same = cur.find((c) => c.text === text);
    return { id: same?.id || `c${i}${Date.now().toString(36)}`, text, releasedAt: same?.releasedAt || null, order: i };
  });
  await saveClues(clues);
  revalidatePath("/", "layout");
}

export async function releaseClueAction(fd: FormData) {
  await guard();
  const id = s(fd, "id");
  const clues = await getClues();
  const c = clues.find((x) => x.id === id);
  if (!c || c.releasedAt) return;
  c.releasedAt = new Date().toISOString();
  await saveClues(clues);
  const n = clues.filter((x) => x.releasedAt).length;
  const text = s(fd, "text") || `Still looking? Clue ${n} just dropped 👀`;
  await postAnnouncement(text, "clue");
  if (fd.get("push")) await broadcastPush("New clue 👀", text, "/prize");
  revalidatePath("/", "layout");
}

export async function postAnnouncementAction(fd: FormData) {
  await guard();
  const text = s(fd, "text");
  if (!text) return;
  await postAnnouncement(text, "general");
  if (fd.get("push")) await broadcastPush("Bronze Snake Xmas Party", text, "/announcements");
  revalidatePath("/", "layout");
}

export async function deleteAnnouncementAction(fd: FormData) {
  await guard();
  await deleteAnnouncement(s(fd, "id"));
  revalidatePath("/", "layout");
}

export async function closeHuntAction(fd: FormData) {
  await guard();
  const cfg = await getConfig();
  const foundBy = s(fd, "foundBy");
  const reopen = fd.get("reopen");
  await saveConfig({ prize: { ...cfg.prize, closed: !reopen, foundBy: reopen ? "" : foundBy, foundAt: reopen ? "" : new Date().toISOString() } });
  if (!reopen) {
    const text = `${foundBy || "Someone"} found the hidden prize. Hunt's over!`;
    await postAnnouncement(text, "general");
    if (fd.get("push")) await broadcastPush("Found!", text, "/prize");
  }
  revalidatePath("/", "layout");
}
