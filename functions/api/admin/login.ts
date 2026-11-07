import { adminConfigured, checkPassword, sessionCookie, throttled } from "../../_lib/auth";
import { clientIp, fail, json, type Env } from "../../_lib/http";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (await throttled(env.DB, "login", clientIp(request), 8, 15 * 60_000)) {
    return fail("Too many attempts. Try again in a few minutes.", 429);
  }
  if (!adminConfigured(env) || !env.SESSION_SECRET) {
    return fail("Admin is not configured on this deployment.", 503);
  }

  let body: { password?: unknown };
  try {
    body = (await request.json()) as { password?: unknown };
  } catch {
    return fail("Invalid request.");
  }

  if (!checkPassword(env, body.password)) return fail("Incorrect password.", 401);
  return json({ ok: true }, 200, { "set-cookie": await sessionCookie(env, new URL(request.url)) });
};
