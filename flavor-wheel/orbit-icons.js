/** Плоские иконки орбиты, viewBox 0 0 48 48. Классы: fill, shade, hi, shade-stroke, hi-stroke. */

const ICONS = {};

function put(key, markup) {
  ICONS[key] = markup.replace(/\s+/g, " ").trim();
}

put("coffee-bean", `
  <ellipse class="shade" cx="24" cy="27" rx="13" ry="17" transform="rotate(-28 24 24)"/>
  <ellipse class="fill" cx="24" cy="25.5" rx="12" ry="16" transform="rotate(-28 24 24)"/>
  <path class="shade-stroke" d="M18 16c3 6 5 10 8 18" stroke-width="1.7" stroke-linecap="round"/>
  <ellipse class="hi" cx="19" cy="18" rx="4" ry="2.2" transform="rotate(-28 24 24)"/>
`);

put("tea-leaf", `
  <path class="shade" d="M24 6c8 8 14 16 12 28-8 2-18-2-22-12C10 12 16 6 24 6z"/>
  <path class="fill" d="M24 8c7 7 12 14 10 25-7 2-16-1-19-11C12 13 17 8 24 8z"/>
  <path class="shade-stroke" d="M24 10c-1 8-1 16 2 24" stroke-width="1.4" stroke-linecap="round"/>
  <ellipse class="hi" cx="20" cy="16" rx="3.2" ry="1.8"/>
`);

put("chocolate-bar", `
  <rect class="shade" x="8" y="12" width="32" height="26" rx="4"/>
  <rect class="fill" x="9" y="11" width="30" height="24" rx="3.5"/>
  <path class="shade-stroke" d="M9 19h30M9 27h30M19 11v24M29 11v24" stroke-width="1.3"/>
  <rect class="hi" x="12" y="13" width="8" height="3" rx="1.2"/>
`);

put("cocoa-powder", `
  <ellipse class="shade" cx="24" cy="30" rx="16" ry="8"/>
  <ellipse class="fill" cx="24" cy="28" rx="15" ry="7"/>
  <ellipse class="shade" cx="24" cy="24" rx="11" ry="6"/>
  <ellipse class="fill" cx="24" cy="22.5" rx="10" ry="5.2"/>
  <circle class="fill" cx="16" cy="16" r="1.4"/>
  <circle class="fill" cx="30" cy="14" r="1.1"/>
  <ellipse class="hi" cx="20" cy="21" rx="3" ry="1.4"/>
`);

put("brownie", `
  <path class="shade" d="M10 18h28v16a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V18z"/>
  <path class="fill" d="M10 16h28l-2 4H12l-2-4z"/>
  <path class="fill" d="M11 20h26v13a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V20z"/>
  <path class="shade-stroke" d="M16 16c2 3 3 3 5 0M24 16c1.5 3 3 3 5 0" stroke-width="1.4" stroke-linecap="round"/>
  <rect class="hi" x="14" y="22" width="7" height="2.2" rx="1"/>
`);

function nut(rot, rx, ry, mark) {
  put(mark.key, `
    <ellipse class="shade" cx="24" cy="26" rx="${rx + 1.2}" ry="${ry + 1.2}" transform="rotate(${rot} 24 25)"/>
    <ellipse class="fill" cx="24" cy="25" rx="${rx}" ry="${ry}" transform="rotate(${rot} 24 25)"/>
    <path class="shade-stroke" d="${mark.d}" stroke-width="1.5" stroke-linecap="round"/>
    <ellipse class="hi" cx="${mark.hx}" cy="${mark.hy}" rx="3.4" ry="1.7" transform="rotate(${rot} 24 25)"/>
  `);
}

