import type { Env } from "./http";

/**
 * Admin sessions: a signed, expiring, HttpOnly cookie. Stateless, so there is no
 * session store to keep in sync across Cloudflare's isolates. Uses Web Crypto,
 * which is what Workers provide (no Node `crypto`).
 */
const COOKIE = "lt_admin";
const MAX_AGE_S = 12 * 60 * 60; // 12 hours

const enc = new TextEncoder();

export const adminConfigured = (env: Env) => (env.ADMIN_PASSWORD ?? "").length >= 8;

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string comparison, so a wrong guess leaks no timing signal. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function checkPassword(env: Env, candidate: unknown): boolean {
  return adminConfigured(env) && typeof candidate === "string" && safeEqual(candidate, env.ADMIN_PASSWORD!);
}

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return undefined;
}

export async function sessionCookie(env: Env, url: URL): Promise<string> {
  const exp = String(Date.now() + MAX_AGE_S * 1000);
  const token = `${exp}.${await sign(exp, env.SESSION_SECRET!)}`;
  const secure = url.protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_S}${secure}`;
}

export const clearCookie = () => `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;

export async function isAuthed(request: Request, env: Env): Promise<boolean> {
  if (!env.SESSION_SECRET) return false;
  const token = readCookie(request, COOKIE);
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  if (!safeEqual(sig, await sign(exp, env.SESSION_SECRET))) return false;
  return Number(exp) > Date.now();
}

/**
 * Rate limiting lives in D1 rather than memory, because each Worker isolate has
 * its own memory and would otherwise forget attempts immediately.
 */
export async function throttled(db: D1Database, bucket: string, ip: string, limit: number, windowMs: number): Promise<boolean> {
  const cutoff = new Date(Date.now() - windowMs).toISOString();
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM rate WHERE bucket = ? AND ip = ? AND at > ?")
    .bind(bucket, ip, cutoff)
    .first<{ n: number }>();
  await db.prepare("INSERT INTO rate (bucket, ip, at) VALUES (?, ?, ?)").bind(bucket, ip, new Date().toISOString()).run();
  // Opportunistic cleanup so the table cannot grow without bound.
  if (Math.random() < 0.05) {
    await db.prepare("DELETE FROM rate WHERE at < ?").bind(new Date(Date.now() - 24 * 3600_000).toISOString()).run();
  }
  return (row?.n ?? 0) >= limit;
}

/** Guard for every /api/admin route except login/session. */
export async function guard(request: Request, env: Env): Promise<Response | null> {
  if (!adminConfigured(env) || !env.SESSION_SECRET) {
    return new Response(JSON.stringify({ ok: false, error: "Admin is not configured on this deployment." }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }
  if (!(await isAuthed(request, env))) {
    return new Response(JSON.stringify({ ok: false, error: "Please sign in again." }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return null;
}
