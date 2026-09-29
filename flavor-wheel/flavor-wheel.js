import {
  CX, CY, wheelGeometry, petalPath, fitLabel, labelPlacement,
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

/** HSL: поднять lightness на dl (абс. 0–1), насыщенность сохранить/чуть усилить — без белого подмеса. */
function lightenJuicy(hex, dl = 0.08) {
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
  s = Math.min(1, s * 1.03);
  l = Math.min(0.9, l + dl);
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

/* Зазор чуть увеличен (+stroke), чтобы после снятия белой обводки
   видимая ширина щели между цветными заливками осталась как раньше. */
const MAIN_GAP = 13.25;
const MAIN_RADIUS = 24;
const PREVIEW_GAP = 7.1;
const PREVIEW_RADIUS = 12;
/** Cache-bust для flavor-data.json (менять при деплое данных). */
const DATA_CACHE_BUST = "motion10";
/** Смена info-панели: контент + высота. */
const PANEL_HEIGHT_MS = 560;
const PANEL_OUT_MS = 280;
const PANEL_IN_MS = 340;
const PANEL_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const PANEL_SHIFT_PX = 6;
/** Hover-левитация плитки (scale/тень/fill): было ~180–220 ms → ~×5. */
const HOVER_LIFT_MS = 1200;
const PRESS_LIFT_MS = 140;
const EASE_LIFT_UP = "cubic-bezier(0.22, 0.2, 0.36, 1)";
const EASE_LIFT_DOWN = "cubic-bezier(0.45, 0.05, 0.55, 0.95)";
/** Тяжёлая инерция маховика (°/с, трение 1/с). */
const INERTIA_SAMPLE_MS = 100;
const INERTIA_PAUSE_MS = 100;
const INERTIA_MIN_GESTURE_DPS = 36;
const INERTIA_TRANSFER = 0.48;
const INERTIA_VMAX_DPS = 480;
const INERTIA_FRICTION = 2.1;
const INERTIA_STOP_DPS = 10;
const TILE_LIT_REST = 0.08;
const TILE_LIT_HOT = 0.15;
const PARA_MAX_WIDE = 2.5;
const PARA_MAX_NARROW = 1.75;
const PARA_LERP = 0.18;
/** Каскад «лесенкой» дочерних превью при hover/press родителя (уровни 0–1). */
const CASCADE_DELAY = 48;
const CASCADE_UP_MS = 260;
const CASCADE_DOWN_MS = 170;
const CASCADE_DOWN_DELAY = 26;
const CASCADE_FAST_MS = 130;
const CASCADE_FAST_DELAY = 16;
const CASCADE_SCALE = 1.05;
const CASCADE_OUT = 6;
const LIFT_REST = {
  transform: "scale(1)",
  filter: "drop-shadow(0px 0px 0px rgba(0,0,0,0))",
};
const LIFT_LOW = {
  transform: "scale(1.02)",
  filter: "drop-shadow(0px 3px 5px rgba(0,0,0,0.12))",
};
const LIFT_HIGH = {
  transform: "scale(1.045)",
  filter: "drop-shadow(1px 9px 12px rgba(0,0,0,0.2))",
};
const LIFT_STATIC = {
  transform: "scale(1.03)",
  filter: "drop-shadow(0px 5px 8px rgba(0,0,0,0.16))",
};
const GRAIN_TILE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">' +
  '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter>' +
  '<rect width="100%" height="100%" filter="url(#n)" opacity=".55"/></svg>'
)}`;
const TILT_MAX_GYRO = 2;
const TILT_MAX_MOUSE = 1.4;
const TILT_LERP = 0.12;

function cssText() {
  return `
