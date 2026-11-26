export type Stage = "before" | "night" | "after";

export type Flags = {
  rsvp: boolean;
  chat: boolean;
  voting: boolean;
  photos: boolean;
  prize: boolean;
  cocktail: boolean;
  recovery: boolean;
  luckydip: boolean;
  winnersRevealed: boolean;
  ballot: "all" | "checkedin";
};

export type EventConfig = {
  name: string;
  tagline: string;
  dateLabel: string; // "Sat 5 Dec"
  timeLabel: string; // "7–11pm"
  startsAt: string; // ISO, used for countdown
  venue: string;
  address: string;
  mapUrl: string;
  dressCode: string;
  partyCode: string; // guests type this once
  stage: Stage;
  flags: Flags;
  cocktail: { name: string; ingredients: string; imageUrl: string; blurb: string };
  recovery: { blurb: string; items: string; limitPerGuest: number };
  luckydip: { blurb: string; prizes: string };
  prize: { title: string; description: string; imageUrl: string; foundBy: string; foundAt: string; closed: boolean };
  dropboxUrl: string;
};

export type Guest = {
  id: string;
  first: string;
  last: string;
  team: string;
  pinHash: string | null; // null until they set one
  rsvp: "yes" | "no" | null;
  rsvpAt: string | null;
  checkedInAt: string | null;
  checkedInBy: "self" | "admin" | null;
  addedBy: "upload" | "admin";
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  guestId: string;
  name: string;
  text: string;
  at: string;
};

export type Award = { id: string; title: string };

export type Clue = { id: string; text: string; releasedAt: string | null; order: number };

export type Announcement = { id: string; text: string; at: string; kind: "clue" | "general" };

export type Photo = { id: string; url: string; by: string; guestId: string | null; at: string; source: "guest" | "camera" };
