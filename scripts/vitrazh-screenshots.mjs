import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const base = process.argv[2] || "http://127.0.0.1:8765";
const url = `${base.replace(/\/$/, "")}/vitrazh/`;
const outDir = "/opt/cursor/artifacts/vitrazh-screens";

async function clickLabel(page, labelPart) {
  await page.evaluate((part) => {
    const w = document.querySelector("flavor-wheel-vitrazh");
    const seg = [...w.shadowRoot.querySelectorAll(".seg")].find((s) =>
      s.getAttribute("aria-label")?.includes(part),
    );
    if (!seg) throw new Error(`seg ${part}`);
    seg.dispatchEvent(new PointerEvent("click", { bubbles: true }));
  }, labelPart);
  await page.waitForTimeout(700);
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: false });
}

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();

for (const [tag, viewport] of [
  ["375", { width: 375, height: 667 }],
  ["1440", { width: 1440, height: 900 }],
]) {
  const context = await browser.newContext({ viewport, locale: "ru-RU" });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForFunction(
    () => document.querySelector("flavor-wheel-vitrazh")?.shadowRoot?.querySelector(".seg"),
    undefined,
    { timeout: 120000 },
  );
  await shot(page, `${tag}-start`);
  await clickLabel(page, "Сладкий");
  await shot(page, `${tag}-sweet`);
  await clickLabel(page, "Карамельный");
  await shot(page, `${tag}-karamelnyy`);
  await page.evaluate(() => document.querySelector("flavor-wheel-vitrazh").jumpTo(0));
  await page.waitForTimeout(500);
  await clickLabel(page, "Фруктовый");
  await shot(page, `${tag}-fruity`);
  await context.close();
}

await browser.close();
console.log("saved to", outDir);
