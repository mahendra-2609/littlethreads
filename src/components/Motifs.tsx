import { StitchArt } from "../stitch/Needle";

/* ------------------------------------------------------------------
   Embroidered motifs. Every piece is marked with data-st so the stitch
   engine sews it live when it scrolls into view.
   ------------------------------------------------------------------ */

type Tone = "rose" | "cream";
const thread = (tone: Tone) => ({ stem: tone === "cream" ? "#e3b9bb" : "#6b6a3a", leaf: tone === "cream" ? "#d98a92" : "#6b6a3a", petal: tone === "cream" ? "#c79e6c" : "#c46c78" });

const leafD = (L: number) => `M0 0 C ${L * 0.27} ${-L * 0.3}, ${L * 0.73} ${-L * 0.33}, ${L} 0 C ${L * 0.73} ${L * 0.3}, ${L * 0.27} ${L * 0.3}, 0 0 Z`;

const Leaf = ({ x, y, rot, L = 30, seq, tone = "rose", dur }: { x: number; y: number; rot: number; L?: number; seq?: number; tone?: Tone; dur?: number }) => (
  <path className="m-leaf" d={leafD(L)} transform={`translate(${x} ${y}) rotate(${rot})`} data-st data-seq={seq} data-thread={thread(tone).leaf} data-dur={dur} />
);

const Bloom = ({ x, y, r = 12, seq, tone = "rose", dur }: { x: number; y: number; r?: number; seq?: number; tone?: Tone; dur?: number }) => {
  const d = r * 1.08;
  const pts = [[0, -d], [d * 0.95, -d * 0.31], [d * 0.59, d * 0.81], [-d * 0.59, d * 0.81], [-d * 0.95, -d * 0.31]];
  return (
    <g className="m-bloom" transform={`translate(${x} ${y})`} data-st data-seq={seq} data-thread={thread(tone).petal} data-dur={dur ?? 420} data-stitches={10}>
      {pts.map(([px, py], i) => <circle key={i} className="m-petal" cx={px} cy={py} r={r * 0.92} />)}
      <circle className="m-knot" r={r * 0.42} />
    </g>
  );
};

const Knot = ({ x, y, r = 4.5, seq }: { x: number; y: number; r?: number; seq?: number }) => (
  <circle className="m-fknot" cx={x} cy={y} r={r} data-st data-seq={seq} data-thread="#c46c78" data-dur={140} data-stitches={3} />
);

/* ---------- Vine: a long running stitch, used as the section divider ---------- */
const VW = 1400, VH = 90, VMID = 48;
const yAt = (x: number) => VMID + 18 * Math.sin(x / 105);
const angAt = (x: number) => (Math.atan((18 / 105) * Math.cos(x / 105)) * 180) / Math.PI;
const vinePts: string[] = [];
for (let x = 0; x <= VW; x += 10) vinePts.push(`${x} ${yAt(x).toFixed(1)}`);
const VINE_D = `M${vinePts.join(" L ")}`;
const VINE_LEAVES = Array.from({ length: 19 }, (_, k) => 45 + k * 72);
const VINE_BLOOMS = [210, 560, 910, 1260];
const VINE_KNOTS = [385, 735, 1085];

export function Vine({ tone = "rose" }: { tone?: Tone }) {
  return (
    <StitchArt viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid slice" className={`vine thread-${tone}`} speed={0.6}>
      <path className="m-stem" d={VINE_D} data-st data-seq={-1} data-kind="stroke" data-thread={thread(tone).stem} data-dur={2600} />
      {VINE_LEAVES.map((x, k) => (
        <Leaf key={x} x={x} y={yAt(x)} rot={angAt(x) + (k % 2 ? -62 : 62)} L={30} seq={x} tone={tone} dur={170} />
      ))}
      {VINE_BLOOMS.map((x, k) => <Bloom key={x} x={x} y={yAt(x) + (k % 2 ? 16 : -16)} r={11} seq={x} tone={tone} dur={380} />)}
      {VINE_KNOTS.map((x, k) => <Knot key={x} x={x} y={yAt(x) + (k % 2 ? -12 : 12)} seq={x} />)}
    </StitchArt>
  );
}

/* ---------- Sprig: a single stem with leaves and a bloom ---------- */
export function Sprig({ tone = "rose", className = "" }: { tone?: Tone; className?: string }) {
  return (
    <StitchArt viewBox="0 0 160 210" className={`sprig thread-${tone} ${className}`} speed={0.85}>
      <path className="m-stem" d="M84 206 C 60 165, 96 115, 72 34" data-st data-kind="stroke" data-thread={thread(tone).stem} />
      <Leaf x={77} y={176} rot={-145} L={34} tone={tone} />
      <Leaf x={84} y={156} rot={-28} L={32} tone={tone} />
      <Leaf x={82} y={128} rot={-152} L={32} tone={tone} />
      <Leaf x={86} y={104} rot={-36} L={30} tone={tone} />
      <Leaf x={78} y={74} rot={-150} L={28} tone={tone} />
      <Knot x={94} y={84} />
      <Bloom x={72} y={30} r={14} tone={tone} />
    </StitchArt>
  );
}

