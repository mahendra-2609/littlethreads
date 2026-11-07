import "./env";
import express from "express";
import nodemailer from "nodemailer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ContactSchema, fieldErrorsFrom, formatEnquiry, type ContactInput } from "../shared/contact";
import { STATUSES, type Status } from "../shared/orders";
import * as store from "./db";
import { adminConfigured, checkPassword, clearSession, isAuthed, issueSession, loginThrottled, requireAuth } from "./auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT ?? 3001);
const isProd = process.env.NODE_ENV === "production";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", true); // behind Cloudflare / a reverse proxy
app.use(express.json({ limit: "32kb" }));
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

/* ============================ Public contact form ============================ */

const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const smtpReady = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const transporter = smtpReady
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

/** Email is a best-effort notification; the CRM row is the source of truth. */
async function notify(input: ContactInput, meta: { ip: string; at: string }) {
  if (!transporter) return;
  const { subject, text } = formatEnquiry(input, meta);
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: process.env.CONTACT_TO ?? process.env.SMTP_USER,
    replyTo: `${input.name} <${input.email}>`,
    subject,
    text,
  });
}

app.post("/api/contact", async (req, res) => {
  const ip = req.ip ?? "unknown";
  if (rateLimited(ip)) {
    return res.status(429).json({ ok: false, error: "Too many messages — please try again in a few minutes." });
  }
  const parsed = ContactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, fieldErrors: fieldErrorsFrom(parsed.error) });
  if (parsed.data.website) return res.json({ ok: true }); // bot: pretend success

  try {
    const order = store.createOrder({ ...parsed.data, ip });
    console.log(`[contact] #${order.id.slice(0, 8)} ${order.email} (${order.type})`);
    notify(parsed.data, { ip, at: order.created_at }).catch((err) => console.error("[contact] email failed", err));
    res.json({ ok: true });
  } catch (err) {
    console.error("[contact] could not save enquiry", err);
    res.status(500).json({ ok: false, error: "We couldn't save your message just now. Please email us directly." });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true, smtp: smtpReady, admin: adminConfigured }));

/* ================================ Admin CRM ================================ */

app.post("/api/admin/login", (req, res) => {
  if (loginThrottled(req.ip ?? "unknown")) {
    return res.status(429).json({ ok: false, error: "Too many attempts. Try again in a few minutes." });
  }
  if (!adminConfigured) return res.status(503).json({ ok: false, error: "Admin is not configured on this server." });
  if (!checkPassword(req.body?.password)) return res.status(401).json({ ok: false, error: "Incorrect password." });
  issueSession(res);
  res.json({ ok: true });
});

app.post("/api/admin/logout", (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

app.get("/api/admin/session", (req, res) => res.json({ ok: true, authed: isAuthed(req), configured: adminConfigured }));

app.get("/api/admin/orders", requireAuth, (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const q = typeof req.query.q === "string" ? req.query.q : undefined;
  res.json({ ok: true, orders: store.listOrders({ status, q }), stats: store.stats() });
});

app.get("/api/admin/orders/:id", requireAuth, (req, res) => {
  const found = store.getOrder(req.params.id);
  if (!found) return res.status(404).json({ ok: false, error: "Order not found." });
  res.json({ ok: true, ...found });
});

app.patch("/api/admin/orders/:id", requireAuth, (req, res) => {
  const body = req.body ?? {};
  const patch: store.OrderPatch = {};

  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return res.status(400).json({ ok: false, error: "Unknown status." });
    patch.status = body.status as Status;
  }
  if (body.price !== undefined) {
    const n = body.price === null || body.price === "" ? null : Number(body.price);
    if (n !== null && (!Number.isFinite(n) || n < 0)) return res.status(400).json({ ok: false, error: "Invalid price." });
    patch.price = n;
  }
  if (body.due_date !== undefined) patch.due_date = body.due_date ? String(body.due_date).slice(0, 10) : null;
  if (body.notes !== undefined) patch.notes = body.notes ? String(body.notes).slice(0, 8000) : null;

  const updated = store.updateOrder(req.params.id, patch);
  if (!updated) return res.status(404).json({ ok: false, error: "Order not found." });
  res.json({ ok: true, order: updated, stats: store.stats() });
});

app.delete("/api/admin/orders/:id", requireAuth, (req, res) => {
  if (!store.deleteOrder(req.params.id)) return res.status(404).json({ ok: false, error: "Order not found." });
  res.json({ ok: true, stats: store.stats() });
});

app.get("/api/admin/export.csv", requireAuth, (_req, res) => {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="littlethreads-orders-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send("﻿" + store.exportCsv());
});

/* ========================= Static site (production) ========================= */

if (isProd) {
  const dist = path.join(ROOT, "dist");
  app.use(express.static(dist, { maxAge: "1y", index: false }));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, () => {
  console.log(`[api] http://localhost:${PORT} — ${isProd ? "production" : "development"}`);
  console.log(`[api] mail: ${smtpReady ? "smtp" : "off (enquiries still saved)"} · admin: ${adminConfigured ? "/admin ready" : "disabled, set ADMIN_PASSWORD"}`);
});
