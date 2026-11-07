import { useRef, type ReactNode } from "react";
import { useStitch } from "./useStitch";

/** The needle and trailing thread the stitch engine drives. Place last inside the svg so it draws on top. */
export function Needle() {
  return (
    <>
      <path className="st-thread" fill="none" stroke="#c46c78" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0 }} />
      <g className="st-needle" style={{ opacity: 0 }}>
        <path d="M0 0 H 46" stroke="rgba(59,26,34,.25)" strokeWidth="4" strokeLinecap="round" transform="translate(1.5 3)" />
        <path d="M0 0 H 46" stroke="#8b9095" strokeWidth="3" strokeLinecap="round" />
        <path d="M3 -0.7 H 42" stroke="#e3e7ea" strokeWidth="1" strokeLinecap="round" />
        <ellipse cx="40" cy="0" rx="4" ry="1.7" fill="#fbf3e8" stroke="#6b7075" strokeWidth="1" />
      </g>
    </>
  );
}

type ArtProps = {
  viewBox: string;
  children: ReactNode;
  className?: string;
  speed?: number;
  needleScale?: number;
  preserveAspectRatio?: string;
  label?: string;
};

/** An SVG that embroiders its `data-st` children live when it scrolls into view. */
export function StitchArt({ viewBox, children, className = "", speed, needleScale, preserveAspectRatio, label }: ArtProps) {
  const ref = useRef<SVGSVGElement>(null);
  useStitch(ref);
  return (
    <svg
      ref={ref}
      viewBox={viewBox}
      className={`stitch ${className}`.trim()}
      data-speed={speed}
      data-needle-scale={needleScale}
      preserveAspectRatio={preserveAspectRatio}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {children}
      <Needle />
    </svg>
  );
}
