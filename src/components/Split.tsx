import type { CSSProperties } from "react";

const idx = (i: number) => ({ "--i": i } as CSSProperties);

/** Splits text into word spans so CSS can stagger them (`--i` per word). */
export function Words({ text, className = "" }: { text: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={`a-words ${className}`.trim()} aria-label={text}>
      {words.map((w, i) => (
        <span key={i}>
          <span className="w" style={idx(i)} aria-hidden="true">{w}</span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

/** Splits text into letter spans (`--i` per letter). */
export function Letters({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`a-letters ${className}`.trim()} aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span className="ch" key={i} style={idx(i)} aria-hidden="true">{ch === " " ? " " : ch}</span>
      ))}
    </span>
  );
}

/** Stagger delay helper: `style={delay(i)}` → `--d` in ms used by `.reveal`. */
export const delay = (i: number, step = 90) => ({ "--d": i * step } as CSSProperties);
