import {
  CX, CY, wheelGeometry, petalPath, fitLabel, labelPlacement,
  isLight, inertiaTarget, glow, polar,
} from "./geometry.js";

const INFO_EMPTY = "Выберите сектор, подкатегорию или конкретную ноту на колесе — здесь появится описание.";
const FALLBACK_SHORT = "Описание появится позже.";
const FALLBACK_INFO = "Информация появится позже.";

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function angDelta(from, to) {
  return ((to - from + 540) % 360) - 180;
}

function paras(text) {
  return String(text || "").split("\n").filter((p) => p.trim()).map((p) => `<p>${esc(p)}</p>`).join("") || `<p>${esc(FALLBACK_INFO)}</p>`;
}

function parseRgb(hex) {
  const raw = String(hex || "#cccccc").replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw.padEnd(6, "0").slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return { r: 204, g: 204, b: 204 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function toHex({ r, g, b }) {
  const hx = (c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0");
  return `#${hx(r)}${hx(g)}${hx(b)}`;
}

function mixHex(hex, amount = 0.78) {
  const { r, g, b } = parseRgb(hex);
  const mix = (c) => c + (255 - c) * amount;
  return toHex({ r: mix(r), g: mix(g), b: mix(b) });
}

function mixBlack(hex, amount = 0.25) {
  const { r, g, b } = parseRgb(hex);
  const mix = (c) => c * (1 - amount);
  return toHex({ r: mix(r), g: mix(g), b: mix(b) });
}

function tuneHex(hex, { sat = 1, light = 1 } = {}) {
  let { r, g, b } = parseRgb(hex);
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  s = Math.min(1, Math.max(0, s * sat));
  l = Math.min(1, Math.max(0, l * light));
  const C = s * (1 - Math.abs(2 * l - 1));
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - C / 2;
  let r1 = 0; let g1 = 0; let b1 = 0;
  if (h < 60) [r1, g1, b1] = [C, X, 0];
  else if (h < 120) [r1, g1, b1] = [X, C, 0];
  else if (h < 180) [r1, g1, b1] = [0, C, X];
  else if (h < 240) [r1, g1, b1] = [0, X, C];
  else if (h < 300) [r1, g1, b1] = [X, 0, C];
  else [r1, g1, b1] = [C, 0, X];
  return toHex({ r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255 });
}

const MAIN_GAP = 12;
const MAIN_RADIUS = 24;
const PREVIEW_GAP = 6;
const PREVIEW_RADIUS = 12;
const TILE_FACE_OP = 0.54;
const TILE_PREVIEW_OP = 0.5;
/** Свет сверху-слева (viewBox 800×800). */
const SUN = { x1: 230, y1: 200, x2: 570, y2: 600 };

function createGlassFilterRegistry() {
  const map = new Map();
  const blocks = [];
  return {
    id(hex, hot, compact) {
      const key = `${hex}|${hot ? 1 : 0}|${compact ? 1 : 0}`;
      if (map.has(key)) return map.get(key);
      const id = `glass-fx-${map.size}`;
      blocks.push(acrylicShadowFilter(id, hex, compact, hot ? 0.1 : 0));
      map.set(key, id);
      return id;
    },
    defsHtml() { return blocks.join(""); },
  };
}

function acrylicTileFx(prefix, hex, rIn, rOut, a0, a1, { compact = false, filters = null } = {}) {
  const gl = glow(rIn, rOut, a0, a1);
  const base = hex;
  const edge = tuneHex(hex, { sat: 1.24, light: 0.62 });
  const slab = tuneHex(hex, { sat: 1.18, light: 0.48 });
  const fillId = `${prefix}-fill`;
  const rimId = `${prefix}-rim`;
  const rimLightId = `${prefix}-rim-hi`;
  const clipId = `${prefix}-clip`;
  const filterId = filters ? filters.id(base, false, compact) : `${prefix}-fx`;
  const filterHotId = filters ? filters.id(base, true, compact) : `${prefix}-fx-hot`;
  const defs =
    `<radialGradient id="${fillId}" cx="${gl.cx}" cy="${gl.cy}" r="${Math.max(28, gl.r * 0.95)}" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0%" stop-color="${base}" stop-opacity="0.14"></stop>` +
    `<stop offset="50%" stop-color="${base}" stop-opacity="0.38"></stop>` +
    `<stop offset="82%" stop-color="${base}" stop-opacity="0.58"></stop>` +
    `<stop offset="100%" stop-color="${edge}" stop-opacity="0.88"></stop>` +
    `</radialGradient>` +
    `<linearGradient id="${rimId}" gradientUnits="userSpaceOnUse" x1="${SUN.x1}" y1="${SUN.y1}" x2="${SUN.x2}" y2="${SUN.y2}">` +
    `<stop offset="0%" stop-color="${edge}" stop-opacity="0.98"></stop>` +
    `<stop offset="42%" stop-color="${base}" stop-opacity="0.55"></stop>` +
    `<stop offset="100%" stop-color="${mixBlack(base, 0.35)}" stop-opacity="0.95"></stop>` +
    `</linearGradient>` +
    `<linearGradient id="${rimLightId}" gradientUnits="userSpaceOnUse" x1="${SUN.x1}" y1="${SUN.y1}" x2="${SUN.x2}" y2="${SUN.y2}">` +
    `<stop offset="0%" stop-color="#ffffff" stop-opacity="0.88"></stop>` +
    `<stop offset="28%" stop-color="#ffffff" stop-opacity="0.22"></stop>` +
    `<stop offset="100%" stop-color="#ffffff" stop-opacity="0"></stop>` +
    `</linearGradient>` +
    (filters ? "" : acrylicShadowFilter(filterId, base, compact, 0) + acrylicShadowFilter(filterHotId, base, compact, 0.1));
  return { defs, fillId, rimId, rimLightId, clipId, slab, hex: base, filterId, filterHotId };
}

function acrylicShadowFilter(id, hex, compact, boost) {
  const dx = compact ? 5 : 8;
  const dy = compact ? 6 : 10;
  const dev = compact ? 2.4 : 3.8;
  const col = (0.62 + boost).toFixed(3);
  const caustic = (0.44 + boost * 0.4).toFixed(3);
  return `<filter id="${id}" x="-100%" y="-100%" width="300%" height="300%" color-interpolation-filters="sRGB">` +
    `<feDropShadow dx="${dx}" dy="${dy}" stdDeviation="${dev}" flood-color="${hex}" flood-opacity="${col}"></feDropShadow>` +
    `<feDropShadow dx="${(dx * 0.65).toFixed(1)}" dy="${(dy * 0.7).toFixed(1)}" stdDeviation="1" flood-color="${hex}" flood-opacity="${caustic}"></feDropShadow>` +
    `</filter>`;
}

const GLASS_CONTACT_FILTER = "glass-contact-edge";

function glassContactFilterDef() {
  return `<filter id="${GLASS_CONTACT_FILTER}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">` +
    `<feDropShadow dx="1" dy="1.4" stdDeviation="0.4" flood-color="#121212" flood-opacity="0.17"></feDropShadow>` +
    `</filter>`;
}

function glassTileDefs(d, fx) {
  return `<clipPath id="${fx.clipId}"><path d="${d}"></path></clipPath>${fx.defs}`;
}

function glassTileLayers(d, fx, baseOp, compact, hex) {
  const slabDx = compact ? 1.6 : 2.6;
  const slabDy = compact ? 2.2 : 3.4;
  const castDx = compact ? 10 : 16;
  const castDy = compact ? 12 : 18;
  const rimW = compact ? 3.6 : 5.2;
  const hiW = compact ? 1.15 : 1.55;
  return `<g class="glass-tile">` +
    `<path class="glass-cast" d="${d}" fill="${hex}" fill-opacity="0.36" transform="translate(${castDx} ${castDy})" filter="url(#${fx.filterId})"></path>` +
    `<g class="glass-body" filter="url(#${GLASS_CONTACT_FILTER})">` +
    `<g clip-path="url(#${fx.clipId})">` +
    `<path class="glass-slab" d="${d}" fill="${fx.slab}" fill-opacity="0.58" transform="translate(${slabDx} ${slabDy})"></path>` +
    `<path class="glass-fill" d="${d}" fill="url(#${fx.fillId})" fill-opacity="${baseOp}"></path>` +
    `<path class="glass-rim" d="${d}" fill="none" stroke="url(#${fx.rimId})" stroke-width="${rimW}" stroke-linejoin="round"></path>` +
    `<path class="glass-rim-hi" d="${d}" fill="none" stroke="url(#${fx.rimLightId})" stroke-width="${hiW}" stroke-linejoin="round"></path>` +
    `</g></g></g>`;
}

function glassEdgeSparks(rIn, rOut, a0, a1, compact) {
  const span = a1 - a0;
  const aOut = a0 + span * 0.17;
  const aIn = a0 + span * 0.11;
  const p0 = polar(CX, CY, rOut - 5, aOut);
  const p1 = polar(CX, CY, rOut - 2, aOut + 2.2);
  const sw = compact ? 0.7 : 1;
  let html = `<g class="glass-spark" pointer-events="none">` +
    `<line x1="${p0.x.toFixed(2)}" y1="${p0.y.toFixed(2)}" x2="${p1.x.toFixed(2)}" y2="${p1.y.toFixed(2)}" stroke="#ffffff" stroke-opacity="0.94" stroke-width="${sw}" stroke-linecap="round"></line>`;
  const p2 = polar(CX, CY, rIn + (rOut - rIn) * 0.28, aIn);
  html += `<line x1="${(p2.x - 1.8).toFixed(2)}" y1="${(p2.y + 0.6).toFixed(2)}" x2="${(p2.x + 2.2).toFixed(2)}" y2="${(p2.y - 1.4).toFixed(2)}" stroke="#ffffff" stroke-opacity="0.78" stroke-width="${compact ? 0.55 : 0.75}" stroke-linecap="round"></line>`;
  if (!compact) {
    const aEdge = a0 + span * 0.32;
    const e0 = polar(CX, CY, rOut - 8, aEdge);
    const e1 = polar(CX, CY, rOut - 5, aEdge + 3.5);
    html += `<line x1="${e0.x.toFixed(2)}" y1="${e0.y.toFixed(2)}" x2="${e1.x.toFixed(2)}" y2="${e1.y.toFixed(2)}" stroke="#ffffff" stroke-opacity="0.55" stroke-width="0.65" stroke-linecap="round"></line>`;
  }
  return `${html}</g>`;
}

function cssText() {
  return `
:host {
  --fw-font-family: Mulish, "Mulish Fallback", Arial, sans-serif;
  --fw-max-width: 1280px;
  --fw-bg: transparent;
  --fw-ink: #000000;
  /* Размер колеса только от viewport — не от контента панели/уровня. */
  --fw-wheel-size: min(600px, calc(100vw - 40px), calc(100vh - 160px));
  --fw-trail-slot: 44px;
  display: block;
  width: 100%;
  min-width: 0;
  align-self: flex-start;
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  outline: none;
  max-width: var(--fw-max-width);
  margin: 0 auto;
  background: var(--fw-bg);
  color: var(--fw-ink);
  font-family: var(--fw-font-family);
  position: relative;
}
:host([data-layout="wide"]) {
  --fw-wheel-size: min(700px, calc(100vw - 420px), calc(100vh - 96px));
}
:host *, :host *::before, :host *::after { box-sizing: border-box; }
.stage { position: relative; width: 100%; }
:host([data-layout="wide"]) .stage {
  min-height: calc(100dvh - 64px);
  display: flex;
  align-items: center;
}
.wrap { position: relative; z-index: 1; width: 100%; padding: 0; }
.grid {
  display: grid; grid-template-columns: minmax(0, 1fr); align-items: start; gap: 0;
  width: 100%;
}
:host([data-layout="wide"]) .grid {
  grid-template-columns: var(--fw-wheel-size) minmax(260px, 1fr);
  gap: 0 40px; align-items: start;
}
.wheel-col {
  order: 1; display: flex; width: var(--fw-wheel-size); max-width: 100%;
  min-width: 0; flex-direction: column; align-items: center;
  flex: 0 0 auto;
  position: relative;
  padding-top: calc(var(--fw-trail-slot) + 12px);
}
.panel {
  order: 2; width: 100%; margin-top: 20px; min-width: 0; min-height: 0;
  align-self: start;
}
:host([data-layout="wide"]) .panel {
  margin-top: 0;
  max-height: calc(var(--fw-wheel-size) + var(--fw-trail-slot) + 12px);
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.trail {
  position: absolute; top: 0; left: 0; right: 0;
  height: var(--fw-trail-slot);
  width: 100%; max-width: var(--fw-wheel-size); margin: 0 auto;
  display: flex; flex-wrap: nowrap; align-items: center; gap: 8px;
  overflow: hidden;
}
.trail:empty {
  visibility: hidden;
  pointer-events: none;
}
.trail-crumb {
  border: 0; border-radius: 999px; padding: 10px 14px;
  font: 600 13px/1 var(--fw-font-family); letter-spacing: -0.5px;
  color: #000000;
  cursor: pointer; transition: filter .2s ease, transform .2s ease, box-shadow .2s ease;
}
.trail-crumb:hover { filter: brightness(1.06); transform: scale(1.03); }
.trail-crumb.is-current { cursor: default; box-shadow: 0 8px 20px rgba(0,0,0,.14); }
.trail-crumb.is-current:hover { filter: none; transform: none; }
.trail-sep { color: #000000; opacity: .35; font-size: 13px; font-weight: 600; }
.wheel-box {
  width: var(--fw-wheel-size);
  max-width: 100%;
  margin: 0 auto;
  flex: 0 0 auto;
  aspect-ratio: 1;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  border-radius: 50%;
  background:
    linear-gradient(128deg, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0) 38%),
    linear-gradient(152deg, #f3f1ec 0%, #ebe8e2 55%, #e3dfd8 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
}
:host([data-layout="wide"]) .wheel-box { margin: 0; }
svg.wheel {
  display: block; width: 100%; height: auto; overflow: visible;
  touch-action: none; cursor: grab;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}
svg.wheel * {
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}
svg.wheel:focus { outline: none; }
svg.wheel:focus-visible {
  outline: 2px solid rgba(0, 0, 0, 0.35);
  outline-offset: 6px;
}
svg.wheel:focus:not(:focus-visible) { outline: none; }
svg.wheel.is-dragging { cursor: grabbing; }
.seg {
  cursor: pointer; outline: none; isolation: isolate;
  transform-box: view-box; transform-origin: 400px 400px;
  transition: transform .2s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}
.seg:focus { outline: none; }
.seg:focus:not(:focus-visible) { outline: none; }
.seg:focus-visible { outline: none; }
.seg .seg-focus-ring {
  pointer-events: none;
  fill: none;
  stroke: rgba(0, 0, 0, 0.55);
  stroke-width: 2.5;
  stroke-linejoin: round;
  visibility: hidden;
}
.seg:focus-visible .seg-focus-ring { visibility: visible; }
.seg.is-hot { transform: scale(1.03); }
.seg .glass-fill { transition: fill-opacity .2s ease; }
.seg .glass-spark { pointer-events: none; }
.seg text {
  pointer-events: none;
  fill: #000000;
  stroke: none;
  paint-order: normal;
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}
.seg text::selection { background: transparent; }
.center-hit {
  cursor: default; outline: none;
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  touch-action: manipulation;
  transform-box: view-box; transform-origin: 400px 400px;
  transition: transform .2s ease, opacity .2s ease;
}
.center-hit text {
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}
.center-hit .center-focus-ring {
  pointer-events: none;
  fill: none;
  stroke: rgba(0, 0, 0, 0.45);
  stroke-width: 2.5;
  visibility: hidden;
}
.center-hit:focus-visible .center-focus-ring { visibility: visible; }
.center-hit.is-back { cursor: pointer; }
.center-hit:focus:not(:focus-visible) { outline: none; }
.center-hit.is-back:hover, .center-hit.is-back:focus-visible { transform: scale(1.04); opacity: .92; }
.center-hit circle.center-disc {
  fill: #ffffff;
  stroke: rgba(0,0,0,.08);
  stroke-width: 1.2;
}
.sheet {
  border-radius: 28px; overflow: hidden;
  background: #ffffff;
  box-shadow: 0 18px 48px rgba(0,0,0,.1);
  border: 1px solid rgba(0,0,0,.08);
  color: #000000;
}
.sheet-head {
  padding: 24px 24px 20px;
  color: #000000;
  background: #f5f5f2;
  box-shadow: inset 0 -1px 0 rgba(0,0,0,.06);
  border-left: 6px solid var(--sheet-accent, #000000);
}
.sheet-head h2 {
  margin: 0 0 10px; font-size: 24px; font-weight: 700;
  line-height: 1.15; letter-spacing: -1.2px;
  color: #000000;
}
.sheet-head .lead {
  margin: 0; font-size: 16px; font-weight: 500; line-height: 1.5; letter-spacing: -0.6px;
  color: #000000; opacity: .88;
}
.sheet-body { padding: 8px 24px 8px; color: #000000; }
.sheet-section { padding: 16px 0; border-top: 1px solid rgba(0,0,0,.1); }
.sheet-section:first-child { border-top: 0; }
.sheet-section h3 {
  margin: 0 0 8px; font-size: 12px; font-weight: 700;
  letter-spacing: .02em; text-transform: uppercase; color: #000000; opacity: .55;
}
.sheet-section p { margin: 0 0 8px; font-size: 15px; font-weight: 500; line-height: 1.55; letter-spacing: -0.4px; color: #000000; }
.sheet-section p:last-child { margin-bottom: 0; }
.sheet-empty { padding: 28px 24px; color: #000000; }
.sheet-empty h2 {
  margin: 0 0 12px; font-size: 20px; font-weight: 700; letter-spacing: -1px; color: #000000;
}
.sheet-empty p { margin: 0; font-size: 15px; font-weight: 500; line-height: 1.5; letter-spacing: -0.4px; color: #000000; opacity: .72; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  border: 0; border-radius: 32px; padding: 11px 14px;
  font: 600 12px/1 var(--fw-font-family); letter-spacing: -0.5px;
  color: #000000;
  cursor: pointer; transition: filter .2s ease, transform .2s ease;
}
button.chip:hover { filter: brightness(1.08); transform: scale(1.03); }
span.chip { cursor: default; }
.sheet-foot {
  padding: 8px 24px 24px; display: flex; justify-content: stretch;
}
.show-cta {
  width: 100%; border: 0; border-radius: 999px; padding: 16px 20px;
  font: 700 16px/1 var(--fw-font-family); letter-spacing: -0.8px;
  color: #000000; cursor: pointer;
  background: #ecece8;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.08);
  transition: transform .2s ease, filter .2s ease, opacity .2s ease, background .2s ease;
}
.show-cta:hover:not(:disabled) { background: #e2e2dc; transform: translateY(-1px); }
.show-cta:disabled { opacity: .4; cursor: not-allowed; }
.load-msg { padding: 24px; text-align: center; color: #000000; font-weight: 600; }
@media (prefers-reduced-motion: reduce) {
  .seg, .glass-fill, .center-hit, .chip, .trail-crumb, .show-cta { transition: none !important; }
  .seg.is-hot, .center-hit.is-back:hover { transform: none; }
}
`;
}

function filters() {
  const specs = [
    ["wheel-petal-shadow-default", 2, 5, 0.12],
    ["wheel-petal-shadow-selected", 4, 8, 0.18],
    ["wheel-petal-shadow-hover", 6, 12, 0.22],
    ["wheel-preview-shadow", 1, 3, 0.08],
    ["wheel-center-shadow", 2, 6, 0.08],
  ];
  return specs.map(([id, dy, dev, op]) =>
    `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="${dy}" stdDeviation="${dev}" flood-color="#000" flood-opacity="${op}"></feDropShadow></filter>`
  ).join("");
}

class FlavorWheel extends HTMLElement {
  static get observedAttributes() {
    return ["data-src", "initial", "sync-url", "center-text"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.tree = [];
    this.notes = new Map();
    this.selection = {};
    this.viewLevel = 0;
    this.rotation = 0;
    this.velocity = 0;
    this.segmentCount = 5;
    this.geom = wheelGeometry(700);
    this.wheelW = 0;
    this.hot = null;
    this.drag = null;
    this.lastPointerType = "";
    this.suppressClick = false;
    this.inertiaRaf = 0;
    this.urlTimer = 0;
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.fxCompact = false;
  }

  get syncUrl() {
    return this.getAttribute("sync-url") === "true";
  }

  connectedCallback() {
    if (this._booted) return;
    this._booted = true;
    this.installFonts();
    this.renderShell();
    this.bind();
    this.watch();
    this.load();
  }

  disconnectedCallback() {
    this.ro?.disconnect();
    this.hostRo?.disconnect();
    cancelAnimationFrame(this.inertiaRaf);
    clearTimeout(this.urlTimer);
  }

  attributeChangedCallback(name) {
    if (!this._booted || !this.tree.length) return;
    if (name === "data-src") { this.load(); return; }
    if (name === "center-text") this.renderCenter();
    if (name === "initial" || name === "sync-url") {
      this.applyInitial();
      this.afterNav(true);
    }
  }

  installFonts() {
    if (document.getElementById("flavor-wheel-fonts")) return;
    const file = (name) => new URL(`./fonts/${name}`, import.meta.url).href;
    const face = (weight, subset, range) => `@font-face{font-family:Mulish;font-style:normal;font-weight:${weight};font-display:swap;src:url("${file(`mulish-${subset}-${weight}-normal.woff2`)}") format("woff2");unicode-range:${range};}`;
    const cyr = "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116";
    const lat = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
    let css = `@font-face{font-family:"Mulish Fallback";src:local("Arial");size-adjust:105%;ascent-override:95.71%;descent-override:23.81%;}`;
    for (const w of [400, 500, 600, 700]) css += face(w, "cyrillic", cyr) + face(w, "latin", lat);
    const style = document.createElement("style");
    style.id = "flavor-wheel-fonts";
    style.textContent = css;
    document.head.appendChild(style);
  }

  renderShell() {
    this.shadowRoot.innerHTML = `
      <style>${cssText()}</style>
      <div class="stage">
        <div class="wrap">
          <div class="grid" data-testid="taste-wheel-grid">
            <div class="wheel-col">
              <nav class="trail" data-testid="wheel-trail" aria-label="Путь выбора"></nav>
              <div class="wheel-box" data-testid="wheel-filter">
                <svg class="wheel" tabindex="-1" viewBox="0 0 800 800" role="img" aria-label="Колесо вкусов — фильтр по нотам (потяните для вращения)">
                  <title>Колесо вкусов</title>
                  <defs>${filters()}</defs>
                  <g class="rotor" transform="rotate(0 400 400)"></g>
                  <g class="center-layer"></g>
                </svg>
              </div>
            </div>
            <div class="panel" data-testid="wheel-info-panel"></div>
          </div>
        </div>
      </div>`;
    this.svg = this.shadowRoot.querySelector("svg.wheel");
    this.rotor = this.shadowRoot.querySelector(".rotor");
    this.centerLayer = this.shadowRoot.querySelector(".center-layer");
    this.wheelBox = this.shadowRoot.querySelector(".wheel-box");
    this.panelEl = this.shadowRoot.querySelector(".panel");
    this.trailEl = this.shadowRoot.querySelector(".trail");
  }

  bind() {
    this.svg.addEventListener("pointerdown", (e) => this.onDown(e));
    this.svg.addEventListener("pointermove", (e) => this.onMove(e));
    this.svg.addEventListener("pointerup", (e) => this.onUp(e));
    this.svg.addEventListener("pointercancel", () => { this.drag = null; this.svg.classList.remove("is-dragging"); });
    this.svg.addEventListener("pointerover", (e) => {
      const seg = e.target.closest?.(".seg");
      if (!seg || seg === this.hot) return;
      this.hot = seg;
      this.paintSeg(seg);
    });
    this.svg.addEventListener("pointerout", (e) => {
      const seg = e.target.closest?.(".seg");
      if (!seg) return;
      if (e.relatedTarget && seg.contains(e.relatedTarget)) return;
      if (this.hot === seg) this.hot = null;
      this.paintSeg(seg);
    });
    this.svg.addEventListener("focusin", (e) => {
      const seg = e.target.closest?.(".seg");
      if (!seg) return;
      this.hot = seg;
      this.paintSeg(seg);
    });
    this.svg.addEventListener("focusout", (e) => {
      const seg = e.target.closest?.(".seg");
      if (!seg) return;
      if (this.hot === seg) this.hot = null;
      this.paintSeg(seg);
    });
    this.shadowRoot.addEventListener("click", (e) => this.onClick(e));
    this.shadowRoot.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const center = e.target.closest?.(".center-hit");
      if (center?.classList.contains("is-back")) {
        e.preventDefault();
        this.back();
        return;
      }
      const seg = e.target.closest?.(".seg");
      if (!seg) return;
      e.preventDefault();
      this.onSegment(seg);
    });
  }

  watch() {
    const applyHost = () => {
      const w = Math.round(this.getBoundingClientRect().width || this.clientWidth || 0);
      this.dataset.layout = w >= 1280 ? "wide" : "narrow";
      const compact = w <= 425;
      if (compact) this.setAttribute("data-compact", "");
      else this.removeAttribute("data-compact");
      if (compact !== this.fxCompact) {
        this.fxCompact = compact;
        if (this.tree.length) this.renderWheel();
      }
    };
    this.hostRo = new ResizeObserver(applyHost);
    this.hostRo.observe(this);
    window.addEventListener("resize", applyHost);
    applyHost();
    this.ro = new ResizeObserver(() => {
      const w = this.wheelBox?.clientWidth || 0;
      if (!w || Math.abs(w - this.wheelW) < 0.5) return;
      this.wheelW = w;
      this.geom = wheelGeometry(w);
      this.svg.setAttribute("viewBox", this.geom.viewBox);
      if (this.tree.length) this.renderWheel();
    });
    this.ro.observe(this.wheelBox);
    window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener?.("change", (e) => {
      this.reduced = e.matches;
    });
  }

  async load() {
    try {
      const src = this.getAttribute("data-src") || new URL("./flavor-data.json", import.meta.url).href;
      const data = await fetch(src).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      });
      this.tree = data.tree || [];
      this.notes = new Map((data.notes || []).map((n) => [n.id, n]));
      const ww = this.wheelBox?.clientWidth || 0;
      if (ww) {
        this.wheelW = ww;
        this.geom = wheelGeometry(ww);
      }
      this.applyInitial();
      this.afterNav(true);
    } catch (err) {
      this.panelEl.innerHTML = `<p class="load-msg">Не удалось загрузить данные колеса.</p>`;
      console.error(err);
    }
  }

  applyInitial() {
    let s = null, sub = null, d = null;
    if (this.syncUrl) {
      const q = new URLSearchParams(location.search);
      s = q.get("s"); sub = q.get("sub"); d = q.get("d");
    } else if (this.getAttribute("initial")) {
      const parts = this.getAttribute("initial").split("/");
      s = parts[0] || null; sub = parts[1] || null; d = parts[2] || null;
    }
    this.selection = this.resolve(s, sub, d);
    this.viewLevel = this.levelFrom(this.selection);
    this.rotation = 0;
  }

  resolve(s, sub, d) {
    const sector = this.tree.find((x) => x.slug === s);
    if (!sector) return {};
    const subsector = sector.subsectors.find((x) => x.slug === sub);
    if (!subsector) return { sectorId: sector.id };
    const desc = subsector.descriptors.find((x) => x.slug === d);
    if (!desc) return { sectorId: sector.id, subsectorId: subsector.id };
    return { sectorId: sector.id, subsectorId: subsector.id, descriptorId: desc.id };
  }

  levelFrom(sel) {
    if (sel.descriptorId || sel.subsectorId) return 2;
    if (sel.sectorId) return 1;
    return 0;
  }

  sector() { return this.tree.find((s) => s.id === this.selection.sectorId) || null; }
  subsector() { return this.sector()?.subsectors.find((s) => s.id === this.selection.subsectorId) || null; }
  descriptor() { return this.subsector()?.descriptors.find((d) => d.id === this.selection.descriptorId) || null; }

  centerLines() {
    // viewLevel 0 = старт; 1–2 = «Назад».
    if (this.viewLevel > 0) return ["←", "Назад"];
    const raw = this.getAttribute("center-text");
    if (raw) {
      const parts = raw.split("|").map((p) => p.trim()).filter(Boolean);
      if (parts.length) return parts.slice(0, 2);
    }
    return ["Выберите", "вкус"];
  }

  afterNav(rebuild) {
    this.cancelInertia();
    if (rebuild) {
      this.rotation = 0;
      this.renderWheel();
    } else this.updateSelected();
    this.renderCenter();
    this.renderTrail();
    this.renderPanel();
    this.scheduleUrl();
    this.emit();
  }

  selectSector(sector) {
    this.selection = { sectorId: sector.id };
    this.viewLevel = 1;
    this.vibrate(18);
    this.afterNav(true);
  }

  selectSub(sub) {
    this.selection = { sectorId: this.selection.sectorId || this.sector()?.id, subsectorId: sub.id };
    this.viewLevel = 2;
    this.vibrate(18);
    this.afterNav(true);
  }

  selectDesc(desc) {
    if (this.selection.descriptorId === desc.id) return;
    this.selection = {
      sectorId: this.selection.sectorId,
      subsectorId: this.selection.subsectorId,
      descriptorId: desc.id,
    };
    this.vibrate(12);
    this.afterNav(false);
  }

  back() {
    if (this.viewLevel === 2) {
      this.selection = { sectorId: this.selection.sectorId, subsectorId: this.selection.subsectorId };
      this.viewLevel = 1;
    } else if (this.viewLevel === 1) {
      this.selection = { sectorId: this.selection.sectorId };
      this.viewLevel = 0;
    } else return;
    this.afterNav(true);
  }

  jumpTo(level) {
    if (level <= 0) {
      this.selection = this.selection.sectorId ? { sectorId: this.selection.sectorId } : {};
      this.viewLevel = 0;
    } else if (level === 1) {
      this.selection = { sectorId: this.selection.sectorId };
      this.viewLevel = 1;
    } else {
      this.selection = { sectorId: this.selection.sectorId, subsectorId: this.selection.subsectorId };
      this.viewLevel = 2;
    }
    this.afterNav(true);
  }

  showLots() {
    if (!this.selection.sectorId) return;
    this.dispatchEvent(new CustomEvent("flavor-show", { bubbles: true, composed: true, detail: this.snapshot() }));
    this.panelEl?.scrollIntoView({ behavior: this.reduced ? "auto" : "smooth", block: "nearest" });
  }

  onSegment(seg) {
    if (this.suppressClick) return;
    const id = Number(seg.dataset.id);
    if (this.viewLevel === 0) {
      const sector = this.tree.find((s) => s.id === id);
      if (sector) this.selectSector(sector);
    } else if (this.viewLevel === 1) {
      const sub = this.sector()?.subsectors.find((s) => s.id === id);
      if (sub) this.selectSub(sub);
    } else {
      const desc = this.subsector()?.descriptors.find((d) => d.id === id);
      if (desc) this.selectDesc(desc);
    }
  }

  svgPoint(e) {
    const rect = this.svg.getBoundingClientRect();
    const vb = this.svg.viewBox.baseVal;
    return {
      x: vb.x + ((e.clientX - rect.left) / rect.width) * vb.width,
      y: vb.y + ((e.clientY - rect.top) / rect.height) * vb.height,
    };
  }

  hitCenter(e) {
    if (this.viewLevel <= 0) return false;
    const p = this.svgPoint(e);
    const r = this.geom.innerR - 8;
    return Math.hypot(p.x - CX, p.y - CY) < r;
  }

  onClick(e) {
    if (this.suppressClick) {
      this.suppressClick = false;
      return;
    }
    if (e.target.closest?.(".center-hit.is-back") || (e.target.closest?.("svg.wheel") && this.hitCenter(e) && !e.target.closest?.(".seg"))) {
      if (this.viewLevel > 0 && !e.target.closest?.(".seg")) {
        this.back();
        if (this.isPointerLike(this.lastPointerType)) this.blurPointerFocus();
        return;
      }
    }
    const seg = e.target.closest?.(".seg");
    if (seg) {
      this.onSegment(seg);
      if (this.isPointerLike(this.lastPointerType)) this.blurPointerFocus();
      return;
    }
    const crumb = e.target.closest?.("[data-trail-level]");
    if (crumb) {
      const level = Number(crumb.dataset.trailLevel);
      if (!crumb.classList.contains("is-current")) this.jumpTo(level);
      return;
    }
    const chip = e.target.closest?.("button.chip");
    if (chip) {
      if (chip.dataset.kind === "sub") {
        const sub = this.sector()?.subsectors.find((s) => s.slug === chip.dataset.slug);
        if (sub) this.selectSub(sub);
      } else if (chip.dataset.kind === "desc") {
        const desc = this.subsector()?.descriptors.find((d) => d.slug === chip.dataset.slug);
        if (desc) this.selectDesc(desc);
      }
      return;
    }
    if (e.target.closest?.("[data-testid=wheel-controls-show]")) this.showLots();
  }

  renderWheel() {
    const g = this.geom;
    const level = this.viewLevel;
    const model = this.model(level, g);
    this.segmentCount = Math.max(1, model.main.length);
    const filterReg = createGlassFilterRegistry();
    const compact = this.fxCompact;
    const previewParts = [];
    const previews = model.preview.map((p, i) => {
      const d = petalPath(CX, CY, g.middleR + 12, g.outerR, p.a0, p.a1, PREVIEW_GAP, PREVIEW_RADIUS);
      const prefix = `preview-${level}-${i}`;
      const fx = acrylicTileFx(prefix, p.hex, g.middleR + 12, g.outerR, p.a0, p.a1, { compact, filters: filterReg });
      previewParts.push(glassTileDefs(d, fx));
      return `<g pointer-events="none">` +
        `${glassTileLayers(d, fx, TILE_PREVIEW_OP, compact, p.hex)}` +
        `${glassEdgeSparks(g.middleR + 12, g.outerR, p.a0, p.a1, compact)}` +
        `</g>`;
    }).join("");
    const segs = model.main.map((s) => this.segmentHtml(s, level, g, filterReg)).join("");
    this.rotor.innerHTML = `<defs>${glassContactFilterDef()}${filterReg.defsHtml()}${previewParts.join("")}</defs><g pointer-events="none">${previews}</g>${segs}`;
    this.rotor.setAttribute("transform", `rotate(${this.rotation} ${CX} ${CY})`);
    this.svg.setAttribute("viewBox", g.viewBox);
    this.hot = null;
    this.renderCenter();
    this.shadowRoot.querySelectorAll(".seg").forEach((seg) => this.paintSeg(seg));
  }

  model(level, g) {
    if (level === 0) {
      const step = 360 / this.tree.length;
      const main = this.tree.map((node, i) => ({
        node, a0: i * step, a1: (i + 1) * step, rIn: g.innerR, rOut: g.middleR,
        kind: "sector", selected: false,
      }));
      const preview = [];
      this.tree.forEach((sec, i) => {
        const span = step / sec.subsectors.length;
        sec.subsectors.forEach((su, j) => {
          preview.push({ hex: su.hex, a0: i * step + j * span, a1: i * step + (j + 1) * span });
        });
      });
      return { main, preview };
    }
    const sector = this.sector();
    if (!sector) return { main: [], preview: [] };
    if (level === 1) {
      const subs = sector.subsectors;
      const step = 360 / subs.length;
      const main = subs.map((node, i) => ({
        node, a0: i * step, a1: (i + 1) * step, rIn: g.innerR, rOut: g.middleR,
        kind: "subsector", selected: false,
      }));
      const preview = [];
      subs.forEach((su, i) => {
        const vis = su.descriptors.filter((d) => !d.hideFromWheel);
        if (!vis.length) return;
        const span = step / vis.length;
        vis.forEach((de, j) => {
          preview.push({ hex: de.hex, a0: i * step + j * span, a1: i * step + (j + 1) * span });
        });
      });
      return { main, preview };
    }
    const sub = this.subsector() || sector.subsectors[0];
    const vis = sub.descriptors.filter((d) => !d.hideFromWheel);
    const step = 360 / Math.max(1, vis.length);
    const main = vis.map((node, i) => ({
      node, a0: i * step, a1: (i + 1) * step, rIn: g.innerR, rOut: g.outerR,
      kind: "descriptor", selected: node.id === this.selection.descriptorId,
    }));
    return { main, preview: [] };
  }

  segmentHtml(s, level, g, filterReg) {
    const d = petalPath(CX, CY, s.rIn, s.rOut, s.a0, s.a1, MAIN_GAP, MAIN_RADIUS);
    const fitted = fitLabel(s.node.name, s.rIn, s.rOut, s.a0, s.a1, g.labelMaxFont(level));
    const place = labelPlacement(s.rIn, s.rOut, s.a0, s.a1, fitted.fontSize, fitted.lines.length);
    const prefix = `petal-${level}-${s.node.id}`;
    const compact = this.fxCompact;
    const fx = acrylicTileFx(prefix, s.node.hex, s.rIn, s.rOut, s.a0, s.a1, { compact, filters: filterReg });
    const baseOp = TILE_FACE_OP;
    const tspans = fitted.lines.map((line, i) =>
      `<tspan x="${place.x}" dy="${i === 0 ? place.firstDy : place.lineHeight}">${esc(line)}</tspan>`
    ).join("");
    const mid = (s.a0 + s.a1) / 2;
    return `<g class="seg" role="button" tabindex="0" aria-label="${esc(s.node.name)}" aria-pressed="${s.selected ? "true" : "false"}" data-testid="wheel-${s.kind}-${s.node.id}" data-kind="${s.kind}" data-id="${s.node.id}" data-mid="${mid}" data-selected="${s.selected ? "1" : "0"}" data-base-op="${baseOp}" data-filter-default="${fx.filterId}" data-filter-hot="${fx.filterHotId}">` +
      `<defs>${glassTileDefs(d, fx)}</defs>` +
      `${glassTileLayers(d, fx, baseOp, compact, s.node.hex)}` +
      `${glassEdgeSparks(s.rIn, s.rOut, s.a0, s.a1, compact)}` +
      `<text x="${place.x}" y="${place.y}" text-anchor="middle" transform="rotate(${place.rotate} ${place.x} ${place.y})" font-family="Mulish, sans-serif" font-size="${fitted.fontSize}" font-weight="500" letter-spacing="${place.letterSpacing}" fill="#000000">${tspans}</text>` +
      `<path class="seg-focus-ring" d="${d}" aria-hidden="true"></path>` +
      `</g>`;
  }

  renderCenter() {
    const g = this.geom;
    const lines = this.centerLines().filter(Boolean);
    const canBack = this.viewLevel > 0;
    const r = g.innerR - 14;
    const maxW = r * 1.65;
    const longest = Math.max(...lines.map((w) => String(w).length), 1);
    const fit = maxW / (longest * 0.58);
    const fs = Math.max(14, Math.min(canBack ? 34 : 26, Math.floor(fit), g.centerFont));
    const step = Math.round(Math.min(g.centerLineStep, fs * 1.2));
    const startY = lines.length === 1 ? CY : CY - (step * (lines.length - 1)) / 2;
    const color = "#000000";
    const cls = canBack ? "center-hit is-back" : "center-hit";
    const aria = canBack
      ? ` role="button" tabindex="0" aria-label="Назад"`
      : ` aria-hidden="true"`;
    const texts = lines.map((t, i) =>
      `<text x="400" y="${startY + i * step}" text-anchor="middle" dominant-baseline="central" font-family="Mulish, sans-serif" font-weight="700" font-size="${fs}" letter-spacing="${canBack ? -1 : -1.2}" fill="${color}" stroke="none" pointer-events="none">${esc(t)}</text>`
    ).join("");
    this.centerLayer.innerHTML = `<g class="${cls}"${aria} filter="url(#wheel-center-shadow)"><circle class="center-disc" cx="400" cy="400" r="${r}"></circle><circle class="center-focus-ring" cx="400" cy="400" r="${r + 3}" aria-hidden="true"></circle>${texts}</g>`;
  }

  paintSeg(seg) {
    const selected = seg.dataset.selected === "1";
    const hot = seg === this.hot || seg.matches(":focus-visible");
    seg.classList.toggle("is-hot", hot || selected);
    const filterId = (hot || selected) ? seg.dataset.filterHot : seg.dataset.filterDefault;
    if (filterId) seg.querySelector(".glass-cast")?.setAttribute("filter", `url(#${filterId})`);
    const base = Number(seg.dataset.baseOp || TILE_FACE_OP);
    const fill = seg.querySelector(".glass-fill");
    if (fill) fill.setAttribute("fill-opacity", String(Math.min(0.68, base + (hot || selected ? 0.06 : 0))));
  }

  updateSelected() {
    const id = this.viewLevel === 2 ? this.selection.descriptorId : null;
    this.shadowRoot.querySelectorAll(".seg").forEach((seg) => {
      const on = id != null && Number(seg.dataset.id) === id;
      seg.dataset.selected = on ? "1" : "0";
      seg.setAttribute("aria-pressed", on ? "true" : "false");
      this.paintSeg(seg);
    });
  }

  crumbBtn(level, node, current) {
    const cur = current ? " is-current" : "";
    const aria = current ? ` aria-current="true"` : "";
    return `<button type="button" class="trail-crumb${cur}" data-trail-level="${level}" style="background:${mixHex(node.hex)};color:#000000"${aria}>${esc(node.name)}</button>`;
  }

  renderTrail() {
    if (!this.trailEl) return;
    const sector = this.sector();
    const sub = this.subsector();
    const desc = this.descriptor();
    if (!sector || this.viewLevel === 0) {
      this.trailEl.innerHTML = "";
      return;
    }
    const sep = `<span class="trail-sep" aria-hidden="true">→</span>`;
    if (this.viewLevel === 1) {
      this.trailEl.innerHTML = this.crumbBtn(0, sector, true);
      return;
    }
    if (sub && !desc) {
      this.trailEl.innerHTML = [
        this.crumbBtn(0, sector, false), sep, this.crumbBtn(1, sub, true),
      ].join("");
      return;
    }
    if (sub && desc) {
      this.trailEl.innerHTML = [
        this.crumbBtn(0, sector, false), sep,
        this.crumbBtn(1, sub, false), sep,
        this.crumbBtn(2, desc, true),
      ].join("");
    }
  }

  renderPanel() {
    if (this.viewLevel === 0 || !this.sector()) {
      this.panelEl.innerHTML = `<div class="sheet sheet-empty" data-testid="wheel-info-description"><h2>Информация</h2><p>${esc(INFO_EMPTY)}</p></div>`;
      return;
    }
    const sector = this.sector();
    const sub = this.subsector();
    const desc = this.viewLevel === 2 ? this.descriptor() : null;
    const node = desc || (this.viewLevel === 2 ? sub : sector);
    const note = node ? this.notes.get(node.id) : null;
    const hex = node.hex;
    const short = note?.short || FALLBACK_SHORT;
    const how = note?.howInCoffee || FALLBACK_INFO;
    const result = note?.result || FALLBACK_INFO;
    const chips = this.chipsHtml(sector, sub, desc);
    this.panelEl.innerHTML = `
      <article class="sheet">
        <header class="sheet-head" data-testid="wheel-info-description" style="--sheet-accent:${hex};background:${mixHex(hex, 0.86)};color:#000000">
          <h2>${esc(node.name)}</h2>
          <p class="lead">${esc(short)}</p>
        </header>
        <div class="sheet-body">
          <section class="sheet-section" data-testid="wheel-info-how-appears">
            <h3>Как проявляется в кофе</h3>
            ${paras(how)}
          </section>
          <section class="sheet-section" data-testid="wheel-info-where-occurs">
            <h3>В чашке</h3>
            ${paras(result)}
          </section>
          ${chips}
        </div>
        <div class="sheet-foot">
          <button type="button" class="show-cta" data-testid="wheel-controls-show"${this.selection.sectorId ? "" : " disabled"}>Показать</button>
        </div>
      </article>`;
  }

  chipsHtml(sector, sub, desc) {
    let chips = "";
    let title = "Рядом на колесе";
    if (this.viewLevel === 1) {
      title = "Подкатегории";
      chips = sector.subsectors.map((s) => this.chip("sub", s)).join("");
    } else if (!desc && sub) {
      title = "Ноты";
      chips = sub.descriptors.map((d) => this.chip("desc", d)).join("");
    } else if (desc?.children?.length) {
      title = "Оттенки";
      chips = desc.children.map((c) =>
        `<span class="chip" style="background:${mixHex(c.hex)};color:#000000">${esc(c.name)}</span>`
      ).join("");
    }
    if (!chips) return "";
    return `<section class="sheet-section" data-testid="wheel-info-subcategories"><h3>${esc(title)}</h3><div class="chips">${chips}</div></section>`;
  }

  chip(kind, item) {
    return `<button type="button" class="chip" data-kind="${kind}" data-slug="${esc(item.slug)}" style="background:${mixHex(item.hex)};color:#000000">${esc(item.name)}</button>`;
  }

  snapshot() {
    const sector = this.sector();
    const sub = this.subsector();
    const desc = this.descriptor();
    const pack = (n) => n ? { id: n.id, slug: n.slug, name: n.name, hex: n.hex } : null;
    return {
      level: this.viewLevel,
      sector: pack(sector),
      subsector: pack(sub),
      descriptor: pack(desc),
      slugs: { s: sector?.slug || null, sub: sub?.slug || null, d: desc?.slug || null },
    };
  }

  emit() {
    this.dispatchEvent(new CustomEvent("flavor-change", { bubbles: true, composed: true, detail: this.snapshot() }));
  }

  scheduleUrl() {
    if (!this.syncUrl) return;
    clearTimeout(this.urlTimer);
    this.urlTimer = setTimeout(() => {
      const snap = this.snapshot();
      const url = new URL(location.href);
      url.searchParams.delete("page");
      url.searchParams.delete("s");
      url.searchParams.delete("sub");
      url.searchParams.delete("d");
      if (snap.slugs.s) url.searchParams.set("s", snap.slugs.s);
      if (snap.slugs.sub) url.searchParams.set("sub", snap.slugs.sub);
      if (snap.slugs.d) url.searchParams.set("d", snap.slugs.d);
      history.replaceState(null, "", url);
      const name = snap.descriptor?.name || snap.subsector?.name || snap.sector?.name;
      document.title = name
        ? `${name} — Колесо вкусов`
        : "Колесо вкусов";
    }, 200);
  }

  vibrate(ms) {
    if (!ms) return;
    try { navigator.vibrate?.(ms); } catch { /* no vibrate */ }
  }

  pointerAngle(e) {
    const p = this.svgPoint(e);
    return (Math.atan2(p.y - CY, p.x - CX) * 180) / Math.PI;
  }

  isPointerLike(type) {
    return type === "mouse" || type === "touch" || type === "pen";
  }

  blurPointerFocus() {
    const root = this.shadowRoot;
    const ae = root.activeElement;
    if (ae && ae !== this.svg && (ae.closest?.(".seg") || ae.closest?.(".center-hit"))) ae.blur();
    if (root.activeElement === this.svg) this.svg.blur();
  }

  onDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    this.lastPointerType = e.pointerType || "";
    if (e.pointerType === "mouse" || e.pointerType === "touch" || e.pointerType === "pen") {
      this.blurPointerFocus();
      if (e.cancelable) e.preventDefault();
    }
    this.cancelInertia();
    this.drag = { last: this.pointerAngle(e), moved: 0, active: false, ts: e.timeStamp, id: e.pointerId };
    this.velocity = 0;
  }

  onMove(e) {
    if (!this.drag || e.pointerId !== this.drag.id) return;
    const a = this.pointerAngle(e);
    const delta = angDelta(this.drag.last, a);
    this.drag.last = a;
    this.drag.moved += Math.abs(delta);
    const dt = e.timeStamp - this.drag.ts;
    this.drag.ts = e.timeStamp;
    if (!this.drag.active) {
      if (this.drag.moved <= 5) return;
      this.drag.active = true;
      this.svg.setPointerCapture?.(e.pointerId);
      this.svg.classList.add("is-dragging");
      this.blurPointerFocus();
    }
    this.rotation += delta;
    if (dt > 0) this.velocity = delta / dt;
    this.rotor.setAttribute("transform", `rotate(${this.rotation} ${CX} ${CY})`);
    if (e.cancelable) e.preventDefault();
  }

  onUp(e) {
    if (!this.drag || (e && e.pointerId !== this.drag.id)) return;
    const active = this.drag.active;
    this.drag = null;
    this.svg.classList.remove("is-dragging");
    if (e && (e.pointerType === "mouse" || e.pointerType === "touch" || e.pointerType === "pen")) {
      this.blurPointerFocus();
    }
    if (!active) return;
    this.suppressClick = true;
    setTimeout(() => { this.suppressClick = false; }, 0);
    this.startInertia();
  }

  startInertia() {
    const step = 360 / this.segmentCount;
    const { target, duration } = inertiaTarget(this.rotation, this.velocity, step);
    if (this.reduced) {
      this.rotation = target;
      this.rotor.setAttribute("transform", `rotate(${this.rotation} ${CX} ${CY})`);
      return;
    }
    const from = this.rotation;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      this.rotation = from + (target - from) * (1 - (1 - p) ** 3);
      this.rotor.setAttribute("transform", `rotate(${this.rotation} ${CX} ${CY})`);
      if (p < 1) this.inertiaRaf = requestAnimationFrame(tick);
    };
    this.inertiaRaf = requestAnimationFrame(tick);
  }

  cancelInertia() {
    if (this.inertiaRaf) cancelAnimationFrame(this.inertiaRaf);
    this.inertiaRaf = 0;
  }
}

if (!customElements.get("flavor-wheel")) {
  customElements.define("flavor-wheel", FlavorWheel);
}
