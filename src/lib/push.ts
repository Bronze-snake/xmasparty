import * as webpush from "web-push";
import { kv } from "./kv";
import { listPushSubs, removePushSub } from "./data";

type Keys = { publicKey: string; privateKey: string };

export async function vapidKeys(): Promise<Keys> {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
  }
  let k = await kv().get<Keys>("push:vapid");
  if (!k) {
    k = webpush.generateVAPIDKeys();
    await kv().set("push:vapid", k);
  }
  return k;
}

export async function broadcastPush(title: string, body: string, url = "/") {
  const keys = await vapidKeys();
  webpush.setVapidDetails("mailto:hello@bronzesnake.com", keys.publicKey, keys.privateKey);
  const subs = await listPushSubs();
  const payload = JSON.stringify({ title, body, url });
  let sent = 0;
  await Promise.all(
    Object.entries(subs).map(async ([guestId, sub]) => {
      try {
        await webpush.sendNotification(sub as webpush.PushSubscription, payload, { TTL: 3600 });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await removePushSub(guestId);
      }
    }),
  );
  return sent;
}
