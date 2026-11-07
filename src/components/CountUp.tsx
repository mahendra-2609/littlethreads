import { useEffect, useRef } from "react";

type Props = { to: number; prefix?: string; suffix?: string; duration?: number };

/** Counts from 0 to `to` the first time it scrolls into view. */
export function CountUp({ to, prefix = "", suffix = "", duration = 1400 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.textContent = `${prefix}0${suffix}`;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = `${prefix}${Math.round(to * eased)}${suffix}`;
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, prefix, suffix, duration]);
  return <span ref={ref}>{prefix}{to}{suffix}</span>;
}
