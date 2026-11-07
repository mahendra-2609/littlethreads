# LittleThreads — website + studio CRM

The site for the LittleThreads hand-embroidery studio, plus an order CRM at `/admin`.
Runs entirely on Cloudflare: Pages for the site, Pages Functions for the API, D1 for the database.

Live: **https://littlethreads.store**

## Stack

| Part | What |
|------|------|
| UI | React 18, TypeScript, Vite 6, plain CSS (`src/styles.css`) |
| API + CRM | Cloudflare Pages Functions (`functions/`), `zod` validation |
| Database | Cloudflare D1 (SQLite at the edge) |
| CI/CD | GitHub Actions → type-check, build, migrate, deploy |
| Embroidery | `src/stitch/` — a rAF engine that "sews" any SVG marked with `data-st` |

No server to run, no CSS framework, no UI library, no ORM.

## Run it locally

```bash
npm install
npm run db:local          # create the local D1 and apply schema.sql
npm run dev               # site on :5173, Functions + local D1 on :8788
```

`npm run dev` starts Vite and `wrangler pages dev` together. Vite proxies `/api` to Wrangler, so
you develop against the **real** Functions and a real (local) D1 — not a stand-in.

Secrets for local dev go in `.dev.vars` (gitignored):

```ini
ADMIN_PASSWORD=something-at-least-8-chars
SESSION_SECRET=<64 hex chars>
CONTACT_TO=tejaswiande029@gmail.com
```

Generate a session secret with:
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

To check a production build before pushing: `npm run preview`.

## First-time Cloudflare setup

```bash
npx wrangler login
npm run db:create         # paste the returned database_id into wrangler.toml
npm run db:remote         # apply schema.sql to the real D1
```

Then in the Cloudflare dashboard, under **Workers & Pages → littlethreads → Settings**:

1. **Variables and Secrets** — add `ADMIN_PASSWORD` and `SESSION_SECRET` (and `RESEND_API_KEY`,
   `CONTACT_TO`, `CONTACT_FROM` if you want the email alert).
2. **Bindings** — confirm the D1 binding `DB` → `littlethreads`.
3. **Custom domains** — add `littlethreads.store`. Cloudflare writes the DNS records itself
   because the zone is already on your account.

## CI/CD

`.github/workflows/ci.yml`:

- **Every push and PR** — `npm ci`, type-check both the site and the Functions, then build.
  A type error fails the run, so broken code never reaches production.
- **Push to `main`** — re-runs the checks, applies `schema.sql` to D1 (idempotent, every
  statement is `IF NOT EXISTS`), then `wrangler pages deploy`.

Add two repository secrets under **Settings → Secrets and variables → Actions**:

| Secret | Where to get it |
|--------|-----------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → *Edit Cloudflare Workers* template |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard sidebar, or `npx wrangler whoami` |

Deploys do **not** use Cloudflare's own Git integration; connecting it would deploy on every
push without type-checking first.

## The studio CRM — `/admin`

Every website enquiry becomes an order row. Sign in with `ADMIN_PASSWORD`.

- **Dashboard** — new enquiries, pieces in progress, open value, completed value
- **List** — filter by status, full-text search across name, email, message and notes
- **Detail** — move through `New → Quoted → Stitching → Shipped → Completed` (or `Archived`),
  set a price and due date, keep private notes, read a dated history of every change
- **Deep links** — `/admin?order=<id>` opens one enquiry
- **Export** — `Export CSV` downloads everything

Sessions are a signed 12-hour HttpOnly cookie (no session store, so nothing to replicate across
Cloudflare's isolates). Sign-ins are throttled to 8 per IP per 15 minutes and the contact form to
5 per IP per 10 minutes — both counted in D1, since Workers share no memory. `/admin` stays
disabled until `ADMIN_PASSWORD` is set to 8+ characters, and is marked `noindex`.

The CRM is a lazy-loaded route, so visitors to the website never download it.

## Email notifications (optional)

Enquiries are **always** saved to D1; email is only an alert on top, so the form cannot break if
mail does. Set `RESEND_API_KEY` ([resend.com](https://resend.com)) to turn it on. Workers cannot
reliably speak SMTP, so this uses an HTTP email API rather than an SMTP host.

## Project layout

```
index.html                 Vite entry (meta tags, fonts, JSON-LD)
schema.sql                 D1 schema — idempotent, applied by CI
wrangler.toml              Pages config + the D1 binding
public/                    logo, robots.txt, sitemap.xml, _headers, _redirects
shared/                    types + validation used by BOTH the client and the Functions
  contact.ts               contact-form schema
  orders.ts                order shape and status vocabulary
functions/                 the API — file-based routing
  _lib/{db,auth,http}.ts   D1 queries, signed-cookie sessions, response helpers
  api/contact.ts           POST /api/contact
  api/health.ts            GET  /api/health
  api/admin/*              login, logout, session, orders, orders/[id], export
src/
  main.tsx                 two routes: the site, or /admin (lazy-loaded)
  styles.css               design tokens, textures, every section's styles
  stitch/                  the live-embroidery engine
  components/              Hero, Collection, Process, Story, Faq, Contact, Motifs, …
  admin/                   the CRM (Admin.tsx, OrderDetail.tsx, api.ts, admin.css)
  hooks/                   useReveal, useReducedMotion
.github/workflows/ci.yml   type-check → build → migrate → deploy
```

## Editing content

- **Prices & products**: `ITEMS` in `src/components/Collection.tsx`
- **Stats under the hero**: `ITEMS` in `src/components/Highlights.tsx`
- **"What's included" & process steps**: `INCLUDED` in `CustomOrders.tsx`, `STEPS` in `Process.tsx`
- **FAQ**: `FAQS` in `src/components/Faq.tsx`
- **Email / Instagram**: `src/components/Contact.tsx` and `Footer.tsx` (and `CONTACT_TO`)
- **Story text**: `src/components/Story.tsx`
- **Colours**: the `:root` tokens at the top of `src/styles.css`

## How the embroidery animation works

Mark any element inside a `<StitchArt>` with `data-st` and it is sewn when it scrolls into view.
Elements start hidden behind `clip-path: inset(0 100% 0 0)` in their own local box (so a rotated
leaf fills along its length) and are revealed one at a time while the needle moves.

| Attribute | Meaning |
|-----------|---------|
| `data-kind="stroke"` | needle follows the path (stems, vines); default is a satin zig-zag fill |
| `data-seq` | stitch order (defaults to DOM order) |
| `data-dur` | milliseconds (otherwise estimated from the element's size) |
| `data-thread` | thread colour while this element is sewn |
| `data-stitches` | zig-zags across a fill |

The hero starts on load; everything else waits until it is on screen. Add `?stitch_t=6000` to the
URL to start the hero's timeline 6s in. Visitors with *reduce motion* enabled skip straight to the
finished artwork.
