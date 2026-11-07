import { useState } from "react";
import { SectionHead } from "./SectionHead";
import { delay } from "./Split";

const FAQS = [
  { q: "How long does a custom piece take?", a: "Most hoops are stitched within one to three weeks, depending on size and detail. We’ll give you an estimated finish date with your quote, and send progress photos along the way." },
  { q: "What sizes do you offer?", a: "Hoops come in 4″, 6″, 8″ and 10″. Patches and bookmarks are made to fit the item — just tell us where it’s going." },
  { q: "Can I send a photo for a portrait?", a: "Yes — a clear, well-lit photo is all we need. We sketch the design first and only start stitching once you’ve approved it." },
  { q: "How do I look after an embroidered piece?", a: "Keep it out of direct sunlight and away from damp. Dust gently with a soft brush. Hoops come backed with felt so they’re ready to hang straight away." },
  { q: "Do you ship?", a: "We do. Every piece is wrapped in tissue, boxed and sent tracked. Add a gift message and we’ll write it by hand." },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="section faq" id="faq">
      <div className="container faq-grid">
        <SectionHead num="05" kicker="Good to know" lines={["Questions,", "answered."]} />
        <div className="faq-list reveal-group">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div className="faq-item reveal" data-open={isOpen} key={f.q} style={delay(i, 90)}>
                <button
                  type="button"
                  className="faq-btn"
                  id={`faq-b-${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-p-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="faq-n">{String(i + 1).padStart(2, "0")}</span>
                  <span className="faq-q">{f.q}</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                </button>
                <div className="faq-panel" id={`faq-p-${i}`} role="region" aria-labelledby={`faq-b-${i}`}>
                  <div className="faq-panel-in"><p>{f.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
