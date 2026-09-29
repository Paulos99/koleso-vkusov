import svgpath from "./vendor/svgpath.esm.js";

export const CX = 400;
export const CY = 400;

/** Разбор SVG эталона Illustrator: классы → цвет, path → { cls, fill, d }. */
export function loadGirlFromSvg(s) {
  const css = s.match(/<style>([\s\S]*?)<\/style>/)[1];
  const cls = {};
  for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const fill = m[2].match(/fill:\s*(#[0-9a-fA-F]{6})/);
    if (fill) {
      for (const c of m[1].split(",")) cls[c.trim().replace(/^\./, "")] = fill[1].toLowerCase();
    }
  }
  const paths = [...s.matchAll(/<path class="([^"]+)" d="([^"]+)"\/>/g)].map((m, i) => ({
    i, cls: m[1], fill: cls[m[1]], d: m[2],
  }));
  return { cls, paths };
}

export function toCubics(d) {
  const subs = [];
  let cur = null;
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  svgpath(d).abs().unshort().unarc().iterate((seg) => {
    const c = seg[0];
    if (c === "M") {
      cur = { start: [seg[1], seg[2]], segs: [], closed: false };
      subs.push(cur);
      x = sx = seg[1];
      y = sy = seg[2];
      return;
    }
    const line = (nx, ny) => {
      cur.segs.push([
        [x, y],
        [x + (nx - x) / 3, y + (ny - y) / 3],
        [x + 2 * (nx - x) / 3, y + 2 * (ny - y) / 3],
        [nx, ny],
      ]);
      x = nx;
      y = ny;
    };
    if (c === "L") line(seg[1], seg[2]);
    else if (c === "H") line(seg[1], y);
    else if (c === "V") line(x, seg[1]);
    else if (c === "C") {
      cur.segs.push([[x, y], [seg[1], seg[2]], [seg[3], seg[4]], [seg[5], seg[6]]]);
      x = seg[5];
      y = seg[6];
    } else if (c === "Q") {
      const [qx, qy, nx, ny] = seg.slice(1);
      cur.segs.push([
        [x, y],
        [x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y)],
        [nx + (2 / 3) * (qx - nx), ny + (2 / 3) * (qy - ny)],
        [nx, ny],
      ]);
      x = nx;
      y = ny;
    } else if (c === "Z" || c === "z") {
      if (Math.hypot(x - sx, y - sy) > 1e-9) line(sx, sy);
      cur.closed = true;
      x = sx;
      y = sy;
    } else throw new Error(`cmd ${c}`);
  });
  return subs;
}

export const polarOf = ([px, py]) => {
  const r = Math.hypot(px - CX, py - CY);
  let a = (Math.atan2(py - CY, px - CX) * 180) / Math.PI + 90;
  a = ((a % 360) + 360) % 360;
  return [r, a];
};

export const cart = (r, a) => {
  const t = ((a - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(t), CY + r * Math.sin(t)];
};
