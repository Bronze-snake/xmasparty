import { redirect } from "next/navigation";
import { currentGuest } from "@/lib/auth";
import { getConfig } from "@/lib/data";
import { Back, Footer, Topbar } from "@/components/chrome";

export const dynamic = "force-dynamic";

export default async function DrinkPage() {
  const g = await currentGuest();
  if (!g) redirect("/join?next=/drink");
  const cfg = await getConfig();
  if (!cfg.flags.cocktail) redirect("/");
  const c = cfg.cocktail;
  return (
    <main className="shell">
      <Topbar cfg={cfg} right={<Back />} />
      <section className="section dark">
        <span className="eyebrow">Welcome drink</span>
        <h1 className="display">{c.name || "The signature"}</h1>
        {c.blurb && <p style={{ margin: 0, color: "#dad7d0" }}>{c.blurb}</p>}
      </section>
      {c.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.imageUrl} alt={c.name} style={{ width: "100%", display: "block" }} />
      )}
      <section className="section" style={{ borderBottom: 0 }}>
        <h2 className="display">What&apos;s in it</h2>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          {c.ingredients
            .split("\n")
            .filter((s) => s.trim())
            .map((s, i) => (
              <li key={i}>{s.trim()}</li>
            ))}
        </ul>
        <p className="muted small" style={{ margin: 0 }}>One each to start. After that, you&apos;re on your own.</p>
      </section>
      <Footer cfg={cfg} />
    </main>
  );
}
