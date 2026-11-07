import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

/**
 * A hoop that gets embroidered live. A needle stitches the stem, satin-fills each
 * leaf and petal, then stitches the lettering, with thread trailing behind it.
 *
 * How it works: every design element starts hidden with `clip-path: inset(0 100% 0 0)`
 * (in its own local box, so rotated leaves reveal along their length). A rAF timeline
 * reveals one element at a time while the needle either follows the path
 * (`stroke` steps) or zig-zags across the element's bounding box (`fill` steps).
 */

type Step =
  | { kind: "stroke"; id: string; dur: number }
  | { kind: "fill"; id: string; dur: number; stitches?: number };

const SPEED = 0.9; // < 1 = faster
const TIMELINE: Step[] = [
  { kind: "stroke", id: "stem", dur: 1500 },
  { kind: "fill", id: "leaf-l1", dur: 650 },
  { kind: "fill", id: "leaf-l2", dur: 650 },
  { kind: "fill", id: "leaf-r1", dur: 460 },
  { kind: "fill", id: "leaf-r2", dur: 460 },
  { kind: "fill", id: "leaf-r3", dur: 460 },
  { kind: "fill", id: "leaf-r4", dur: 460 },
  { kind: "fill", id: "leaf-r5", dur: 460 },
  { kind: "fill", id: "petal-1", dur: 420 },
  { kind: "fill", id: "petal-2", dur: 420 },
  { kind: "fill", id: "petal-3", dur: 420 },
  { kind: "fill", id: "petal-4", dur: 420 },
  { kind: "fill", id: "petal-5", dur: 420 },
  { kind: "fill", id: "flower-center", dur: 280, stitches: 5 },
  { kind: "fill", id: "bud", dur: 480 },
  { kind: "fill", id: "calyx", dur: 220, stitches: 4 },
  { kind: "fill", id: "sp-1", dur: 260 },
  { kind: "fill", id: "sp-2", dur: 260 },
  { kind: "fill", id: "sp-3", dur: 260 },
  { kind: "fill", id: "sp-4", dur: 260 },
  { kind: "fill", id: "sp-5", dur: 260 },
  { kind: "fill", id: "small-center", dur: 180, stitches: 3 },
  { kind: "fill", id: "lettering", dur: 2800, stitches: 90 },
];

const LEAF = "M0 0 C 16 -24, 48 -26, 70 -2 C 48 20, 16 24, 0 0 Z";
const PETALS = [[0, -29], [27.6, -9], [17, 23.5], [-17, 23.5], [-27.6, -9]] as const;
const SMALL = [[0, -14], [13.3, -4.3], [8.2, 11.3], [-8.2, 11.3], [-13.3, -4.3]] as const;

const HIDDEN = "inset(0 100% 0 0)";
const NEEDLE_ANGLE = -48;
const EYE_OFFSET = 40;

