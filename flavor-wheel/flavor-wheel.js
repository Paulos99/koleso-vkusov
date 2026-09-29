import {
  CX, CY, wheelGeometry, petalPath, fitLabel, labelPlacement,
  isLight, glow, inertiaTarget,
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

function mixHex(hex, amount = 0.78) {
  const raw = String(hex || "#cccccc").replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw.padEnd(6, "0").slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return "#f3f3f0";
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (c) => Math.round(c + (255 - c) * amount);
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function cssText() {
  return `
:host {
  --fw-font-family: Mulish, "Mulish Fallback", Arial, sans-serif;
  --fw-max-width: 1280px;
  --fw-bg: transparent;
  --fw-ink: #000000;
  display: block;
  width: 100%;
  min-width: 0;
  align-self: center;
  max-width: var(--fw-max-width);
  margin: 0 auto;
  background: var(--fw-bg);
  color: var(--fw-ink);
  font-family: var(--fw-font-family);
  position: relative;
}
:host *, :host *::before, :host *::after { box-sizing: border-box; }
.stage { position: relative; }
.wrap { position: relative; z-index: 1; width: 100%; padding: 0; container-type: inline-size; }
.grid {
  display: grid; grid-template-columns: minmax(0, 1fr); align-items: center; gap: 0;
}
:host([data-layout="wide"]) .grid {
  grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
  gap: 0 40px; align-items: center;
}
.wheel-col { order: 1; display: flex; width: 100%; min-width: 0; flex-direction: column; align-items: center; }
.panel { order: 2; width: 100%; margin-top: 24px; min-width: 0; }
:host([data-layout="wide"]) .panel { margin-top: 0; }
.trail {
  width: 100%; max-width: 700px; margin: 0 auto 12px;
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
  min-height: 0;
}
.trail:empty { display: none; margin: 0; }
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
  width: 600px; max-width: calc(100% + 16px);
  margin-left: -8px; margin-right: -8px;
}
@container (min-width: 1024px) {
  .wheel-box { max-width: 100%; margin-left: 0; margin-right: 0; }
}
:host([data-layout="wide"]) .wheel-box { width: 700px; max-width: 100%; margin: 0; }
svg.wheel {
  display: block; width: 100%; height: auto; overflow: visible;
  touch-action: none; user-select: none; cursor: grab;
}
svg.wheel.is-dragging { cursor: grabbing; }
.seg {
  cursor: pointer; outline: none; isolation: isolate;
  transform-box: view-box; transform-origin: 400px 400px;
  transition: transform .2s ease;
}
.seg.is-hot { transform: scale(1.04); }
.seg .glass-fill { transition: fill-opacity .2s ease; }
.seg .glass-sheen {
  pointer-events: none; mix-blend-mode: screen; opacity: .55;
  transition: opacity .28s ease;
}
.seg.is-hot .glass-sheen { opacity: .95; }
.seg text {
  pointer-events: none;
  fill: #000000;
  stroke: none;
  paint-order: normal;
}
.center-hit {
  cursor: default; outline: none;
  transform-box: view-box; transform-origin: 400px 400px;
  transition: transform .2s ease, opacity .2s ease;
}
.center-hit.is-back { cursor: pointer; }
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
  .seg, .glass-fill, .glass-sheen, .center-hit, .chip, .trail-crumb, .show-cta { transition: none !important; }
  .seg.is-hot, .center-hit.is-back:hover { transform: none; }
}
`;
}

function filters() {
  const specs = [
    ["wheel-petal-shadow-default", 2, 5, 0.1],
    ["wheel-petal-shadow-selected", 4, 8, 0.16],
    ["wheel-petal-shadow-hover", 6, 12, 0.2],
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
    this.suppressClick = false;
    this.inertiaRaf = 0;
    this.urlTimer = 0;
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
                <svg class="wheel" viewBox="0 0 800 800" role="img" aria-label="Колесо вкусов — фильтр по нотам (потяните для вращения)">
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
      if (w <= 425) this.setAttribute("data-compact", "");
      else this.removeAttribute("data-compact");
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
    const raw = this.getAttribute("center-text");
    if (!raw) return ["Coffee", "Choice"];
    const parts = raw.split("|");
    return [parts[0] || "Coffee", parts[1] || ""];
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
        return;
      }
    }
    const seg = e.target.closest?.(".seg");
    if (seg) { this.onSegment(seg); return; }
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
    const previews = model.preview.map((p) => {
      const d = petalPath(CX, CY, g.middleR + 12, g.outerR, p.a0, p.a1, 6, 12);
      return `<path d="${d}" fill="${p.hex}" fill-opacity="0.28" stroke="rgba(255,255,255,.55)" stroke-width="1.1"></path>`;
    }).join("");
    const segs = model.main.map((s) => this.segmentHtml(s, level, g)).join("");
    this.rotor.innerHTML = `<g pointer-events="none" filter="url(#wheel-preview-shadow)">${previews}</g>${segs}`;
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

  segmentHtml(s, level, g) {
    const d = petalPath(CX, CY, s.rIn, s.rOut, s.a0, s.a1, 12, 24);
    const fitted = fitLabel(s.node.name, s.rIn, s.rOut, s.a0, s.a1, g.labelMaxFont(level));
    const place = labelPlacement(s.rIn, s.rOut, s.a0, s.a1, fitted.fontSize, fitted.lines.length);
    const gl = glow(s.rIn, s.rOut, s.a0, s.a1);
    const gid = `petal-glow-${level}-${s.node.id}`;
    const fill = "#000000";
    const baseOp = level === 2 ? 0.64 : 0.5;
    const tspans = fitted.lines.map((line, i) =>
      `<tspan x="${place.x}" dy="${i === 0 ? place.firstDy : place.lineHeight}">${esc(line)}</tspan>`
    ).join("");
    const mid = (s.a0 + s.a1) / 2;
    return `<g class="seg" role="button" tabindex="0" aria-label="${esc(s.node.name)}" aria-pressed="${s.selected ? "true" : "false"}" data-testid="wheel-${s.kind}-${s.node.id}" data-kind="${s.kind}" data-id="${s.node.id}" data-mid="${mid}" data-selected="${s.selected ? "1" : "0"}" data-base-op="${baseOp}"><g filter="url(#wheel-petal-shadow-default)"><path class="glass-fill" d="${d}" fill="${s.node.hex}" fill-opacity="${baseOp}" stroke="rgba(255,255,255,.55)" stroke-width="1.25"></path></g><defs><radialGradient id="${gid}" cx="${gl.cx}" cy="${gl.cy}" r="${gl.r}" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#fff" stop-opacity="0.5"></stop><stop offset="55%" stop-color="#fff" stop-opacity="0.12"></stop><stop offset="100%" stop-color="#fff" stop-opacity="0"></stop></radialGradient></defs><path class="glass-sheen" d="${d}" fill="url(#${gid})"></path><text x="${place.x}" y="${place.y}" text-anchor="middle" transform="rotate(${place.rotate} ${place.x} ${place.y})" font-family="Mulish, sans-serif" font-size="${fitted.fontSize}" font-weight="500" letter-spacing="${place.letterSpacing}" fill="${fill}">${tspans}</text></g>`;
  }

  renderCenter() {
    const g = this.geom;
    const lines = this.centerLines();
    const long = lines.some((w) => w.length > 10);
    const fs = long ? 16 : g.centerFont;
    const y1 = CY - g.centerLineStep / 2;
    const y2 = CY + g.centerLineStep / 2;
    let color = "#000000";
    if (this.viewLevel === 1 && this.sector()) {
      color = isLight(this.sector().hex) ? "#000000" : this.sector().hex;
    }
    if (this.viewLevel === 2 && this.subsector()) {
      color = isLight(this.subsector().hex) ? "#000000" : this.subsector().hex;
    }
    const r = g.innerR - 14;
    const canBack = this.viewLevel > 0;
    const cls = canBack ? "center-hit is-back" : "center-hit";
    const aria = canBack ? ` role="button" tabindex="0" aria-label="Назад на уровень"` : ` aria-hidden="true"`;
    const text = (t, y) => t
      ? `<text x="400" y="${y}" text-anchor="middle" dominant-baseline="central" font-family="Mulish, sans-serif" font-weight="700" font-size="${fs}" letter-spacing="-2" fill="${color}" pointer-events="none">${esc(t)}</text>`
      : "";
    this.centerLayer.innerHTML = `<g class="${cls}"${aria} filter="url(#wheel-center-shadow)"><circle class="center-disc" cx="400" cy="400" r="${r}"></circle></g>${text(lines[0], y1)}${text(lines[1], y2)}`;
  }

  paintSeg(seg) {
    const selected = seg.dataset.selected === "1";
    const hot = seg === this.hot || seg.matches(":focus-visible");
    seg.classList.toggle("is-hot", hot || selected);
    const name = hot ? "hover" : selected ? "selected" : "default";
    seg.querySelector("g")?.setAttribute("filter", `url(#wheel-petal-shadow-${name})`);
    const base = Number(seg.dataset.baseOp || 0.62);
    const fill = seg.querySelector(".glass-fill");
    if (fill) fill.setAttribute("fill-opacity", String(Math.min(0.92, base + (hot || selected ? 0.1 : 0))));
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

  onDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
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
