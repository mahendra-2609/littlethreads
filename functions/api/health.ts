import { adminConfigured } from "../_lib/auth";
import { ok, type Env } from "../_lib/http";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  let db = false;
  try {
    await env.DB.prepare("SELECT 1").first();
    db = true;
  } catch {
    db = false;
  }
  return ok({ db, mail: Boolean(env.RESEND_API_KEY), admin: adminConfigured(env) });
};
