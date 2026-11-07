import { SectionHead } from "./SectionHead";
import { delay } from "./Split";
import { StitchArt } from "../stitch/Needle";

const OLIVE = "#6b6a3a", ROSE = "#c46c78", CREAM = "#c79e6c", BURGUNDY = "#8a2944";

export function Story() {
  return (
    <section className="section story" id="story">
      <div className="container">
        <SectionHead num="04" kicker="Our story" lines={["A small studio with", "a slow-made heart."]} />
        <div className="story-grid">
          <div className="story-text">
            <p className="dropcap reveal" style={delay(0)}>
              LittleThreads began at a kitchen table, with a single hoop, a tangle of pink floss and a wish to make
              something that would outlast the moment. We believe the best gifts carry time inside them — the hours,
              the care, the hand that made them.
            </p>
            <p className="reveal" style={delay(1, 160)}>
              Today we’re a tiny, independent studio stitching pieces for new parents, newlyweds, pet lovers and
              anyone who wants to hold onto a memory a little longer. Everything is still made at that same table.
            </p>
          </div>
          <figure className="story-fig reveal">
            {/* The first hoop, stitched live: a running stitch, a leaf, then the flower. */}
            <StitchArt viewBox="0 0 320 320" needleScale={0.85}>
              <g className="clamp"><rect x="140" y="4" width="40" height="8" rx="4" /><rect x="150" y="10" width="20" height="16" rx="2" /></g>
              <circle cx="160" cy="160" r="130" className="hoop" />
              <circle cx="160" cy="160" r="118" className="linen-fill" />
              <path data-st data-kind="stroke" data-thread={BURGUNDY} data-dur={1800} className="dash" d="M80 200 C 120 120, 200 240, 240 140" />
              <path data-st data-thread={OLIVE} className="leaf" d="M120 170 c -22 -8 -32 6 -34 14 c 12 3 28 0 34 -14Z" />
              <g className="flower" transform="translate(240 140) scale(.9)">
                <circle data-st data-thread={ROSE} r="14" cx="0" cy="-20" /><circle data-st data-thread={ROSE} r="14" cx="19" cy="-6" />
                <circle data-st data-thread={ROSE} r="14" cx="12" cy="17" /><circle data-st data-thread={ROSE} r="14" cx="-12" cy="17" />
                <circle data-st data-thread={ROSE} r="14" cx="-19" cy="-6" /><circle data-st data-thread={CREAM} data-stitches={4} r="7" className="center" />
              </g>
            </StitchArt>
            <figcaption>Fig. 1 — The first hoop, still on the studio wall.</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
