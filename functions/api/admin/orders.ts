import { guard } from "../../_lib/auth";
import { listOrders, stats } from "../../_lib/db";
import { ok, type Env } from "../../_lib/http";

/** GET /api/admin/orders?status=&q= */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await guard(request, env);
  if (denied) return denied;

  const url = new URL(request.url);
  const [orders, counts] = await Promise.all([
    listOrders(env.DB, { status: url.searchParams.get("status") ?? undefined, q: url.searchParams.get("q") ?? undefined }),
    stats(env.DB),
  ]);
  return ok({ orders, stats: counts });
};