nut(-20, 11, 14, { key: "hazelnut", d: "M24 14v20", hx: 19, hy: 18 });
nut(16, 13, 10, { key: "peanut", d: "M16 24c4-3 8-3 14 1", hx: 18, hy: 20 });
nut(-8, 12, 13, { key: "walnut", d: "M24 13c-4 6-4 12 0 20M24 13c4 6 4 12 0 20", hx: 18, hy: 17 });
nut(0, 10, 15, { key: "almond", d: "M24 12c2 8 2 14 0 22", hx: 20, hy: 18 });
nut(24, 14, 9, { key: "pecan", d: "M14 26c6-2 12-2 18 2", hx: 18, hy: 22 });
nut(-40, 12, 11, { key: "cashew", d: "M18 30c2-10 10-14 14-8", hx: 20, hy: 18 });
nut(8, 11, 13, { key: "pistachio", d: "M20 16c6 4 8 12 4 20", hx: 18, hy: 18 });
nut(0, 14, 12, { key: "macadamia", d: "M18 25h12", hx: 19, hy: 20 });
nut(0, 12, 13, { key: "nutmeg", d: "M24 14c3 5 3 12 0 18", hx: 19, hy: 18 });
nut(0, 15, 12, { key: "coconut", d: "M17 22h14M24 16v16", hx: 18, hy: 20 });

put("honey", `
  <path class="shade" d="M16 16h16l3 22a6 6 0 0 1-6 5H19a6 6 0 0 1-6-5l3-22z"/>
  <path class="fill" d="M17 15h14l2.4 20a5 5 0 0 1-5 4.6H19.6a5 5 0 0 1-5-4.6L17 15z"/>
  <rect class="shade" x="15" y="12" width="18" height="5" rx="1.5"/>
  <path class="hi" d="M20 20c1 6 1 10 0 14" />
  <ellipse class="hi" cx="21" cy="22" rx="2.2" ry="3"/>
`);

put("caramel", `
  <path class="shade" d="M10 22c0-6 6-8 14-8s14 2 14 8-4 16-14 16S10 28 10 22z"/>
  <path class="fill" d="M12 21c0-5 5.2-7 12-7s12 2 12 7-3.5 14-12 14-12-9-12-14z"/>
  <path class="shade-stroke" d="M16 20c4 3 8 3 16-1" stroke-width="1.6" stroke-linecap="round"/>
  <ellipse class="hi" cx="18" cy="18" rx="4" ry="2"/>
`);

put("jam", `
  <path class="shade" d="M15 18h18v16a7 7 0 0 1-7 7h-4a7 7 0 0 1-7-7V18z"/>
  <path class="fill" d="M16 17h16v16a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6V17z"/>
  <rect class="shade" x="14" y="13" width="20" height="5" rx="1.4"/>
  <circle class="hi" cx="22" cy="24" r="1.3"/>
  <circle class="hi" cx="27" cy="28" r="1"/>
  <ellipse class="hi" cx="20" cy="21" rx="3" ry="1.5"/>
`);

put("vanilla", `
  <path class="shade" d="M24 6c2 8 6 14 6 22a6 6 0 0 1-12 0c0-8 4-14 6-22z"/>
  <path class="fill" d="M24 8c1.6 7 4.6 12 4.6 20a4.6 4.6 0 0 1-9.2 0C19.4 20 22.4 15 24 8z"/>
  <path class="shade-stroke" d="M24 12v22" stroke-width="1.2"/>
  <ellipse class="hi" cx="22" cy="16" rx="1.6" ry="3"/>
`);

put("maple", `
  <path class="shade" d="M24 4l4 10 10 2-8 6 3 10-9-6-9 6 3-10-8-6 10-2z"/>
  <path class="fill" d="M24 7l3 8 8 1.6-6.4 4.8 2.4 8-7-4.6-7 4.6 2.4-8L13.2 16.6 21 15z"/>
  <ellipse class="hi" cx="21" cy="16" rx="2.4" ry="1.4"/>
`);

put("toffee", `
  <rect class="shade" x="8" y="18" width="32" height="14" rx="7"/>
  <rect class="fill" x="9" y="17" width="30" height="12" rx="6"/>
  <path class="shade-stroke" d="M16 17v12M32 17v12" stroke-width="1.4"/>
  <ellipse class="hi" cx="18" cy="21" rx="4" ry="1.6"/>
`);

put("nougat", `
  <rect class="shade" x="9" y="16" width="30" height="18" rx="3"/>
  <rect class="fill" x="10" y="15" width="28" height="16" rx="2.5"/>
  <circle class="shade" cx="18" cy="23" r="2"/>
  <circle class="shade" cx="28" cy="25" r="1.7"/>
  <rect class="hi" x="13" y="17" width="8" height="2" rx="1"/>
`);

