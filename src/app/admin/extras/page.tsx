import { requireAdminPage } from "../guard";
import { getConfig, luckydipClaims, recoveryClaims } from "@/lib/data";
import { saveExtrasAction } from "../actions";

export default async function ExtrasAdmin() {
  await requireAdminPage();
  const [cfg, rc, lc] = await Promise.all([getConfig(), recoveryClaims(), luckydipClaims()]);
  const recoveryCount = Object.values(rc).reduce((a, b) => a + Number(b), 0);
  return (
    <section className="section" style={{ borderBottom: 0 }}>
      <h1 className="display" style={{ fontSize: 36 }}>Extras</h1>
      <p className="muted small" style={{ margin: 0 }}>Fill these in when confirmed, then switch each one on from the run sheet. Guests don&apos;t see anything until it&apos;s on.</p>
      <form action={saveExtrasAction} className="field" style={{ gap: 22 }}>
        <div className="card field">
          <b>Welcome drink</b>
          <input name="cName" className="input" placeholder="Cocktail name" defaultValue={cfg.cocktail.name} />
          <input name="cBlurb" className="input" placeholder="One cheeky line" defaultValue={cfg.cocktail.blurb} />
          <textarea name="cIngredients" className="input" rows={4} placeholder={"Ingredients, one per line"} defaultValue={cfg.cocktail.ingredients} />
          <input name="cImage" className="input" placeholder="Image URL (optional)" defaultValue={cfg.cocktail.imageUrl} />
        </div>
        <div className="card field">
          <b>Hidden prize</b>
          <input name="pTitle" className="input" placeholder="What is it?" defaultValue={cfg.prize.title} />
          <textarea name="pDesc" className="input" rows={2} placeholder="A line about it" defaultValue={cfg.prize.description} />
          <input name="pImage" className="input" placeholder="Image URL (optional)" defaultValue={cfg.prize.imageUrl} />
        </div>
        <div className="card field">
          <b>Recovery kits</b> <span className="muted small">{recoveryCount} claimed so far</span>
          <input name="rBlurb" className="input" placeholder="Blurb" defaultValue={cfg.recovery.blurb} />
          <textarea name="rItems" className="input" rows={3} placeholder={"What's in the bag, one per line"} defaultValue={cfg.recovery.items} />
          <label className="small">Limit per guest <input name="rLimit" type="number" min={1} className="input" style={{ width: 90, height: 40, marginLeft: 8 }} defaultValue={cfg.recovery.limitPerGuest} /></label>
        </div>
        <div className="card field">
          <b>Lucky dip</b> <span className="muted small">{Object.keys(lc).length} dipped so far</span>
          <input name="lBlurb" className="input" placeholder="Blurb" defaultValue={cfg.luckydip.blurb} />
          <textarea name="lPrizes" className="input" rows={4} placeholder={"Possible prizes, one per line (picked at random, repeats allowed)"} defaultValue={cfg.luckydip.prizes} />
        </div>
        <button className="btn">Save extras</button>
      </form>
      {Object.keys(lc).length > 0 && (
        <details>
          <summary className="small" style={{ cursor: "pointer", fontWeight: 600 }}>Who got what (lucky dip)</summary>
          <ul className="small">{Object.entries(lc).map(([g, p]) => <li key={g}>{g}: {String(p)}</li>)}</ul>
        </details>
      )}
    </section>
  );
}
