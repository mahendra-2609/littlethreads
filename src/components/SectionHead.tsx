import type { CSSProperties, ReactNode } from "react";

type Props = {
  num: string;
  kicker: string;
  /** Title lines; the last line is set in italic rose. */
  lines: string[];
  intro?: ReactNode;
  aside?: ReactNode;
};

/** Editorial section header. Each title line rises out of a mask in sequence; the kicker rule draws in. */
export function SectionHead({ num, kicker, lines, intro, aside }: Props) {
  return (
    <header className="sec-head reveal-group">
      <p className="kicker">
        <span className="kicker-num">{num}</span>
        <span className="kicker-text">{kicker}</span>
      </p>
      <div className="sec-head-row">
        <h2 className="a-lines">
          {lines.map((line, i) => {
            const last = lines.length > 1 && i === lines.length - 1;
            return (
              <span className="line" key={i} style={{ "--i": i } as CSSProperties}>
                <span className="line-in">{last ? <em>{line}</em> : line}</span>
              </span>
            );
          })}
        </h2>
        {intro && <p className="sec-intro a-fade">{intro}</p>}
        {aside}
      </div>
    </header>
  );
}