put("yogurt", `
  <path class="shade" d="M14 16h20l-2 20a6 6 0 0 1-6 5h-4a6 6 0 0 1-6-5l-2-20z"/>
  <path class="fill" d="M15 15h18l-1.8 19a5 5 0 0 1-5 4.5h-4.4a5 5 0 0 1-5-4.5L15 15z"/>
  <ellipse class="hi" cx="24" cy="18" rx="7" ry="2"/>
  <path class="hi" d="M20 24c2 2 6 2 8 0" />
`);

put("sugar", `
  <path class="shade" d="M16 14h16l6 8-14 16L10 22z"/>
  <path class="fill" d="M17 14h14l5 7-12 15L12 21z"/>
  <path class="hi" d="M18 18h8"/>
  <ellipse class="hi" cx="20" cy="19" rx="3" ry="1.4"/>
`);

put("marshmallow", `
  <rect class="shade" x="12" y="14" width="24" height="22" rx="11"/>
  <rect class="fill" x="13" y="13" width="22" height="20" rx="10"/>
  <ellipse class="hi" cx="20" cy="18" rx="5" ry="2.4"/>
`);

function flower(key, petals) {
  const parts = [`<circle class="shade" cx="24" cy="26" r="6"/>`];
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2 - Math.PI / 2;
    const cx = 24 + Math.cos(a) * 10;
    const cy = 25 + Math.sin(a) * 10;
    parts.push(`<ellipse class="fill" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="6" ry="8" transform="rotate(${Math.round((a * 180) / Math.PI + 90)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`);
  }
  parts.push(`<circle class="shade" cx="24" cy="25" r="4.2"/>`, `<circle class="hi" cx="22" cy="23" r="1.6"/>`);
  put(key, parts.join(""));
}
flower("rose", 6);
flower("jasmine", 5);
flower("hibiscus", 5);
flower("chamomile", 8);

put("lavender", `
  <path class="shade-stroke" d="M24 40V16" stroke-width="1.6" stroke-linecap="round"/>
  <ellipse class="fill" cx="24" cy="14" rx="3" ry="5"/>
  <ellipse class="fill" cx="20" cy="20" rx="2.6" ry="4"/>
  <ellipse class="fill" cx="28" cy="20" rx="2.6" ry="4"/>
  <ellipse class="fill" cx="21" cy="26" rx="2.4" ry="3.6"/>
  <ellipse class="fill" cx="27" cy="26" rx="2.4" ry="3.6"/>
  <ellipse class="hi" cx="23" cy="12" rx="1.4" ry="2"/>
`);

put("mint", `
  <path class="shade" d="M24 40c0-10 2-14 2-14"/>
  <path class="shade" d="M14 28c6-2 10-8 10-16-8 2-12 8-10 16z"/>
  <path class="fill" d="M16 27c5-2 8-7 8-14-6 2-10 7-8 14z"/>
  <path class="shade" d="M34 28c-6-2-10-8-10-16 8 2 12 8 10 16z"/>
  <path class="fill" d="M32 27c-5-2-8-7-8-14 6 2 10 7 8 14z"/>
  <ellipse class="hi" cx="18" cy="20" rx="2" ry="1.2"/>
`);

put("lemongrass", `
  <path class="shade" d="M18 42c2-12 4-22 2-34 6 4 8 16 6 34"/>
  <path class="fill" d="M20 40c1.4-10 2.4-20 1-30 4 4 5 14 4 30"/>
  <path class="fill" d="M26 40c.6-12 1-22-.4-30 3 6 3.4 16 2.4 30"/>
  <ellipse class="hi" cx="22" cy="16" rx="1.4" ry="3"/>
`);

put("sage", `
  <path class="shade" d="M24 40V22"/>
  <ellipse class="shade" cx="24" cy="18" rx="10" ry="8"/>
  <ellipse class="fill" cx="24" cy="17" rx="9" ry="7"/>
  <path class="shade-stroke" d="M24 12v12" stroke-width="1.2"/>
  <ellipse class="hi" cx="20" cy="15" rx="3" ry="1.5"/>
`);

