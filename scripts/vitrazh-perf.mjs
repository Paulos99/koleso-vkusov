/**
 * Замер FPS на vitrazh: 375×667, CPU 4×, вращение + hover.
 * Экран: старт + все 5 экранов второго уровня.
 * Запуск: node scripts/vitrazh-perf.mjs [baseUrl]
 */
import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:8765";
const url = `${base.replace(/\/$/, "")}/vitrazh/`;

const L2 = [
  { label: "l2-nutty-cocoa", part: "Ореховый" },
  { label: "l2-sweet", part: "Сладкий" },
  { label: "l2-floral-tea", part: "Цветочный" },
  { label: "l2-fruity", part: "Фруктовый" },
  { label: "l2-spicy-unique", part: "Пряный" },
];

async function measure(page, label) {
  const fps = await page.evaluate(async () => {
    const host = document.querySelector("flavor-wheel-vitrazh");
    const svg = host?.shadowRoot?.querySelector("svg.wheel");
    if (!svg) return { error: "no wheel" };
    let frames = 0;
    const start = performance.now();
    const dur = 2500;
    return new Promise((resolve) => {
      function tick() {
        frames++;
        if (performance.now() - start < dur) requestAnimationFrame(tick);
        else resolve(Math.round((frames / dur) * 1000 * 10) / 10);
      }
      requestAnimationFrame(tick);
      const box = svg.getBoundingClientRect();
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      const r = box.width * 0.34;
      let a = 0;
      let rot = 0;
      const id = setInterval(() => {
        a += 0.14;
        rot += 2.5;
        host.rotation = rot;
        host.applyRotation();
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        svg.dispatchEvent(new PointerEvent("pointermove", {
          clientX: x, clientY: y, bubbles: true, pointerId: 1, pointerType: "mouse",
        }));
      }, 16);
      setTimeout(() => clearInterval(id), dur);
    });
  });
  console.log(JSON.stringify({ label, fps }));
  return fps;
}

async function waitReady(page) {
  await page.waitForFunction(
    () => {
      const root = document.querySelector("flavor-wheel-vitrazh")?.shadowRoot;
      if (!root?.querySelector(".seg")) return false;
      const pending = root.querySelectorAll(".preview-vitrazh[data-raster-pending='1']").length;
      return pending === 0;
    },
    undefined,
    { timeout: 120000 },
  );
}

async function clickPart(page, part) {
  await page.evaluate((p) => {
    const w = document.querySelector("flavor-wheel-vitrazh");
    const seg = [...w.shadowRoot.querySelectorAll(".seg")].find((s) =>
      s.getAttribute("aria-label")?.includes(p),
    );
    if (!seg) throw new Error(`seg ${p}`);
    seg.dispatchEvent(new PointerEvent("click", { bubbles: true }));
  }, part);
  await page.waitForTimeout(500);
  await waitReady(page);
}

async function goStart(page) {
  await page.evaluate(() => document.querySelector("flavor-wheel-vitrazh").jumpTo(0));
  await page.waitForTimeout(400);
  await waitReady(page);
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 375, height: 667 },
  deviceScaleFactor: 2,
  isMobile: true,
  locale: "ru-RU",
});
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForSelector("flavor-wheel-vitrazh", { state: "attached", timeout: 60000 });
await page.waitForFunction(
  () => document.querySelector("flavor-wheel-vitrazh")?.shadowRoot?.querySelector(".seg"),
  undefined,
  { timeout: 120000 },
);
await waitReady(page);
await measure(page, "start");

for (const screen of L2) {
  await goStart(page);
  await clickPart(page, screen.part);
  await measure(page, screen.label);
}

await browser.close();