/* ---------- Wreath ---------- */
const WR = 120, WC = 160;
export function Wreath({ tone = "rose", className = "" }: { tone?: Tone; className?: string }) {
  const leaves = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const tangent = (a * 180) / Math.PI + 90;
    return { x: WC + WR * Math.cos(a), y: WC + WR * Math.sin(a), rot: tangent + (i % 2 ? 34 : -34), seq: i + 1 };
  });
  const blooms = [[-90, -14], [0, 14], [90, -14], [180, 14]].map(([deg, off], i) => {
    const a = (deg * Math.PI) / 180;
    return { x: WC + (WR + off) * Math.cos(a), y: WC + (WR + off) * Math.sin(a), seq: 20 + i };
  });
  const knots = [45, 135, 225, 315].map((deg, i) => {
    const a = (deg * Math.PI) / 180;
    return { x: WC + (WR + 20) * Math.cos(a), y: WC + (WR + 20) * Math.sin(a), seq: 30 + i };
  });
  return (
    <StitchArt viewBox="0 0 320 320" className={`wreath thread-${tone} ${className}`} speed={0.7}>
      <path className="m-stem" d={`M${WC} ${WC - WR} A${WR} ${WR} 0 1 1 ${WC - 0.1} ${WC - WR}`} data-st data-seq={0} data-kind="stroke" data-thread={thread(tone).stem} data-dur={2400} />
      {leaves.map((l) => <Leaf key={l.seq} {...l} L={30} tone={tone} dur={180} />)}
      {blooms.map((b) => <Bloom key={b.seq} {...b} r={15} tone={tone} />)}
      {knots.map((k) => <Knot key={k.seq} {...k} />)}
    </StitchArt>
  );
}

/* ---------- Spray: three stems fanning out from a corner ---------- */
export function Spray({ tone = "rose", className = "" }: { tone?: Tone; className?: string }) {
  const t = thread(tone);
  return (
    <StitchArt viewBox="0 0 380 320" className={`spray thread-${tone} ${className}`} speed={0.8}>
      <path className="m-stem" d="M40 300 C 70 220, 90 140, 120 60" data-st data-seq={1} data-kind="stroke" data-thread={t.stem} />
      <Leaf x={62} y={240} rot={-160} L={34} seq={2} tone={tone} />
      <Leaf x={78} y={200} rot={-40} L={32} seq={3} tone={tone} />
      <Leaf x={92} y={150} rot={-165} L={32} seq={4} tone={tone} />
      <Leaf x={106} y={110} rot={-45} L={30} seq={5} tone={tone} />
      <Bloom x={120} y={56} r={18} seq={6} tone={tone} />

      <path className="m-stem" d="M40 300 C 110 250, 170 180, 225 110" data-st data-seq={7} data-kind="stroke" data-thread={t.stem} />
      <Leaf x={110} y={252} rot={-120} L={30} seq={8} tone={tone} />
      <Leaf x={150} y={210} rot={10} L={30} seq={9} tone={tone} />
      <Leaf x={190} y={160} rot={-125} L={28} seq={10} tone={tone} />
      <Knot x={205} y={140} seq={11} />
      <Bloom x={228} y={104} r={16} seq={12} tone={tone} />

      <path className="m-stem" d="M40 300 C 140 290, 240 260, 330 205" data-st data-seq={13} data-kind="stroke" data-thread={t.stem} />
      <Leaf x={140} y={288} rot={-70} L={30} seq={14} tone={tone} />
      <Leaf x={210} y={270} rot={30} L={30} seq={15} tone={tone} />
      <Leaf x={270} y={243} rot={-80} L={28} seq={16} tone={tone} />
      <Knot x={300} y={236} seq={17} />
      <Bloom x={334} y={200} r={14} seq={18} tone={tone} />
    </StitchArt>
  );
}

/* ---------- Bloom cluster ---------- */
export function Cluster({ tone = "rose", className = "" }: { tone?: Tone; className?: string }) {
  return (
    <StitchArt viewBox="0 0 220 170" className={`cluster thread-${tone} ${className}`} speed={0.85}>
      <Leaf x={40} y={110} rot={-150} L={38} seq={1} tone={tone} />
      <Leaf x={150} y={120} rot={-20} L={36} seq={2} tone={tone} />
      <Leaf x={100} y={40} rot={-100} L={34} seq={3} tone={tone} />
      <Leaf x={70} y={140} rot={70} L={30} seq={4} tone={tone} />
      <Bloom x={74} y={84} r={22} seq={5} tone={tone} dur={520} />
      <Bloom x={148} y={64} r={17} seq={6} tone={tone} />
      <Bloom x={128} y={128} r={13} seq={7} tone={tone} />
      <Knot x={170} y={100} seq={8} />
      <Knot x={40} y={60} seq={9} />
      <Knot x={190} y={140} seq={10} />
    </StitchArt>
  );
}

/** A vine stitched across the page between two sections. */
export function Divider({ tone = "rose" }: { tone?: Tone }) {
  return (
    <div className="divider" aria-hidden="true">
      <Vine tone={tone} />
    </div>
  );
}
