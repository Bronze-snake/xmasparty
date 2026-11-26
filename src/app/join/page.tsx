import { Suspense } from "react";
import { getConfig } from "@/lib/data";
import { Footer, Topbar } from "@/components/chrome";
import { JoinFlow } from "./join-flow";

export const dynamic = "force-dynamic";

export default async function JoinPage() {
  const cfg = await getConfig();
  return (
    <main className="shell">
      <Topbar cfg={cfg} />
      <Suspense>
        <JoinFlow eventName={cfg.name} />
      </Suspense>
      <Footer cfg={cfg} />
    </main>
  );
}
