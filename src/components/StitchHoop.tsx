import { useRef, useState } from "react";
import { useStitch } from "../stitch/useStitch";
import { Needle } from "../stitch/Needle";
import { useReducedMotion } from "../hooks/useReducedMotion";

/**
 * The hero hoop: embroidered live on load. Stem → leaves → petals → bud → small flower → lettering.
 * Stitch order is DOM order except the lettering, which is pushed last with data-seq.
 */
const LEAF = "M0 0 C 16 -24, 48 -26, 70 -2 C 48 20, 16 24, 0 0 Z";
const PETALS = [[0, -29], [27.6, -9], [17, 23.5], [-17, 23.5], [-27.6, -9]] as const;
const SMALL = [[0, -14], [13.3, -4.3], [8.2, 11.3], [-8.2, 11.3], [-13.3, -4.3]] as const;
const OLIVE = "#6b6a3a", ROSE = "#c46c78", CREAM = "#c79e6c";

export function StitchHoop() {
  const reduced = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const [run, setRun] = useState(0);
  const done = useStitch(svgRef, { start: "now", replay: run });

  return (
    <div className={`stitch-hoop${done ? " is-done" : ""}`}>
      <svg
        ref={svgRef}
        viewBox="0 0 600 600"
        className="stitch"
        data-speed="0.9"
        role="img"
        aria-label="An embroidery hoop being stitched: olive leaves, pink flowers and the name LittleThreads on cream linen"
      >
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

        <g className="design">
          <text data-st data-seq={99} data-thread="#8a2944" data-dur={2800} data-stitches={90} x="300" y="272" textAnchor="middle" className="hoop-lettering">LittleThreads</text>

          <path data-st data-kind="stroke" data-thread={OLIVE} data-dur={1500} className="hoop-stem" d="M190 404 C 250 390, 330 392, 420 350" />

          <path data-st data-thread={OLIVE} data-dur={650} className="leaf-olive" d={LEAF} transform="translate(188 404) rotate(-150)" />
          <path data-st data-thread={OLIVE} data-dur={650} className="leaf-olive" d={LEAF} transform="translate(196 410) rotate(160)" />

          <path data-st data-thread={ROSE} data-dur={460} className="leaf-rose" d={LEAF} transform="translate(330 390) rotate(-110) scale(.75)" />
          <path data-st data-thread={ROSE} data-dur={460} className="leaf-rose" d={LEAF} transform="translate(352 386) rotate(60) scale(.7)" />
          <path data-st data-thread={ROSE} data-dur={460} className="leaf-rose" d={LEAF} transform="translate(372 377) rotate(-100) scale(.75)" />
          <path data-st data-thread={ROSE} data-dur={460} className="leaf-rose" d={LEAF} transform="translate(398 364) rotate(50) scale(.65)" />
          <path data-st data-thread={ROSE} data-dur={460} className="leaf-rose" d={LEAF} transform="translate(416 352) rotate(-60) scale(.7)" />

          <g transform="translate(238 386)">
            {PETALS.map(([x, y], i) => (
              <circle key={i} data-st data-thread={ROSE} data-dur={420} className="petal" cx={x} cy={y} r="26" />
            ))}
            <circle data-st data-thread={CREAM} data-dur={280} data-stitches={5} className="knot" r="11" />
          </g>

          <g transform="translate(296 384) rotate(15)">
            <path data-st data-thread={ROSE} data-dur={480} className="petal" d="M0 0 C -13 -8, -14 -30, 0 -40 C 14 -30, 13 -8, 0 0 Z" />
            <path data-st data-thread={OLIVE} data-dur={220} data-stitches={4} className="leaf-olive" d="M-10 -4 C -4 4, 4 4, 10 -4 C 4 -1, -4 -1, -10 -4 Z" />
          </g>

          <g transform="translate(268 442)">
            {SMALL.map(([x, y], i) => (
              <circle key={i} data-st data-thread={ROSE} data-dur={260} className="petal" cx={x} cy={y} r="13" />
            ))}
            <circle data-st data-thread={CREAM} data-dur={180} data-stitches={3} className="knot" r="6" />
          </g>
        </g>

        <Needle />
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
