/** Плоские иконки орбиты, viewBox 0 0 48 48. Токены __FILL__ и __SHADE__. */
export const ORBIT_ELEMENTS = {};
export const CATEGORY_ORBIT = {
  "nutty-cocoa": ["chocolate-bar", "cocoa-pod", "hazelnut", "almond", "walnut", "coconut", "peanut", "pecan"],
  "sweet": ["honey", "caramel", "jam", "vanilla", "maple", "toffee", "nougat", "pastila"],
  "floral-tea": ["jasmine", "rose", "lavender", "mint", "chamomile", "tea-leaf", "hibiscus", "lemongrass"],
  "fruity": ["cherry", "lemon", "strawberry", "apple", "grape", "raspberry", "mango", "orange"],
  "spicy-unique": ["clove", "cinnamon-stick", "nutmeg", "peppercorn", "tobacco-leaf", "star-anise", "croissant", "wine-glass"],
};

function orbitIcon(key, emoji, label, svg) {
  ORBIT_ELEMENTS[key] = { emoji, label, svg };
}
const HL = `<ellipse cx="18" cy="16" rx="4.2" ry="2" fill="#fff" fill-opacity=".35"/>`;

orbitIcon("coffee-bean", "☕", "Зерно",
  `<ellipse cx="24" cy="24" rx="11" ry="16.5" fill="__FILL__" transform="rotate(-32 24 24)"/>
   <path d="M19 10.5c3.2 7 3.2 20 0 27" stroke="__SHADE__" stroke-width="1.7" fill="none" stroke-linecap="round"/>
   <ellipse cx="17" cy="16" rx="3.2" ry="1.5" fill="#fff" fill-opacity=".35" transform="rotate(-32 17 16)"/>`);

orbitIcon("tea-leaf", "🍃", "Чайный лист",
  `<path d="M24 5c9 7 16 16 13 29-9 3-20-1-24-12C9 12 14 6 24 5z" fill="__FILL__"/>
   <path d="M23 9c1 10-1 18-7 25" stroke="__SHADE__" stroke-width="1.5" fill="none" stroke-linecap="round"/>
   <path d="M16 18c5 2 10 2 14-1M17 24c4 2 8 1 11-1" stroke="__SHADE__" stroke-width="1.1" fill="none" opacity=".8"/>
   <ellipse cx="20" cy="14" rx="3.4" ry="1.5" fill="#fff" fill-opacity=".35"/>`);

function leafIcon(tilt) {
  return `<g transform="rotate(${tilt} 24 24)">
    <path d="M24 6c8 8 14 16 11 27-8 3-18 0-22-11C10 12 15 7 24 6z" fill="__FILL__"/>
    <path d="M24 10c0 9-2 16-6 22" stroke="__SHADE__" stroke-width="1.4" fill="none"/>
    ${HL}</g>`;
}
orbitIcon("mint", "🌿", "Мята", leafIcon(-8) + `<path d="M8 30c6-2 8-8 6-12" stroke="__SHADE__" stroke-width="1.4" fill="none"/>`);
orbitIcon("tobacco-leaf", "🍂", "Табак", leafIcon(18));
orbitIcon("lemongrass", "🌾", "Лемонграсс",
  `<path d="M16 40c2-12 2-22 0-30M24 42c1-14 1-24 0-32M32 40c-1-12-1-22 1-30" stroke="__FILL__" stroke-width="3" fill="none" stroke-linecap="round"/>
   <path d="M16 14c6-6 10-6 16 0" stroke="__SHADE__" stroke-width="1.6" fill="none"/>${HL}`);

function nutIcon(rx, crack) {
  return `<ellipse cx="24" cy="25" rx="${rx}" ry="15" fill="__FILL__"/>
    <path d="${crack}" stroke="__SHADE__" stroke-width="1.5" fill="none" stroke-linecap="round"/>${HL}`;
}
orbitIcon("hazelnut", "🌰", "Фундук", nutIcon(13, "M24 12c-2 8 2 14 0 22"));
orbitIcon("walnut", "🌰", "Грецкий орех",
  `<path d="M24 8c10 2 16 10 14 20-4 10-20 12-26 4C6 22 10 8 24 8z" fill="__FILL__"/>
   <path d="M18 16c6 4 8 10 6 18M28 14c-4 6-4 12 0 20" stroke="__SHADE__" stroke-width="1.3" fill="none"/>${HL}`);
