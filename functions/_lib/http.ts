/** Shared response helpers for the Pages Functions. */

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });

export const ok = (body: Record<string, unknown> = {}) => json({ ok: true, ...body });
export const fail = (error: string, status = 400, extra: Record<string, unknown> = {}) =>
  json({ ok: false, error, ...extra }, status);

export const clientIp = (request: Request) => request.headers.get("cf-connecting-ip") ?? "unknown";

export interface Env {
  DB: D1Database;
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
  RESEND_API_KEY?: string;
}
