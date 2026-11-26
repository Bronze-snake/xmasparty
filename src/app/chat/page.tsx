import { redirect } from "next/navigation";
import { currentGuest } from "@/lib/auth";
import { getConfig } from "@/lib/data";
import { Back, Topbar } from "@/components/chrome";
import { Chat } from "@/components/chat";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const g = await currentGuest();
  if (!g) redirect("/join?next=/chat");
  const cfg = await getConfig();
  return (
    <main className="shell" style={{ height: "100dvh" }}>
      <Topbar cfg={cfg} right={<Back />} />
      <div style={{ padding: "14px 20px 0" }}>
        <h1 className="display" style={{ fontSize: 32 }}>
          Party chat
        </h1>
        <p className="muted small" style={{ margin: "4px 0 0" }}>
          Be a legend, not a liability. Anth and Dylan can delete anything.
        </p>
      </div>
      <Chat open={cfg.flags.chat} />
    </main>
  );
}
