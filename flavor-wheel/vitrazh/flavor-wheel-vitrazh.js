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
  preferRasterPreview,
  vitrazhPixelScale,
  vitrazhTileRasterHtml,
} from "./vitrazh-style.js?v=vitrazh3";

const ETALON_URL = new URL("./vitrazh-cell-etalon.svg", import.meta.url).href;
const VITRAZH_CACHE_BUST = "vitrazh3";

const vitrazhReady = initVitrazhEngine(`${ETALON_URL}?v=${VITRAZH_CACHE_BUST}`);

class FlavorWheelVitrazh extends FlavorWheel {
  constructor() {
    super();
    this._vitrazhBoot = vitrazhReady;
    this._previewUpgradeGen = 0;
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

  vitrazhScale() {
    const css = this.wheelBox?.clientWidth || this.wheelW || 335;
    return vitrazhPixelScale(css);
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
      const raster = preferRasterPreview(t);
      const pending = raster ? ` data-raster-pending="1"` : "";
      // data-* в нижнем регистре — dataset/getAttribute без сюрпризов camelCase
      const tAttr = ` data-a0="${t.a0}" data-a1="${t.a1}" data-rin="${t.rIn}" data-rout="${t.rOut}" data-gap="${t.gap}" data-corner="${t.corner}"`;
      // Сразу вектор (кольцо полное на первом кадре); узкие превью потом заменим на bitmap.
      const body = vitrazhTileInnerHtml(t, fill);
      return `<g class="preview-tile" data-parent-id="${String(p.parentId)}" data-preview-i="${p.index}" data-mid="${mid}">` +
        `<g class="preview-motion">` +
        `<g class="tile-vitrazh preview-vitrazh"${pending}${tAttr} data-hex-lit="${fill}">${body}</g>` +
        `</g></g>`;
    }).join("");

    const segs = model.main.map((s) => this.segmentHtml(s, level, g)).join("");
    // Превью поверх main: витражная деформация L1 иногда заходит в полосу outer-кольца и закрывала хвост.
    this.rotor.innerHTML = `${segs}<g class="preview-ring" pointer-events="none">${previews}</g>`;
    this.applyRotation();
    this.svg.setAttribute("viewBox", g.viewBox);
    this.hot = null;
    this.resetParallax(true);
    this.resetCascade(true);
    this.renderCenter();
    this.shadowRoot.querySelectorAll(".seg").forEach((seg) => this.paintSeg(seg));
    // Синхронно в microtask: без rAF-батчей — иначе при раннем скриншоте/VTB хвост кольца пустой.
    queueMicrotask(() => this.upgradePreviewRasters());
  }

  upgradePreviewRasters() {
    const gen = ++this._previewUpgradeGen;
    const pending = [...this.shadowRoot.querySelectorAll(".preview-vitrazh[data-raster-pending='1']")];
    if (!pending.length) return;
    const scale = this.vitrazhScale();
    for (const el of pending) {
      if (gen !== this._previewUpgradeGen || !el.isConnected) return;
      const num = (name) => Number(el.getAttribute(name));
      const t = {
        a0: num("data-a0"),
        a1: num("data-a1"),
        rIn: num("data-rin"),
        rOut: num("data-rout"),
        gap: num("data-gap"),
        corner: num("data-corner"),
      };
      if (![t.a0, t.a1, t.rIn, t.rOut, t.gap, t.corner].every(Number.isFinite)) {
        el.removeAttribute("data-raster-pending");
        continue;
      }
      const hex = el.getAttribute("data-hex-lit");
      try {
        el.innerHTML = vitrazhTileRasterHtml(t, hex, scale);
        el.classList.add("is-raster");
      } catch (err) {
        el.innerHTML = vitrazhTileInnerHtml(t, hex);
        console.warn("vitrazh raster failed", err);
      }
      el.removeAttribute("data-raster-pending");
    }
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

    return `<g class="seg" role="button" tabindex="0" aria-label="${this._esc(s.node.name)}" aria-pressed="${s.selected ? "true" : "false"}" data-testid="wheel-${s.kind}-${s.node.id}" data-kind="${s.kind}" data-id="${s.node.id}" data-mid="${mid}" data-selected="${s.selected ? "1" : "0"}" data-hex-raw="${this._esc(raw)}" data-a0="${s.a0}" data-a1="${s.a1}" data-rin="${s.rIn}" data-rout="${s.rOut}" data-slug="${this._esc(s.node.slug || "")}" style="--seg-hex:${raw}">` +
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
    if (vit && vit.getAttribute("data-hex-lit") !== hex) {
      const t = asMainTile({
        a0: Number(seg.getAttribute("data-a0")),
        a1: Number(seg.getAttribute("data-a1")),
        rIn: Number(seg.getAttribute("data-rin")),
        rOut: Number(seg.getAttribute("data-rout")),
        node: { hex: raw, slug: seg.getAttribute("data-slug") || seg.dataset.id },
      });
      if ([t.a0, t.a1, t.rIn, t.rOut].every(Number.isFinite)) {
        vit.innerHTML = vitrazhTileInnerHtml(t, hex);
        vit.setAttribute("data-hex-lit", hex);
      }
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
