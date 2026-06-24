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
    <linearGradient id="amber" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFD23D"/>
      <stop offset="40%" stop-color="#FFB000"/>
      <stop offset="100%" stop-color="#FF7A00"/>
    </linearGradient>
    <linearGradient id="amberV" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFD23D"/>
      <stop offset="100%" stop-color="#FF7A00"/>
    </linearGradient>
    <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7CCBFF"/>
      <stop offset="100%" stop-color="#2E97F0"/>
    </linearGradient>
    <linearGradient id="steelDark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3DA9FC"/>
      <stop offset="100%" stop-color="#1C6FB5"/>
    </linearGradient>
    <linearGradient id="amberDark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#E08800"/>
      <stop offset="100%" stop-color="#B85E00"/>
    </linearGradient>
    <radialGradient id="bg" cx="50%" cy="35%" r="80%">
      <stop offset="0%" stop-color="#16202E"/>
      <stop offset="100%" stop-color="#080B11"/>
    </radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="7" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="glowBig" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="12" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;

function tile() {
  return `<rect x="2" y="2" width="196" height="196" rx="44" fill="url(#bg)"/>
          <rect x="2.5" y="2.5" width="195" height="195" rx="43.5" fill="none" stroke="#26313f" stroke-width="1.5"/>`;
}

// ---------- Concept A: ASCEND (double chevron, upward motion) ----------
function markAscend() {
  return `
  ${tile()}
  <g filter="url(#glowBig)" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="44,118 100,58 156,118" stroke="url(#steelDark)" stroke-width="24" opacity="0.95"/>
    <polyline points="44,150 100,90 156,150" stroke="url(#amber)" stroke-width="26"/>
  </g>`;
}

// ---------- Concept B: NEXUS X (crossed blades + glowing core) ----------
function blade(L = 94, t = 15, tp = 16) {
  const x0 = 100 - L, x1 = 100 - L + tp, x2 = 100 + L - tp, x3 = 100 + L;
  return `${x0},100 ${x1},${100 - t} ${x2},${100 - t} ${x3},100 ${x2},${100 + t} ${x1},${100 + t}`;
}
function markNexus() {
  return `
  ${tile()}
  <g filter="url(#glow)">
    <polygon points="${blade()}" fill="url(#steel)" transform="rotate(-45 100 100)"/>
    <polygon points="${blade()}" fill="url(#amber)" transform="rotate(45 100 100)"/>
    <circle cx="100" cy="100" r="13" fill="#0A0E14"/>
    <circle cx="100" cy="100" r="8.5" fill="#FFE08A"/>
  </g>`;
}

// ---------- Concept C: PRISM (isometric cube, dimensional) ----------
function markPrism() {
  // iso cube centered ~100,100
  const top = "100,38 152,68 100,98 48,68";
  const left = "48,68 100,98 100,158 48,128";
  const right = "152,68 100,98 100,158 152,128";
  return `
  ${tile()}
  <g filter="url(#glow)">
    <polygon points="${left}" fill="url(#steelDark)"/>
    <polygon points="${right}" fill="url(#amberDark)"/>
    <polygon points="${top}" fill="url(#amber)"/>
    <polyline points="100,98 100,158" fill="none" stroke="#0A0E14" stroke-width="2.5" opacity="0.35"/>
    <polyline points="48,68 100,98 152,68" fill="none" stroke="#FFE9B8" stroke-width="2" opacity="0.5"/>
  </g>`;
}

// ---------- Concept D: BOLT-T (energy mark, T + forward slash) ----------
function markBoltT() {
  return `
  ${tile()}
  <g filter="url(#glow)">
    <!-- crossbar -->
    <path d="M52 56 L150 56 L150 80 L52 80 Z" fill="url(#steel)"/>
    <!-- dynamic stem leaning forward -->
    <path d="M112 56 L150 56 L96 156 L58 156 Z" fill="url(#amber)"/>
    <path d="M112 56 L150 56 L131 96 L93 96 Z" fill="#FFE08A" opacity="0.35"/>
  </g>`;
}

const icons = {
  "concept-a-ascend.svg": markAscend(),
  "concept-b-nexus.svg": markNexus(),
  "concept-c-prism.svg": markPrism(),
  "concept-d-boltt.svg": markBoltT(),
};

const wm = textPath(grotesk, "TERRANEX", 150, 1);
const left = textPath(grotesk, "TERRA", 150, 1);
const adv = left.width + 1;
const right = textPath(grotesk, "NEX", 150, 1);

function lockup(markFn, name) {
  const markBox = 200, scale = 0.6, mw = markBox * scale, gap = 36, pad = 34;
  const wmScale = (mw * 1.0) / wm.height, wmW = wm.width * wmScale, wmH = wm.height * wmScale;
  const contentH = Math.max(mw, wmH);
  const W = pad + mw + gap + wmW + pad;
  const H = pad + contentH + pad;
  return `<svg width="${Math.round(W)}" height="${Math.round(H)}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <rect width="${W}" height="${H}" rx="30" fill="url(#bg)"/>
  <g transform="translate(${pad},${pad + (contentH - mw) / 2}) scale(${scale})">${markFn()}</g>
  <g transform="translate(${pad + mw + gap},${pad + (contentH - wmH) / 2}) scale(${wmScale})">
    <g transform="translate(0,${150})">
      <path d="${left.d}" transform="translate(0,${-150})" fill="#EEF3FA"/>
      <path d="${right.d}" transform="translate(${adv},${-150})" fill="url(#amber)"/>
    </g>
  </g>
</svg>`;
}

const wrap = (inner) => `<svg width="512" height="512" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${defs}${inner}</svg>`;

const files = {};
for (const [name, inner] of Object.entries(icons)) files[name] = wrap(inner);
files["lockup-ascend.svg"] = lockup(markAscend, "ascend");
files["lockup-nexus.svg"] = lockup(markNexus, "nexus");
files["lockup-prism.svg"] = lockup(markPrism, "prism");
files["lockup-boltt.svg"] = lockup(markBoltT, "boltt");

for (const [name, svg] of Object.entries(files)) writeFileSync(name, svg);

const renders = [
  ...Object.keys(icons).map((n) => [n, n.replace(".svg", ".png"), 512]),
  ["lockup-ascend.svg", "lockup-ascend.png", 1400],
  ["lockup-nexus.svg", "lockup-nexus.png", 1400],
  ["lockup-prism.svg", "lockup-prism.png", 1400],
  ["lockup-boltt.svg", "lockup-boltt.png", 1400],
];
for (const [src, out, w] of renders) {
  await sharp(Buffer.from(files[src]), { density: 400 }).resize({ width: w }).png().toFile(out);
  console.log("rendered", out);
}
