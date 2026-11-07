import { STATUSES, type Status } from "../../../../shared/orders";
import { guard } from "../../../_lib/auth";
import { deleteOrder, getOrder, stats, updateOrder, type OrderPatch } from "../../../_lib/db";
import { fail, ok, type Env } from "../../../_lib/http";

type Params = { id: string };

export const onRequestGet: PagesFunction<Env, "id"> = async ({ request, env, params }) => {
  const denied = await guard(request, env);
  if (denied) return denied;

  const found = await getOrder(env.DB, String((params as Params).id));
  if (!found) return fail("Order not found.", 404);
  return ok(found);
};

export const onRequestPatch: PagesFunction<Env, "id"> = async ({ request, env, params }) => {
  const denied = await guard(request, env);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail("Invalid request.");
  }

  const patch: OrderPatch = {};
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status as Status)) return fail("Unknown status.");
    patch.status = body.status as Status;
  }
  if (body.price !== undefined) {
    const n = body.price === null || body.price === "" ? null : Number(body.price);
    if (n !== null && (!Number.isFinite(n) || n < 0)) return fail("Invalid price.");
    patch.price = n;
  }
  if (body.due_date !== undefined) patch.due_date = body.due_date ? String(body.due_date).slice(0, 10) : null;
  if (body.notes !== undefined) patch.notes = body.notes ? String(body.notes).slice(0, 8000) : null;

  const order = await updateOrder(env.DB, String((params as Params).id), patch);
  if (!order) return fail("Order not found.", 404);
  return ok({ order, stats: await stats(env.DB) });
};

export const onRequestDelete: PagesFunction<Env, "id"> = async ({ request, env, params }) => {
  const denied = await guard(request, env);
  if (denied) return denied;

  if (!(await deleteOrder(env.DB, String((params as Params).id)))) return fail("Order not found.", 404);
  return ok({ stats: await stats(env.DB) });
};
