# LittleThreads — website

Landing page for the LittleThreads hand-embroidery studio. React + TypeScript on the front,
a small Express API behind it for the contact form.

## Stack

| Part | What |
|------|------|
| UI | React 18, TypeScript, Vite 6, plain CSS (`src/styles.css`) |
| API | Express 4 (TypeScript, run with `tsx`), `zod` validation, `nodemailer` |
| Hero | `src/components/StitchHoop.tsx` — a rAF timeline that "embroiders" an SVG hoop live |

No CSS framework and no UI library. The hero is "embroidered" (satin-stitched headline, live-stitched
hoop); everything below it is editorial — numbered sections, large serif type, hairline rules, a
horizontal-scroll collection — on cream, with a burgundy footer.

## Run it

```bash
npm install
npm run dev        # Vite on http://localhost:5173, API on :3001 (proxied under /api)
```

Production:

```bash
npm run build      # type-check + bundle to dist/
npm start          # Express serves dist/ and /api on PORT (default 3001)
```

## Contact form

`POST /api/contact` validates with zod (same rules as the client), rate-limits per IP
(5 per 10 min), and ignores bots via a honeypot field.

- With SMTP configured (copy `.env.example` → `.env`), enquiries are **emailed** to `CONTACT_TO`.
- Without it, they are **appended to `server/data/inquiries.jsonl`** so nothing is lost.

`GET /api/health` reports whether SMTP is configured.

## Project layout

```
index.html                 Vite entry (meta tags, fonts, JSON-LD)
public/logo.png            full-size logo (2.4 MB — only used for og:image)
public/logo-320.png        header/footer/favicon logo
server/index.ts            Express API + static hosting in production
src/
  main.tsx, App.tsx
  styles.css               design tokens, textures, every component's styles
  hooks/useReveal.ts       scroll-in fade for .reveal elements
  hooks/useReducedMotion.ts
  components/
    StitchHoop.tsx         live-stitched hero hoop (timeline + needle + thread)
    Hero.tsx               hero copy + the hoop
    SectionHead.tsx        "01 — Kicker" + big serif title used by every section
    Highlights / Collection / CustomOrders / Process / Story / Faq / Contact / Footer
    Header.tsx             sticky header + mobile menu
    SewProgress.tsx        needle that sews across the top as you scroll
    StitchDefs.tsx         shared SVG satin-stitch patterns & gradients
```

## Editing content

- **Prices & products**: `ITEMS` in `src/components/Collection.tsx`
- **Stats under the hero**: `ITEMS` in `src/components/Highlights.tsx`
- **"What's included" & process steps**: `INCLUDED` in `CustomOrders.tsx`, `STEPS` in `Process.tsx`
- **FAQ**: `FAQS` in `src/components/Faq.tsx`
- **Email / Instagram**: `src/components/Contact.tsx` and `Footer.tsx` (and `CONTACT_TO` in `.env`)
- **Story text**: `src/components/Story.tsx`
- **Colours**: the `:root` tokens at the top of `src/styles.css`

## Hero animation notes

The timeline (`TIMELINE` in `StitchHoop.tsx`) lists each element and how long it takes to stitch.
Elements are revealed with `clip-path: inset(...)` in their own local box, so rotated leaves fill
along their length. `stroke` steps move the needle along the path; `fill` steps zig-zag it across
the element like satin stitch. Add `?stitch_t=6000` to the URL to start the timeline 6s in — handy
for screenshots. Visitors with *reduce motion* enabled see the finished hoop immediately.

## Deploying

Any Node host works (Render, Railway, Fly, a VPS): build, then `npm start`. For static-only
hosting (Netlify/Vercel), deploy `dist/` and move `/api/contact` to a serverless function or a
form service.
