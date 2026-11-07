import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { STATUSES, type Order, type OrderEvent, type Stats, type Status } from "../shared/orders";

const DATA_DIR = path.resolve(process.cwd(), "server", "data");
mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, "littlethreads.db"));
db.exec("PRAGMA journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id          TEXT PRIMARY KEY,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    type        TEXT NOT NULL,
    message     TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'new',
    price       REAL,
    due_date    TEXT,
    notes       TEXT,
    ip          TEXT
  );
  CREATE INDEX IF NOT EXISTS orders_status  ON orders(status);
  CREATE INDEX IF NOT EXISTS orders_created ON orders(created_at DESC);

  CREATE TABLE IF NOT EXISTS events (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    at       TEXT NOT NULL,
    kind     TEXT NOT NULL,
    detail   TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS events_order ON events(order_id, id);
`);

const now = () => new Date().toISOString();

function logEvent(orderId: string, kind: OrderEvent["kind"], detail = "") {
  db.prepare("INSERT INTO events (order_id, at, kind, detail) VALUES (?, ?, ?, ?)").run(orderId, now(), kind, detail);
}

export type NewOrder = { name: string; email: string; type: string; message: string; ip: string };

export function createOrder(input: NewOrder): Order {
  const id = randomUUID();
  const at = now();
  db.prepare(
    `INSERT INTO orders (id, created_at, updated_at, name, email, type, message, status, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)`,
  ).run(id, at, at, input.name, input.email, input.type, input.message, input.ip);
  logEvent(id, "created", `Enquiry received via the website (${input.type}).`);
  return getOrder(id)!.order;
}

export function listOrders(opts: { status?: string; q?: string } = {}): Order[] {
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (opts.status && STATUSES.includes(opts.status as Status)) {
    where.push("status = ?");
    args.push(opts.status);
  } else if (opts.status === "open") {
    where.push("status IN ('new','quoted','in_progress')");
  } else if (!opts.status || opts.status === "active") {
    where.push("status != 'archived'");
  }
  if (opts.q?.trim()) {
    where.push("(name LIKE ? OR email LIKE ? OR message LIKE ? OR type LIKE ? OR IFNULL(notes,'') LIKE ?)");
    const like = `%${opts.q.trim()}%`;
    args.push(like, like, like, like, like);
  }
  const sql = `SELECT id, created_at, updated_at, name, email, type, message, status, price, due_date, notes
               FROM orders ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
               ORDER BY datetime(created_at) DESC LIMIT 500`;
  return db.prepare(sql).all(...args) as unknown as Order[];
}

export function getOrder(id: string): { order: Order; events: OrderEvent[] } | null {
  const order = db
    .prepare(`SELECT id, created_at, updated_at, name, email, type, message, status, price, due_date, notes
              FROM orders WHERE id = ?`)
    .get(id) as unknown as Order | undefined;
  if (!order) return null;
  const events = db
    .prepare("SELECT id, order_id, at, kind, detail FROM events WHERE order_id = ? ORDER BY id ASC")
    .all(id) as unknown as OrderEvent[];
  return { order, events };
}

export type OrderPatch = { status?: Status; price?: number | null; due_date?: string | null; notes?: string | null };

export function updateOrder(id: string, patch: OrderPatch): Order | null {
  const existing = getOrder(id);
  if (!existing) return null;
  const prev = existing.order;

  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  if (patch.status && patch.status !== prev.status) {
    sets.push("status = ?");
    args.push(patch.status);
  }
  if (patch.price !== undefined && patch.price !== prev.price) {
    sets.push("price = ?");
    args.push(patch.price);
  }
  if (patch.due_date !== undefined && patch.due_date !== prev.due_date) {
    sets.push("due_date = ?");
    args.push(patch.due_date);
  }
  if (patch.notes !== undefined && patch.notes !== prev.notes) {
    sets.push("notes = ?");
    args.push(patch.notes);
  }
  if (!sets.length) return prev;

  sets.push("updated_at = ?");
  args.push(now(), id);
  db.prepare(`UPDATE orders SET ${sets.join(", ")} WHERE id = ?`).run(...args);

  if (patch.status && patch.status !== prev.status) logEvent(id, "status", `${prev.status} → ${patch.status}`);
  if (patch.notes !== undefined && patch.notes !== prev.notes) logEvent(id, "note", "Notes updated.");
  const detailBits: string[] = [];
  if (patch.price !== undefined && patch.price !== prev.price) detailBits.push(`price → ${patch.price ?? "—"}`);
  if (patch.due_date !== undefined && patch.due_date !== prev.due_date) detailBits.push(`due → ${patch.due_date ?? "—"}`);
  if (detailBits.length) logEvent(id, "edit", detailBits.join(", "));

  return getOrder(id)!.order;
}

export function deleteOrder(id: string): boolean {
  db.prepare("DELETE FROM events WHERE order_id = ?").run(id);
  return db.prepare("DELETE FROM orders WHERE id = ?").run(id).changes > 0;
}

export function stats(): Stats {
  const rows = db.prepare("SELECT status, COUNT(*) AS n FROM orders GROUP BY status").all() as unknown as
    { status: Status; n: number }[];
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  for (const r of rows) counts[r.status] = r.n;

  const valueOpen = (db
    .prepare("SELECT IFNULL(SUM(price), 0) AS v FROM orders WHERE status IN ('quoted','in_progress','shipped')")
    .get() as unknown as { v: number }).v;
  const valueCompleted = (db
    .prepare("SELECT IFNULL(SUM(price), 0) AS v FROM orders WHERE status = 'completed'")
    .get() as unknown as { v: number }).v;

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { counts, total, open: counts.new + counts.quoted + counts.in_progress, valueOpen, valueCompleted };
}

export function exportCsv(): string {
  const rows = db
    .prepare(`SELECT created_at, name, email, type, status, price, due_date, message, notes
              FROM orders ORDER BY datetime(created_at) DESC`)
    .all() as unknown as Record<string, string | number | null>[];
  const head = ["Received", "Name", "Email", "Interested in", "Status", "Price", "Due", "Message", "Notes"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [head.map(esc).join(","), ...rows.map((r) => Object.values(r).map(esc).join(","))].join("\r\n");
}

export default db;
