import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import { blobToken } from "@/lib/blob-token";

export async function GET() {
  const store = kv();
  let ok = false;
  try {
    const n = await store.incr("health:ping");
    ok = n > 0;
  } catch {}
  return NextResponse.json({ redis: !store.isMemory, redisOk: ok, blob: !!(blobToken() || process.env.BLOB_STORE_ID), blobAuth: blobToken() ? "token" : process.env.BLOB_STORE_ID ? "oidc" : "none" });
}
