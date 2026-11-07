import { StitchHoop } from "./StitchHoop";

export function Hero() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy reveal">
          <p className="eyebrow">Hand embroidery studio</p>
          <h1>Little stitches,<br /><em>lasting stories.</em></h1>
          <p className="lede">
            Heirloom-quality hoops, keepsakes and custom pieces — each one hand-stitched
            on natural linen, slowly and with care, to hold the moments that matter to you.
          </p>
          <div className="hero-actions">
            <a href="#contact" className="btn btn-primary">Commission a Custom Piece</a>
            <a href="#collection" className="btn btn-ghost">Browse the Collection</a>
          </div>
          <ul className="hero-trust" aria-label="Highlights">
            <li><span className="dot" aria-hidden="true" />100% hand-stitched</li>
            <li><span className="dot" aria-hidden="true" />Natural linen &amp; cotton floss</li>
            <li><span className="dot" aria-hidden="true" />Made to order</li>
          </ul>
        </div>

        <div className="hero-art reveal">
          <div className="hero-halo" aria-hidden="true" />
          <StitchHoop />
        </div>
      </div>
    </section>
  );
}
