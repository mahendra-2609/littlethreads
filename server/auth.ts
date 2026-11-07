import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

/**
 * Stateless admin session: a signed, expiring cookie. No session store, no extra
 * dependency. The secret lives in .env; a random one is generated if it is missing
 * (which logs everyone out on restart, but never runs unsigned).
 */
const COOKIE = "lt_admin";
const MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

const SECRET = process.env.SESSION_SECRET || randomBytes(32).toString("hex");
if (!process.env.SESSION_SECRET) {
  console.warn("[auth] SESSION_SECRET not set — using a temporary one; sessions end when the server restarts.");
}
const PASSWORD = process.env.ADMIN_PASSWORD ?? "";
export const adminConfigured = PASSWORD.length >= 8;
if (!adminConfigured) {
  console.warn("[auth] ADMIN_PASSWORD missing or shorter than 8 characters — /admin is disabled.");
}

const sign = (value: string) => createHmac("sha256", SECRET).update(value).digest("hex");

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function checkPassword(candidate: unknown): boolean {
  return adminConfigured && typeof candidate === "string" && safeEqual(candidate, PASSWORD);
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return undefined;
}

export function issueSession(res: Response) {
  const exp = String(Date.now() + MAX_AGE_MS);
  const token = `${exp}.${sign(exp)}`;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_MS / 1000}${secure}`,
  );
}

export function clearSession(res: Response) {
  res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

export function isAuthed(req: Request): boolean {
  const token = readCookie(req, COOKIE);
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !safeEqual(sig, sign(exp))) return false;
  return Number(exp) > Date.now();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!adminConfigured) return res.status(503).json({ ok: false, error: "Admin is not configured on this server." });
  if (!isAuthed(req)) return res.status(401).json({ ok: false, error: "Please sign in again." });
  next();
}

/** Throttles sign-in attempts per IP: 8 tries per 15 minutes. */
const attempts = new Map<string, number[]>();
export function loginThrottled(ip: string): boolean {
  const cutoff = Date.now() - 15 * 60_000;
  const recent = (attempts.get(ip) ?? []).filter((t) => t > cutoff);
  recent.push(Date.now());
  attempts.set(ip, recent);
  return recent.length > 8;
}
