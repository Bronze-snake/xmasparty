# Bronze Snake Xmas Party 2026

Staff party site for Sat 5 Dec, 7–11pm. Next.js on Vercel, Vercel Blob for photos, Upstash Redis (via Vercel Storage) for everything else.

## Links
- Guest entry: `/join?code=<PARTY CODE>` (default code `SNAKE26`, change it in Admin → Event)
- Admin: `/admin` (default PIN `2026`, change it in Admin → Event)

## Storage
Vercel injects the Blob and Redis credentials automatically once both stores are connected to the project. Without Redis the site runs on an in-memory store that resets on every deploy — the run sheet shows a red warning when that's the case.

Optional env vars: `SESSION_SECRET`, `ADMIN_PIN`, `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` (all auto-generated and stored in Redis if absent), `NEXT_PUBLIC_SITE_URL`.

## Run sheet (short version)
1. Before: upload `docs/sample-guests.csv`-style list in Admin → Guests, fill Event details, send the guest link.
2. Doors: Admin → Run sheet → Stage **On the night**. Open voting and photos when ready.
3. Mid-party: Admin → Prize & updates → Release clue (optionally with a phone notification).
4. Awards: announce winners out loud, then **Reveal winners on site**.
5. After: Stage **After**, paste the Dropbox link, bulk-upload SD card photos in Admin → Photos.
