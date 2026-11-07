import { SectionHead } from "./SectionHead";
import { Words, delay } from "./Split";

const INCLUDED = [
  ["Sketch first", "A free design sketch and thread palette before a single stitch."],
  ["Your choices", "Hoop size, fabric colour and floss — chosen with you, not for you."],
  ["Progress photos", "You’ll see it grow. No surprises on delivery day."],
  ["Gift-ready", "Backed in felt, wrapped in tissue, with a note in our handwriting."],
];

export function CustomOrders() {
  return (
    <section className="section custom" id="custom">
      <div className="container">
        <SectionHead num="02" kicker="Custom orders" lines={["Something made", "just for you."]} />

        <div className="custom-grid">
          <p className="statement reveal-group">
            <Words text="Wedding dates, first homes, a much-loved pet, a line from your favourite poem — tell us the story and we’ll stitch it into something you’ll keep for a lifetime." />
          </p>

          <ol className="included reveal-group">
            {INCLUDED.map(([t, d], i) => (
              <li key={t} className="reveal" style={delay(i, 140)}>
                <span className="included-n">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              </li>
            ))}
          </ol>

          <figure className="pull-quote reveal-group">
            <blockquote>
              <p><Words text="Every piece begins with a conversation and ends with a little bit of someone’s story held inside a hoop." /></p>
            </blockquote>
            <figcaption className="a-fade">— The LittleThreads studio</figcaption>
          </figure>

          <div className="custom-cta reveal">
            <a href="#contact" className="btn btn-primary">Start a custom order</a>
            <span className="cta-note">Replies within two days · no obligation</span>
          </div>
        </div>
      </div>
    </section>
  );
}
