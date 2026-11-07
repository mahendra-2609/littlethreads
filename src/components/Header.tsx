import { useEffect, useState } from "react";

const LINKS = [
  { href: "#collection", label: "Collection" },
  { href: "#custom", label: "Custom" },
  { href: "#process", label: "Process" },
  { href: "#story", label: "Story" },
  { href: "#faq", label: "FAQ" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`site-header${scrolled ? " scrolled" : ""}`} id="top">
      <div className="container header-inner">
        <a href="#top" className="brand" aria-label="LittleThreads home">
          <img src="/logo-320.png" alt="" width="44" height="44" />
          <span className="brand-name">LittleThreads</span>
        </a>
        <nav className="main-nav" aria-label="Primary">
          <button
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="nav-list"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M3 8h18M3 16h18" />}
            </svg>
          </button>
          <ul id="nav-list" className={`nav-list${open ? " open" : ""}`} onClick={() => setOpen(false)}>
            {LINKS.map((l) => (
              <li key={l.href}><a href={l.href}>{l.label}</a></li>
            ))}
            <li><a href="#contact" className="btn btn-primary btn-sm">Order a piece</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
