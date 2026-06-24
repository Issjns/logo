import TextToSVG from "text-to-svg";
import sharp from "sharp";
import { writeFileSync } from "fs";

const grotesk = TextToSVG.loadSync("./SpaceGrotesk-Bold.ttf");

function textPath(engine, text, fontSize, tracking = 0) {
  const options = { x: 0, y: 0, fontSize, anchor: "left top", kerning: true, letterSpacing: tracking };
  return { d: engine.getD(text, options), ...engine.getMetrics(text, options) };
}

const defs = `
  <defs>
    <linearGradient id="amber" x1="0" y1="0" x2="0.7" y2="1">
      <stop offset="0%" stop-color="#FFD23D"/>
      <stop offset="45%" stop-color="#FFB000"/>
      <stop offset="100%" stop-color="#FF7A00"/>
    </linearGradient>
    <linearGradient id="amberFlat" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FFC21A"/>
      <stop offset="100%" stop-color="#FF8A00"/>
    </linearGradient>
    <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0.5">
      <stop offset="0%" stop-color="#7CCBFF"/>
      <stop offset="100%" stop-color="#2E97F0"/>
    </linearGradient>
    <linearGradient id="steelV" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6FC2FF"/>
      <stop offset="100%" stop-color="#2585DC"/>
    </linearGradient>
    <radialGradient id="bg" cx="50%" cy="32%" r="85%">
      <stop offset="0%" stop-color="#172333"/>
      <stop offset="100%" stop-color="#070A10"/>
    </radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000000" flood-opacity="0.45"/>
    </filter>
  </defs>`;

function tile() {
  return `<rect x="2" y="2" width="196" height="196" rx="46" fill="url(#bg)"/>
          <rect x="3" y="3" width="194" height="194" rx="45" fill="none" stroke="#2b3947" stroke-width="1.5"/>`;
}

/* ---------- D1: APEX-T  (sharp italic T, steel crossbar wedge + amber stem,
   with a clean angular notch that reads as forward speed) ---------- */
function markApex() {
  return `
  ${tile()}
  <g filter="url(#softShadow)">
    <!-- crossbar: a forward-tilted wedge -->
    <path d="M40 50 L162 50 L150 82 L52 82 Z" fill="url(#steel)"/>
    <!-- bevel highlight on crossbar -->
    <path d="M40 50 L162 50 L158 60 L43 60 Z" fill="#BFE6FF" opacity="0.35"/>
    <!-- stem: bold forward-leaning blade -->
    <path d="M116 50 L150 50 L104 168 L70 168 Z" fill="url(#amber)"/>
    <!-- inner speed cut (dark) -->
    <path d="M120 62 L132 62 L100 144 L88 144 Z" fill="url(#bg)" opacity="0.55"/>
    <!-- bright leading edge -->
    <path d="M141 50 L150 50 L104 168 L96 168 Z" fill="#FFE08A" opacity="0.5"/>
  </g>`;
}

/* ---------- D2: VOLT-T  (T whose stem is carved by a lightning bolt) ---------- */
function markVolt() {
  // amber T block with a lightning bolt cut out via evenodd
  const tBlock =
    "M44 52 L156 52 L156 82 L116 82 L116 166 L84 166 L84 82 L44 82 Z";
  const bolt =
    "M108 88 L82 124 L98 124 L92 158 L120 116 L104 116 L114 88 Z";
  return `
  ${tile()}
  <g filter="url(#softShadow)">
    <!-- crossbar steel -->
    <path d="M44 52 L156 52 L156 82 L44 82 Z" fill="url(#steel)"/>
    <!-- stem amber with bolt cutout -->
    <path d="${tBlock} ${bolt}" fill="url(#amber)" fill-rule="evenodd"/>
  </g>
  <!-- glowing bolt sitting in the cut -->
  <g filter="url(#glow)">
    <path d="${bolt}" fill="#FFE7A0"/>
  </g>`;
}