:host {
  --fw-font-family: Mulish, "Mulish Fallback", Arial, sans-serif;
  --fw-max-width: 1280px;
  --fw-bg: transparent;
  --fw-ink: #000000;
  /* Стабильная высота: JS --fw-stable-h (px) при смене ширины/ориентации; CSS — svh/vh. */
  --fw-vh: 1vh;
  --fw-stable-h: calc(var(--fw-vh) * 100);
  --fw-stable-h: 100vh;
  --fw-stable-h: 100svh;
  --fw-safe-t: env(safe-area-inset-top, 0px);
  --fw-safe-b: env(safe-area-inset-bottom, 0px);
  --fw-safe-l: env(safe-area-inset-left, 0px);
  --fw-safe-r: env(safe-area-inset-right, 0px);
  --fw-trail-slot: 44px;
  --fw-trail-reserve: calc(var(--fw-trail-slot) + 12px);
  --fw-gap-panel: 20px;
  --fw-panel-min: 132px;
  /* Размер колеса только от viewport — не от контента панели/уровня (b25a928). */
  --fw-wheel-size: min(600px, calc(100vw - 40px), calc(var(--fw-stable-h) - 160px));
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
/* Узкий layout: колесо + панель в один экран; размер колеса стабилен. */
:host([data-layout="narrow"]) {
  --fw-trail-slot: 38px;
  --fw-trail-reserve: calc(var(--fw-trail-slot) + 8px);
  --fw-gap-panel: clamp(6px, 1.1vh, 12px);
  /* Минимальная высота инфо-блока — читаемый empty/заголовок; остаток — колесу. */
  --fw-panel-min: clamp(108px, 18svh, 150px);
  --fw-wheel-size: clamp(
    268px,
    min(
      calc(100vw - 20px - var(--fw-safe-l) - var(--fw-safe-r)),
      calc(
        var(--fw-stable-h)
        - var(--fw-safe-t) - var(--fw-safe-b)
        - 2 * clamp(6px, 1.2vh, 12px)
        - var(--fw-trail-reserve)
        - var(--fw-gap-panel)
        - var(--fw-panel-min)
      )
    ),
    600px
  );
  align-self: stretch;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  container-type: size;
}
@supports (width: 1cqw) {
  :host([data-layout="narrow"]) {
    --fw-wheel-size: clamp(
      268px,
      min(
        100cqw,
        calc(100cqh - var(--fw-trail-reserve) - var(--fw-gap-panel) - var(--fw-panel-min))
      ),
      600px
    );
  }
}
:host *, :host *::before, :host *::after { box-sizing: border-box; }
.stage { position: relative; width: 100%; }
:host([data-layout="narrow"]) .stage {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
:host([data-layout="wide"]) .stage {
  min-height: calc(100dvh - 64px);
  display: flex;
  align-items: center;
}
.wrap { position: relative; z-index: 1; width: 100%; padding: 0; }
:host([data-layout="narrow"]) .wrap {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.grid {
  display: grid; grid-template-columns: minmax(0, 1fr); align-items: start; gap: 0;
  width: 100%;
}
:host([data-layout="narrow"]) .grid {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  grid-template-rows: auto minmax(0, 1fr);
  gap: var(--fw-gap-panel);
  align-items: stretch;
  overflow: hidden;
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
  padding-top: var(--fw-trail-reserve);
}
:host([data-layout="narrow"]) .wheel-col {
  justify-self: center;
  /* Тень/наклон не раздувают layout и не дают скролл страницы. */
  overflow: hidden;
  max-width: 100%;
}
.panel {
  order: 2; width: 100%; margin-top: 20px; min-width: 0; min-height: 0;
  align-self: start;
}
:host([data-layout="narrow"]) .panel {
  margin-top: 0;
  align-self: stretch;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}
:host([data-layout="wide"]) .panel {
  margin-top: 0;
  max-height: calc(var(--fw-wheel-size) + var(--fw-trail-slot) + 12px);
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.panel-viewport {
  width: 100%;
  overflow: hidden;
  position: relative;
}
:host([data-layout="narrow"]) .panel-viewport {
  flex: 1 1 auto;
  min-height: 0;
  max-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}
.panel-layer {
  width: 100%;
  will-change: opacity, transform, filter;
}
/* Мягкий fade у нижнего края при переполнении инфо-блока. */
:host([data-layout="narrow"]) .panel::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 36px;
  pointer-events: none;
  z-index: 2;
  border-radius: 0 0 22px 22px;
  background: linear-gradient(to top, rgba(255, 255, 255, 0.96) 8%, rgba(255, 255, 255, 0) 100%);
  opacity: 0;
  transition: opacity .25s ease;
}
:host([data-layout="narrow"]) .panel.is-overflowing::after { opacity: 1; }
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
:host([data-layout="narrow"]) .trail-crumb {
  padding: 8px 12px;
  font-size: clamp(11px, 3.1vw, 13px);
}
.trail-crumb:hover { filter: brightness(1.06); transform: scale(1.03); }
.trail-crumb.is-current { cursor: default; box-shadow: 0 8px 20px rgba(0,0,0,.14); }
.trail-crumb.is-current:hover { filter: none; transform: none; }
.trail-sep { color: #000000; opacity: .35; font-size: 13px; font-weight: 600; }
.wheel-perspective {
  width: var(--fw-wheel-size);
  max-width: 100%;
  perspective: 900px;
  perspective-origin: 50% 45%;
}
:host([data-layout="narrow"]) .wheel-perspective {
  flex: 0 0 auto;
  overflow: hidden;
}
:host([data-layout="wide"]) .wheel-perspective { margin: 0; }
.wheel-tilt {
  --tilt-rx: 0deg;
  --tilt-ry: 0deg;
  --tilt-sx: 0px;
  --tilt-sy: 18px;
  position: relative;
  width: 100%;
  transform-style: preserve-3d;
  transform: rotateX(var(--tilt-rx)) rotateY(var(--tilt-ry));
  will-change: transform;
  filter:
    drop-shadow(var(--tilt-sx) var(--tilt-sy) 28px rgba(0, 0, 0, 0.14))
    drop-shadow(0 6px 10px rgba(0, 0, 0, 0.08));
}
:host([data-layout="narrow"]) .wheel-tilt {
  /* Чуть короче тень, чтобы не требовать лишнего места по вертикали. */
  --tilt-sy: 12px;
  filter:
    drop-shadow(var(--tilt-sx) var(--tilt-sy) 18px rgba(0, 0, 0, 0.14))
    drop-shadow(0 4px 8px rgba(0, 0, 0, 0.08));
}
.wheel-shine {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;
  z-index: 2;
  background:
    radial-gradient(ellipse 70% 34% at 50% 8%, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0) 70%);
  mix-blend-mode: soft-light;
}
.wheel-box {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  flex: 0 0 auto;
  aspect-ratio: 1;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  position: relative;
  z-index: 1;
}
.grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 8;
  opacity: 0.055;
  background-image: url("${GRAIN_TILE}");
  background-size: 160px 160px;
  mix-blend-mode: multiply;
}
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
/* Подъём выбранной ячейки — отдельный слой, не конфликтует с hover/press */
.tile-motion {
  transform-box: view-box;
  transform-origin: 400px 400px;
  transform: scale(1);
  filter: drop-shadow(0px 0px 0px rgba(0,0,0,0));
  will-change: transform, filter;
}
/* Hover-левитация: медленный мягкий взлёт; press — короткий отклик на том же слое */
.tile-levitate {
  transform-box: view-box;
  transform-origin: 400px 400px;
  transform: scale(1);
  filter: drop-shadow(0px 0px 0px rgba(0,0,0,0));
  /* Опускание: мягкий settle — синхронно с fill */
  transition:
    transform ${HOVER_LIFT_MS}ms ${EASE_LIFT_DOWN},
    filter ${HOVER_LIFT_MS}ms ${EASE_LIFT_DOWN};
  will-change: transform, filter;
}
.seg.is-hot:not([data-selected="1"]):not(.is-press) .tile-levitate {
  transform: scale(1.03);
  filter: drop-shadow(0px 6px 12px rgba(0, 0, 0, 0.2));
  /* Подъём — синхронно с fill */
  transition:
    transform ${HOVER_LIFT_MS}ms ${EASE_LIFT_UP},
    filter ${HOVER_LIFT_MS}ms ${EASE_LIFT_UP};
}
.seg.is-press .tile-levitate {
  transform: scale(1.055);
  filter: drop-shadow(0px 7px 14px rgba(0, 0, 0, 0.22));
  transition:
    transform ${PRESS_LIFT_MS}ms cubic-bezier(.22,.8,.3,1),
    filter ${PRESS_LIFT_MS}ms cubic-bezier(.22,.8,.3,1);
}
/* Selected: hover-левитация сбрасывается; WAAPI-пульс (п.3) не трогаем */
.seg[data-selected="1"] .tile-levitate {
  transform: scale(1);
  filter: drop-shadow(0px 0px 0px rgba(0,0,0,0));
  transition:
    transform ${HOVER_LIFT_MS}ms ${EASE_LIFT_DOWN},
    filter ${HOVER_LIFT_MS}ms ${EASE_LIFT_DOWN};
}
/* Локальный параллакс заливки — отдельный слой внутри подъёма; hit-test остаётся на path */
.tile-parallax {
  transform-box: fill-box;
  transform-origin: center;
  transform: translate(0px, 0px);
  will-change: transform;
}
/* Осветление: те же duration/easing, что у подъёма (вход/выход hover и selected) */
.seg .tile-fill {
  transition: fill ${HOVER_LIFT_MS}ms ${EASE_LIFT_DOWN};
  transform-box: fill-box;
}
.seg.is-hot:not([data-selected="1"]):not(.is-press) .tile-fill {
  transition: fill ${HOVER_LIFT_MS}ms ${EASE_LIFT_UP};
}
.seg.is-press .tile-fill {
  transition: fill ${PRESS_LIFT_MS}ms ease;
}
.seg[data-selected="1"] .tile-fill {
  transition: fill ${HOVER_LIFT_MS}ms ${EASE_LIFT_UP};
}
/* Каскад дочерних превью — отдельный слой, не трогает hit-test основных .seg */
.preview-tile { pointer-events: none; }
.preview-motion {
  transform-box: view-box;
  transform-origin: 400px 400px;
  transform: translate(0px, 0px) scale(1);
  filter: drop-shadow(0px 0px 0px rgba(0,0,0,0));
  will-change: transform, filter;
}
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
:host([data-layout="narrow"]) .sheet {
  border-radius: clamp(18px, 5vw, 24px);
  box-shadow: 0 10px 28px rgba(0,0,0,.08);
}
.sheet-head {
  padding: 24px 24px 20px;
  color: #000000;
  background: #f5f5f2;
  box-shadow: inset 0 -1px 0 rgba(0,0,0,.06);
  border-left: 6px solid var(--sheet-accent, #000000);
}
:host([data-layout="narrow"]) .sheet-head {
  padding: clamp(12px, 3.2vw, 18px) clamp(14px, 3.8vw, 20px) clamp(10px, 2.6vw, 14px);
  border-left-width: 5px;
}
.sheet-head h2 {
  margin: 0 0 10px; font-size: 24px; font-weight: 700;
  line-height: 1.15; letter-spacing: -1.2px;
  color: #000000;
}
:host([data-layout="narrow"]) .sheet-head h2 {
  margin: 0 0 6px;
  font-size: clamp(17px, 4.6vw, 22px);
  letter-spacing: -0.9px;
}
.sheet-head .lead {
  margin: 0; font-size: 16px; font-weight: 500; line-height: 1.5; letter-spacing: -0.6px;
  color: #000000; opacity: .88;
}
:host([data-layout="narrow"]) .sheet-head .lead {
  font-size: clamp(13px, 3.5vw, 15px);
  line-height: 1.45;
  letter-spacing: -0.4px;
}
.sheet-body { padding: 8px 24px 24px; color: #000000; }
:host([data-layout="narrow"]) .sheet-body {
  padding: 4px clamp(14px, 3.8vw, 20px) clamp(14px, 3.5vw, 20px);
}
.sheet-section { padding: 16px 0; border-top: 1px solid rgba(0,0,0,.1); }
:host([data-layout="narrow"]) .sheet-section { padding: clamp(10px, 2.4vw, 14px) 0; }
.sheet-section:first-child { border-top: 0; }
.sheet-section h3 {
  margin: 0 0 8px; font-size: 12px; font-weight: 700;
  letter-spacing: .02em; text-transform: uppercase; color: #000000; opacity: .55;
}
:host([data-layout="narrow"]) .sheet-section h3 {
  margin: 0 0 6px;
  font-size: clamp(10px, 2.8vw, 12px);
}
.sheet-section p { margin: 0 0 8px; font-size: 15px; font-weight: 500; line-height: 1.55; letter-spacing: -0.4px; color: #000000; }
:host([data-layout="narrow"]) .sheet-section p {
  margin: 0 0 6px;
  font-size: clamp(13px, 3.5vw, 15px);
  line-height: 1.45;
}
.sheet-section p:last-child { margin-bottom: 0; }
.sheet-empty { padding: 28px 24px; color: #000000; }
:host([data-layout="narrow"]) .sheet-empty {
  padding: clamp(14px, 3.5vw, 22px) clamp(14px, 3.8vw, 22px);
}
.sheet-empty h2 {
  margin: 0 0 12px; font-size: 20px; font-weight: 700; letter-spacing: -1px; color: #000000;
}
:host([data-layout="narrow"]) .sheet-empty h2 {
  margin: 0 0 8px;
  font-size: clamp(16px, 4.4vw, 20px);
}
.sheet-empty p { margin: 0; font-size: 15px; font-weight: 500; line-height: 1.5; letter-spacing: -0.4px; color: #000000; opacity: .72; }
:host([data-layout="narrow"]) .sheet-empty p {
  font-size: clamp(13px, 3.5vw, 15px);
  line-height: 1.45;
}
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  border: 0; border-radius: 32px; padding: 11px 14px;
  font: 600 12px/1 var(--fw-font-family); letter-spacing: -0.5px;
  color: #000000;
  cursor: pointer; transition: filter .2s ease, transform .2s ease;
}
:host([data-layout="narrow"]) .chip {
  padding: 9px 12px;
  font-size: clamp(11px, 3vw, 12px);
}
button.chip:hover { filter: brightness(1.08); transform: scale(1.03); }
span.chip { cursor: default; }
.load-msg { padding: 24px; text-align: center; color: #000000; font-weight: 600; }
@media (prefers-reduced-motion: reduce) {
  .seg, .tile-fill, .tile-levitate, .center-hit, .chip, .trail-crumb, .panel-layer, .panel-viewport { transition: none !important; }
  .seg.is-hot .tile-levitate, .seg.is-press .tile-levitate,
  .center-hit.is-back:hover { transform: none !important; filter: none !important; }
  .tile-parallax { transform: none !important; will-change: auto; }
  .tile-levitate { will-change: auto; }
  .preview-motion { transform: none !important; filter: none !important; will-change: auto; }
  .wheel-tilt {
    transform: none !important;
    filter: drop-shadow(0 14px 24px rgba(0, 0, 0, 0.12)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.07));
  }
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
    this.segmentCount = 5;
    this.geom = wheelGeometry(700);
    this.wheelW = 0;
    this.hot = null;
    this.drag = null;
    this.lastPointerType = "";
    this.suppressClick = false;
    this.inertiaRaf = 0;
    this.inertiaV = 0;
    this.inertiaLastT = 0;
    this.panelGen = 0;
    this.urlTimer = 0;
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.pressedSeg = null;
    this.liftAnims = new WeakMap();
    this.tiltTarget = { x: 0, y: 0 };
    this.tiltCurrent = { x: 0, y: 0 };
    this.tiltRaf = 0;
    this.tiltMode = "none";
    this.gyroAllowed = false;
    this.gyroAsked = false;
    this.paraSeg = null;
    this.paraTarget = { x: 0, y: 0 };
    this.paraCurrent = { x: 0, y: 0 };
    this.paraRaf = 0;
    this.cascadeParentId = null;
    this.cascadeMode = "idle";
    this.onOrient = (e) => this.handleOrientation(e);
    this.onMouseMove = (e) => this.handleMouseTilt(e);
    this.onMouseLeave = () => {
      this.tiltTarget.x = 0;
      this.tiltTarget.y = 0;
    };
    this.onReducedChange = (e) => {
      this.reduced = e.matches;
      if (this.reduced) {
        this.resetTilt(true);
        this.resetParallax(true);
        this.resetCascade(true);
        this.stopInertia();
      } else {
        this.ensureTiltLoop();
        this.ensureParaLoop();
        this.syncCascade();
      }
    };
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
    this.panelRo?.disconnect();
    this.stopInertia();
    cancelAnimationFrame(this.tiltRaf);
    cancelAnimationFrame(this.paraRaf);
    clearTimeout(this.urlTimer);
    window.removeEventListener("deviceorientation", this.onOrient);
    window.removeEventListener("orientationchange", this.onStableViewport);
    window.removeEventListener("resize", this.onStableViewport);
    this.shadowRoot?.removeEventListener("pointermove", this.onMouseMove);
    this.wheelPerspective?.removeEventListener("pointerleave", this.onMouseLeave);
    window.matchMedia("(prefers-reduced-motion: reduce)").removeEventListener?.("change", this.onReducedChange);
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
      <div class="grain" aria-hidden="true"></div>
      <div class="stage">
        <div class="wrap">
          <div class="grid" data-testid="taste-wheel-grid">
            <div class="wheel-col">
              <nav class="trail" data-testid="wheel-trail" aria-label="Путь выбора"></nav>
              <div class="wheel-perspective">
                <div class="wheel-tilt">
                  <div class="wheel-box" data-testid="wheel-filter">
                    <svg class="wheel" tabindex="-1" viewBox="0 0 800 800" role="img" aria-label="Колесо вкусов — фильтр по нотам (потяните для вращения)">
                      <title>Колесо вкусов</title>
                      <defs>${filters()}</defs>
                      <g class="rotor" transform="rotate(0 400 400)"></g>
                      <g class="center-layer"></g>
                    </svg>
                  </div>
                  <div class="wheel-shine" aria-hidden="true"></div>
                </div>
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
    this.wheelPerspective = this.shadowRoot.querySelector(".wheel-perspective");
    this.wheelTilt = this.shadowRoot.querySelector(".wheel-tilt");
    this.panelEl = this.shadowRoot.querySelector(".panel");
    this.trailEl = this.shadowRoot.querySelector(".trail");
  }

  bind() {
    this.svg.addEventListener("pointerdown", (e) => this.onDown(e));
    this.svg.addEventListener("pointermove", (e) => this.onMove(e));
    this.svg.addEventListener("pointerup", (e) => this.onUp(e));
    this.svg.addEventListener("pointercancel", () => {
      this.drag = null;
      this.svg.classList.remove("is-dragging");
      this.clearPress();
      this.stopInertia();
    });
    this.svg.addEventListener("pointerover", (e) => {
      const seg = e.target.closest?.(".seg");
      if (!seg || seg === this.hot) return;
      this.setHot(seg);
    });
    this.svg.addEventListener("pointerout", (e) => {
      const seg = e.target.closest?.(".seg");
      if (!seg) return;
      if (e.relatedTarget && seg.contains(e.relatedTarget)) return;
      if (this.hot === seg) {
        // Прямой переход на соседний блок — без промежуточного collapse всех превью.
        const next = e.relatedTarget?.closest?.(".seg") || null;
        this.setHot(next);
      }
      if (this.paraSeg === seg && this.hot !== seg) this.clearParaTarget();
    });
    this.svg.addEventListener("focusin", (e) => {
      const seg = e.target.closest?.(".seg");
      if (!seg) return;
      this.setHot(seg);
    });
    this.svg.addEventListener("focusout", (e) => {
      const seg = e.target.closest?.(".seg");
      if (!seg) return;
      if (this.hot === seg) this.setHot(null);
    });
    this.svg.addEventListener("pointermove", (e) => this.handleTileParallax(e), { passive: true });
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
    this.shadowRoot.addEventListener("pointermove", this.onMouseMove, { passive: true });
    this.wheelPerspective?.addEventListener("pointerleave", this.onMouseLeave);
    this.ensureTiltLoop();
    this.ensureParaLoop();
  }

  watch() {
    this.onStableViewport = () => this.updateStableViewport();
    const applyHost = () => {
      const w = Math.round(this.getBoundingClientRect().width || this.clientWidth || 0);
      const next = w >= 1280 ? "wide" : "narrow";
      const prev = this.dataset.layout;
      this.dataset.layout = next;
      if (next === "narrow") this.updateStableViewport(true);
      if (prev !== next) queueMicrotask(() => this.syncPanelOverflow());
    };
    this.hostRo = new ResizeObserver(applyHost);
    this.hostRo.observe(this);
    window.addEventListener("resize", applyHost);
    window.addEventListener("orientationchange", this.onStableViewport);
    // resize: updateStableViewport сам фильтрует скачки адресной строки (только ширина/ориентация).
    window.addEventListener("resize", this.onStableViewport);
    applyHost();
    this.updateStableViewport(true);
    this.ro = new ResizeObserver(() => {
      const w = this.wheelBox?.clientWidth || 0;
      if (!w || Math.abs(w - this.wheelW) < 0.5) return;
      this.wheelW = w;
      this.geom = wheelGeometry(w);
      this.svg.setAttribute("viewBox", this.geom.viewBox);
      if (this.tree.length) this.renderWheel();
    });
    this.ro.observe(this.wheelBox);
    this.panelRo = new ResizeObserver(() => this.syncPanelOverflow());
    if (this.panelEl) this.panelRo.observe(this.panelEl);
    window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener?.("change", this.onReducedChange);
  }

  /**
   * Стабильная высота viewport для расчёта колеса.
   * Не реагирует на скачки адресной строки: пересчёт только при смене ширины/ориентации
   * (или force при первом layout).
   */
  updateStableViewport(force = false) {
    const w = Math.round(window.innerWidth || 0);
    const orient = (typeof screen !== "undefined" && screen.orientation?.type)
      || (window.innerHeight >= window.innerWidth ? "portrait" : "landscape");
    if (!force && this._stableVpW === w && this._stableVpOrient === orient && this._stableVpH) {
      return;
    }
    this._stableVpW = w;
    this._stableVpOrient = orient;
    const h = Math.round(window.visualViewport?.height || window.innerHeight || 0);
    if (!h) return;
    this._stableVpH = h;
    const vh = `${(h * 0.01).toFixed(3)}px`;
    this.style.setProperty("--fw-vh", vh);
    this.style.setProperty("--fw-stable-h", `${h}px`);
    try {
      document.documentElement.style.setProperty("--vh", vh);
      document.documentElement.style.setProperty("--fw-stable-h", `${h}px`);
    } catch { /* ignore */ }
  }

  syncPanelOverflow() {
    const panel = this.panelEl;
    if (!panel) return;
    if (this.dataset.layout !== "narrow") {
      panel.classList.remove("is-overflowing");
      return;
    }
    const vp = panel.querySelector(":scope > .panel-viewport");
    if (!vp) {
      panel.classList.remove("is-overflowing");
      return;
    }
    const overflowing = vp.scrollHeight > vp.clientHeight + 1;
    panel.classList.toggle("is-overflowing", overflowing);
  }

  dataUrls() {
    const attr = this.getAttribute("data-src");
    if (attr) return [attr];
    const urls = [];
    try {
      const u = new URL("./flavor-data.json", import.meta.url);
      u.searchParams.set("v", DATA_CACHE_BUST);
      urls.push(u.href);
    } catch { /* ignore */ }
    try {
      const u = new URL("flavor-wheel/flavor-data.json", document.baseURI || location.href);
      u.searchParams.set("v", DATA_CACHE_BUST);
      urls.push(u.href);
    } catch { /* ignore */ }
    return [...new Set(urls)];
  }

  async fetchJson(src, { timeoutMs = 8000 } = {}) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(src, { signal: ctrl.signal, cache: "no-cache", credentials: "same-origin" });
      if (!r.ok) throw new Error(`HTTP ${r.status} for ${src}`);
      const data = await r.json();
      if (!data || !Array.isArray(data.tree)) throw new Error(`Invalid wheel JSON from ${src}`);
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  async load() {
    if (this._loading) return;
    this._loading = true;
    let data = null;
    let lastErr = null;
    const urls = this.dataUrls();
    try {
      for (let attempt = 0; attempt < 3 && !data; attempt++) {
        for (const src of urls) {
          try {
            data = await this.fetchJson(src);
            break;
          } catch (err) {
            lastErr = err;
          }
        }
        if (!data) await new Promise((r) => setTimeout(r, 180 * (attempt + 1)));
      }
      if (!data) {
        this.panelEl.innerHTML = `<p class="load-msg">Не удалось загрузить данные колеса.</p>`;
        console.error(lastErr || new Error("wheel data fetch failed"));
        return;
      }
      try {
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
        console.error(err);
        this.panelEl.innerHTML = `<p class="load-msg">Не удалось отрисовать колесо.</p>`;
      }
    } finally {
      this._loading = false;
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
    this.stopInertia();
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
  }

  renderWheel() {
    const g = this.geom;
    const level = this.viewLevel;
    const model = this.model(level, g);
    this.segmentCount = Math.max(1, model.main.length);
    const previews = model.preview.map((p) => {
      const d = petalPath(CX, CY, g.middleR + 12, g.outerR, p.a0, p.a1, PREVIEW_GAP, PREVIEW_RADIUS);
      const fill = lightenJuicy(p.hex, TILE_LIT_REST);
      const mid = (p.a0 + p.a1) / 2;
      return `<g class="preview-tile" data-parent-id="${esc(String(p.parentId))}" data-preview-i="${p.index}" data-mid="${mid}">` +
        `<g class="preview-motion">` +
        `<path d="${d}" fill="${fill}" fill-opacity="1" stroke="none" stroke-width="0" data-hex-raw="${esc(p.hex)}"></path>` +
        `</g></g>`;
    }).join("");
    const segs = model.main.map((s) => this.segmentHtml(s, level, g)).join("");
    this.rotor.innerHTML =
      `<g class="preview-ring" pointer-events="none" filter="url(#wheel-preview-shadow)">${previews}</g>${segs}`;
    this.rotor.setAttribute("transform", `rotate(${this.rotation} ${CX} ${CY})`);
    this.svg.setAttribute("viewBox", g.viewBox);
    this.hot = null;
    this.resetParallax(true);
    this.resetCascade(true);
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
          const a0 = i * step + j * span;
          const a1 = i * step + (j + 1) * span;
          preview.push({ hex: su.hex, a0, a1, parentId: sec.id, index: j });
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
          const a0 = i * step + j * span;
          const a1 = i * step + (j + 1) * span;
          preview.push({ hex: de.hex, a0, a1, parentId: su.id, index: j });
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

  segmentHtml(s, level, g) {
    const d = petalPath(CX, CY, s.rIn, s.rOut, s.a0, s.a1, MAIN_GAP, MAIN_RADIUS);
    const fitted = fitLabel(s.node.name, s.rIn, s.rOut, s.a0, s.a1, g.labelMaxFont(level));
    const place = labelPlacement(s.rIn, s.rOut, s.a0, s.a1, fitted.fontSize, fitted.lines.length);
    const tspans = fitted.lines.map((line, i) =>
      `<tspan x="${place.x}" dy="${i === 0 ? place.firstDy : place.lineHeight}">${esc(line)}</tspan>`
    ).join("");
    const mid = (s.a0 + s.a1) / 2;
    const raw = s.node.hex;
    const fill = lightenJuicy(raw, s.selected ? TILE_LIT_HOT : TILE_LIT_REST);
    return `<g class="seg" role="button" tabindex="0" aria-label="${esc(s.node.name)}" aria-pressed="${s.selected ? "true" : "false"}" data-testid="wheel-${s.kind}-${s.node.id}" data-kind="${s.kind}" data-id="${s.node.id}" data-mid="${mid}" data-selected="${s.selected ? "1" : "0"}" data-hex-raw="${esc(raw)}" style="--seg-hex:${raw}">` +
      `<g class="tile-motion">` +
      `<g class="tile-levitate">` +
      `<g class="tile-parallax">` +
      `<g class="tile-body" filter="url(#wheel-petal-shadow-default)">` +
      `<path class="tile-fill" d="${d}" fill="${fill}" fill-opacity="1" stroke="none" stroke-width="0"></path>` +
      `</g></g></g></g>` +
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

  setHot(seg) {
    const prev = this.hot;
    if (prev === seg) return;
    this.hot = seg;
    if (prev) this.paintSeg(prev);
    if (seg) this.paintSeg(seg);
    this.syncCascade();
  }

  paintSeg(seg) {
    if (!seg) return;
    const selected = seg.dataset.selected === "1";
    const hot = seg === this.hot || seg.matches(":focus-visible");
    const pressed = seg.classList.contains("is-press") || seg === this.pressedSeg;
    // is-hot только для невыбранных — иначе hover-scale конфликтует с lift.
    seg.classList.toggle("is-hot", hot && !selected);
    const body = seg.querySelector(".tile-body");
    const motion = seg.querySelector(".tile-motion");
    const fill = seg.querySelector(".tile-fill");
    const raw = seg.dataset.hexRaw || "#cccccc";
    const lit = selected || hot || pressed ? TILE_LIT_HOT : TILE_LIT_REST;
    if (fill) fill.setAttribute("fill", lightenJuicy(raw, lit));
    if (selected) {
      body?.setAttribute("filter", "url(#wheel-petal-shadow-selected)");
      this.startLiftAnim(motion);
    } else {
      // Hover-тень анимируется CSS на .tile-levitate — SVG-filter не дёргаем при is-hot.
      body?.setAttribute("filter", "url(#wheel-petal-shadow-default)");
      this.stopLiftAnim(motion);
    }
  }

  cascadeSource() {
    return this.pressedSeg || this.hot || null;
  }

  previewPose(tile, up) {
    if (!up) {
      return {
        transform: "translate(0px, 0px) scale(1)",
        filter: "drop-shadow(0px 0px 0px rgba(0,0,0,0))",
      };
    }
    const mid = Number(tile.dataset.mid) || 0;
    const rad = ((mid - 90) * Math.PI) / 180;
    const dx = Math.cos(rad) * CASCADE_OUT;
    const dy = Math.sin(rad) * CASCADE_OUT;
    return {
      transform: `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${CASCADE_SCALE})`,
      filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.14))",
    };
  }

  animatePreview(tile, dir, delay, duration) {
    const motion = tile.querySelector(".preview-motion");
    if (!motion) return null;
    motion.getAnimations().forEach((a) => {
      try { a.cancel(); } catch { /* ignore */ }
    });
    let fromT = getComputedStyle(motion).transform;
    let fromF = getComputedStyle(motion).filter;
    if (!fromT || fromT === "none") fromT = "translate(0px, 0px) scale(1)";
    if (!fromF || fromF === "none") fromF = "drop-shadow(0px 0px 0px rgba(0,0,0,0))";
    const to = this.previewPose(tile, dir === "up");
    const anim = motion.animate(
      [{ transform: fromT, filter: fromF }, to],
      {
        duration,
        delay,
        fill: "forwards",
        easing: dir === "up"
          ? "cubic-bezier(.22,.82,.28,1)"
          : "cubic-bezier(.33,.12,.25,1)",
      },
    );
    if (dir === "down") {
      anim.finished.then(() => {
        if (this.cascadeParentId != null && String(tile.dataset.parentId) === String(this.cascadeParentId)) {
          return;
        }
        try { anim.cancel(); } catch { /* ignore */ }
        motion.style.transform = "";
        motion.style.filter = "";
      }).catch(() => {});
    }
    return anim;
  }

  resetCascade(hard = false) {
    this.cascadeParentId = null;
    this.cascadeMode = "idle";
    if (!hard || !this.shadowRoot) return;
    this.shadowRoot.querySelectorAll(".preview-motion").forEach((motion) => {
      motion.getAnimations().forEach((a) => {
        try { a.cancel(); } catch { /* ignore */ }
      });
      motion.style.transform = "";
      motion.style.filter = "";
    });
  }

  syncCascade() {
    if (this.reduced || this.viewLevel > 1) {
      this.collapseCascade({ fast: true });
      return;
    }
    const source = this.cascadeSource();
    if (!source) {
      this.collapseCascade({ fast: false });
      return;
    }
    const kind = source.dataset.kind;
    if (kind !== "sector" && kind !== "subsector") {
      this.collapseCascade({ fast: true });
      return;
    }
    this.expandCascade(source.dataset.id);
  }

  expandCascade(parentId) {
    const id = String(parentId);
    if (this.cascadeParentId === id && this.cascadeMode === "up") return;
    this.cascadeParentId = id;
    this.cascadeMode = "up";
    const all = [...this.shadowRoot.querySelectorAll(".preview-tile")];
    const kids = all
      .filter((t) => String(t.dataset.parentId) === id)
      .sort((a, b) => Number(a.dataset.previewI) - Number(b.dataset.previewI));
    const others = all.filter((t) => String(t.dataset.parentId) !== id);
    others.forEach((tile, i) => {
      this.animatePreview(tile, "down", i * CASCADE_FAST_DELAY, CASCADE_FAST_MS);
    });
    kids.forEach((tile, i) => {
      this.animatePreview(tile, "up", i * CASCADE_DELAY, CASCADE_UP_MS);
    });
  }

  collapseCascade({ fast = false } = {}) {
    if (this.cascadeMode === "idle" && this.cascadeParentId == null) return;
    const parentId = this.cascadeParentId;
    this.cascadeParentId = null;
    this.cascadeMode = parentId == null ? "idle" : "down";
    const delay = fast ? CASCADE_FAST_DELAY : CASCADE_DOWN_DELAY;
    const dur = fast ? CASCADE_FAST_MS : CASCADE_DOWN_MS;
    let tiles;
    if (parentId == null) {
      tiles = [...this.shadowRoot.querySelectorAll(".preview-tile")];
    } else {
      const id = String(parentId);
      tiles = [...this.shadowRoot.querySelectorAll(".preview-tile")]
        .filter((t) => String(t.dataset.parentId) === id);
    }
    tiles
      .sort((a, b) => Number(a.dataset.previewI) - Number(b.dataset.previewI))
      .forEach((tile, i) => {
        this.animatePreview(tile, "down", i * delay, dur);
      });
    // stray elevated tiles from interrupted switches
    this.shadowRoot.querySelectorAll(".preview-motion").forEach((motion) => {
      const tile = motion.closest(".preview-tile");
      if (!tile) return;
      if (parentId != null && String(tile.dataset.parentId) === String(parentId)) return;
      if (!motion.getAnimations().length) {
        const t = getComputedStyle(motion).transform;
        if (t && t !== "none") this.animatePreview(tile, "down", 0, CASCADE_FAST_MS);
      }
    });
    if (!tiles.length) this.cascadeMode = "idle";
  }

  startLiftAnim(motion) {
    if (!motion) return;
    const prev = this.liftAnims.get(motion) || {};
    if (prev.loop && prev.loop.playState !== "finished") return;
    if (prev.exit) {
      try { prev.exit.cancel(); } catch { /* ignore */ }
    }
    if (this.reduced) {
      motion.style.transform = LIFT_STATIC.transform;
      motion.style.filter = LIFT_STATIC.filter;
      this.liftAnims.set(motion, { static: true });
      return;
    }
    if (prev.enter) {
      try { prev.enter.cancel(); } catch { /* ignore */ }
    }
    const enter = motion.animate([LIFT_REST, LIFT_LOW], {
      duration: 380,
      easing: "ease-out",
      fill: "forwards",
    });
    this.liftAnims.set(motion, { enter });
    enter.finished.then(() => {
      const cur = this.liftAnims.get(motion);
      if (!cur || cur.enter !== enter) return;
      try { enter.cancel(); } catch { /* ignore */ }
      const loop = motion.animate([LIFT_LOW, LIFT_HIGH], {
        duration: 3000,
        easing: "ease-in-out",
        direction: "alternate",
        iterations: Infinity,
      });
      this.liftAnims.set(motion, { loop });
    }).catch(() => {});
  }

  stopLiftAnim(motion) {
    if (!motion) return;
    const prev = this.liftAnims.get(motion);
    if (!prev) return;
    if (this.reduced || prev.static) {
      motion.style.transform = "";
      motion.style.filter = "";
      this.liftAnims.delete(motion);
      return;
    }
    if (prev.exit && prev.exit.playState !== "finished") return;
    const running = prev.loop || prev.enter;
    let fromT = getComputedStyle(motion).transform;
    let fromF = getComputedStyle(motion).filter;
    if (running) {
      try { running.cancel(); } catch { /* ignore */ }
    }
    if (!fromT || fromT === "none") fromT = LIFT_REST.transform;
    if (!fromF || fromF === "none") fromF = LIFT_REST.filter;
    const exit = motion.animate(
      [{ transform: fromT, filter: fromF }, LIFT_REST],
      { duration: 420, easing: "ease-out", fill: "forwards" },
    );
    this.liftAnims.set(motion, { exit });
    exit.finished.then(() => {
      const cur = this.liftAnims.get(motion);
      if (!cur || cur.exit !== exit) return;
      try { exit.cancel(); } catch { /* ignore */ }
      motion.style.transform = "";
      motion.style.filter = "";
      this.liftAnims.delete(motion);
    }).catch(() => {});
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

  buildPanelHtml() {
    if (this.viewLevel === 0 || !this.sector()) {
      return `<div class="sheet sheet-empty" data-testid="wheel-info-description"><h2>Информация</h2><p>${esc(INFO_EMPTY)}</p></div>`;
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
    return `
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
      </article>`;
  }

  ensurePanelShell() {
    if (!this.panelEl) return null;
    let viewport = this.panelEl.querySelector(":scope > .panel-viewport");
    if (!viewport) {
      this.panelEl.innerHTML = `<div class="panel-viewport"><div class="panel-layer"></div></div>`;
      viewport = this.panelEl.querySelector(".panel-viewport");
    }
    let layer = viewport.querySelector(":scope > .panel-layer");
    if (!layer) {
      viewport.innerHTML = `<div class="panel-layer"></div>`;
      layer = viewport.querySelector(".panel-layer");
    }
    if (viewport && !viewport._fwOverflowBound) {
      viewport._fwOverflowBound = true;
      viewport.addEventListener("scroll", () => this.syncPanelOverflow(), { passive: true });
      try { this.panelRo?.observe(viewport); } catch { /* ignore */ }
    }
    return { viewport, layer };
  }

  renderPanel() {
    const html = this.buildPanelHtml();
    const shell = this.ensurePanelShell();
    if (!shell) return;
    const { viewport, layer } = shell;
    const gen = ++this.panelGen;
    const narrow = this.dataset.layout === "narrow";

    const panelCap = () => {
      if (!narrow) return Infinity;
      const h = this.panelEl?.clientHeight || 0;
      return h > 0 ? h : Infinity;
    };

    const settle = () => {
      if (gen !== this.panelGen) return;
      if (narrow) {
        // В пределах max-height панели; длинный контент — внутренний scroll.
        viewport.style.height = "100%";
        viewport.style.maxHeight = "100%";
      } else {
        viewport.style.height = "auto";
        viewport.style.maxHeight = "";
      }
      layer.style.opacity = "";
      layer.style.transform = "";
      layer.style.filter = "";
      this.syncPanelOverflow();
    };

    const cancelAnims = (el) => {
      el?.getAnimations?.().forEach((a) => {
        try { a.cancel(); } catch { /* ignore */ }
      });
    };

    // Первый кадр или reduced-motion — мгновенно.
    if (this.reduced || !layer.childElementCount) {
      cancelAnims(viewport);
      cancelAnims(layer);
      layer.innerHTML = html;
      settle();
      return;
    }

    const cap = panelCap();
    const fromRaw = viewport.getBoundingClientRect().height || layer.getBoundingClientRect().height;
    const fromH = Math.min(fromRaw, cap);
    const probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;left:0;top:0;width:100%;";
    probe.innerHTML = html;
    viewport.appendChild(probe);
    const toRaw = probe.getBoundingClientRect().height;
    probe.remove();
    if (gen !== this.panelGen) return;
    const toH = Math.min(Math.max(1, toRaw), cap);

    cancelAnims(viewport);
    cancelAnims(layer);

    viewport.style.height = `${fromH}px`;
    viewport.style.maxHeight = narrow ? "100%" : "";
    const heightAnim = viewport.animate(
      [{ height: `${fromH}px` }, { height: `${toH}px` }],
      { duration: PANEL_HEIGHT_MS, easing: PANEL_EASE, fill: "forwards" },
    );

    const out = layer.animate(
      [
        { opacity: 1, transform: "translateY(0px)", filter: "blur(0px)" },
        { opacity: 0, transform: `translateY(-${PANEL_SHIFT_PX}px)`, filter: "blur(2px)" },
      ],
      { duration: PANEL_OUT_MS, easing: PANEL_EASE, fill: "forwards" },
    );

    out.finished.then(() => {
      if (gen !== this.panelGen) return;
      layer.innerHTML = html;
      layer.animate(
        [
          { opacity: 0, transform: `translateY(${PANEL_SHIFT_PX}px)`, filter: "blur(2px)" },
          { opacity: 1, transform: "translateY(0px)", filter: "blur(0px)" },
        ],
        { duration: PANEL_IN_MS, easing: PANEL_EASE, fill: "forwards" },
      ).finished.then(settle).catch(settle);
    }).catch(() => {
      if (gen !== this.panelGen) return;
      layer.innerHTML = html;
      settle();
    });

    heightAnim.finished.then(() => {
      if (gen !== this.panelGen) return;
      // height остаётся forwards до settle после in-анимации
    }).catch(() => {});
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

  clearPress() {
    if (!this.pressedSeg) return;
    const prev = this.pressedSeg;
    prev.classList.remove("is-press");
    this.pressedSeg = null;
    this.paintSeg(prev);
    this.syncCascade();
  }

  setPress(seg) {
    if (this.pressedSeg === seg) return;
    this.clearPress();
    if (!seg) return;
    this.pressedSeg = seg;
    seg.classList.add("is-press");
    this.paintSeg(seg);
    this.syncCascade();
  }

  paraMaxPx() {
    const w = window.innerWidth || this.wheelBox?.clientWidth || 1440;
    return w >= 800 ? PARA_MAX_WIDE : PARA_MAX_NARROW;
  }

  clearParaTarget() {
    this.paraTarget.x = 0;
    this.paraTarget.y = 0;
    this.ensureParaLoop();
  }

  resetParallax(hard = false) {
    this.paraTarget.x = 0;
    this.paraTarget.y = 0;
    if (hard) {
      if (this.paraSeg) {
        const layer = this.paraSeg.querySelector?.(".tile-parallax");
        if (layer) layer.style.transform = "";
      }
      this.paraSeg = null;
      this.paraCurrent.x = 0;
      this.paraCurrent.y = 0;
      cancelAnimationFrame(this.paraRaf);
      this.paraRaf = 0;
    }
  }

  applyParaStyles() {
    if (!this.paraSeg) return;
    const layer = this.paraSeg.querySelector(".tile-parallax");
    if (!layer) return;
    const x = this.paraCurrent.x;
    const y = this.paraCurrent.y;
    if (Math.abs(x) < 0.02 && Math.abs(y) < 0.02) {
      layer.style.transform = "";
      return;
    }
    layer.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
  }

  ensureParaLoop() {
    if (this.reduced || this.paraRaf) return;
    const tick = () => {
      if (this.reduced) {
        this.paraRaf = 0;
        this.resetParallax(true);
        return;
      }
      const dx = this.paraTarget.x - this.paraCurrent.x;
      const dy = this.paraTarget.y - this.paraCurrent.y;
      this.paraCurrent.x += dx * PARA_LERP;
      this.paraCurrent.y += dy * PARA_LERP;
      if (Math.abs(dx) < 0.02 && Math.abs(dy) < 0.02) {
        this.paraCurrent.x = this.paraTarget.x;
        this.paraCurrent.y = this.paraTarget.y;
      }
      this.applyParaStyles();
      const idle =
        this.paraTarget.x === 0 && this.paraTarget.y === 0 &&
        Math.abs(this.paraCurrent.x) < 0.02 && Math.abs(this.paraCurrent.y) < 0.02;
      if (idle) {
        if (this.paraSeg) {
          const layer = this.paraSeg.querySelector(".tile-parallax");
          if (layer) layer.style.transform = "";
        }
        this.paraCurrent.x = 0;
        this.paraCurrent.y = 0;
        this.paraSeg = null;
        this.paraRaf = 0;
        return;
      }
      this.paraRaf = requestAnimationFrame(tick);
    };
    this.paraRaf = requestAnimationFrame(tick);
  }

  handleTileParallax(e) {
    if (this.reduced || this.drag?.active) return;
    const seg = e.target.closest?.(".seg");
    if (!seg) {
      if (this.paraSeg) this.clearParaTarget();
      return;
    }
    if (this.paraSeg && this.paraSeg !== seg) {
      const prev = this.paraSeg.querySelector(".tile-parallax");
      if (prev) prev.style.transform = "";
      this.paraCurrent.x = 0;
      this.paraCurrent.y = 0;
    }
    this.paraSeg = seg;
    const fill = seg.querySelector(".tile-fill");
    const box = (fill || seg).getBoundingClientRect();
    if (!box.width || !box.height) return;
    const max = this.paraMaxPx();
    const nx = ((e.clientX - box.left) / box.width) * 2 - 1;
    const ny = ((e.clientY - box.top) / box.height) * 2 - 1;
    this.paraTarget.x = Math.max(-max, Math.min(max, nx * max));
    this.paraTarget.y = Math.max(-max, Math.min(max, ny * max));
    this.ensureParaLoop();
  }

  async maybeRequestGyro() {
    if (this.gyroAsked || this.reduced) return;
    this.gyroAsked = true;
    try {
      const DOE = window.DeviceOrientationEvent;
      if (DOE && typeof DOE.requestPermission === "function") {
        const state = await DOE.requestPermission();
        this.gyroAllowed = state === "granted";
      } else if ("DeviceOrientationEvent" in window) {
        this.gyroAllowed = true;
      }
    } catch {
      this.gyroAllowed = false;
    }
    if (this.gyroAllowed) {
      this.tiltMode = "gyro";
      window.addEventListener("deviceorientation", this.onOrient, { passive: true });
    } else {
      this.tiltMode = "mouse";
    }
    this.ensureTiltLoop();
  }

  handleOrientation(e) {
    if (this.reduced || !this.gyroAllowed) return;
    const beta = Number(e.beta) || 0;
    const gamma = Number(e.gamma) || 0;
    const rx = Math.max(-TILT_MAX_GYRO, Math.min(TILT_MAX_GYRO, beta * 0.18));
    const ry = Math.max(-TILT_MAX_GYRO, Math.min(TILT_MAX_GYRO, gamma * 0.22));
    this.tiltTarget.x = rx;
    this.tiltTarget.y = ry;
  }

  handleMouseTilt(e) {
    if (this.reduced || this.tiltMode === "gyro") return;
    if (e.pointerType && e.pointerType !== "mouse") return;
    const box = this.wheelPerspective?.getBoundingClientRect();
    if (!box || !box.width || !box.height) return;
    const nx = ((e.clientX - box.left) / box.width) * 2 - 1;
    const ny = ((e.clientY - box.top) / box.height) * 2 - 1;
    if (Math.abs(nx) > 1.4 || Math.abs(ny) > 1.4) {
      this.tiltTarget.x = 0;
      this.tiltTarget.y = 0;
      return;
    }
    this.tiltMode = "mouse";
    this.tiltTarget.x = Math.max(-TILT_MAX_MOUSE, Math.min(TILT_MAX_MOUSE, -ny * TILT_MAX_MOUSE));
    this.tiltTarget.y = Math.max(-TILT_MAX_MOUSE, Math.min(TILT_MAX_MOUSE, nx * TILT_MAX_MOUSE));
  }

  resetTilt(hard = false) {
    this.tiltTarget.x = 0;
    this.tiltTarget.y = 0;
    if (hard) {
      this.tiltCurrent.x = 0;
      this.tiltCurrent.y = 0;
      this.applyTiltStyles();
      cancelAnimationFrame(this.tiltRaf);
      this.tiltRaf = 0;
    }
  }

  applyTiltStyles() {
    if (!this.wheelTilt) return;
    const rx = this.tiltCurrent.x;
    const ry = this.tiltCurrent.y;
    this.wheelTilt.style.setProperty("--tilt-rx", `${rx.toFixed(3)}deg`);
    this.wheelTilt.style.setProperty("--tilt-ry", `${ry.toFixed(3)}deg`);
    // Тень слегка против наклона (коэфф. пропорциональны малой амплитуде ~2°).
    this.wheelTilt.style.setProperty("--tilt-sx", `${(-ry * 0.35).toFixed(2)}px`);
    this.wheelTilt.style.setProperty("--tilt-sy", `${(18 + rx * 0.28).toFixed(2)}px`);
  }

  ensureTiltLoop() {
    if (this.reduced || this.tiltRaf) return;
    const tick = () => {
      if (this.reduced) {
        this.tiltRaf = 0;
        this.resetTilt(true);
        return;
      }
      const dx = this.tiltTarget.x - this.tiltCurrent.x;
      const dy = this.tiltTarget.y - this.tiltCurrent.y;
      this.tiltCurrent.x += dx * TILT_LERP;
      this.tiltCurrent.y += dy * TILT_LERP;
      if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
        this.tiltCurrent.x = this.tiltTarget.x;
        this.tiltCurrent.y = this.tiltTarget.y;
      }
      this.applyTiltStyles();
      this.tiltRaf = requestAnimationFrame(tick);
    };
    this.tiltRaf = requestAnimationFrame(tick);
  }

  stopInertia() {
    const was = !!this.inertiaRaf || Math.abs(this.inertiaV) > 0;
    if (this.inertiaRaf) {
      cancelAnimationFrame(this.inertiaRaf);
      this.inertiaRaf = 0;
    }
    this.inertiaV = 0;
    this.inertiaLastT = 0;
    return was;
  }

  /** Угловая скорость жеста (°/с) по последним ~100 мс сэмплов. */
  gestureSpeedDps(samples, nowTs) {
    if (!samples?.length) return 0;
    const last = samples[samples.length - 1];
    if (nowTs - last.t > INERTIA_PAUSE_MS) return 0;
    const t0 = last.t - INERTIA_SAMPLE_MS;
    let i = 0;
    while (i < samples.length - 1 && samples[i].t < t0) i += 1;
    const first = samples[i];
    const dt = last.t - first.t;
    if (dt < 20) return 0;
    return ((last.rot - first.rot) / dt) * 1000;
  }

  /** Передача <1 + мягкий потолок tanh → стартовая скорость инерции °/с. */
  mapInertiaSpeed(gestureDps) {
    if (!Number.isFinite(gestureDps)) return 0;
    if (Math.abs(gestureDps) < INERTIA_MIN_GESTURE_DPS) return 0;
    const raw = gestureDps * INERTIA_TRANSFER;
    const sign = raw < 0 ? -1 : 1;
    return sign * INERTIA_VMAX_DPS * Math.tanh(Math.abs(raw) / INERTIA_VMAX_DPS);
  }

  startInertia(v0Dps) {
    this.stopInertia();
    if (this.reduced || Math.abs(v0Dps) < INERTIA_STOP_DPS) return;
    this.inertiaV = v0Dps;
    this.inertiaLastT = performance.now();
    const tick = (now) => {
      if (this.reduced) {
        this.stopInertia();
        return;
      }
      let dt = (now - this.inertiaLastT) / 1000;
      this.inertiaLastT = now;
      if (dt <= 0) {
        this.inertiaRaf = requestAnimationFrame(tick);
        return;
      }
      if (dt > 0.05) dt = 0.05;
      this.rotation += this.inertiaV * dt;
      this.inertiaV *= Math.exp(-INERTIA_FRICTION * dt);
      this.rotor.setAttribute("transform", `rotate(${this.rotation} ${CX} ${CY})`);
      if (Math.abs(this.inertiaV) < INERTIA_STOP_DPS) {
        this.inertiaV = 0;
        this.inertiaRaf = 0;
        return;
      }
      this.inertiaRaf = requestAnimationFrame(tick);
    };
    this.inertiaRaf = requestAnimationFrame(tick);
  }

  onDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    this.lastPointerType = e.pointerType || "";
    if (e.pointerType === "mouse" || e.pointerType === "touch" || e.pointerType === "pen") {
      this.blurPointerFocus();
      if (e.cancelable) e.preventDefault();
    }
    if (e.pointerType === "touch" || e.pointerType === "pen") this.maybeRequestGyro();
    // Хват во время инерции: стоп + это касание не клик.
    const grabbed = this.stopInertia();
    const seg = e.target.closest?.(".seg");
    if (seg && !grabbed) this.setPress(seg);
    this.drag = {
      last: this.pointerAngle(e),
      moved: 0,
      active: false,
      id: e.pointerId,
      samples: [],
      suppressTap: grabbed,
    };
  }

  onMove(e) {
    if (!this.drag || e.pointerId !== this.drag.id) return;
    const a = this.pointerAngle(e);
    const delta = angDelta(this.drag.last, a);
    this.drag.last = a;
    this.drag.moved += Math.abs(delta);
    if (!this.drag.active) {
      if (this.drag.moved <= 5) return;
      this.drag.active = true;
      this.clearPress();
      this.svg.setPointerCapture?.(e.pointerId);
      this.svg.classList.add("is-dragging");
      this.blurPointerFocus();
    }
    this.rotation += delta;
    this.rotor.setAttribute("transform", `rotate(${this.rotation} ${CX} ${CY})`);
    const samples = this.drag.samples;
    samples.push({ t: e.timeStamp, rot: this.rotation });
    const cut = e.timeStamp - (INERTIA_SAMPLE_MS + 40);
    while (samples.length && samples[0].t < cut) samples.shift();
    if (e.cancelable) e.preventDefault();
  }

  onUp(e) {
    if (!this.drag || (e && e.pointerId !== this.drag.id)) return;
    const active = this.drag.active;
    const samples = this.drag.samples;
    const suppressTap = this.drag.suppressTap;
    const nowTs = e?.timeStamp ?? performance.now();
    this.drag = null;
    this.svg.classList.remove("is-dragging");
    this.clearPress();
    if (e && (e.pointerType === "mouse" || e.pointerType === "touch" || e.pointerType === "pen")) {
      this.blurPointerFocus();
    }
    if (active) {
      this.suppressClick = true;
      setTimeout(() => { this.suppressClick = false; }, 0);
      const gesture = this.gestureSpeedDps(samples, nowTs);
      const v0 = this.mapInertiaSpeed(gesture);
      this.startInertia(v0);
      return;
    }
    if (suppressTap) {
      this.suppressClick = true;
      setTimeout(() => { this.suppressClick = false; }, 0);
    }
  }
}

if (!customElements.get("flavor-wheel")) {
  customElements.define("flavor-wheel", FlavorWheel);
}
