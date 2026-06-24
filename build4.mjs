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
    <linearGradient id="amber" x1="0.15" y1="0" x2="0.7" y2="1">
      <stop offset="0%" stop-color="#FFD23D"/>
      <stop offset="42%" stop-color="#FFB000"/>
      <stop offset="100%" stop-color="#FF7A00"/>
    </linearGradient>
    <linearGradient id="amberFlat" x1="0" y1="0" x2="1" y2="0.2">
      <stop offset="0%" stop-color="#FFC21A"/>
      <stop offset="100%" stop-color="#FF8A00"/>
    </linearGradient>
    <!-- motion trail gradient: fades from transparent (left) to steel (right) -->
    <linearGradient id="trailDark" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#3DA9FC" stop-opacity="0"/>
      <stop offset="100%" stop-color="#5CB8FF" stop-opacity="1"/>
    </linearGradient>
    <linearGradient id="trailLight" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#2E97F0" stop-opacity="0"/>
      <stop offset="100%" stop-color="#1C7FD6" stop-opacity="1"/>
    </linearGradient>
    <radialGradient id="bgDark" cx="50%" cy="30%" r="90%">
      <stop offset="0%" stop-color="#172333"/>
      <stop offset="100%" stop-color="#070A10"/>
    </radialGradient>
    <linearGradient id="bgLight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#E8EDF4"/>
    </linearGradient>
    <filter id="glowAmber" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="4.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="dropDark" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
    <filter id="dropLight" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0A0E14" flood-opacity="0.18"/>
    </filter>
  </defs>`;

/* The polished VELOCITY-T mark, drawn in a 200x200 box.
   theme: "dark" | "light" | "transparent"  */
function markVelocity(theme = "dark") {
  const trailGrad = theme === "light" ? "trailLight" : "trailDark";
  const drop = theme === "light" ? "dropLight" : "dropDark";

  // Tapered, fading motion trails streaming off the back (left) of the T.
  // Rounded caps + width variation give a sense of speed.
  const trails = `
    <g stroke-linecap="round" fill="none">
      <line x1="20" y1="104" x2="96"  y2="104" stroke="url(#${trailGrad})" stroke-width="9"  opacity="0.55"/>
      <line x1="12" y1="126" x2="100" y2="126" stroke="url(#${trailGrad})" stroke-width="13" opacity="0.85"/>
      <line x1="24" y1="150" x2="102" y2="150" stroke="url(#${trailGrad})" stroke-width="10" opacity="0.7"/>
      <line x1="38" y1="170" x2="104" y2="170" stroke="url(#${trailGrad})" stroke-width="7"  opacity="0.5"/>
    </g>`;

  // The T: a confident crossbar with a slight forward tilt, and a
  // forward-leaning blade stem. Amber, with a bright leading edge.
  const t = `
    <g filter="url(#${drop})">
      <!-- crossbar -->
      <path d="M40 44 L170 44 L158 76 L40 76 Z" fill="url(#amberFlat)"/>
      <!-- stem descending from the CENTER of the crossbar, leaning forward -->
      <path d="M87 44 L123 44 L139 176 L103 176 Z" fill="url(#amber)"/>
      <!-- crossbar top bevel highlight -->
      <path d="M40 44 L170 44 L166 54 L40 54 Z" fill="#FFE49A" opacity="0.45"/>
      <!-- stem leading-edge highlight -->
      <path d="M113 44 L123 44 L139 176 L129 176 Z" fill="#FFE08A" opacity="0.5"/>
    </g>`;

  // glow only looks good on dark
  const glowOpen = theme === "dark" ? `<g filter="url(#glowAmber)">` : `<g>`;
  return `${trails}\n  ${glowOpen}${t}</g>`;
}

function tileDark() {
  return `<rect x="2" y="2" width="196" height="196" rx="46" fill="url(#bgDark)"/>
          <rect x="3" y="3" width="194" height="194" rx="45" fill="none" stroke="#2b3947" stroke-width="1.5"/>`;
}
function tileLight() {
  return `<rect x="2" y="2" width="196" height="196" rx="46" fill="url(#bgLight)"/>
          <rect x="3" y="3" width="194" height="194" rx="45" fill="none" stroke="#CBD6E6" stroke-width="1.5"/>`;
}

const iconDark = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${defs}${tileDark()}${markVelocity("dark")}</svg>`;
const iconLight = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${defs}${tileLight()}${markVelocity("light")}</svg>`;
const iconTransparent = `<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${defs}${markVelocity("dark")}</svg>`;

// ---------- Wordmark + lockups ----------
const left = textPath(grotesk, "TERRA", 150, 1);
const adv = left.width + 1;
const right = textPath(grotesk, "NEX", 150, 1);
const wmW = left.width + 1 + right.width;
const wmH = 150;

function lockup(theme) {
  const tile = theme === "light" ? tileLight() : tileDark();
  const textLeftColor = theme === "light" ? "#0F1620" : "#EEF3FA";
  const scale = 0.66, mw = 200 * scale, gap = 34, pad = 36;
  const wmScale = (mw * 0.82) / wmH, wmWS = wmW * wmScale, wmHS = wmH * wmScale;
  const contentH = Math.max(mw, wmHS);
  const W = pad + mw + gap + wmWS + pad;
  const H = pad + contentH + pad;
  const bg = theme === "light" ? "url(#bgLight)" : "url(#bgDark)";
  return `<svg width="${Math.round(W)}" height="${Math.round(H)}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${defs}
  <rect width="${W}" height="${H}" rx="30" fill="${bg}"/>
  <g transform="translate(${pad},${pad + (contentH - mw) / 2}) scale(${scale})">${tile}${markVelocity(theme)}</g>
  <g transform="translate(${pad + mw + gap},${pad + (contentH - wmHS) / 2}) scale(${wmScale})">
    <g transform="translate(0,150)">
      <path d="${left.d}" transform="translate(0,-150)" fill="${textLeftColor}"/>
      <path d="${right.d}" transform="translate(${adv},-150)" fill="url(#amberFlat)"/>
    </g>
  </g>
</svg>`;
}

const files = {
  "velocity-mark-dark.svg": iconDark,
  "velocity-mark-light.svg": iconLight,
  "velocity-mark-transparent.svg": iconTransparent,
  "velocity-lockup-dark.svg": lockup("dark"),
  "velocity-lockup-light.svg": lockup("light"),
};
for (const [name, svg] of Object.entries(files)) writeFileSync(name, svg);

const renders = [
  ["velocity-mark-dark.svg", "velocity-mark-512.png", 512],
  ["velocity-mark-dark.svg", "velocity-mark-1024.png", 1024],
  ["velocity-mark-light.svg", "velocity-mark-light-512.png", 512],
  ["velocity-mark-transparent.svg", "velocity-mark-transparent-1024.png", 1024],
  ["velocity-mark-dark.svg", "velocity-favicon-64.png", 64],
  ["velocity-lockup-dark.svg", "velocity-lockup-dark.png", 1600],
  ["velocity-lockup-light.svg", "velocity-lockup-light.png", 1600],
];
for (const [src, out, w] of renders) {
  await sharp(Buffer.from(files[src]), { density: 500 }).resize({ width: w }).png().toFile(out);
  console.log("rendered", out);
}
