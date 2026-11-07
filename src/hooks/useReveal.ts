import { useEffect } from "react";

/**
 * Adds `.in` to `.reveal`, `.reveal-group` and `.section` elements as they scroll into view.
 * All the actual motion lives in CSS (see "Motion" in styles.css); `.reveal` fades/rises
 * itself, `.reveal-group` just flips the class so its children can run staggered animations.
 * Honours reduced-motion by marking everything visible immediately.
 */
export function useReveal() {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(".reveal, .reveal-group, .section"));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.01 },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