/* ---------- D3: VELOCITY-T  (amber T with steel motion trails) ---------- */
function markVelocity() {
  return `
  ${tile()}
  <!-- motion trails behind -->
  <g opacity="0.9">
    <path d="M34 96 L150 96 L150 110 L34 110 Z" fill="url(#steel)" opacity="0.30"/>
    <path d="M40 118 L150 118 L150 132 L40 132 Z" fill="url(#steel)" opacity="0.45"/>
    <path d="M46 140 L150 140 L150 154 L46 154 Z" fill="url(#steel)" opacity="0.65"/>
  </g>
  <g filter="url(#softShadow)">
    <!-- crossbar -->
    <path d="M52 50 L166 50 L154 80 L52 80 Z" fill="url(#amberFlat)"/>
    <!-- stem leaning forward -->
    <path d="M112 50 L154 50 L112 168 L78 168 Z" fill="url(#amber)"/>
    <path d="M138 50 L154 50 L120 144 L108 144 Z" fill="#FFE08A" opacity="0.45"/>
  </g>`;
}

/* ---------- D4: TERRA-T  (T rising from a terrain horizon — ties to "Terra") ---------- */
function markTerra() {
  return `
  ${tile()}
  <!-- terrain ridge -->
  <g>
    <path d="M30 150 L78 116 L112 138 L170 96 L170 168 L30 168 Z" fill="url(#steelV)" opacity="0.85"/>
    <path d="M30 150 L78 116 L112 138 L170 96" fill="none" stroke="#BFE6FF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>
  </g>
  <g filter="url(#softShadow)">
    <!-- crossbar -->
    <path d="M50 44 L156 44 L156 72 L50 72 Z" fill="url(#amberFlat)"/>
    <!-- stem (slight forward lean) down into terrain -->
    <path d="M114 44 L150 44 L112 150 L80 150 Z" fill="url(#amber)"/>
    <path d="M138 44 L150 44 L118 132 L107 132 Z" fill="#FFE08A" opacity="0.45"/>
  </g>`;
}

const icons = {
  "d1-apex.svg": markApex(),
  "d2-volt.svg": markVolt(),
  "d3-velocity.svg": markVelocity(),
  "d4-terra.svg": markTerra(),
};

const wm = textPath(grotesk, "TERRANEX", 150, 1);
const left = textPath(grotesk, "TERRA", 150, 1);
const adv = left.width + 1;
const right = textPath(grotesk, "NEX", 150, 1);

function lockup(markFn) {
  const markBox = 200, scale = 0.62, mw = markBox * scale, gap = 34, pad = 34;
  const wmScale = (mw * 0.9) / wm.height, wmW = wm.width * wmScale, wmH = wm.height * wmScale;
  const contentH = Math.max(mw, wmH);
  const W = pad + mw + gap + wmW + pad;
  const H = pad + contentH + pad;
  return `<svg width="${Math.round(W)}" height="${Math.round(H)}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <rect width="${W}" height="${H}" rx="30" fill="url(#bg)"/>
  <g transform="translate(${pad},${pad + (contentH - mw) / 2}) scale(${scale})">${markFn()}</g>
  <g transform="translate(${pad + mw + gap},${pad + (contentH - wmH) / 2}) scale(${wmScale})">
    <g transform="translate(0,150)">
      <path d="${left.d}" transform="translate(0,-150)" fill="#EEF3FA"/>
      <path d="${right.d}" transform="translate(${adv},-150)" fill="url(#amberFlat)"/>
    </g>
  </g>
</svg>`;
}

const wrap = (inner) => `<svg width="512" height="512" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${defs}${inner}</svg>`;

const files = {};
for (const [name, inner] of Object.entries(icons)) files[name] = wrap(inner);
files["lockup-d1-apex.svg"] = lockup(markApex);
files["lockup-d2-volt.svg"] = lockup(markVolt);
files["lockup-d3-velocity.svg"] = lockup(markVelocity);
files["lockup-d4-terra.svg"] = lockup(markTerra);

for (const [name, svg] of Object.entries(files)) writeFileSync(name, svg);

const renders = [
  ...Object.keys(icons).map((n) => [n, n.replace(".svg", ".png"), 512]),
  ["lockup-d1-apex.svg", "lockup-d1-apex.png", 1400],
  ["lockup-d2-volt.svg", "lockup-d2-volt.png", 1400],
  ["lockup-d3-velocity.svg", "lockup-d3-velocity.png", 1400],
  ["lockup-d4-terra.svg", "lockup-d4-terra.png", 1400],
];
for (const [src, out, w] of renders) {
  await sharp(Buffer.from(files[src]), { density: 400 }).resize({ width: w }).png().toFile(out);
  console.log("rendered", out);
}
