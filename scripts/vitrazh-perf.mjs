/**
 * Замер FPS на vitrazh: 375×667, CPU 4×, сценарий hover + drag.
 * Запуск: node scripts/vitrazh-perf.mjs [baseUrl]
 */
import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:8765";
const url = `${base.replace(/\/$/, "")}/vitrazh/`;

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
        svg.dispatchEvent(new PointerEvent("pointermove", { clientX: x, clientY: y, bubbles: true, pointerId: 1, pointerType: "mouse" }));
      }, 16);
      setTimeout(() => clearInterval(id), dur);
    });
  });
  console.log(JSON.stringify({ label, fps: fps?.error ? fps : fps }));
}

async function waitPreviewRaster(page, minImages = 1) {
  await page.waitForFunction(
    (min) => {
      const root = document.querySelector("flavor-wheel-vitrazh")?.shadowRoot;
      const imgs = root?.querySelectorAll(".preview-vitrazh.is-raster image")?.length || 0;
      const pending = root?.querySelectorAll(".preview-vitrazh[data-raster-pending='1']")?.length || 0;
      return pending === 0 && imgs >= min;
    },
    minImages,
    { timeout: 90000 },
  ).catch(() => {});
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
await page.waitForSelector("flavor-wheel-vitrazh", { timeout: 30000 });
await page.waitForFunction(
  () => document.querySelector("flavor-wheel-vitrazh")?.shadowRoot?.querySelector(".seg"),
  undefined,
  { timeout: 120000 },
);

await waitPreviewRaster(page, 15);
await measure(page, "start");

await page.evaluate(() => {
  const w = document.querySelector("flavor-wheel-vitrazh");
  const seg = [...w.shadowRoot.querySelectorAll(".seg")].find((s) => s.getAttribute("aria-label")?.includes("Сладкий"));
  seg?.dispatchEvent(new PointerEvent("click", { bubbles: true }));
});
await page.waitForTimeout(800);

await measure(page, "sweet");

await page.evaluate(() => {
  const w = document.querySelector("flavor-wheel-vitrazh");
  const seg = [...w.shadowRoot.querySelectorAll(".seg")].find((s) => s.getAttribute("aria-label")?.includes("Карамельный"));
  seg?.dispatchEvent(new PointerEvent("click", { bubbles: true }));
});
await page.waitForTimeout(800);

await measure(page, "karamelnyy");

await page.evaluate(() => {
  const w = document.querySelector("flavor-wheel-vitrazh");
  w.jumpTo(0);
});
await page.waitForTimeout(400);
await page.evaluate(() => {
  const w = document.querySelector("flavor-wheel-vitrazh");
  const seg = [...w.shadowRoot.querySelectorAll(".seg")].find((s) => s.getAttribute("aria-label")?.includes("Фруктовый"));
  seg?.dispatchEvent(new PointerEvent("click", { bubbles: true }));
});
await page.waitForTimeout(800);
await waitPreviewRaster(page, 35);

await measure(page, "fruity");

await browser.close();
