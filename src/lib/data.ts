import { kv } from "./kv";
import type { Announcement, Award, ChatMessage, Clue, EventConfig, Guest, Photo } from "./types";

const K = {
  config: "event:config",
  guests: "guests", // hash id -> Guest
  chat: "chat", // zset score=time member=json
  awards: "awards", // json array
  votes: (awardId: string) => `votes:${awardId}`, // hash guestId -> candidateId
  clues: "clues", // json array
  ann: "announcements", // zset
  photos: "photos", // zset
  recovery: "recovery:claimed", // hash guestId -> count
  luckydip: "luckydip:claimed", // hash guestId -> prize
  pushSubs: "push:subs", // hash guestId -> subscription json
  seq: "seq",
};

export const DEFAULT_AWARDS: Award[] = [
  { id: "best-dressed", title: "Best dressed" },
  { id: "life-of-party", title: "Life of the party" },
  { id: "bush", title: "Most likely to end up in a bush outside the venue" },
  { id: "every-photo", title: "Most likely to be in every photo" },
  { id: "dnm", title: "Most likely to start the deep and meaningfuls" },
  { id: "food", title: "Most likely to disappear and reappear with food" },
];

export const DEFAULT_CONFIG: EventConfig = {
  name: "Bronze Snake Xmas Party",
  tagline: "Dust off something good. Bring your camera face. Leave your manager problems at the door.",
  dateLabel: "Sat 5 Dec",
  timeLabel: "7–11pm",
  startsAt: "2026-12-05T19:00:00+11:00",
  venue: "",
  address: "",
  mapUrl: "",
  dressCode: "",
  partyCode: "SNAKE26",
  stage: "before",
  flags: {
    rsvp: true,
    chat: true,
    voting: false,
    photos: false,
    prize: false,
    cocktail: false,
    recovery: false,
    luckydip: false,
    winnersRevealed: false,
    ballot: "all",
  },
  cocktail: { name: "", ingredients: "", imageUrl: "", blurb: "" },
  recovery: { blurb: "Water, snacks and a little something for the morning after.", items: "", limitPerGuest: 1 },
  luckydip: { blurb: "", prizes: "" },
  prize: { title: "", description: "", imageUrl: "", foundBy: "", foundAt: "", closed: false },
  dropboxUrl: "",
};

export async function getConfig(): Promise<EventConfig> {
  const c = await kv().get<Partial<EventConfig>>(K.config);
  return { ...DEFAULT_CONFIG, ...(c || {}), flags: { ...DEFAULT_CONFIG.flags, ...((c && c.flags) || {}) } };
}

export async function saveConfig(patch: Partial<EventConfig>) {
  const cur = await getConfig();
  const next: EventConfig = { ...cur, ...patch, flags: { ...cur.flags, ...(patch.flags || {}) } };
  await kv().set(K.config, next);
  return next;
}

async function nextId(prefix: string) {
  const n = await kv().incr(K.seq);
  return `${prefix}${n.toString(36)}${Date.now().toString(36).slice(-4)}`;
}

// ---- Guests ----
export async function listGuests(): Promise<Guest[]> {
  const all = await kv().hgetall<Guest>(K.guests);
  return Object.values(all).sort((a, b) => (a.first + a.last).localeCompare(b.first + b.last));
}
export async function getGuest(id: string) {
  return kv().hget<Guest>(K.guests, id);
}
export async function saveGuest(g: Guest) {
  await kv().hset(K.guests, g.id, g);
}
export async function deleteGuest(id: string) {
  await kv().hdel(K.guests, id);
}
export async function addGuest(first: string, last: string, team: string, addedBy: Guest["addedBy"]) {
  const g: Guest = {
    id: await nextId("g"),
    first: first.trim(),
    last: last.trim(),
    team: team.trim(),
    pinHash: null,
    rsvp: null,
    rsvpAt: null,
    checkedInAt: null,
    checkedInBy: null,
    addedBy,
    createdAt: new Date().toISOString(),
  };
  await saveGuest(g);
  return g;
}