export function StitchHoop() {
  const reduced = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const needleRef = useRef<SVGGElement>(null);
  const threadRef = useRef<SVGPathElement>(null);
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(reduced);

  useEffect(() => {
    const svg = svgRef.current;
    const needle = needleRef.current;
    const thread = threadRef.current;
    if (!svg || !needle || !thread) return;

    const els = TIMELINE.map((s) => svg.querySelector<SVGGraphicsElement>(`[data-st="${s.id}"]`)!);

    if (reduced) {
      els.forEach((el) => (el.style.clipPath = "none"));
      needle.style.opacity = "0";
      thread.style.opacity = "0";
      setDone(true);
      return;
    }

    let raf = 0;
    let cancelled = false;
    setDone(false);
    els.forEach((el) => (el.style.clipPath = HIDDEN));
    needle.style.opacity = "0";
    thread.style.opacity = "0";

    // Map a point in an element's local space into the root SVG's viewBox space.
    const toRoot = (el: SVGGraphicsElement, x: number, y: number) => {
      const m = el.getScreenCTM();
      const r = svg.getScreenCTM()?.inverse();
      if (!m || !r) return { x, y };
      return new DOMPoint(x, y).matrixTransform(m).matrixTransform(r);
    };

    const start = async () => {
      // The lettering is measured with getBBox, so make sure the font is in before we begin.
      try {
        await Promise.race([
          document.fonts.load('700 60px "Cormorant Garamond"'),
          new Promise((res) => setTimeout(res, 1800)),
        ]);
      } catch { /* fall back to system serif */ }
      if (cancelled) return;

      const steps = TIMELINE.map((s, i) => {
        const el = els[i];
        const bbox = el.getBBox();
        const len = s.kind === "stroke" ? (el as SVGPathElement).getTotalLength() : 0;
        const stitches = s.kind === "fill" ? (s.stitches ?? Math.max(4, Math.round(bbox.width / 3.2))) : 0;
        return { ...s, el, bbox, len, stitches, dur: s.dur * SPEED, color: el.dataset.thread ?? "#c46c78" };
      });
      const offsets: number[] = [];
      let total = 0;
      for (const s of steps) { offsets.push(total); total += s.dur; }
      const settle = 500;

      const history: { x: number; y: number }[] = [];
      let lastSample = 0;
      // Debug aid: /?stitch_t=5000 starts the timeline 5s in (handy for screenshots).
      const seek = Number(new URLSearchParams(window.location.search).get("stitch_t")) || 0;
      let t0 = performance.now() - seek;
      let lastIdx = -1;

      const frame = (now: number) => {
        const t = now - t0;
        let idx = steps.findIndex((s, i) => t < offsets[i] + s.dur);
        const finished = idx === -1;
        if (finished) idx = steps.length - 1;

        // Reveal: everything before idx is complete, idx is partial, rest hidden.
        for (let i = 0; i < steps.length; i++) {
          const s = steps[i];
          if (i < idx || finished) { if (s.el.style.clipPath !== "none") s.el.style.clipPath = "none"; }
          else if (i > idx) { if (s.el.style.clipPath !== HIDDEN) s.el.style.clipPath = HIDDEN; }
        }

        const s = steps[idx];
        const p = finished ? 1 : Math.min(1, (t - offsets[idx]) / s.dur);
        let lx: number, ly: number;

        if (s.kind === "stroke") {
          const pt = (s.el as SVGPathElement).getPointAtLength(p * s.len);
          lx = pt.x; ly = pt.y;
          const right = 1 - Math.min(1, Math.max(0, (pt.x - s.bbox.x) / s.bbox.width));
          if (!finished) s.el.style.clipPath = `inset(-6px ${(right * 100).toFixed(2)}% -6px -6px)`;
        } else {
          // Satin stitch: sweep across the element, zig-zagging between its edges.
          lx = s.bbox.x + p * s.bbox.width;
          const zig = Math.sin(p * s.stitches * Math.PI);
          ly = s.bbox.y + s.bbox.height * (0.5 + 0.42 * zig);
          if (!finished) s.el.style.clipPath = `inset(-6px ${((1 - p) * 100).toFixed(2)}% -6px -6px)`;
        }

        const pt = toRoot(s.el, lx, ly);
        const bob = 2 + 4 * Math.abs(Math.sin(t / 85)); // the needle dipping in and out
        needle.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${NEEDLE_ANGLE}) translate(${bob.toFixed(1)} 0)`);
        if (!finished && needle.style.opacity !== "1") { needle.style.opacity = "1"; thread.style.opacity = "0.95"; }

        // Thread trails from the needle's eye through where it has just been.
        const rad = (NEEDLE_ANGLE * Math.PI) / 180;
        const eye = { x: pt.x + (EYE_OFFSET + bob) * Math.cos(rad), y: pt.y + (EYE_OFFSET + bob) * Math.sin(rad) };
        if (now - lastSample > 40) { history.unshift(eye); if (history.length > 14) history.pop(); lastSample = now; }
        if (idx !== lastIdx) { thread.setAttribute("stroke", s.color); lastIdx = idx; }
        if (history.length > 1) {
          let d = `M${eye.x.toFixed(1)} ${eye.y.toFixed(1)}`;
          for (let i = 0; i < history.length - 1; i++) {
            const a = history[i], b = history[i + 1];
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 + 3; // a little sag
            d += ` Q${a.x.toFixed(1)} ${a.y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
          }
          thread.setAttribute("d", d);
        }

        if (finished && t > total + settle) {
          needle.style.opacity = "0";
          thread.style.opacity = "0";
          setDone(true);
          return;
        }
        raf = requestAnimationFrame(frame);
      };
      t0 = performance.now() - seek;
      raf = requestAnimationFrame(frame);
    };

    start();
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [run, reduced]);

  return (
    <div className={`stitch-hoop${done ? " is-done" : ""}`}>
      <svg
        ref={svgRef}
        viewBox="0 0 600 600"
        role="img"
        aria-label="An embroidery hoop being stitched: olive leaves, pink flowers and the name LittleThreads on cream linen"
      >
        {/* Hoop */}
        <g className="hoop-frame">
          <circle cx="300" cy="322" r="236" fill="none" stroke="url(#wood)" strokeWidth="17" />
          <circle cx="300" cy="322" r="236" fill="none" stroke="#b78a5c" strokeWidth="1" opacity=".5" />
          <circle cx="300" cy="322" r="228" fill="url(#linen-weave)" />
          <circle cx="300" cy="322" r="228" fill="url(#hoop-shade)" />
          <circle cx="300" cy="322" r="222" fill="none" stroke="#caa073" strokeWidth="5" opacity=".85" />
          <g className="clamp">
            <rect x="238" y="62" width="130" height="11" rx="5.5" fill="url(#brass)" stroke="#8a6427" strokeWidth=".8" />
            <rect x="354" y="56" width="24" height="23" rx="4" fill="url(#brass)" stroke="#8a6427" strokeWidth=".8" />
            <rect x="281" y="66" width="38" height="36" rx="6" fill="url(#brass)" stroke="#8a6427" strokeWidth=".8" />
            <rect x="291" y="74" width="18" height="20" rx="3" fill="#fbf3e8" opacity=".9" />
          </g>
        </g>

        {/* Design — each element is revealed by the engine */}
        <g className="design">
          <text data-st="lettering" data-thread="#8a2944" x="300" y="272" textAnchor="middle" className="hoop-lettering">LittleThreads</text>

          <path data-st="stem" data-thread="#6b6a3a" className="hoop-stem" d="M190 404 C 250 390, 330 392, 420 350" />

          <path data-st="leaf-l1" data-thread="#6b6a3a" className="leaf-olive" d={LEAF} transform="translate(188 404) rotate(-150)" />
          <path data-st="leaf-l2" data-thread="#6b6a3a" className="leaf-olive" d={LEAF} transform="translate(196 410) rotate(160)" />

          <path data-st="leaf-r1" data-thread="#c46c78" className="leaf-rose" d={LEAF} transform="translate(330 390) rotate(-110) scale(.75)" />
          <path data-st="leaf-r2" data-thread="#c46c78" className="leaf-rose" d={LEAF} transform="translate(352 386) rotate(60) scale(.7)" />
          <path data-st="leaf-r3" data-thread="#c46c78" className="leaf-rose" d={LEAF} transform="translate(372 377) rotate(-100) scale(.75)" />
          <path data-st="leaf-r4" data-thread="#c46c78" className="leaf-rose" d={LEAF} transform="translate(398 364) rotate(50) scale(.65)" />
          <path data-st="leaf-r5" data-thread="#c46c78" className="leaf-rose" d={LEAF} transform="translate(416 352) rotate(-60) scale(.7)" />

          <g transform="translate(238 386)">
            {PETALS.map(([x, y], i) => (
              <circle key={i} data-st={`petal-${i + 1}`} data-thread="#c46c78" className="petal" cx={x} cy={y} r="26" />
            ))}
            <circle data-st="flower-center" data-thread="#c79e6c" className="knot" r="11" />
          </g>

          <g transform="translate(296 384) rotate(15)">
            <path data-st="bud" data-thread="#c46c78" className="petal" d="M0 0 C -13 -8, -14 -30, 0 -40 C 14 -30, 13 -8, 0 0 Z" />
            <path data-st="calyx" data-thread="#6b6a3a" className="leaf-olive" d="M-10 -4 C -4 4, 4 4, 10 -4 C 4 -1, -4 -1, -10 -4 Z" />
          </g>

          <g transform="translate(268 442)">
            {SMALL.map(([x, y], i) => (
              <circle key={i} data-st={`sp-${i + 1}`} data-thread="#c46c78" className="petal" cx={x} cy={y} r="13" />
            ))}
            <circle data-st="small-center" data-thread="#c79e6c" className="knot" r="6" />
          </g>
        </g>

        {/* Thread + needle */}
        <path ref={threadRef} className="hoop-thread" fill="none" stroke="#c46c78" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <g ref={needleRef} className="hoop-needle" style={{ opacity: 0 }}>
          <path d="M0 0 H 46" stroke="rgba(59,26,34,.25)" strokeWidth="4" strokeLinecap="round" transform="translate(1.5 3)" />
          <path d="M0 0 H 46" stroke="#8b9095" strokeWidth="3" strokeLinecap="round" />
          <path d="M3 -0.7 H 42" stroke="#e3e7ea" strokeWidth="1" strokeLinecap="round" />
          <ellipse cx={EYE_OFFSET} cy="0" rx="4" ry="1.7" fill="#fbf3e8" stroke="#6b7075" strokeWidth="1" />
        </g>
      </svg>

      <button
        type="button"
        className="replay"
        onClick={() => setRun((r) => r + 1)}
        disabled={!done || reduced}
        aria-hidden={reduced}
        tabIndex={reduced ? -1 : 0}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" />
        </svg>
        Stitch it again
      </button>
    </div>
  );
}
