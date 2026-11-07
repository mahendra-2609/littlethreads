import { adminConfigured, isAuthed } from "../../_lib/auth";
import { ok, type Env } from "../../_lib/http";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) =>
  ok({ authed: await isAuthed(request, env), configured: adminConfigured(env) });
