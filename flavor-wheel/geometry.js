// Читаемая реконструкция чистых функций геометрии/типографики колеса вкусов,
// восстановленная по поведению и минифицированному бандлу coffeechoice.ru (сентябрь 2026).
// Координаты — в системе viewBox 800×800, центр (400, 400).
// Углы — в градусах, 0° = 12 часов, растут ПО часовой стрелке.

export const CX = 400, CY = 400;

/** t ∈ [0..1] — «насколько колесо большое»: 0 при ширине контейнера ≤288px, 1 при ≥600px. */
export function sizeFactor(containerWidth) {
  if (containerWidth == null) return 1;
  return Math.min(1, Math.max(0, (containerWidth - 288) / 312));
}

/** Радиусы и viewBox (пересчитываются по ResizeObserver ширины контейнера). */
export function wheelGeometry(containerWidth) {
  const t = sizeFactor(containerWidth);
  const pad = 8 + 27 * t;                 // 35 на десктопе
  const min = Math.round(35 - pad);       // 0 на десктопе
  const size = Math.round(730 + 2 * pad); // 800 на десктопе
  return {
    t,
    innerR: 120 - 10 * t,   // 110 на десктопе, 120 на самом узком
    middleR: 315 - 40 * t,  // 275 на десктопе
    outerR: 365,
    viewBox: `${min} ${min} ${size} ${size}`, // "0 0 800 800" на ≥600px; "21 21 758 758" на 359px
    labelMaxFont: (level) => level === 2 ? Math.round(36 - 4 * t) : Math.round(32 - 4 * t), // 32 / 28 на десктопе
    centerFont: Math.round(44 + 4 * t),      // 48 на десктопе (для слов ≤10 символов, иначе 16)
    centerLineStep: Math.round(40 + 3 * t),  // 43 на десктопе
  };
}

/** Полярные → декартовы, округление до 0.001. */
export function polar(cx, cy, r, deg) {
  const a = ((deg - 90) * Math.PI) / 180;
  return {
    x: Math.round((cx + r * Math.cos(a)) * 1000) / 1000,
    y: Math.round((cy + r * Math.sin(a)) * 1000) / 1000,
  };
}

/**
 * Путь «лепестка» — кольцевой сектор со скруглёнными углами и зазором постоянной ЛИНЕЙНОЙ ширины.
 * gap — ширина зазора между соседними сегментами в единицах viewBox,
 * radius — размер скругления углов.
 * Основные сегменты: gap=12, radius=24. Внешнее «превью»-кольцо: gap=6, radius=12.
 */
export function petalPath(cx, cy, rIn, rOut, a0, a1, gap, radius) {
  const deg = 180 / Math.PI;
  const gOut = (gap / rOut) * deg, gIn = (gap / rIn) * deg;
  const o0 = a0 + gOut / 2, o1 = a1 - gOut / 2;   // углы внешней дуги
  const i0 = a0 + gIn / 2,  i1 = a1 - gIn / 2;    // углы внутренней дуги
  const cOut = Math.min((radius / rOut) * deg, (o1 - o0) / 2.5); // угловой размер скругления снаружи
  const cIn  = Math.min((radius / rIn) * deg,  (i1 - i0) / 2.5); // ... внутри
  const cRad = Math.min(radius, (rOut - rIn) / 4);               // радиальный размер скругления
  const P = (r, a) => polar(cx, cy, r, a);
  const s1 = P(rOut - cRad, o0), c1 = P(rOut, o0), e1 = P(rOut, o0 + cOut);
  const e2 = P(rOut, o1 - cOut), c2 = P(rOut, o1), s3 = P(rOut - cRad, o1);
  const s4 = P(rIn + cRad, i1), c4 = P(rIn, i1), e4 = P(rIn, i1 - cIn);
  const e5 = P(rIn, i0 + cIn),  c5 = P(rIn, i0), s6 = P(rIn + cRad, i0);
  const largeOut = +(o1 - o0 - 2 * cOut > 180);
  const largeIn  = +(i1 - i0 - 2 * cIn > 180);
  return `M ${s1.x} ${s1.y} Q ${c1.x} ${c1.y} ${e1.x} ${e1.y} ` +
         `A ${rOut} ${rOut} 0 ${largeOut} 1 ${e2.x} ${e2.y} ` +
         `Q ${c2.x} ${c2.y} ${s3.x} ${s3.y} ` +
         `L ${s4.x} ${s4.y} Q ${c4.x} ${c4.y} ${e4.x} ${e4.y} ` +
         `A ${rIn} ${rIn} 0 ${largeIn} 0 ${e5.x} ${e5.y} ` +
         `Q ${c5.x} ${c5.y} ${s6.x} ${s6.y} Z`;
}

