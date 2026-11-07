import { useEffect, useRef } from "react";

/** A needle that sews a running stitch across the top of the page as you scroll. */
export function SewProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      el.style.setProperty("--p", p.toFixed(4));
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
    <div className="sew-progress" ref={ref} aria-hidden="true">
      <span className="sew-thread" />
      <svg className="sew-needle" width="34" height="14" viewBox="0 0 34 14">
        <path d="M1 7h26" stroke="#9aa0a6" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M27 7h6" stroke="#c4c8cc" strokeWidth="1.4" strokeLinecap="round" />
        <ellipse cx="5" cy="7" rx="2.6" ry="1" fill="none" stroke="#6b7075" strokeWidth="1" />
      </svg>
    </div>
  );
}
