# LittleThreads — website + studio CRM

The site for the LittleThreads hand-embroidery studio, plus a small order CRM at `/admin`.
React + TypeScript on the front, Express + SQLite behind it.

Live domain: **littlethreads.store**

## Stack

| Part | What |
|------|------|
| UI | React 18, TypeScript, Vite 6, plain CSS (`src/styles.css`) |
| API + CRM | Express 4 (TypeScript via `tsx`), `node:sqlite`, `zod`, `nodemailer` |
| Embroidery | `src/stitch/` — a rAF engine that "sews" any SVG marked with `data-st` |

No CSS framework, no UI library, no ORM. The database is Node's built-in SQLite, so there is
nothing to compile and no database server to run.

## Run it

```bash
npm install
cp .env.example .env     # then set ADMIN_PASSWORD and SESSION_SECRET
npm run dev              # site on :5173, API on :3001 (proxied under /api)
```

Production:

```bash
npm run build            # type-check + bundle to dist/
npm start                # Express serves dist/ and the API on PORT (default 3001)
```

## The studio CRM — `/admin`

Every website enquiry becomes an order row. Sign in with `ADMIN_PASSWORD`.

- **Dashboard** — new enquiries, pieces in progress, open value, completed value
- **List** — filter by status, full-text search across name, email, message and notes
- **Detail** — move through `New → Quoted → Stitching → Shipped → Completed` (or `Archived`),
  set a price and due date, keep private notes, and see a dated history of every change
- **Deep links** — `/admin?order=<id>` opens one enquiry directly
- **Export** — `Export CSV` downloads everything

Sessions are a signed, 12-hour, HttpOnly cookie (no session store). Sign-in attempts are
throttled to 8 per IP per 15 minutes, and `/admin` stays disabled until `ADMIN_PASSWORD` is set
to at least 8 characters.

### Data

SQLite lives at `server/data/littlethreads.db` (gitignored). Back it up by copying that file.
Tables: `orders` and an append-only `events` log.

## Email notifications (optional)

Enquiries are **always** saved to the CRM. SMTP only adds an email alert on top, so the form
never depends on mail working. Fill the `SMTP_*` block in `.env`; for Gmail use an
[app password](https://myaccount.google.com/apppasswords), not the account password.

## Project layout

```
index.html                 Vite entry (meta tags, fonts, JSON-LD)
public/                    logo, robots.txt, sitemap.xml
shared/                    types + validation used by BOTH client and server
  contact.ts               contact-form schema
  orders.ts                order shape and status vocabulary
server/
  index.ts                 Express: contact API, admin API, static hosting
  db.ts                    SQLite schema and queries
  auth.ts                  signed-cookie admin sessions
  env.ts                   tiny .env loader (no dotenv dependency)
src/
  main.tsx                 two routes: the site, or /admin (lazy-loaded)
  styles.css               design tokens, textures, every section's styles
  stitch/                  the live-embroidery engine
    useStitch.ts           rAF timeline that drives needle, thread and reveal
    Needle.tsx             <StitchArt> wrapper + the needle/thread SVG
  components/              Hero, Collection, Process, Story, Faq, Contact, Motifs, …
  admin/                   the CRM (Admin.tsx, OrderDetail.tsx, api.ts, admin.css)
  hooks/                   useReveal, useReducedMotion
```

## Editing content

- **Prices & products**: `ITEMS` in `src/components/Collection.tsx`
- **Stats under the hero**: `ITEMS` in `src/components/Highlights.tsx`
- **"What's included" & process steps**: `INCLUDED` in `CustomOrders.tsx`, `STEPS` in `Process.tsx`
- **FAQ**: `FAQS` in `src/components/Faq.tsx`
- **Email / Instagram**: `src/components/Contact.tsx` and `Footer.tsx` (and `CONTACT_TO` in `.env`)
- **Story text**: `src/components/Story.tsx`
- **Colours**: the `:root` tokens at the top of `src/styles.css`

## How the embroidery animation works

Mark any element inside a `<StitchArt>` with `data-st` and it gets sewn when it scrolls into
view. Elements start hidden behind `clip-path: inset(0 100% 0 0)` in their own local box (so a
rotated leaf fills along its length) and are revealed one at a time while the needle moves.

| Attribute | Meaning |
|-----------|---------|
| `data-kind="stroke"` | needle follows the path (stems, vines); default is a satin zig-zag fill |
| `data-seq` | stitch order (defaults to DOM order) |
| `data-dur` | milliseconds (otherwise estimated from the element's size) |
| `data-thread` | thread colour while this element is sewn |
| `data-stitches` | zig-zags across a fill |

The hero starts on load; everything else waits until it is on screen. Add `?stitch_t=6000` to
the URL to start the hero's timeline 6s in. Visitors with *reduce motion* enabled skip straight
to the finished artwork.

## Deploying

Needs a Node host (Render, Railway, Fly, a VPS) because of SQLite and SMTP: `npm run build`
then `npm start`, with a persistent disk mounted at `server/data`. Point `littlethreads.store`
at it in Cloudflare DNS (proxied is fine) and set the `.env` values as environment variables
there — real environment variables always win over the `.env` file.
