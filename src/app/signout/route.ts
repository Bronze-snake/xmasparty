import { redirect } from "next/navigation";
import { clearGuestSession } from "@/lib/auth";

export async function GET() {
  await clearGuestSession();
  redirect("/join");
}
