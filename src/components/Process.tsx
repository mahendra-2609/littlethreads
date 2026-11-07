import { useEffect, useRef } from "react";
import { SectionHead } from "./SectionHead";
import { delay } from "./Split";

const STEPS = [
  { title: "Share your idea", text: "Send a message with a photo, a name or simply a feeling you’d like captured. Rough is fine — that’s what the sketch is for.", time: "Day 1" },
  { title: "Approve the sketch", text: "We draw up a design and thread palette for you to review and tweak until it feels exactly right.", time: "Days 2–4" },
  { title: "We stitch it by hand", text: "Your piece is slow-made over one to three weeks, with progress photos along the way.", time: "Weeks 1–3" },
  { title: "Wrapped & delivered", text: "Finished, backed in felt, gift-wrapped and sent tracked to your door — or straight to theirs.", time: "Last day" },
];

export function Process() {
  const list = useRef<HTMLOListElement>(null);

  // A thread sews down the list as you scroll; each step gets a knot once the thread reaches it.
  useEffect(() => {
    const el = list.current!;
    const steps = Array.from(el.querySelectorAll<HTMLElement>(".step"));
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const line = window.innerHeight * 0.62;
      const p = Math.min(1, Math.max(0, (line - r.top) / r.height));
      el.style.setProperty("--p", p.toFixed(4));
      for (const s of steps) s.classList.toggle("passed", s.getBoundingClientRect().top + 48 < line);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="section process" id="process">
      <div className="container process-grid">
        <div className="process-side">
          <SectionHead num="03" kicker="How it works" lines={["From idea to hoop", "in four steps."]} />
          <p className="sec-intro reveal">Everything is made to order, so every piece starts the same way: with a conversation.</p>
        </div>
        <ol className="steps" ref={list}>
          <span className="steps-thread" aria-hidden="true" />
          <svg className="steps-needle" width="14" height="40" viewBox="0 0 14 40" aria-hidden="true">
            <path d="M7 2v34" stroke="#8b9095" strokeWidth="3" strokeLinecap="round" />
            <path d="M7.6 4v30" stroke="#e3e7ea" strokeWidth="1" strokeLinecap="round" />
            <ellipse cx="7" cy="7" rx="1.7" ry="3.5" fill="#fbf3e8" stroke="#6b7075" strokeWidth="1" />
          </svg>
          {STEPS.map((s, i) => (
            <li className="step reveal" key={s.title} style={delay(i, 120)}>
              <span className="step-n">0{i + 1}</span>
              <div className="step-body">
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
              <span className="step-time">{s.time}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