put("tea-cup", `
  <path class="shade" d="M10 16h24v12a10 10 0 0 1-10 10h-4A10 10 0 0 1 10 28V16z"/>
  <path class="fill" d="M11 15h22v12a9 9 0 0 1-9 9h-4a9 9 0 0 1-9-9V15z"/>
  <path class="shade-stroke" d="M33 20h4a5 5 0 0 1 0 10h-4" stroke-width="2" stroke-linecap="round"/>
  <ellipse class="hi" cx="18" cy="22" rx="4" ry="2"/>
`);

function roundFruit(key, extra) {
  put(key, `
    <circle class="shade" cx="24" cy="26" r="13"/>
    <circle class="fill" cx="24" cy="25" r="12"/>
    ${extra || ""}
    <ellipse class="hi" cx="19" cy="20" rx="3.5" ry="2"/>
  `);
}

put("apple", `
  <path class="shade" d="M24 14c-8 1-14 8-14 16a12 12 0 0 0 24 0c0-8-6-15-10-16z"/>
  <path class="fill" d="M24 15c-7 1-12 7-12 14a11 11 0 0 0 22 0c0-7-5-13-10-14z"/>
  <path class="shade" d="M24 15c1-6 6-8 8-7-2 3-4 5-8 7z"/>
  <path class="shade-stroke" d="M24 16v8" stroke-width="1.3"/>
  <ellipse class="hi" cx="18" cy="22" rx="3" ry="1.8"/>
`);

put("cherry", `
  <path class="shade-stroke" d="M18 22C18 12 24 8 28 6M30 22C30 12 26 8 22 6" stroke-width="1.4" stroke-linecap="round"/>
  <circle class="shade" cx="16" cy="30" r="8"/>
  <circle class="fill" cx="16" cy="29" r="7"/>
  <circle class="shade" cx="30" cy="31" r="8"/>
  <circle class="fill" cx="30" cy="30" r="7"/>
  <ellipse class="hi" cx="14" cy="26" rx="2" ry="1.2"/>
`);

put("strawberry", `
  <path class="shade" d="M24 16c8 2 12 10 10 18a12 12 0 0 1-20 0C12 26 16 18 24 16z"/>
  <path class="fill" d="M24 17c7 2 10 9 8.5 16a11 11 0 0 1-17 0C14.5 26 17 19 24 17z"/>
  <path class="shade" d="M16 18c3-4 6-6 8-6s5 2 8 6c-4 1-8 1-16 0z"/>
  <circle class="hi" cx="20" cy="26" r="1"/>
  <circle class="hi" cx="26" cy="30" r="1"/>
  <circle class="hi" cx="23" cy="34" r=".8"/>
`);

put("raspberry", `
  <circle class="shade" cx="24" cy="18" r="6"/>
  <circle class="fill" cx="18" cy="22" r="6"/>
  <circle class="fill" cx="30" cy="22" r="6"/>
  <circle class="fill" cx="24" cy="20" r="5.5"/>
  <circle class="fill" cx="20" cy="30" r="6"/>
  <circle class="fill" cx="28" cy="30" r="6"/>
  <circle class="fill" cx="24" cy="28" r="5.5"/>
  <ellipse class="hi" cx="22" cy="18" rx="2" ry="1.2"/>
`);

put("blueberry", `
  <circle class="shade" cx="24" cy="26" r="12"/>
  <circle class="fill" cx="24" cy="25" r="11"/>
  <path class="shade" d="M18 16c2-3 10-3 12 0-4 2-8 2-12 0z"/>
  <ellipse class="hi" cx="19" cy="22" rx="3" ry="1.8"/>
`);

roundFruit("berry", `<path class="shade" d="M18 16c2-4 10-4 12 1-4 1-8 1-12-1z"/>`);

put("grape", `
  <circle class="fill" cx="24" cy="16" r="5"/>
  <circle class="fill" cx="17" cy="23" r="5"/>
  <circle class="fill" cx="31" cy="23" r="5"/>
  <circle class="shade" cx="24" cy="24" r="5.2"/>
  <circle class="fill" cx="24" cy="23" r="4.6"/>
  <circle class="fill" cx="20" cy="32" r="5"/>
  <circle class="fill" cx="29" cy="32" r="5"/>
  <path class="shade-stroke" d="M24 8v6" stroke-width="1.4" stroke-linecap="round"/>
  <ellipse class="hi" cx="22" cy="15" rx="1.6" ry="1"/>
`);

