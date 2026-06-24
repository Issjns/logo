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

  // Tapered, fading speed lines streaming off the lower-LEFT, tucked behind
  // the stem's left edge so they read as motion — NOT as a cross-stroke.
  const trails = `
    <g stroke-linecap="round" fill="none">
      <line x1="16" y1="118" x2="88" y2="118" stroke="url(#${trailGrad})" stroke-width="9"  opacity="0.5"/>
      <line x1="8"  y1="140" x2="90" y2="140" stroke="url(#${trailGrad})" stroke-width="13" opacity="0.85"/>
      <line x1="22" y1="162" x2="89" y2="162" stroke="url(#${trailGrad})" stroke-width="10" opacity="0.65"/>
    </g>`;

  // The T: a bold horizontal crossbar with a PERFECTLY VERTICAL, CENTERED
  // stem so it reads unmistakably as a "T" (not a "7"). Amber, with a
  // bright leading-edge highlight for depth.
  const t = `
    <g filter="url(#${drop})">
      <!-- crossbar -->
      <path d="M34 40 L176 40 L176 74 L34 74 Z" fill="url(#amberFlat)"/>
      <!-- vertical centered stem -->
      <path d="M86 40 L124 40 L124 178 L86 178 Z" fill="url(#amber)"/>
      <!-- crossbar top bevel highlight -->
      <path d="M34 40 L176 40 L176 50 L34 50 Z" fill="#FFE49A" opacity="0.45"/>
      <!-- stem right-edge highlight -->
      <path d="M114 40 L124 40 L124 178 L114 178 Z" fill="#FFE08A" opacity="0.5"/>
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
