import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { kv } from "./kv";
import { getGuest } from "./data";
import type { Guest } from "./types";

const GUEST_COOKIE = "bs_guest";
const ADMIN_COOKIE = "bs_admin";
const ONE_YEAR = 60 * 60 * 24 * 365;

async function secret(): Promise<string> {
  // Stable per deployment without needing Redis: prefer an explicit secret,
  // then the Redis token Vercel injects (stable for the project), then a fixed fallback.
  return (
    process.env.SESSION_SECRET ||
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    "bronze-snake-xmas-2026-fallback-secret"
  );
}

async function sign(payload: string) {
  return createHmac("sha256", await secret()).update(payload).digest("base64url");
}

async function seal(obj: Record<string, unknown>) {
  const p = Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${p}.${await sign(p)}`;
}

async function open<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  const [p, sig] = token.split(".");
  if (!p || !sig) return null;
  const expected = await sign(p);
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  try {
    return JSON.parse(Buffer.from(p, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

// ---- PIN hashing ----
export function hashPin(pin: string) {
  const salt = randomBytes(8).toString("hex");
  return `${salt}:${scryptSync(pin, salt, 32).toString("hex")}`;
}
export function checkPin(pin: string, stored: string | null) {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  const got = scryptSync(pin, salt, 32);
  const want = Buffer.from(hash, "hex");
  return got.length === want.length && timingSafeEqual(got, want);
}

// ---- Guest session ----
export async function setGuestSession(guestId: string) {
  const c = await cookies();
  c.set(GUEST_COOKIE, await seal({ g: guestId, t: Date.now() }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR,
    path: "/",
  });
}
export async function clearGuestSession() {
  (await cookies()).delete(GUEST_COOKIE);
}
export async function currentGuest(): Promise<Guest | null> {
  const c = await cookies();
  const s = await open<{ g: string }>(c.get(GUEST_COOKIE)?.value);
  if (!s) return null;
  return getGuest(s.g);
}

// ---- Admin session ----
export async function getAdminPin(): Promise<string> {
  return (await kv().get<string>("auth:adminPin")) || process.env.ADMIN_PIN || "2026";
}
export async function setAdminPin(pin: string) {
  await kv().set("auth:adminPin", pin);
}
export async function setAdminSession() {
  const c = await cookies();
  c.set(ADMIN_COOKIE, await seal({ a: 1, t: Date.now() }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}
export async function clearAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}
export async function isAdmin(): Promise<boolean> {
  const c = await cookies();
  const s = await open<{ a: number }>(c.get(ADMIN_COOKIE)?.value);
  return !!s && s.a === 1;
}
export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("unauthorised");
}