put("lemon", `
  <ellipse class="shade" cx="24" cy="26" rx="16" ry="12" transform="rotate(-18 24 26)"/>
  <ellipse class="fill" cx="24" cy="25" rx="15" ry="11" transform="rotate(-18 24 25)"/>
  <path class="shade-stroke" d="M24 16v18M16 24h16" stroke-width="1.1"/>
  <ellipse class="hi" cx="18" cy="20" rx="3.5" ry="1.8" transform="rotate(-18 24 25)"/>
`);

put("orange", `
  <circle class="shade" cx="24" cy="26" r="13"/>
  <circle class="fill" cx="24" cy="25" r="12"/>
  <path class="shade-stroke" d="M24 14v22M14 24h20M17 17l14 14M31 17L17 31" stroke-width="1"/>
  <ellipse class="hi" cx="18" cy="20" rx="3" ry="1.6"/>
`);

put("mango", `
  <path class="shade" d="M14 30c0-12 8-20 16-20 6 8 8 16 4 24-6 6-16 4-20-4z"/>
  <path class="fill" d="M16 29c0-10 7-17 14-17 5 7 6 14 3 21-5 5-14 3-17-4z"/>
  <ellipse class="hi" cx="20" cy="20" rx="3" ry="1.8"/>
`);

put("peach", `
  <circle class="shade" cx="24" cy="27" r="13"/>
  <circle class="fill" cx="24" cy="26" r="12"/>
  <path class="shade-stroke" d="M24 14c2 8 2 14 0 22" stroke-width="1.3"/>
  <path class="shade" d="M24 14c2-5 7-6 8-4-3 2-5 3-8 4z"/>
  <ellipse class="hi" cx="18" cy="22" rx="3" ry="1.6"/>
`);

put("plum", `
  <ellipse class="shade" cx="24" cy="27" rx="11" ry="13"/>
  <ellipse class="fill" cx="24" cy="26" rx="10" ry="12"/>
  <path class="shade-stroke" d="M24 14v10" stroke-width="1.3" stroke-linecap="round"/>
  <ellipse class="hi" cx="19" cy="21" rx="2.8" ry="1.6"/>
`);

put("kiwi", `
  <ellipse class="shade" cx="24" cy="26" rx="14" ry="11"/>
  <ellipse class="fill" cx="24" cy="25" rx="13" ry="10"/>
  <ellipse class="shade" cx="24" cy="25" rx="6" ry="5"/>
  <circle class="hi" cx="22" cy="23" r="1"/>
  <circle class="hi" cx="27" cy="24" r=".8"/>
  <circle class="hi" cx="24" cy="28" r=".8"/>
  <ellipse class="hi" cx="16" cy="22" rx="2.4" ry="1.3"/>
`);

put("melon", `
  <circle class="shade" cx="24" cy="26" r="14"/>
  <path class="fill" d="M24 12a14 14 0 0 1 0 28 14 14 0 0 1 0-28z"/>
  <path class="shade-stroke" d="M12 22c8 2 16 2 24-2M12 28c8 2 16 2 24-1" stroke-width="1.3"/>
  <ellipse class="hi" cx="18" cy="18" rx="3" ry="1.5"/>
`);

put("pomegranate", `
  <path class="shade" d="M16 20c0-6 4-10 8-10s8 4 8 10c4 2 6 8 4 14a12 12 0 0 1-24 0c-2-6 0-12 4-14z"/>
  <path class="fill" d="M17 20c0-5 3-8 7-8s7 3 7 8c3 2 5 7 3 12a11 11 0 0 1-20 0c-2-5 0-10 3-12z"/>
  <path class="shade" d="M20 12c1-4 7-4 8 0"/>
  <ellipse class="hi" cx="20" cy="22" rx="2.2" ry="1.3"/>
`);

put("fig", `
  <path class="shade" d="M18 16c-6 6-8 14-4 22a10 10 0 0 0 20 0c4-8 2-16-4-22-2 3-6 4-12 0z"/>
  <path class="fill" d="M19 17c-5 5-6 12-3 19a8 8 0 0 0 16 0c3-7 2-14-3-19-2 2-5 3-10 0z"/>
  <path class="shade" d="M20 16c2-6 8-6 9-1"/>
  <ellipse class="hi" cx="22" cy="24" rx="2" ry="1.2"/>
`);

