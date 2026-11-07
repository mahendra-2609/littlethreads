import type { MouseEvent, ReactNode } from "react";
import { SectionHead } from "./SectionHead";
import { delay } from "./Split";
import { StitchArt } from "../stitch/Needle";

const OLIVE = "#6b6a3a", ROSE = "#c46c78", CREAM = "#c79e6c", BURGUNDY = "#8a2944";

/** A mini hoop whose design is embroidered live when the card scrolls into view. */
function Hoop({ children }: { children: ReactNode }) {
  return (
    <StitchArt viewBox="0 0 200 200" needleScale={0.7} speed={0.9}>
      <g className="clamp"><rect x="84" y="3" width="32" height="6" rx="3" /><rect x="91" y="7" width="18" height="14" rx="2" /></g>
      <circle cx="100" cy="100" r="78" className="hoop" />
      <circle cx="100" cy="100" r="70" className="linen-fill" />
      {children}
    </StitchArt>
  );
}

const Flower = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g className="flower" transform={`translate(${x} ${y}) scale(${s})`}>
    <circle data-st data-thread={ROSE} r="14" cx="0" cy="-20" />
    <circle data-st data-thread={ROSE} r="14" cx="19" cy="-6" />
    <circle data-st data-thread={ROSE} r="14" cx="12" cy="17" />
    <circle data-st data-thread={ROSE} r="14" cx="-12" cy="17" />
    <circle data-st data-thread={ROSE} r="14" cx="-19" cy="-6" />
    <circle data-st data-thread={CREAM} data-stitches={4} r="7" className="center" />
  </g>
);

const ITEMS = [
  {
    n: "I", title: "Botanical Hoops", price: "from $45", tone: "tone-rose",
    text: "Wildflowers, sprigs and blossoms in soft, earthy tones. Ready to hang.",
    art: (
      <Hoop>
        <path data-st data-kind="stroke" data-thread={OLIVE} className="stem" d="M100 116 C 100 140, 90 150, 84 160" />
        <path data-st data-thread={OLIVE} className="leaf" d="M96 140 c -18 -6 -26 4 -28 10 c 10 2 22 0 28 -10Z" />
        <Flower x={100} y={96} />
      </Hoop>
    ),
  },
  {
    n: "II", title: "Name & Birth Hoops", price: "from $65", tone: "tone-sand",
    text: "A baby’s name, date and weight, framed in tiny flowers. A nursery keepsake.",
    art: (
      <Hoop>
        <path data-st data-kind="stroke" data-thread={ROSE} className="vine" d="M58 140 q 21 -12 42 0 t 42 0" />
        <text data-st data-thread={BURGUNDY} data-dur={1600} data-stitches={40} x="100" y="98" textAnchor="middle" className="stitch-text">Amelia</text>
        <text data-st data-thread={OLIVE} data-dur={700} data-stitches={30} x="100" y="122" textAnchor="middle" className="stitch-small">12 · 03 · 2026</text>
      </Hoop>
    ),
  },
  {
    n: "III", title: "Pet & Home Portraits", price: "from $85", tone: "tone-clay",
    text: "Your companion or the house you love, stitched from a favourite photo.",
    art: (
      <Hoop>
        <g className="paw" transform="translate(100 104)">
          <ellipse data-st data-thread={BURGUNDY} data-dur={700} rx="20" ry="16" cy="10" />
          <circle data-st data-thread={BURGUNDY} r="8" cx="-20" cy="-14" /><circle data-st data-thread={BURGUNDY} r="8" cx="-7" cy="-26" />
          <circle data-st data-thread={BURGUNDY} r="8" cx="7" cy="-26" /><circle data-st data-thread={BURGUNDY} r="8" cx="20" cy="-14" />
        </g>
      </Hoop>
    ),
  },
  {
    n: "IV", title: "Patches & Accessories", price: "from $18", tone: "tone-olive",
    text: "Stitched details for tote bags, denim jackets, bookmarks and more.",
    art: (
      <StitchArt viewBox="0 0 200 200" needleScale={0.7}>
        <rect data-st data-thread={OLIVE} data-dur={1100} data-stitches={26} x="40" y="40" width="120" height="120" rx="26" className="patch" />
        <path data-st data-thread={ROSE} data-dur={700} className="heart" d="M100 138s-30-17-30-38a16 16 0 0 1 30-8 16 16 0 0 1 30 8c0 21-30 38-30 38Z" />
      </StitchArt>
    ),
  },
  {
    n: "V", title: "Wedding & Anniversary", price: "from $70", tone: "tone-rose",
    text: "Initials, dates and a sprig of your bouquet, stitched for the big day or the years after.",
    art: (
      <Hoop>
        <path data-st data-kind="stroke" data-thread={ROSE} className="vine" d="M50 130 q 25 -14 50 0 t 50 0" />
        <Flower x={58} y={78} s={0.5} />
        <Flower x={142} y={78} s={0.5} />
        <text data-st data-thread={BURGUNDY} data-dur={1300} data-stitches={30} x="100" y="104" textAnchor="middle" className="stitch-text">A &amp; J</text>
      </Hoop>
    ),
  },
];

function tilt(e: MouseEvent<HTMLDivElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  el.style.setProperty("--ry", `${(x * 10).toFixed(2)}deg`);
  el.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
  el.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(1)}%`);
  el.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(1)}%`);
}
function untilt(e: MouseEvent<HTMLDivElement>) {
  e.currentTarget.style.setProperty("--ry", "0deg");
  e.currentTarget.style.setProperty("--rx", "0deg");
}

export function Collection() {
  return (
    <section className="section" id="collection">
      <div className="container">
        <SectionHead
          num="01"
          kicker="The collection"
          lines={["Pieces to keep,", "and to give."]}
          intro="A small, ever-changing range. When a piece is gone, it’s gone — but we’re always happy to stitch you something new."
        />

        <div className="pieces">
          {ITEMS.map((item, i) => (
            <article className="piece reveal" key={item.title} style={delay(i, 110)}>
              <div className={`piece-art ${item.tone}`} aria-hidden="true" onMouseMove={tilt} onMouseLeave={untilt}>
                {item.art}
                <span className="sheen" />
              </div>
              <div className="piece-meta">
                <span className="piece-n">{item.n}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <div className="piece-foot">
                  <span className="piece-price">{item.price}</span>
                  <a href="#contact" className="text-link">Enquire</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
