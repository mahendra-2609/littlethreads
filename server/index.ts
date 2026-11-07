import express from "express";
import { z } from "zod";
import nodemailer from "nodemailer";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT ?? 3001);
const isProd = process.env.NODE_ENV === "production";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));

// ---------- Contact form ----------
const ContactSchema = z.object({
  name: z.string().trim().min(1, "Please tell us your name.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(200),
  type: z.string().trim().max(80).default("Custom hoop"),
  message: z.string().trim().min(10, "Add a little more detail (at least 10 characters).").max(4000),
  // honeypot — real users never fill this in
  website: z.string().max(0).optional(),
});
export type ContactInput = z.infer<typeof ContactSchema>;

// Tiny in-memory rate limit: 5 submissions per IP per 10 minutes.
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

async function deliver(input: ContactInput, meta: { ip: string; at: string }) {
  if (transporter) {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: process.env.CONTACT_TO ?? process.env.SMTP_USER,
      replyTo: `${input.name} <${input.email}>`,
      subject: `New enquiry: ${input.type} — ${input.name}`,
      text: [
        `Name: ${input.name}`,
        `Email: ${input.email}`,
        `Interested in: ${input.type}`,
        "",
        input.message,
        "",
        `— sent ${meta.at} from ${meta.ip}`,
      ].join("\n"),
    });
    return "email";
  }
  // Fallback: append to a local JSONL file so nothing is lost before SMTP is configured.
  const dir = path.join(ROOT, "server", "data");
  await mkdir(dir, { recursive: true });
  await appendFile(path.join(dir, "inquiries.jsonl"), JSON.stringify({ ...meta, ...input }) + "\n", "utf8");
  return "file";
}

app.post("/api/contact", async (req, res) => {
  const ip = req.ip ?? "unknown";
  if (rateLimited(ip)) {
    return res.status(429).json({ ok: false, error: "Too many messages — please try again in a few minutes." });
  }
  const parsed = ContactSchema.safeParse(req.body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return res.status(400).json({ ok: false, fieldErrors });
  }
  if (parsed.data.website) return res.json({ ok: true }); // bot: pretend success

  try {
    const via = await deliver(parsed.data, { ip, at: new Date().toISOString() });
    console.log(`[contact] ${parsed.data.email} (${parsed.data.type}) delivered via ${via}`);
    res.json({ ok: true });
  } catch (err) {
    console.error("[contact] delivery failed", err);
    res.status(500).json({ ok: false, error: "We couldn't send your message just now. Please email us directly." });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true, smtp: smtpReady }));

// ---------- Static site (production) ----------
if (isProd) {
  const dist = path.join(ROOT, "dist");
  app.use(express.static(dist, { maxAge: "1y", index: false }));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT} (${isProd ? "production" : "development"}, mail: ${smtpReady ? "smtp" : "file fallback"})`);
});