orbitIcon("almond", "🌰", "Миндаль",
  `<path d="M24 6c8 6 12 14 8 26-6 8-16 8-20 0C6 20 12 8 24 6z" fill="__FILL__"/>
   <path d="M24 10c-1 10 1 16 0 24" stroke="__SHADE__" stroke-width="1.4" fill="none"/>${HL}`);
orbitIcon("peanut", "🥜", "Арахис",
  `<ellipse cx="18" cy="28" rx="8" ry="10" fill="__FILL__" transform="rotate(-20 18 28)"/>
   <ellipse cx="30" cy="18" rx="8" ry="10" fill="__FILL__" transform="rotate(-20 30 18)"/>
   <path d="M22 24c2-2 4-2 6 0" stroke="__SHADE__" stroke-width="1.4" fill="none"/>${HL}`);
orbitIcon("pecan", "🌰", "Пекан",
  `<path d="M24 7c7 4 12 12 8 24-5 8-14 8-18 1C8 20 12 8 24 7z" fill="__FILL__"/>
   <path d="M20 16c4 6 6 12 4 18" stroke="__SHADE__" stroke-width="1.3" fill="none"/>${HL}`);
orbitIcon("pistachio", "🥜", "Фисташка",
  `<path d="M16 14c8-6 18-2 18 10 0 12-8 18-14 16-8-2-12-10-8-18 2-4 2-8 4-8z" fill="__FILL__"/>
   <path d="M22 12c2 8 2 16 0 24" stroke="__SHADE__" stroke-width="1.5" fill="none"/>${HL}`);
orbitIcon("cashew", "🥜", "Кешью",
  `<path d="M14 30c0-10 6-16 14-16 6 0 10 4 8 10-2 8-8 8-8 14 0 4-6 6-10 2-4-4-4-6-4-10z" fill="__FILL__"/>${HL}`);
orbitIcon("macadamia", "🌰", "Макадамия", `<circle cx="24" cy="25" r="13" fill="__FILL__"/><circle cx="24" cy="25" r="6" fill="none" stroke="__SHADE__" stroke-width="1.6"/>${HL}`);
orbitIcon("coconut", "🥥", "Кокос",
  `<circle cx="24" cy="26" r="14" fill="__FILL__"/>
   <circle cx="19" cy="24" r="1.6" fill="__SHADE__"/><circle cx="25" cy="22" r="1.6" fill="__SHADE__"/><circle cx="28" cy="28" r="1.6" fill="__SHADE__"/>${HL}`);

orbitIcon("chocolate-bar", "🍫", "Шоколад",
  `<rect x="8" y="12" width="32" height="24" rx="4" fill="__FILL__"/>
   <path d="M8 20h32M8 28h32M18 12v24M30 12v24" stroke="__SHADE__" stroke-width="1.3"/>
   <ellipse cx="14" cy="16" rx="3" ry="1.3" fill="#fff" fill-opacity=".35"/>`);
orbitIcon("brownie", "🍫", "Брауни",
  `<rect x="9" y="12" width="30" height="24" rx="3" fill="__FILL__"/>
   <path d="M14 28c4-6 8-6 12 0 3-5 7-4 8 1" stroke="__SHADE__" stroke-width="1.4" fill="none"/>${HL}`);
orbitIcon("cocoa-pod", "🫘", "Какао",
  `<path d="M24 6c8 4 12 12 10 22-2 10-8 14-10 14s-8-4-10-14C12 18 16 10 24 6z" fill="__FILL__"/>
   <path d="M24 10v26M18 16c4 2 8 2 12 0M17 24c5 2 9 2 14 0" stroke="__SHADE__" stroke-width="1.2" fill="none"/>${HL}`);

function dropIcon() {
  return `<path d="M24 6c8 10 12 16 12 24a12 12 0 0 1-24 0c0-8 4-14 12-24z" fill="__FILL__"/>${HL}`;
}
orbitIcon("honey", "🍯", "Мёд", dropIcon());
orbitIcon("caramel", "🍮", "Карамель",
  `<ellipse cx="24" cy="30" rx="14" ry="8" fill="__FILL__"/>
   <path d="M12 28c2-10 22-10 24 0" fill="__FILL__"/>
   <path d="M16 20c4 4 12 4 16 0" stroke="__SHADE__" stroke-width="1.4" fill="none"/>${HL}`);
