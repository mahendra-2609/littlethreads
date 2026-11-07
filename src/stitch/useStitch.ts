import { useEffect, useState, type RefObject } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

/**
 * Live embroidery for any SVG.
 *
 * Mark the elements to stitch with `data-st` (in stitch order, or give `data-seq` numbers).
 *   data-kind="stroke"   needle follows the path (stems, vines); default is a satin "fill" sweep
 *   data-dur="800"       ms (defaults are estimated from size)
 *   data-thread="#hex"   thread colour while stitching this element
 *   data-stitches="12"   zig-zags across a fill
 * On the <svg>: data-speed (multiplier) and data-needle-scale.
 * The svg must contain a `.st-needle` group and `.st-thread` path (see <Needle/>).
 *
 * Elements start hidden with `clip-path: inset(0 100% 0 0)` in their own local box (so rotated
 * leaves fill along their length) and are revealed one at a time while the needle moves.
 */
const HIDDEN = "inset(0 100% 0 0)";
const ANGLE = -48;
const EYE = 40;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type Opts = { start?: "now" | "inview"; replay?: number };

export function useStitch(svgRef: RefObject<SVGSVGElement | null>, { start = "inview", replay = 0 }: Opts = {}) {
  const reduced = useReducedMotion();
  const [done, setDone] = useState(reduced);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const needle = svg.querySelector<SVGGElement>(".st-needle");
    const thread = svg.querySelector<SVGPathElement>(".st-thread");
    const els = Array.from(svg.querySelectorAll<SVGGraphicsElement>("[data-st]"))
      .map((el, i) => ({ el, seq: Number(el.dataset.seq ?? 0), i }))
      .sort((a, b) => a.seq - b.seq || a.i - b.i)
      .map((x) => x.el);
    const nScale = Number(svg.dataset.needleScale) || 1;
    const speed = Number(svg.dataset.speed) || 1;
    const hideNeedle = () => {
      if (needle) needle.style.opacity = "0";
      if (thread) thread.style.opacity = "0";
    };

    if (reduced) {
      els.forEach((el) => (el.style.clipPath = "none"));
      hideNeedle();
      setDone(true);
      return;
    }
    setDone(false);
    els.forEach((el) => (el.style.clipPath = HIDDEN));
    hideNeedle();

    let raf = 0;
    let cancelled = false;
    let io: IntersectionObserver | undefined;

    const toRoot = (el: SVGGraphicsElement, x: number, y: number) => {
      const m = el.getScreenCTM();
      const r = svg.getScreenCTM()?.inverse();
      if (!m || !r) return { x, y };
      return new DOMPoint(x, y).matrixTransform(m).matrixTransform(r);
    };

    const run = async () => {
      if (svg.querySelector("text")) {
        try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]); } catch { /* ignore */ }
      }
      if (cancelled) return;

      const steps = els.map((el) => {
        const kind = el.dataset.kind === "stroke" ? "stroke" : "fill";
        const bbox = el.getBBox();
        const len = kind === "stroke" && "getTotalLength" in el ? (el as SVGPathElement).getTotalLength() : 0;
        const isText = el.tagName.toLowerCase() === "text";
        const base = Number(el.dataset.dur) || (
          kind === "stroke" ? clamp(len * 1.6, 350, 2200)
          : isText ? 2400
          : clamp(Math.sqrt(bbox.width * bbox.height) * 14, 180, 900));
        const stitches = Number(el.dataset.stitches) || Math.max(4, Math.round(bbox.width / 3.2));
        return { el, kind, bbox, len, dur: base * speed, stitches, color: el.dataset.thread ?? "#c46c78" };
      });
      const offsets: number[] = [];
      let total = 0;
      for (const s of steps) { offsets.push(total); total += s.dur; }
      const settle = 450;

      if (thread) thread.setAttribute("stroke-width", String(2.4 * nScale));
      const history: { x: number; y: number }[] = [];
      let lastSample = 0;
      let lastIdx = -1;
      const t0 = performance.now();

      const frame = (now: number) => {
        const t = now - t0;
        let idx = steps.findIndex((s, i) => t < offsets[i] + s.dur);
        const finished = idx === -1;
        if (finished) idx = steps.length - 1;

        for (let i = 0; i < steps.length; i++) {
          const s = steps[i];
          if (i < idx || finished) { if (s.el.style.clipPath !== "none") s.el.style.clipPath = "none"; }
          else if (i > idx) { if (s.el.style.clipPath !== HIDDEN) s.el.style.clipPath = HIDDEN; }
        }

        const s = steps[idx];
        if (s) {
          const p = finished ? 1 : Math.min(1, (t - offsets[idx]) / s.dur);
          let lx: number, ly: number;
          if (s.kind === "stroke") {
            const pt = (s.el as SVGPathElement).getPointAtLength(p * s.len);
            lx = pt.x; ly = pt.y;
            const right = 1 - clamp((pt.x - s.bbox.x) / (s.bbox.width || 1), 0, 1);
            if (!finished) s.el.style.clipPath = `inset(-6px ${(right * 100).toFixed(2)}% -6px -6px)`;
          } else {
            lx = s.bbox.x + p * s.bbox.width;
            ly = s.bbox.y + s.bbox.height * (0.5 + 0.42 * Math.sin(p * s.stitches * Math.PI));
            if (!finished) s.el.style.clipPath = `inset(-6px ${((1 - p) * 100).toFixed(2)}% -6px -6px)`;
          }

          const pt = toRoot(s.el, lx, ly);
          const bob = (2 + 4 * Math.abs(Math.sin(t / 85))) * nScale;
          if (needle) {
            needle.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)}) rotate(${ANGLE}) translate(${bob.toFixed(1)} 0) scale(${nScale})`);
            if (!finished && needle.style.opacity !== "1") { needle.style.opacity = "1"; if (thread) thread.style.opacity = "0.95"; }
          }
          if (thread) {
            const rad = (ANGLE * Math.PI) / 180;
            const d0 = EYE * nScale + bob;
            const eye = { x: pt.x + d0 * Math.cos(rad), y: pt.y + d0 * Math.sin(rad) };
            if (now - lastSample > 40) { history.unshift(eye); if (history.length > 14) history.pop(); lastSample = now; }
            if (idx !== lastIdx) { thread.setAttribute("stroke", s.color); lastIdx = idx; }
            if (history.length > 1) {
              let d = `M${eye.x.toFixed(1)} ${eye.y.toFixed(1)}`;
              for (let i = 0; i < history.length - 1; i++) {
                const a = history[i], b = history[i + 1];
                d += ` Q${a.x.toFixed(1)} ${a.y.toFixed(1)} ${((a.x + b.x) / 2).toFixed(1)} ${((a.y + b.y) / 2 + 3 * nScale).toFixed(1)}`;
              }
              thread.setAttribute("d", d);
            }
          }
        }

        if (finished && t > total + settle) {
          hideNeedle();
          setDone(true);
          return;
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };

    if (start === "now") {
      run();
    } else {
      io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io?.disconnect(); run(); } }, { threshold: 0.3 });
      io.observe(svg);
    }
    return () => { cancelled = true; cancelAnimationFrame(raf); io?.disconnect(); };
  }, [svgRef, start, replay, reduced]);

  return done;
}