put("banana", `
  <path class="shade" d="M12 30c2-12 10-20 22-20 2 6-2 10-6 16-4 8-10 12-16 4z"/>
  <path class="fill" d="M14 29c2-10 9-17 19-17 1 5-2 8-5 14-4 7-9 10-14 3z"/>
  <path class="shade-stroke" d="M16 28c6-4 12-8 16-14" stroke-width="1.3" stroke-linecap="round"/>
  <ellipse class="hi" cx="20" cy="22" rx="2.4" ry="1.2"/>
`);

put("pineapple", `
  <path class="shade" d="M24 8l3 6h-6zM18 10l2 5M30 10l-2 5"/>
  <ellipse class="shade" cx="24" cy="28" rx="11" ry="14"/>
  <ellipse class="fill" cx="24" cy="27" rx="10" ry="13"/>
  <path class="shade-stroke" d="M16 20l16 8M16 28l16 6M18 34l12 4M32 20L16 28M32 28L18 36" stroke-width="1"/>
  <ellipse class="hi" cx="20" cy="20" rx="2.2" ry="1.2"/>
`);

put("cinnamon-stick", `
  <rect class="shade" x="20" y="6" width="10" height="36" rx="5" transform="rotate(18 24 24)"/>
  <rect class="fill" x="21" y="7" width="8" height="34" rx="4" transform="rotate(18 24 24)"/>
  <path class="shade-stroke" d="M22 12c4 2 6 2 8 0M21 22c5 2 7 2 9 0M22 32c4 2 6 2 8 0" stroke-width="1.1" transform="rotate(18 24 24)"/>
  <ellipse class="hi" cx="23" cy="14" rx="2" ry="3" transform="rotate(18 24 24)"/>
`);

put("clove", `
  <circle class="shade" cx="24" cy="14" r="7"/>
  <circle class="fill" cx="24" cy="13" r="6"/>
  <rect class="shade" x="22" y="18" width="4" height="20" rx="2"/>
  <rect class="fill" x="22.6" y="18" width="2.8" height="18" rx="1.4"/>
  <path class="shade" d="M18 36c2 4 10 4 12 0"/>
  <ellipse class="hi" cx="22" cy="11" rx="2" ry="1.3"/>
`);

put("peppercorn", `
  <circle class="shade" cx="24" cy="26" r="12"/>
  <circle class="fill" cx="24" cy="25" r="11"/>
  <path class="shade-stroke" d="M24 16c-2 6-2 10 0 16" stroke-width="1.2"/>
  <ellipse class="hi" cx="19" cy="21" rx="3" ry="1.6"/>
`);

put("star-anise", `
  <path class="shade" d="M24 4l3 10 10 2-8 6 3 10-8-6-8 6 3-10-8-6 10-2z"/>
  <path class="fill" d="M24 7l2.2 8 8 1.6-6.4 4.6 2.2 8-6-4.6-6 4.6 2.2-8L14 16.6l8-1.6z"/>
  <circle class="shade" cx="24" cy="24" r="3"/>
  <circle class="hi" cx="23" cy="23" r="1.2"/>
`);

put("ginger", `
  <path class="shade" d="M10 28c2-8 8-10 12-8 2-6 10-8 14-2 4 2 4 8 0 12-2 6-8 8-14 6-6 4-12 2-12-8z"/>
  <path class="fill" d="M12 27c2-6 7-8 10-6 2-5 8-6 11-1 3 2 3 6 0 9-2 5-7 6-12 5-5 3-10 1-9-7z"/>
  <ellipse class="hi" cx="18" cy="24" rx="3" ry="1.6"/>
`);

put("cardamom", `
  <path class="shade" d="M24 6c8 8 10 16 8 28-6 4-14 4-16 0-2-12 0-20 8-28z"/>
  <path class="fill" d="M24 8c6 7 8 14 6 24-4 3-10 3-12 0-2-10 0-17 6-24z"/>
  <path class="shade-stroke" d="M24 12v22" stroke-width="1.3"/>
  <ellipse class="hi" cx="21" cy="16" rx="2" ry="2.4"/>
`);