orbitIcon("maple", "🍁", "Клён",
  `<path d="M24 6l4 10 10 2-8 6 3 10-9-6-9 6 3-10-8-6 10-2z" fill="__FILL__"/>${HL}`);
orbitIcon("toffee", "🍬", "Ириска",
  `<rect x="8" y="18" width="32" height="14" rx="7" fill="__FILL__"/>
   <path d="M8 25h32" stroke="__SHADE__" stroke-width="1.3"/>${HL}`);
orbitIcon("nougat", "🍬", "Нуга",
  `<rect x="10" y="16" width="28" height="16" rx="3" fill="__FILL__"/>
   <circle cx="18" cy="24" r="2" fill="__SHADE__"/><circle cx="26" cy="22" r="2" fill="__SHADE__"/><circle cx="30" cy="27" r="1.6" fill="__SHADE__"/>${HL}`);
orbitIcon("pastila", "🍥", "Пастила",
  `<rect x="12" y="14" width="24" height="20" rx="10" fill="__FILL__"/>
   <path d="M18 24h12" stroke="__SHADE__" stroke-width="1.4" stroke-linecap="round"/>${HL}`);
orbitIcon("vanilla", "🌿", "Ваниль",
  `<path d="M28 6c-2 10-6 18-14 28 6 2 14-2 18-10 4-8 2-14-4-18z" fill="__FILL__"/>
   <path d="M22 14c-2 6-4 12-8 16" stroke="__SHADE__" stroke-width="1.3" fill="none"/>${HL}`);
orbitIcon("jam", "🍓", "Джем",
  `<path d="M16 18h16v16a8 8 0 0 1-16 0z" fill="__FILL__"/>
   <rect x="14" y="12" width="20" height="7" rx="2" fill="__SHADE__"/>
   <circle cx="22" cy="26" r="1.3" fill="#fff" fill-opacity=".45"/><circle cx="27" cy="30" r="1.2" fill="#fff" fill-opacity=".35"/>`);

function flower(petals) {
  let s = "";
  for (let i = 0; i < petals; i++) {
    const a = (i * 360) / petals;
    s += `<ellipse cx="24" cy="12" rx="5" ry="8" fill="__FILL__" transform="rotate(${a} 24 24)"/>`;
  }
  return s + `<circle cx="24" cy="24" r="4" fill="__SHADE__"/>` + HL;
}
orbitIcon("jasmine", "🌸", "Жасмин", flower(6));
orbitIcon("rose", "🌹", "Роза",
  `<path d="M24 40c0-8 2-12 2-12s6 2 8 8c-6 2-10 4-10 4z" fill="__SHADE__"/>
   <circle cx="24" cy="20" r="6" fill="__FILL__"/>
   <path d="M24 14c4 2 8 6 6 10-4-2-8-2-10 0 0-6 2-8 4-10z" fill="__FILL__"/>
   <path d="M18 18c-4 2-6 8-2 10 2-4 4-6 6-8-2 0-3-1-4-2z" fill="__SHADE__"/>${HL}`);
orbitIcon("lavender", "💜", "Лаванда",
  `<path d="M24 42V18" stroke="__SHADE__" stroke-width="1.6"/>
   <ellipse cx="24" cy="14" rx="4" ry="6" fill="__FILL__"/>
   <ellipse cx="18" cy="18" rx="3.2" ry="5" fill="__FILL__"/><ellipse cx="30" cy="18" rx="3.2" ry="5" fill="__FILL__"/>${HL}`);
orbitIcon("chamomile", "🌼", "Ромашка", flower(8));
orbitIcon("hibiscus", "🌺", "Гибискус", flower(5));

