import { requireAdminPage } from "../guard";
import { getConfig, listChat } from "@/lib/data";
import { deleteChatAction, toggleFlagAction } from "../actions";
import { time } from "@/lib/format";
import { AutoRefresh } from "@/components/auto-refresh";

export default async function ChatAdmin() {
  await requireAdminPage();
  const [cfg, msgs] = await Promise.all([getConfig(), listChat(300)]);
  return (
    <>
      <AutoRefresh seconds={8} />
      <section className="section">
        <h1 className="display" style={{ fontSize: 36 }}>Chat · {msgs.length}</h1>
        <form action={toggleFlagAction}>
          <input type="hidden" name="key" value="chat" />
          <button className={`btn ${cfg.flags.chat ? "danger ghost" : ""}`} style={{ width: "auto" }}>{cfg.flags.chat ? "Close chat (read-only)" : "Open chat"}</button>
        </form>
      </section>
      <section className="section" style={{ borderBottom: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...msgs].reverse().map((m) => (
            <div key={m.id} className="msg" style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <span>
                <span className="who">{m.name} · {time(m.at)}</span>
                <div className="txt">{m.text}</div>
              </span>
              <form action={deleteChatAction}><input type="hidden" name="id" value={m.id} /><button className="btn danger ghost sm">Delete</button></form>
            </div>
          ))}
          {msgs.length === 0 && <p className="muted">Nothing yet.</p>}
        </div>
      </section>
    </>
  );
}