// ---- Chat ----
export async function listChat(limit = 200): Promise<ChatMessage[]> {
  const raw = await kv().zrange(K.chat, -limit, -1);
  return raw.map((s) => (typeof s === "string" ? JSON.parse(s) : s) as ChatMessage);
}
export async function postChat(guest: Guest, text: string) {
  const m: ChatMessage = {
    id: await nextId("m"),
    guestId: guest.id,
    name: `${guest.first} ${guest.last.slice(0, 1)}.`,
    text: text.trim().slice(0, 500),
    at: new Date().toISOString(),
  };
  await kv().zadd(K.chat, Date.parse(m.at), JSON.stringify(m));
  return m;
}
export async function deleteChat(id: string) {
  const all = await listChat(1000);
  const m = all.find((x) => x.id === id);
  if (m) await kv().zrem(K.chat, JSON.stringify(m));
}

// ---- Awards & votes ----
export async function getAwards(): Promise<Award[]> {
  return (await kv().get<Award[]>(K.awards)) || DEFAULT_AWARDS;
}
export async function saveAwards(a: Award[]) {
  await kv().set(K.awards, a);
}
export async function castVote(awardId: string, guestId: string, candidateId: string) {
  await kv().hset(K.votes(awardId), guestId, candidateId);
}
export async function getVotes(awardId: string) {
  return kv().hgetall<string>(K.votes(awardId));
}
export async function myVotes(guestId: string) {
  const awards = await getAwards();
  const out: Record<string, string | null> = {};
  for (const a of awards) out[a.id] = await kv().hget<string>(K.votes(a.id), guestId);
  return out;
}

// ---- Clues & announcements ----
export async function getClues(): Promise<Clue[]> {
  return (await kv().get<Clue[]>(K.clues)) || [];
}
export async function saveClues(c: Clue[]) {
  await kv().set(K.clues, c);
}
export async function listAnnouncements(limit = 50): Promise<Announcement[]> {
  const raw = await kv().zrange(K.ann, -limit, -1);
  return raw.map((s) => (typeof s === "string" ? JSON.parse(s) : s) as Announcement).reverse();
}
export async function postAnnouncement(text: string, kind: Announcement["kind"]) {
  const a: Announcement = { id: await nextId("a"), text: text.trim(), at: new Date().toISOString(), kind };
  await kv().zadd(K.ann, Date.parse(a.at), JSON.stringify(a));
  return a;
}
export async function deleteAnnouncement(id: string) {
  const all = await listAnnouncements(500);
  const a = all.find((x) => x.id === id);
  if (a) await kv().zrem(K.ann, JSON.stringify(a));
}

// ---- Photos ----
export async function listPhotos(limit = 500): Promise<Photo[]> {
  const raw = await kv().zrange(K.photos, -limit, -1);
  return raw.map((s) => (typeof s === "string" ? JSON.parse(s) : s) as Photo).reverse();
}
export async function addPhoto(p: Omit<Photo, "id" | "at">) {
  const photo: Photo = { ...p, id: await nextId("p"), at: new Date().toISOString() };
  await kv().zadd(K.photos, Date.parse(photo.at), JSON.stringify(photo));
  return photo;
}
export async function removePhoto(id: string) {
  const all = await listPhotos(5000);
  const p = all.find((x) => x.id === id);
  if (p) await kv().zrem(K.photos, JSON.stringify(p));
  return p || null;
}

// ---- Recovery kits & lucky dip ----
export async function recoveryClaims() {
  return kv().hgetall<number>(K.recovery);
}
export async function claimRecovery(guestId: string) {
  const cur = (await kv().hget<number>(K.recovery, guestId)) || 0;
  await kv().hset(K.recovery, guestId, cur + 1);
  return cur + 1;
}
export async function luckydipClaims() {
  return kv().hgetall<string>(K.luckydip);
}
export async function claimLuckydip(guestId: string, prize: string) {
  await kv().hset(K.luckydip, guestId, prize);
}

// ---- Push subscriptions ----
export async function savePushSub(guestId: string, sub: unknown) {
  await kv().hset(K.pushSubs, guestId, sub);
}
export async function listPushSubs() {
  return kv().hgetall<unknown>(K.pushSubs);
}
export async function removePushSub(guestId: string) {
  await kv().hdel(K.pushSubs, guestId);
}
