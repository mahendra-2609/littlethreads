/** Shared SVG fills (satin-stitch patterns, wood & brass gradients) used by every illustration. */
export function StitchDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <pattern id="satin-rose" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
          <rect width="3" height="3" fill="#d98a92" /><rect width="1" height="3" fill="#c46c78" /><rect x="2" width=".5" height="3" fill="#eab0b5" />
        </pattern>
        <pattern id="satin-olive" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(-50)">
          <rect width="3" height="3" fill="#8d8b52" /><rect width="1" height="3" fill="#6b6a3a" /><rect x="2" width=".5" height="3" fill="#b0ae78" />
        </pattern>
        <pattern id="satin-burgundy" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="3" height="3" fill="#8a2944" /><rect width="1" height="3" fill="#661730" /><rect x="2" width=".5" height="3" fill="#a8455f" />
        </pattern>
        <pattern id="satin-blush" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(-50)">
          <rect width="3" height="3" fill="#ecc4c6" /><rect width="1" height="3" fill="#d9a3a8" /><rect x="2" width=".5" height="3" fill="#f6dcdd" />
        </pattern>
        <pattern id="satin-cream" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
          <rect width="3" height="3" fill="#f6e6cf" /><rect width="1" height="3" fill="#e4cfae" />
        </pattern>
        <pattern id="linen-weave" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="#fbf3e8" />
          <rect width="4" height="1" fill="#efe2d1" opacity=".7" />
          <rect width="1" height="4" fill="#efe2d1" opacity=".7" />
        </pattern>
        <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ecd2ae" /><stop offset=".5" stopColor="#ddb88a" /><stop offset="1" stopColor="#c99f6e" />
        </linearGradient>
        <linearGradient id="brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9b264" /><stop offset="1" stopColor="#9c7330" />
        </linearGradient>
        <radialGradient id="hoop-shade" cx=".5" cy=".5" r=".5">
          <stop offset=".78" stopColor="#3b1a22" stopOpacity="0" /><stop offset="1" stopColor="#3b1a22" stopOpacity=".16" />
        </radialGradient>
      </defs>
    </svg>
  );
}
