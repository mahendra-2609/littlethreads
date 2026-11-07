import { guard } from "../../_lib/auth";
import { exportCsv } from "../../_lib/db";
import type { Env } from "../../_lib/http";

/** GET /api/admin/export — every order as CSV (BOM included so Excel reads UTF-8). */
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await guard(request, env);
  if (denied) return denied;

  const csv = await exportCsv(env.DB);
  return new Response("﻿" + csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="littlethreads-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
};
