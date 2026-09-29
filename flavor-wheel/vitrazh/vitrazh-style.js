import { converter, formatHex, clampChroma } from "./vendor/culori.esm.js";
import { loadGirlFromSvg, toCubics, polarOf, cart } from "./vitrazh-lib.js";

export const MAIN_GAP = 13.25;
export const MAIN_RADIUS = 24;
export const PREVIEW_GAP = 7.1;
export const PREVIEW_RADIUS = 12;

export const FIT = { s: 0.64614, tx: 145.247, ty: 308.697 };
export const REF = { a0: 144, a1: 216, rIn: 110, rOut: 275, gap: MAIN_GAP, corner: MAIN_RADIUS };
export const BASE_HEX = "#9863e9";

const D = 180 / Math.PI;
const edgeL = (t, r) => t.a0 + (t.gap / (2 * r)) * D;
const edgeR = (t, r) => t.a1 - (t.gap / (2 * r)) * D;

function band(d, W, W2, K, K2) {
  const k = K2 / K;
  if (d <= K) return d * k;
  if (d >= W - K) return W2 - (W - d) * k;
  return K2 + ((d - K) / (W - 2 * K)) * (W2 - 2 * K2);
}

export function makeMapper(tgt, mode = "abs", K = 26) {
  const H = REF.rOut - REF.rIn;
  const H2 = tgt.rOut - tgt.rIn;
  const kc = tgt.corner / REF.corner;
  const Kr2 = Math.min(K * kc, 0.3 * H2);
  return ([x, y]) => {
    const [r, a0] = polarOf([x, y]);
    let a = a0;
    if (a < REF.a0 - 90) a += 360;
    if (a > REF.a1 + 90) a -= 360;
    let r2;
    if (mode === "prop") r2 = tgt.rIn + ((r - REF.rIn) / H) * H2;
    else r2 = tgt.rIn + band(r - REF.rIn, H, H2, K, Kr2);
    const L = edgeL(REF, r);
    const R = edgeR(REF, r);
    const L2 = edgeL(tgt, r2);
    const R2 = edgeR(tgt, r2);
    let a2;
    if (mode === "prop") a2 = L2 + ((a - L) / (R - L)) * (R2 - L2);
    else {
      const W = ((R - L) / D) * r;
      const W2 = ((R2 - L2) / D) * r2;
      const K2 = Math.min(K * kc, 0.3 * W2);
      a2 = L2 + (band(((a - L) / D) * r, W, W2, K, K2) / r2) * D;
    }
    return cart(r2, a2);
  };
}

const bez = (s, t) => {
  const u = 1 - t;
  return [0, 1].map((k) => u * u * u * s[0][k] + 3 * u * u * t * s[1][k] + 3 * u * t * t * s[2][k] + t * t * t * s[3][k]);
};

function split(s) {
  const L = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const a = L(s[0], s[1]);
  const b = L(s[1], s[2]);
  const c = L(s[2], s[3]);
  const d = L(a, b);
  const e = L(b, c);
  const f = L(d, e);
  return [[s[0], a, d, f], [f, e, c, s[3]]];
}

function mapSeg(s, map, tol, out, depth = 0) {
  const m = s.map(map);
  let err = 0;
  for (const t of [0.25, 0.5, 0.75]) {
    const p = map(bez(s, t));
    const q = bez(m, t);
    err = Math.max(err, Math.hypot(p[0] - q[0], p[1] - q[1]));
  }
  if (err <= tol || depth > 12) {
    out.push(m);
    return;
  }
  const [A, B] = split(s);
  mapSeg(A, map, tol, out, depth + 1);
  mapSeg(B, map, tol, out, depth + 1);
}

const f2 = (v) => {
  const x = Math.round(v * 100) / 100;
  return Object.is(x, -0) ? "0" : String(x);
};

export function mapPathD(subs, map, tol = 0.08) {
  let d = "";
  for (const sp of subs) {
    const out = [];
    for (const s of sp.segs) mapSeg(s, map, tol, out);
    d += `M${f2(out[0][0][0])},${f2(out[0][0][1])}`;
    for (const c of out) {
      d += `C${f2(c[1][0])},${f2(c[1][1])} ${f2(c[2][0])},${f2(c[2][1])} ${f2(c[3][0])},${f2(c[3][1])}`;
    }
    if (sp.closed) d += "Z";
  }
  return d;
}

const toOk = converter("oklch");
const base = toOk(BASE_HEX);
let PAL = null;

function ensurePal(refPaths) {
  if (PAL) return PAL;
  PAL = [...new Set(refPaths.map((p) => p.fill))].map((hex) => {
    const c = toOk(hex);
    return { hex, dL: c.l - base.l, cR: c.c / base.c, dH: (((c.h - base.h + 540) % 360) - 180) };
  });
  return PAL;
}

