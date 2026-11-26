import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";

export async function GET() {
  const store = kv();
  let ok = false;
  try {
    const n = await store.incr("health:ping");
    ok = n > 0;
  } catch {}
  return NextResponse.json({ redis: !store.isMemory, redisOk: ok, blob: !!process.env.BLOB_READ_WRITE_TOKEN });
}
