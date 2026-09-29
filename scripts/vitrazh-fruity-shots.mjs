import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const base = process.argv[2] || "http://127.0.0.1:8765";
const url = `${base.replace(/\/$/, "")}/vitrazh/`;
const outDir = "/opt/cursor/artifacts/vitrazh-screens";

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });

for (const [tag, viewport] of [
  ["375", { width: 375, height: 667 }],
  ["1440", { width: 1440, height: 900 }],
]) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: tag === "375" ? 2 : 1, locale: "ru-RU" });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForFunction(
    () => document.querySelector("flavor-wheel-vitrazh")?.shadowRoot?.querySelector(".seg"),
    undefined,
    { timeout: 60000 },
  );
  await page.waitForFunction(
    () => !document.querySelector("flavor-wheel-vitrazh")?.shadowRoot?.querySelector("[data-raster-pending]"),
    undefined,
    { timeout: 60000 },
  );
  await page.evaluate(() => {
    const w = document.querySelector("flavor-wheel-vitrazh");
    const seg = [...w.shadowRoot.querySelectorAll(".seg")].find((s) =>
      s.getAttribute("aria-label")?.includes("Фруктовый"),
    );
    seg.dispatchEvent(new PointerEvent("click", { bubbles: true }));
  });
  await page.waitForTimeout(400);
  await page.waitForFunction(
    () => {
      const root = document.querySelector("flavor-wheel-vitrazh")?.shadowRoot;
      const imgs = root?.querySelectorAll(".preview-vitrazh image")?.length || 0;
      const pending = root?.querySelectorAll("[data-raster-pending]")?.length || 0;
      return pending === 0 && imgs >= 30;
    },
    undefined,
    { timeout: 90000 },
  );
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, `${tag}-fruity.png`), fullPage: false });
  await context.close();
  console.log("saved", tag);
}

await browser.close();