function citrus(wedges) {
  let lines = "";
  for (let i = 0; i < wedges; i++) {
    const a = ((i * 360) / wedges - 90) * Math.PI / 180;
    const x = 24 + Math.cos(a) * 11;
    const y = 24 + Math.sin(a) * 11;
    lines += `<line x1="24" y1="24" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="__SHADE__" stroke-width="1.2"/>`;
  }
  return `<circle cx="24" cy="24" r="14" fill="__FILL__"/><circle cx="24" cy="24" r="11" fill="none" stroke="__SHADE__" stroke-width="1.4"/>${lines}<circle cx="24" cy="24" r="2.2" fill="__SHADE__"/>${HL}`;
}
orbitIcon("lemon", "🍋", "Лимон", citrus(6) + `<path d="M24 6c2 4-2 6 0 8" stroke="__SHADE__" stroke-width="1.4" fill="none"/>`);
orbitIcon("orange", "🍊", "Апельсин", citrus(8));
orbitIcon("lime", "🍋", "Лайм", citrus(6));
orbitIcon("grapefruit", "🍊", "Грейпфрут", citrus(10));
orbitIcon("pomelo", "🍊", "Помело", `<circle cx="24" cy="26" r="15" fill="__FILL__"/><circle cx="24" cy="26" r="8" fill="none" stroke="__SHADE__" stroke-width="1.5"/>${HL}`);

