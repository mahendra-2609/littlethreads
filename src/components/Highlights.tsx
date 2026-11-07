import { CountUp } from "./CountUp";
import { Letters, delay } from "./Split";

const ITEMS = [
  { big: <CountUp to={100} suffix="%" />, small: "hand-stitched, never machine" },
  { big: <CountUp to={3} prefix="1–" suffix=" wks" duration={900} />, small: "from sketch to finished hoop" },
  { big: <CountUp to={4} suffix=" sizes" duration={900} />, small: "of beechwood hoop, 4″ to 10″" },
  { big: <Letters text="Worldwide" />, small: "tracked shipping, gift-wrapped" },
];

/** A thin editorial stats rule under the hero. Numbers count up as it scrolls in. */
export function Highlights() {
  return (
    <section className="highlights" aria-label="At a glance">
      <div className="container">
        <ul className="highlights-row reveal-group">
          {ITEMS.map((it, i) => (
            <li key={it.small} className="reveal" style={delay(i, 120)}>
              <span className="hl-big">{it.big}</span>
              <span className="hl-small">{it.small}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