/** Перенос подписи: «/» всегда даёт новую строку (сам слэш выбрасывается), дальше — жадный перенос по словам. */
export function wrapLabel(name, maxChars) {
  const parts = name.split(/\s*\/\s*/).filter(Boolean);
  const lines = [];
  for (const part of parts) {
    let line = '';
    for (const word of part.trim().split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (next.length <= maxChars || line === '') line = next;
      else { lines.push(line); line = word; }
    }
    if (line) lines.push(line);
  }
  return lines;
}

/** Подбор кегля подписи сегмента: от maxFont вниз до 11 (шаг 1). */
export function fitLabel(name, rIn, rOut, a0, a1, maxFont = 24) {
  const arc = (((a1 - a0) * Math.PI) / 180) * ((rIn + rOut) / 2);
  const radial = 0.8 * (rOut - rIn);  // доступная длина строки (текст идёт ВДОЛЬ радиуса)
  const tangential = 0.8 * arc;       // доступная «высота» блока строк (поперёк радиуса)
  for (let fs = maxFont; fs >= 11; fs--) {
    const maxChars = Math.floor(radial / (0.52 * fs)); // средняя ширина символа ≈ 0.52em
    if (maxChars < 2) continue;
    const lines = wrapLabel(name, maxChars);
    const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
    if (lines.length > 3) continue;
    if (1.1 * fs * lines.length > tangential) continue;
    if (longest * fs * 0.52 > radial) continue;
    return { fontSize: fs, lines };
  }
  return { fontSize: 11, lines: wrapLabel(name, Math.max(2, Math.floor(radial / (11 * 0.52)))).slice(0, 3) };
}

/** Позиция и поворот подписи. Текст всегда читается «от центра наружу» на правой половине и «снаружи к центру» на левой. */
export function labelPlacement(rIn, rOut, a0, a1, fontSize, linesCount) {
  const mid = (a0 + a1) / 2;
  const p = polar(CX, CY, (rIn + rOut) / 2, mid);
  const rotate = mid <= 180 ? mid - 90 : mid + 90;
  const lineHeight = 1.1 * fontSize;
  const firstDy = -(lineHeight * linesCount) / 2 + 0.8 * lineHeight;
  return { x: p.x, y: p.y, rotate, lineHeight, firstDy, letterSpacing: -0.05 * fontSize };
}

/** Светлый цвет? (YIQ-яркость > 0.65) → тёмный текст #2a2a2a на сегменте, иначе #fff. */
export function isLight(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.65;
}

/** Точка и радиус белого радиального «блика» при hover/selected. */
export function glow(rIn, rOut, a0, a1) {
  const mid = (a0 + a1) / 2, a = ((mid - 90) * Math.PI) / 180;
  const r = rIn + (rOut - rIn) * 0.2;
  return { cx: CX + r * Math.cos(a), cy: CY + r * Math.sin(a), r: (rOut - rIn) * 0.9 };
}

/** Запасной цвет подсектора без hex (в текущих данных не используется — у всех подсекторов hex есть).
 *  HSL сектора, светлота L += -25 + (50/(count-1))*index (clamp 0..100), затем обратно в hex. */
export function shadeFromSector(sectorHex, index, count) {
  const h6 = sectorHex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h6)) return '#666666';
  const r = parseInt(h6.slice(0, 2), 16) / 255, g = parseInt(h6.slice(2, 4), 16) / 255, b = parseInt(h6.slice(4, 6), 16) / 255;
  if (count <= 1) return '#' + h6.toLowerCase();
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let h = 0, sat = 0;
  if (max !== min) {
    const d = max - min;
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) * 60 : max === g ? ((b - r) / d + 2) * 60 : ((r - g) / d + 4) * 60;
  } else { return '#' + h6.toLowerCase(); /* оригинал для серых возвращает s=0, l=100*l — фактически тот же цвет */ }
  const i = Math.min(Math.max(index, 0), count - 1);
  const L = Math.min(Math.max(l * 100 + (-25 + (50 / (count - 1)) * i), 0), 100) / 100;
  const C = sat * (1 - Math.abs(2 * L - 1)), X = C * (1 - Math.abs(((h / 60) % 2) - 1)), m = L - C / 2;
  const [r1, g1, b1] = h < 60 ? [C, X, 0] : h < 120 ? [X, C, 0] : h < 180 ? [0, C, X] : h < 240 ? [0, X, C] : h < 300 ? [X, 0, C] : [C, 0, X];
  const hx = (v) => Math.min(255, Math.max(0, Math.round((v + m) * 255))).toString(16).padStart(2, '0');
  return `#${hx(r1)}${hx(g1)}${hx(b1)}`;
}
