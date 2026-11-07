import { Letters, delay } from "./Split";
import { Vine } from "./Motifs";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-vine" aria-hidden="true"><Vine tone="cream" /></div>
      <div className="container">
        <p className="footer-word reveal-group" aria-hidden="true"><Letters text="LittleThreads" /></p>
        <div className="footer-grid reveal-group">
          <div className="reveal" style={delay(0, 120)}>
            <p className="footer-tag">Hand embroidery,<br />stitched with love.</p>
          </div>
          <nav aria-label="Footer" className="reveal" style={delay(1, 120)}>
            <p className="footer-h">Explore</p>
            <ul>
              <li><a href="#collection">Collection</a></li>
              <li><a href="#custom">Custom orders</a></li>
              <li><a href="#process">How it works</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </nav>
          <div className="reveal" style={delay(2, 120)}>
            <p className="footer-h">Say hello</p>
            <ul>
              <li><a href="mailto:tejaswiande029@gmail.com">tejaswiande029@gmail.com</a></li>
              <li><a href="https://instagram.com/little_threadsstudio17" target="_blank" rel="noreferrer">@little_threadsstudio17</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-base reveal">
          <p>© {new Date().getFullYear()} LittleThreads. All rights reserved.</p>
          <a href="#top" className="text-link">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
