/**
 * Тестовое колесо: плитки в стиле витража (эталон floral-tea + генератор OKLCH).
 * Основной flavor-wheel не меняет поведение — отдельный custom element.
 */
import { FlavorWheel, lightenJuicy, TILE_LIT_REST, TILE_LIT_HOT } from "../flavor-wheel.js";
import { fitLabel, labelPlacement, petalPath, CX, CY } from "../geometry.js";
import {
  initVitrazhEngine,
  vitrazhTileInnerHtml,
  asMainTile,
  previewToTile,
} from "./vitrazh-style.js";

const ETALON_URL = new URL("./vitrazh-cell-etalon.svg", import.meta.url).href;
const VITRAZH_CACHE_BUST = "vitrazh1";

const vitrazhReady = initVitrazhEngine(`${ETALON_URL}?v=${VITRAZH_CACHE_BUST}`);

class FlavorWheelVitrazh extends FlavorWheel {
  constructor() {
    super();
    this._vitrazhBoot = vitrazhReady;
  }

  connectedCallback() {
    super.connectedCallback();
    this._vitrazhBoot.catch(() => {
      if (this.panelEl) {
        this.panelEl.innerHTML = `<p class="load-msg">Не удалось загрузить витражный эталон.</p>`;
      }
    });
  }

  async load() {
    try {
      await this._vitrazhBoot;
    } catch (err) {
      console.error(err);
      if (this.panelEl) {
        this.panelEl.innerHTML = `<p class="load-msg">Не удалось загрузить витражный эталон.</p>`;
      }
      return;
    }
    return super.load();
  }

  vitrazhHex(raw, lit = TILE_LIT_REST) {
    return lightenJuicy(raw, lit);
  }

  vitrazhBodyHtml(t, hex) {
    return `<g class="tile-vitrazh" data-hex-lit="${hex}">${vitrazhTileInnerHtml(t, hex)}</g>`;
  }

  renderWheel() {
    if (!this.rotor || !this.tree.length) return;
    const g = this.geom;
    const level = this.viewLevel;
    const model = this.model(level, g);
    this.segmentCount = Math.max(1, model.main.length);

    const previews = model.preview.map((p) => {
      const t = previewToTile(p, g);
      const fill = this.vitrazhHex(p.hex, TILE_LIT_REST);
      const mid = (p.a0 + p.a1) / 2;
      return `<g class="preview-tile" data-parent-id="${String(p.parentId)}" data-preview-i="${p.index}" data-mid="${mid}">` +
        `<g class="preview-motion">` +
        `<g class="tile-vitrazh preview-vitrazh" data-hex-lit="${fill}">${vitrazhTileInnerHtml(t, fill)}</g>` +
        `</g></g>`;
    }).join("");

    const segs = model.main.map((s) => this.segmentHtml(s, level, g)).join("");
    this.rotor.innerHTML = `<g class="preview-ring" pointer-events="none">${previews}</g>${segs}`;
    this.applyRotation();
    this.svg.setAttribute("viewBox", g.viewBox);
    this.hot = null;
    this.resetParallax(true);
    this.resetCascade(true);
    this.renderCenter();
    this.shadowRoot.querySelectorAll(".seg").forEach((seg) => this.paintSeg(seg));
  }

  segmentHtml(s, level, g) {
    const fitted = fitLabel(s.node.name, s.rIn, s.rOut, s.a0, s.a1, g.labelMaxFont(level));
    const place = labelPlacement(s.rIn, s.rOut, s.a0, s.a1, fitted.fontSize, fitted.lines.length);
    const tspans = fitted.lines.map((line, i) =>
      `<tspan x="${place.x}" dy="${i === 0 ? place.firstDy : place.lineHeight}">${this._esc(line)}</tspan>`
    ).join("");
    const mid = (s.a0 + s.a1) / 2;
    const raw = s.node.hex;
    const fill = this.vitrazhHex(raw, s.selected ? TILE_LIT_HOT : TILE_LIT_REST);
    const t = asMainTile({ a0: s.a0, a1: s.a1, rIn: s.rIn, rOut: s.rOut, node: s.node });
    const focusD = petalPath(CX, CY, s.rIn, s.rOut, s.a0, s.a1, 13.25, 24);

    return `<g class="seg" role="button" tabindex="0" aria-label="${this._esc(s.node.name)}" aria-pressed="${s.selected ? "true" : "false"}" data-testid="wheel-${s.kind}-${s.node.id}" data-kind="${s.kind}" data-id="${s.node.id}" data-mid="${mid}" data-selected="${s.selected ? "1" : "0"}" data-hex-raw="${this._esc(raw)}" data-a0="${s.a0}" data-a1="${s.a1}" data-rIn="${s.rIn}" data-rOut="${s.rOut}" data-slug="${this._esc(s.node.slug || "")}" style="--seg-hex:${raw}">` +
      `<g class="tile-motion">` +
      `<g class="tile-levitate">` +
      `<g class="tile-parallax">` +
      `<g class="tile-shade">` +
      `<g class="tile-body" filter="url(#wheel-petal-shadow-default)">` +
      this.vitrazhBodyHtml(t, fill) +
      `</g></g>` +
      `<text class="tile-label" x="${place.x}" y="${place.y}" text-anchor="middle" transform="rotate(${place.rotate} ${place.x} ${place.y})" font-family="Mulish, sans-serif" font-size="${fitted.fontSize}" font-weight="500" letter-spacing="${place.letterSpacing}" fill="#000000" stroke="none">${tspans}</text>` +
      `</g></g></g>` +
      `<path class="seg-focus-ring" d="${focusD}" aria-hidden="true"></path>` +
      `</g>`;
  }

  _esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  paintSeg(seg) {
    if (!seg) return;
    const selected = seg.dataset.selected === "1";
    const hot = seg === this.hot || seg.matches(":focus-visible");
    const pressed = seg.classList.contains("is-press") || seg === this.pressedSeg;
    seg.classList.toggle("is-hot", hot && !selected);
    const body = seg.querySelector(".tile-body");
    const motion = seg.querySelector(".tile-motion");
    const raw = seg.dataset.hexRaw || "#cccccc";
    const lit = selected || hot || pressed ? TILE_LIT_HOT : TILE_LIT_REST;
    const hex = this.vitrazhHex(raw, lit);
    const vit = seg.querySelector(".tile-vitrazh");
    if (vit && vit.dataset.hexLit !== hex) {
      const t = asMainTile({
        a0: Number(seg.dataset.a0),
        a1: Number(seg.dataset.a1),
        rIn: Number(seg.dataset.rIn),
        rOut: Number(seg.dataset.rOut),
        node: { hex: raw, slug: seg.dataset.slug || seg.dataset.id },
      });
      vit.innerHTML = vitrazhTileInnerHtml(t, hex);
      vit.dataset.hexLit = hex;
    }
    if (selected) {
      body?.setAttribute("filter", "url(#wheel-petal-shadow-selected)");
      this.startLiftAnim(motion);
    } else {
      body?.setAttribute("filter", "url(#wheel-petal-shadow-default)");
      this.stopLiftAnim(motion);
    }
  }
}

if (!customElements.get("flavor-wheel-vitrazh")) {
  customElements.define("flavor-wheel-vitrazh", FlavorWheelVitrazh);
}

export { VITRAZH_CACHE_BUST };
