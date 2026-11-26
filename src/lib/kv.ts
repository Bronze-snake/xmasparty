import { Redis } from "@upstash/redis";

/**
 * Thin key-value layer. Uses Upstash Redis when Vercel has injected the
 * credentials (either UPSTASH_REDIS_REST_* or KV_REST_API_*), otherwise an
 * in-memory map so the site still builds and runs before Redis is connected.
 * The in-memory store is per-process and resets on every deploy.
 */

type Json = unknown;

export interface KV {
  get<T = Json>(key: string): Promise<T | null>;
  set(key: string, value: Json): Promise<void>;
  del(key: string): Promise<void>;
  hgetall<T = Json>(key: string): Promise<Record<string, T>>;
  hget<T = Json>(key: string, field: string): Promise<T | null>;
  hset(key: string, field: string, value: Json): Promise<void>;
  hdel(key: string, field: string): Promise<void>;
  zadd(key: string, score: number, member: string): Promise<void>;
  zrange(key: string, start: number, stop: number): Promise<string[]>;
  zrem(key: string, member: string): Promise<void>;
  sadd(key: string, member: string): Promise<void>;
  srem(key: string, member: string): Promise<void>;
  smembers(key: string): Promise<string[]>;
  sismember(key: string, member: string): Promise<boolean>;
  incr(key: string): Promise<number>;
  isMemory: boolean;
}

function upstashEnv() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

function makeUpstash(cfg: { url: string; token: string }): KV {
  const r = new Redis({ url: cfg.url, token: cfg.token });
  return {
    isMemory: false,
    async get(key) {
      return (await r.get(key)) as never;
    },
    async set(key, value) {
      await r.set(key, value as never);
    },
    async del(key) {
      await r.del(key);
    },
    async hgetall(key) {
      return ((await r.hgetall(key)) || {}) as never;
    },
    async hget(key, field) {
      return (await r.hget(key, field)) as never;
    },
    async hset(key, field, value) {
      await r.hset(key, { [field]: value as never });
    },
    async hdel(key, field) {
      await r.hdel(key, field);
    },
    async zadd(key, score, member) {
      await r.zadd(key, { score, member });
    },
    async zrange(key, start, stop) {
      return (await r.zrange(key, start, stop)) as string[];
    },
    async zrem(key, member) {
      await r.zrem(key, member);
    },
    async sadd(key, member) {
      await r.sadd(key, member);
    },
    async srem(key, member) {
      await r.srem(key, member);
    },
    async smembers(key) {
      return (await r.smembers(key)) as string[];
    },
    async sismember(key, member) {
      return (await r.sismember(key, member)) === 1;
    },
    async incr(key) {
      return r.incr(key);
    },
  };
}

type MemState = {
  kv: Map<string, Json>;
  h: Map<string, Map<string, Json>>;
  z: Map<string, Map<string, number>>;
  s: Map<string, Set<string>>;
};

function makeMemory(): KV {
  const g = globalThis as unknown as { __partyMem?: MemState };
  const st: MemState = g.__partyMem || { kv: new Map(), h: new Map(), z: new Map(), s: new Map() };
  g.__partyMem = st;
  const hm = (k: string) => st.h.get(k) || (st.h.set(k, new Map()), st.h.get(k)!);
  const zm = (k: string) => st.z.get(k) || (st.z.set(k, new Map()), st.z.get(k)!);
  const sm = (k: string) => st.s.get(k) || (st.s.set(k, new Set()), st.s.get(k)!);
  return {
    isMemory: true,
    async get(key) {
      return (st.kv.has(key) ? st.kv.get(key) : null) as never;
    },
    async set(key, value) {
      st.kv.set(key, value);
    },
    async del(key) {
      st.kv.delete(key);
      st.h.delete(key);
      st.z.delete(key);
      st.s.delete(key);
    },
    async hgetall(key) {
      return Object.fromEntries(hm(key)) as never;
    },
    async hget(key, field) {
      return (hm(key).has(field) ? hm(key).get(field) : null) as never;
    },
    async hset(key, field, value) {
      hm(key).set(field, value);
    },
    async hdel(key, field) {
      hm(key).delete(field);
    },
    async zadd(key, score, member) {
      zm(key).set(member, score);
    },
    async zrange(key, start, stop) {
      const arr = [...zm(key).entries()].sort((a, b) => a[1] - b[1]).map((e) => e[0]);
      const end = stop < 0 ? arr.length + stop + 1 : stop + 1;
      return arr.slice(start, end);
    },
    async zrem(key, member) {
      zm(key).delete(member);
    },
    async sadd(key, member) {
      sm(key).add(member);
    },
    async srem(key, member) {
      sm(key).delete(member);
    },
    async smembers(key) {
      return [...sm(key)];
    },
    async sismember(key, member) {
      return sm(key).has(member);
    },
    async incr(key) {
      const n = (Number(st.kv.get(key)) || 0) + 1;
      st.kv.set(key, n);
      return n;
    },
  };
}

let _kv: KV | null = null;
export function kv(): KV {
  if (_kv) return _kv;
  const cfg = upstashEnv();
  _kv = cfg ? makeUpstash(cfg) : makeMemory();
  return _kv;
}
