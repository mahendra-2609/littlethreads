import { clearCookie } from "../../_lib/auth";
import { json, type Env } from "../../_lib/http";

export const onRequestPost: PagesFunction<Env> = async () =>
  json({ ok: true }, 200, { "set-cookie": clearCookie() });