function berry(dots) {
  let s = `<circle cx="24" cy="26" r="12" fill="__FILL__"/>`;
  dots.forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="1.3" fill="__SHADE__"/>`; });
  return s + `<path d="M24 10c2 3 2 5 0 7-2-2-2-4 0-7z" fill="__SHADE__"/>` + HL;
}
orbitIcon("strawberry", "🍓", "Клубника",
  `<path d="M24 14c8 2 14 10 12 18-4 8-16 8-20 0C10 24 16 16 24 14z" fill="__FILL__"/>
   <path d="M16 14c4-4 12-4 16 0-4 2-12 2-16 0z" fill="__SHADE__"/>
   <circle cx="20" cy="24" r="1.2" fill="#fff" fill-opacity=".5"/><circle cx="26" cy="28" r="1.2" fill="#fff" fill-opacity=".5"/><circle cx="22" cy="32" r="1.1" fill="#fff" fill-opacity=".45"/>`);
orbitIcon("raspberry", "🍇", "Малина",
  `<circle cx="24" cy="18" r="6" fill="__FILL__"/><circle cx="17" cy="24" r="6" fill="__FILL__"/><circle cx="31" cy="24" r="6" fill="__FILL__"/><circle cx="20" cy="31" r="6" fill="__FILL__"/><circle cx="28" cy="31" r="6" fill="__FILL__"/>
   <path d="M24 8c2 3 1 6-1 7" stroke="__SHADE__" stroke-width="1.4" fill="none"/>`);
orbitIcon("cherry", "🍒", "Вишня",
  `<path d="M20 16c4-8 12-8 14 0" stroke="__SHADE__" stroke-width="1.5" fill="none"/>
   <circle cx="18" cy="30" r="8" fill="__FILL__"/><circle cx="31" cy="28" r="8" fill="__FILL__"/>
   <ellipse cx="15" cy="27" rx="2.4" ry="1.3" fill="#fff" fill-opacity=".35"/>`);
orbitIcon("berry", "🫐", "Ягода", berry([[20, 24], [26, 22], [23, 30], [28, 28]]));
orbitIcon("blackberry", "🫐", "Ежевика",
  `<circle cx="24" cy="16" r="5" fill="__FILL__"/><circle cx="17" cy="22" r="5" fill="__FILL__"/><circle cx="31" cy="22" r="5" fill="__FILL__"/><circle cx="20" cy="29" r="5" fill="__FILL__"/><circle cx="29" cy="29" r="5" fill="__FILL__"/><circle cx="24" cy="34" r="5" fill="__FILL__"/>`);
orbitIcon("cranberry", "🔴", "Клюква", `<circle cx="24" cy="26" r="11" fill="__FILL__"/><path d="M24 12v6" stroke="__SHADE__" stroke-width="1.5"/>${HL}`);
orbitIcon("rosehip", "🌹", "Шиповник", `<circle cx="24" cy="26" r="11" fill="__FILL__"/><path d="M24 8l2 8h-4z" fill="__SHADE__"/>${HL}`);

function stone(stem) {
  return `<circle cx="24" cy="27" r="13" fill="__FILL__"/>${stem ? `<path d="M24 8c2 6-1 10 0 14" stroke="__SHADE__" stroke-width="1.5" fill="none"/>` : ""}<path d="M30 12c4 2 6 6 4 8" stroke="__SHADE__" stroke-width="1.3" fill="none"/>${HL}`;
}
orbitIcon("apple", "🍎", "Яблоко",
  `<path d="M24 12c2-4 6-5 8-4" stroke="__SHADE__" stroke-width="1.5" fill="none"/>
   <circle cx="24" cy="28" r="13" fill="__FILL__"/>
   <path d="M24 16c-1 6 1 8 0 12" stroke="__SHADE__" stroke-width="1.2" fill="none"/>${HL}`);
orbitIcon("peach", "🍑", "Персик", stone(true) + `<path d="M24 16c4 8 4 16 0 24" stroke="__SHADE__" stroke-width="1.2" fill="none" opacity=".7"/>`);
orbitIcon("apricot", "🍊", "Абрикос", stone(true));
orbitIcon("plum", "🟣", "Слива", `<ellipse cx="24" cy="27" rx="11" ry="14" fill="__FILL__"/><path d="M24 10c1 6 0 8 0 12" stroke="__SHADE__" stroke-width="1.4" fill="none"/>${HL}`);
orbitIcon("pear", "🍐", "Груша",
  `<path d="M24 8c6 4 8 10 6 16-4 12-14 14-16 4C10 16 16 6 24 8z" fill="__FILL__"/>
   <path d="M24 6c2 3 1 5 0 7" stroke="__SHADE__" stroke-width="1.4" fill="none"/>${HL}`);
orbitIcon("grape", "🍇", "Виноград",
  `<circle cx="24" cy="14" r="5" fill="__FILL__"/><circle cx="17" cy="22" r="5" fill="__FILL__"/><circle cx="31" cy="22" r="5" fill="__FILL__"/><circle cx="20" cy="30" r="5" fill="__FILL__"/><circle cx="29" cy="30" r="5" fill="__FILL__"/><circle cx="24" cy="36" r="4.5" fill="__FILL__"/>
   <path d="M24 6v6" stroke="__SHADE__" stroke-width="1.4"/>`);
orbitIcon("pomegranate", "🔴", "Гранат",
  `<path d="M16 18c0-6 16-6 16 0-2 14-4 20-8 20s-6-6-8-20z" fill="__FILL__"/>
   <path d="M18 16h12" stroke="__SHADE__" stroke-width="2"/><circle cx="22" cy="26" r="1.4" fill="#fff" fill-opacity=".4"/><circle cx="27" cy="30" r="1.3" fill="#fff" fill-opacity=".4"/>`);

orbitIcon("mango", "🥭", "Манго",
  `<path d="M16 34c-4-10 2-22 12-24 8-2 14 6 12 16-2 10-12 14-24 8z" fill="__FILL__"/>
   <path d="M20 16c6 4 10 12 8 20" stroke="__SHADE__" stroke-width="1.3" fill="none"/>${HL}`);
orbitIcon("pineapple", "🍍", "Ананас",
  `<path d="M18 8c2 4 2 4 6 2 0 4 2 4 4 0 2 4 4 4 6 2-2 4-2 6 0 8H16c2-2 2-4 2-8z" fill="__SHADE__"/>
   <ellipse cx="24" cy="30" rx="10" ry="12" fill="__FILL__"/>
   <path d="M18 24h12M16 30h16M18 36h12M24 20v20" stroke="__SHADE__" stroke-width="1" opacity=".7"/>`);
orbitIcon("melon", "🍈", "Дыня",
  `<circle cx="24" cy="24" r="14" fill="__FILL__"/>
   <path d="M12 20c8 4 16 4 24 0" stroke="__SHADE__" stroke-width="1.2" fill="none"/>${HL}`);
orbitIcon("kiwi", "🥝", "Киви",
  `<circle cx="24" cy="24" r="14" fill="__FILL__"/><circle cx="24" cy="24" r="6" fill="__SHADE__"/>
   <circle cx="24" cy="16" r="1" fill="__SHADE__"/><circle cx="30" cy="20" r="1" fill="__SHADE__"/><circle cx="30" cy="28" r="1" fill="__SHADE__"/><circle cx="24" cy="32" r="1" fill="__SHADE__"/><circle cx="18" cy="28" r="1" fill="__SHADE__"/><circle cx="18" cy="20" r="1" fill="__SHADE__"/>`);
orbitIcon("passion", "🟣", "Маракуйя",
  `<circle cx="24" cy="24" r="14" fill="__FILL__"/><circle cx="24" cy="24" r="7" fill="none" stroke="__SHADE__" stroke-width="1.4"/>
   <circle cx="22" cy="22" r="1.2" fill="__SHADE__"/><circle cx="26" cy="25" r="1.2" fill="__SHADE__"/><circle cx="23" cy="27" r="1" fill="__SHADE__"/>`);
orbitIcon("lychee", "🔴", "Личи", `<circle cx="24" cy="25" r="13" fill="__FILL__"/><path d="M16 20c4 2 8 2 16 0M15 26c5 2 12 2 18 0M16 32c4-1 10-1 16 0" stroke="__SHADE__" stroke-width="1" fill="none"/>${HL}`);
orbitIcon("papaya", "🧡", "Папайя",
  `<ellipse cx="24" cy="24" rx="10" ry="16" fill="__FILL__"/>
   <ellipse cx="24" cy="26" rx="4" ry="8" fill="__SHADE__"/>${HL}`);
orbitIcon("cape", "🟠", "Физалис",
  `<path d="M24 28c-8 0-12-6-10-12 6-2 14-2 20 0 2 6-2 12-10 12z" fill="__SHADE__"/>
   <circle cx="24" cy="30" r="7" fill="__FILL__"/>`);
orbitIcon("banana", "🍌", "Банан",
  `<path d="M14 16c8-6 18-4 22 4-6 2-8 8-6 16-8 2-16-2-18-10-2-4 0-8 2-10z" fill="__FILL__"/>
   <path d="M18 18c6 2 12 8 12 16" stroke="__SHADE__" stroke-width="1.3" fill="none"/>${HL}`);
orbitIcon("date-fruit", "🌴", "Финик", `<ellipse cx="24" cy="26" rx="8" ry="14" fill="__FILL__"/><path d="M24 12v6" stroke="__SHADE__" stroke-width="1.4"/>${HL}`);
orbitIcon("fig", "🟣", "Инжир",
  `<path d="M24 10c8 2 12 10 10 18-2 8-8 12-10 12s-8-4-10-12C12 20 16 12 24 10z" fill="__FILL__"/>
   <path d="M18 14h12" stroke="__SHADE__" stroke-width="1.4"/>${HL}`);
orbitIcon("prune", "🟣", "Чернослив", `<ellipse cx="24" cy="26" rx="10" ry="14" fill="__FILL__"/><path d="M18 24c4 4 8 4 12 0" stroke="__SHADE__" stroke-width="1.3" fill="none"/>${HL}`);
orbitIcon("raisin", "🍇", "Изюм", `<ellipse cx="20" cy="26" rx="7" ry="9" fill="__FILL__"/><ellipse cx="30" cy="24" rx="6" ry="8" fill="__FILL__"/>${HL}`);

orbitIcon("cinnamon-stick", "🍂", "Корица",
  `<rect x="8" y="20" width="32" height="9" rx="4" fill="__FILL__" transform="rotate(-18 24 24)"/>
   <rect x="10" y="16" width="30" height="8" rx="4" fill="__SHADE__" transform="rotate(-18 24 24)" opacity=".9"/>
   <ellipse cx="16" cy="18" rx="3" ry="1.4" fill="#fff" fill-opacity=".35" transform="rotate(-18 16 18)"/>`);
orbitIcon("clove", "🌿", "Гвоздика",
  `<circle cx="24" cy="14" r="6" fill="__FILL__"/>
   <rect x="22" y="18" width="4" height="18" rx="2" fill="__SHADE__"/>
   <circle cx="22" cy="12" r="1.2" fill="#fff" fill-opacity=".4"/>`);
orbitIcon("nutmeg", "🌰", "Мускат",
  `<ellipse cx="24" cy="25" rx="12" ry="14" fill="__FILL__"/>
   <path d="M24 12c-3 8 3 14 0 24" stroke="__SHADE__" stroke-width="1.4" fill="none"/>${HL}`);
orbitIcon("peppercorn", "⚫", "Перец",
  `<circle cx="24" cy="24" r="12" fill="__FILL__"/>
   <path d="M16 20c4 2 8 2 14-2M15 26c6 2 12 1 16-3" stroke="__SHADE__" stroke-width="1.2" fill="none"/>${HL}`);
orbitIcon("star-anise", "⭐", "Бадьян",
  `<path d="M24 4l3 12 12 3-12 3-3 12-3-12-12-3 12-3z" fill="__FILL__"/>
   <circle cx="24" cy="22" r="3" fill="__SHADE__"/>`);
orbitIcon("ginger", "🫚", "Имбирь",
  `<path d="M10 28c4-8 10-10 16-8 4 2 8 0 12-4-2 8-2 12-8 16-8 4-16 2-20-4z" fill="__FILL__"/>
   <path d="M18 22c4 2 10 2 14-2" stroke="__SHADE__" stroke-width="1.3" fill="none"/>${HL}`);
orbitIcon("cardamom", "🟢", "Кардамон",
  `<path d="M24 6c6 6 8 14 4 26-6 4-10 2-12-4C12 18 16 8 24 6z" fill="__FILL__"/>
   <path d="M24 10v24" stroke="__SHADE__" stroke-width="1.3" fill="none"/>${HL}`);
orbitIcon("cedar", "🌲", "Кедр",
  `<path d="M24 6l10 12H28l8 10H14l8-10h-6z" fill="__FILL__"/>
   <rect x="22" y="30" width="4" height="10" fill="__SHADE__"/>`);

function pastry(extra) {
  return `<path d="M8 30c4-10 28-10 32 0-2 6-8 8-16 8s-14-2-16-8z" fill="__FILL__"/>
    <path d="M12 28c6-6 18-6 24 0" stroke="__SHADE__" stroke-width="1.4" fill="none"/>${extra}${HL}`;
}
orbitIcon("croissant", "🥐", "Круассан",
  `<path d="M8 30c6-14 26-16 34-4-8 2-10 6-10 10-6 2-16 0-20-2-2-4-4-6-4-4z" fill="__FILL__"/>
   <path d="M14 26c6-4 14-4 20 0M16 30c5-2 10-2 14 1" stroke="__SHADE__" stroke-width="1.2" fill="none"/>`);
orbitIcon("bread", "🍞", "Хлеб",
  `<path d="M8 26c0-8 8-12 16-12s16 4 16 12v10H8z" fill="__FILL__"/>
   <path d="M8 28h32" stroke="__SHADE__" stroke-width="1.3"/>${HL}`);
orbitIcon("cookie", "🍪", "Печенье",
  `<circle cx="24" cy="25" r="13" fill="__FILL__"/>
   <circle cx="18" cy="22" r="1.6" fill="__SHADE__"/><circle cx="26" cy="20" r="1.5" fill="__SHADE__"/><circle cx="28" cy="28" r="1.6" fill="__SHADE__"/><circle cx="20" cy="30" r="1.4" fill="__SHADE__"/>`);
orbitIcon("pie", "🥧", "Пирог",
  `<path d="M8 22h32l-4 16H12z" fill="__FILL__"/>
   <path d="M8 22c4-6 28-6 32 0" fill="__SHADE__"/>
   <path d="M18 22v16M24 22v16M30 22v16" stroke="__SHADE__" stroke-width="1" opacity=".6"/>`);

orbitIcon("wine-glass", "🍷", "Бокал",
  `<path d="M16 8h16l-2 14a8 8 0 0 1-12 0z" fill="__FILL__"/>
   <path d="M24 26v10M18 40h12" stroke="__SHADE__" stroke-width="1.6" stroke-linecap="round"/>`);
orbitIcon("whiskey", "🥃", "Бокал виски",
  `<path d="M12 12h24l-3 22H15z" fill="__FILL__"/>
   <path d="M14 22h20" stroke="__SHADE__" stroke-width="1.4"/>${HL}`);
orbitIcon("liqueur", "🍸", "Ликёр",
  `<path d="M18 8h12l-1 10H19z" fill="__FILL__"/>
   <path d="M24 18v8" stroke="__SHADE__" stroke-width="1.5"/>
   <path d="M14 34c2-6 18-6 20 0v4H14z" fill="__FILL__"/>`);
