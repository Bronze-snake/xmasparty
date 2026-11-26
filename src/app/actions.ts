"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { castVote, claimLuckydip, claimRecovery, getAwards, getConfig, getGuest, luckydipClaims, recoveryClaims, saveGuest } from "@/lib/data";
import { clearGuestSession, currentGuest } from "@/lib/auth";

async function me() {
  const g = await currentGuest();
  if (!g) redirect("/join");
  return g;
}

export async function rsvpAction(formData: FormData) {
  const g = await me();
  const v = formData.get("rsvp");
  if (v !== "yes" && v !== "no") return;
  g.rsvp = v;
  g.rsvpAt = new Date().toISOString();
  await saveGuest(g);
  revalidatePath("/");
}

export async function checkInAction() {
  const g = await me();
  const cfg = await getConfig();
  if (cfg.stage !== "night") return;
  if (!g.checkedInAt) {
    g.checkedInAt = new Date().toISOString();
    g.checkedInBy = "self";
    await saveGuest(g);
  }
  revalidatePath("/");
}

export async function voteAction(formData: FormData) {
  const g = await me();
  const cfg = await getConfig();
  if (!cfg.flags.voting || cfg.flags.winnersRevealed) return;
  const awardId = String(formData.get("awardId") || "");
  const candidateId = String(formData.get("candidateId") || "");
  const awards = await getAwards();
  if (!awards.some((a) => a.id === awardId)) return;
  const cand = await getGuest(candidateId);
  if (!cand) return;
  if (cfg.flags.ballot === "checkedin" && !cand.checkedInAt) return;
  await castVote(awardId, g.id, candidateId);
  revalidatePath("/awards");
}

export async function claimRecoveryAction() {
  const g = await me();
  const cfg = await getConfig();
  if (!cfg.flags.recovery) return;
  const claims = await recoveryClaims();
  if ((claims[g.id] || 0) >= cfg.recovery.limitPerGuest) return;
  await claimRecovery(g.id);
  revalidatePath("/recovery");
}

export async function claimLuckydipAction() {
  const g = await me();
  const cfg = await getConfig();
  if (!cfg.flags.luckydip) return;
  const claims = await luckydipClaims();
  if (claims[g.id]) return;
  const pool = cfg.luckydip.prizes
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (pool.length === 0) return;
  const prize = pool[Math.floor(Math.random() * pool.length)];
  await claimLuckydip(g.id, prize);
  revalidatePath("/luckydip");
}

export async function signOutAction() {
  await clearGuestSession();
  redirect("/join");
}