put("tobacco-leaf", `
  <path class="shade" d="M24 6c10 8 16 16 12 30-8 4-16 0-20-10C10 16 16 8 24 6z"/>
  <path class="fill" d="M24 8c8 7 13 14 10 26-6 3-13 0-16-8C14 16 17 10 24 8z"/>
  <path class="shade-stroke" d="M22 12c2 8 2 16 4 24M18 20h12M19 28h10" stroke-width="1.1"/>
  <ellipse class="hi" cx="20" cy="16" rx="2.4" ry="1.4"/>
`);

put("croissant", `
  <path class="shade" d="M8 30c6-14 16-20 28-16-6 2-8 6-8 10 6 0 12-2 16-6-2 12-12 20-24 18-6-1-10-3-12-6z"/>
  <path class="fill" d="M10 29c5-12 14-17 24-14-5 2-7 5-7 8 5 0 10-2 14-5-2 10-10 16-20 15-5-1-9-2-11-4z"/>
  <path class="shade-stroke" d="M16 28c4-4 10-6 16-4" stroke-width="1.2"/>
  <ellipse class="hi" cx="18" cy="24" rx="3" ry="1.4"/>
`);

put("biscuit", `
  <circle class="shade" cx="24" cy="26" r="14"/>
  <circle class="fill" cx="24" cy="25" r="13"/>
  <circle class="shade" cx="18" cy="22" r="1.3"/>
  <circle class="shade" cx="26" cy="20" r="1.3"/>
  <circle class="shade" cx="28" cy="28" r="1.3"/>
  <circle class="shade" cx="20" cy="30" r="1.2"/>
  <ellipse class="hi" cx="18" cy="18" rx="3" ry="1.5"/>
`);

put("bread", `
  <path class="shade" d="M8 28c0-8 8-14 16-14s16 6 16 14v6H8v-6z"/>
  <path class="fill" d="M9 27c0-7 7-12 15-12s15 5 15 12v6H9v-6z"/>
  <path class="shade-stroke" d="M16 22c2 3 4 3 6 0M26 22c1 2 3 2 4 0" stroke-width="1.3" stroke-linecap="round"/>
  <ellipse class="hi" cx="16" cy="20" rx="4" ry="1.6"/>
`);

put("wine-glass", `
  <path class="shade" d="M16 8h16l-2 14a8 8 0 0 1-12 0L16 8z"/>
  <path class="fill" d="M17 8h14l-1.6 12a7 7 0 0 1-10.8 0L17 8z"/>
  <path class="shade-stroke" d="M24 28v10M18 40h12" stroke-width="1.8" stroke-linecap="round"/>
  <ellipse class="hi" cx="22" cy="14" rx="3" ry="2"/>
`);

put("whiskey", `
  <path class="shade" d="M14 10h20l-2 28H16L14 10z"/>
  <path class="fill" d="M15 11h18l-1.6 24H16.6L15 11z"/>
  <path class="shade" d="M16 24h16v8H16z"/>
  <ellipse class="hi" cx="20" cy="16" rx="3" ry="1.6"/>
`);

put("barrel", `
  <path class="shade" d="M12 14c0-4 5-6 12-6s12 2 12 6v20c0 4-5 6-12 6s-12-2-12-6V14z"/>
  <path class="fill" d="M13 15c0-3 5-5 11-5s11 2 11 5v18c0 3-5 5-11 5s-11-2-11-5V15z"/>
  <path class="shade-stroke" d="M13 20h22M13 28h22" stroke-width="1.5"/>
  <ellipse class="hi" cx="18" cy="17" rx="3" ry="1.4"/>
`);

export const EMOJI = {
  "coffee-bean": "☕",
  "tea-leaf": "🍃",
  cherry: "🍒",
  lemon: "🍋",
  strawberry: "🍓",
  apple: "🍎",
  grape: "🍇",
  honey: "🍯",
  "chocolate-bar": "🍫",
  rose: "🌸",
  "tea-cup": "🍵",
  croissant: "🥐",
  "wine-glass": "🍷",
  mint: "🌿",
};

export function hasIcon(key) {
  return Object.prototype.hasOwnProperty.call(ICONS, key);
}

export function iconInner(key) {
  return ICONS[key] || "";
}

export const ICON_KEYS = Object.keys(ICONS);