const DMAX = () => Math.max(...PAL.map((p) => p.dL));
const DMIN = () => Math.min(...PAL.map((p) => p.dL));
const LMAX = 0.985;
const LMIN = 0.16;
const MAXSHIFT = 0.07;

const yellowW = (h) => (h < 55 || h > 125 ? 0 : h < 75 ? (h - 55) / 20 : h > 110 ? (125 - h) / 15 : 1);

export function recolorMap(targetHex) {
  if (!PAL) throw new Error("vitrazh engine not initialized");
  const t = toOk(targetHex);
  const th = t.h ?? base.h;
  let Lc = t.l;
  const dmax = DMAX();
  const dmin = DMIN();
  if (Lc + dmax > LMAX) Lc = Math.max(t.l - MAXSHIFT, LMAX - dmax);
  if (Lc + dmin < LMIN) Lc = Math.min(t.l + MAXSHIFT, LMIN - dmin);
  const up = Math.min(1, (LMAX - Lc) / dmax);
  const dn = Math.min(1, (Lc - LMIN) / -dmin);
  const map = {};
  for (const p of PAL) {
    const l = Lc + p.dL * (p.dL > 0 ? up : dn);
    const c = Math.max(0, t.c * p.cR);
    const warm = p.dL < 0 && t.c > 0.05 ? -22 * yellowW(th) * (-p.dL / -dmin) : 0;
    map[p.hex] = formatHex(clampChroma({ mode: "oklch", l: Math.min(1, Math.max(0, l)), c, h: th + p.dH + warm }, "oklch"));
  }
  return map;
}

let refPaths = null;
const pathCache = new Map();

export async function initVitrazhEngine(etalonUrl) {
  const res = await fetch(etalonUrl);
  const svg = await res.text();
  const girl = loadGirlFromSvg(svg);
  refPaths = girl.paths.map((p) => ({
    ...p,
    subs: toCubics(p.d).map((sp) => ({
      closed: sp.closed,
      segs: sp.segs.map((s) => s.map(([x, y]) => [FIT.s * x + FIT.tx, FIT.s * y + FIT.ty])),
    })),
  }));
  ensurePal(refPaths);
  return refPaths.length;
}

function tileSpec(t) {
  return [
    t.a0.toFixed(3),
    t.a1.toFixed(3),
    t.rIn,
    t.rOut,
    t.gap,
    t.corner,
  ].join("|");
}

function mapTolerance(t) {
  const span = Math.abs(t.a1 - t.a0);
  if (span < 18) return 0.14;
  if (span < 32) return 0.11;
  return 0.08;
}

/** Слить path с одинаковым fill в один элемент (меньше DOM). */
function pathsToSvg(refPathsLocal, mapper, colorMap, tol = 0.08) {
  const byFill = new Map();
  for (const p of refPathsLocal) {
    const d = mapPathD(p.subs, mapper, tol);
    const fill = colorMap[p.fill];
    if (!byFill.has(fill)) byFill.set(fill, []);
    byFill.get(fill).push(d);
  }
  let html = "";
  for (const [fill, ds] of byFill) {
    html += `<path fill="${fill}" stroke="none" d="${ds.join(" ")}" />`;
  }
  return html;
}

export function vitrazhTilePathsHtml(t, targetHex, mode = "abs", K = 26) {
  if (!refPaths) return "";
  const tol = mapTolerance(t);
  const key = `${tileSpec(t)}|${targetHex}|${mode}|${K}|${tol}`;
  let cached = pathCache.get(key);
  if (cached) return cached;
  const mapper = makeMapper(t, mode, K);
  const colorMap = recolorMap(targetHex);
  cached = pathsToSvg(refPaths, mapper, colorMap, tol);
  pathCache.set(key, cached);
  return cached;
}

export function vitrazhTileInnerHtml(t, targetHex, mode = "abs", K = 26) {
  return vitrazhTilePathsHtml(t, targetHex, mode, K);
}

export function asMainTile(s) {
  return { ...s, gap: MAIN_GAP, corner: MAIN_RADIUS };
}

export function previewToTile(p, g) {
  return {
    a0: p.a0,
    a1: p.a1,
    rIn: g.middleR + 12,
    rOut: g.outerR,
    gap: PREVIEW_GAP,
    corner: PREVIEW_RADIUS,
    node: { hex: p.hex, slug: `preview-${p.parentId}-${p.index}` },
  };
}

export function clearVitrazhCache() {
  pathCache.clear();
}
