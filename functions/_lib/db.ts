import { STATUSES, type Order, type OrderEvent, type Stats, type Status } from "../../shared/orders";

/** All D1 access lives here. Every call is async — D1 has no synchronous API. */

const COLS = "id, created_at, updated_at, name, email, type, message, status, price, due_date, notes";
const nowIso = () => new Date().toISOString();

export type NewOrder = { name: string; email: string; type: string; message: string; ip: string };

export async function createOrder(db: D1Database, input: NewOrder): Promise<Order> {
  const id = crypto.randomUUID();
  const at = nowIso();
  await db.batch([
    db
      .prepare(
        `INSERT INTO orders (id, created_at, updated_at, name, email, type, message, status, ip)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)`,
      )
      .bind(id, at, at, input.name, input.email, input.type, input.message, input.ip),
    db
      .prepare("INSERT INTO events (order_id, at, kind, detail) VALUES (?, ?, 'created', ?)")
      .bind(id, at, `Enquiry received via the website (${input.type}).`),
  ]);
  return (await db.prepare(`SELECT ${COLS} FROM orders WHERE id = ?`).bind(id).first<Order>())!;
}

export async function listOrders(db: D1Database, opts: { status?: string; q?: string } = {}): Promise<Order[]> {
  const where: string[] = [];
  const args: string[] = [];

  if (opts.status && STATUSES.includes(opts.status as Status)) {
    where.push("status = ?");
    args.push(opts.status);
  } else if (opts.status === "open") {
    where.push("status IN ('new','quoted','in_progress')");
  } else if (!opts.status || opts.status === "active") {
    where.push("status != 'archived'");
  }

  const q = opts.q?.trim();
  if (q) {
    where.push("(name LIKE ? OR email LIKE ? OR message LIKE ? OR type LIKE ? OR IFNULL(notes,'') LIKE ?)");
    const like = `%${q}%`;
    args.push(like, like, like, like, like);
  }

  const sql = `SELECT ${COLS} FROM orders${where.length ? ` WHERE ${where.join(" AND ")}` : ""}
               ORDER BY datetime(created_at) DESC LIMIT 500`;
  const { results } = await db.prepare(sql).bind(...args).all<Order>();
  return results ?? [];
}

export async function getOrder(db: D1Database, id: string): Promise<{ order: Order; events: OrderEvent[] } | null> {
  const order = await db.prepare(`SELECT ${COLS} FROM orders WHERE id = ?`).bind(id).first<Order>();
  if (!order) return null;
  const { results } = await db
    .prepare("SELECT id, order_id, at, kind, detail FROM events WHERE order_id = ? ORDER BY id ASC")
    .bind(id)
    .all<OrderEvent>();
  return { order, events: results ?? [] };
}

export type OrderPatch = { status?: Status; price?: number | null; due_date?: string | null; notes?: string | null };

export async function updateOrder(db: D1Database, id: string, patch: OrderPatch): Promise<Order | null> {
  const prev = await db.prepare(`SELECT ${COLS} FROM orders WHERE id = ?`).bind(id).first<Order>();
  if (!prev) return null;

  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  const events: D1PreparedStatement[] = [];
  const at = nowIso();
  const logged = (kind: string, detail: string) =>
    db.prepare("INSERT INTO events (order_id, at, kind, detail) VALUES (?, ?, ?, ?)").bind(id, at, kind, detail);

  if (patch.status && patch.status !== prev.status) {
    sets.push("status = ?");
    args.push(patch.status);
    events.push(logged("status", `${prev.status} → ${patch.status}`));
  }
  if (patch.notes !== undefined && patch.notes !== prev.notes) {
    sets.push("notes = ?");
    args.push(patch.notes);
    events.push(logged("note", "Notes updated."));
  }
  const edits: string[] = [];
  if (patch.price !== undefined && patch.price !== prev.price) {
    sets.push("price = ?");
    args.push(patch.price);
    edits.push(`price → ${patch.price ?? "—"}`);
  }
  if (patch.due_date !== undefined && patch.due_date !== prev.due_date) {
    sets.push("due_date = ?");
    args.push(patch.due_date);
    edits.push(`due → ${patch.due_date ?? "—"}`);
  }
  if (edits.length) events.push(logged("edit", edits.join(", ")));
  if (!sets.length) return prev;

  sets.push("updated_at = ?");
  args.push(at, id);
  await db.batch([db.prepare(`UPDATE orders SET ${sets.join(", ")} WHERE id = ?`).bind(...args), ...events]);
  return await db.prepare(`SELECT ${COLS} FROM orders WHERE id = ?`).bind(id).first<Order>();
}

export async function deleteOrder(db: D1Database, id: string): Promise<boolean> {
  const [, orders] = await db.batch([
    db.prepare("DELETE FROM events WHERE order_id = ?").bind(id),
    db.prepare("DELETE FROM orders WHERE id = ?").bind(id),
  ]);
  return (orders.meta?.changes ?? 0) > 0;
}

export async function stats(db: D1Database): Promise<Stats> {
  const [byStatus, open, done] = await db.batch<Record<string, number | string>>([
    db.prepare("SELECT status, COUNT(*) AS n FROM orders GROUP BY status"),
    db.prepare("SELECT IFNULL(SUM(price), 0) AS v FROM orders WHERE status IN ('quoted','in_progress','shipped')"),
    db.prepare("SELECT IFNULL(SUM(price), 0) AS v FROM orders WHERE status = 'completed'"),
  ]);

  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  for (const row of (byStatus.results ?? []) as unknown as { status: Status; n: number }[]) counts[row.status] = row.n;

  return {
    counts,
    total: Object.values(counts).reduce((a, b) => a + b, 0),
    open: counts.new + counts.quoted + counts.in_progress,
    valueOpen: Number((open.results?.[0] as { v: number } | undefined)?.v ?? 0),
    valueCompleted: Number((done.results?.[0] as { v: number } | undefined)?.v ?? 0),
  };
}

export async function exportCsv(db: D1Database): Promise<string> {
  const { results } = await db
    .prepare(`SELECT created_at, name, email, type, status, price, due_date, message, notes
              FROM orders ORDER BY datetime(created_at) DESC`)
    .all<Record<string, string | number | null>>();
  const head = ["Received", "Name", "Email", "Interested in", "Status", "Price", "Due", "Message", "Notes"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [head.map(esc).join(","), ...(results ?? []).map((r) => Object.values(r).map(esc).join(","))].join("\r\n");
}
