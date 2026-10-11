import { chromium } from "playwright";
import { mkdir, rename } from "node:fs/promises";
import { resolve } from "node:path";
await mkdir("deliverables", { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.MORPH_BROWSER_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--enable-unsafe-swiftshader"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: "deliverables/raw", size: { width: 1440, height: 900 } },
});
const page = await context.newPage();
await page.goto(process.env.MORPH_BASE_URL || "http://localhost:3034");
await page.locator(".scene-canvas canvas").waitFor();
await page.addStyleTag({
  content:
    "body {zoom: .8} #demo-caption {position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:99999;background:#d9ef8e;color:#142019;padding:18px 26px;border-radius:8px;font:600 21px Arial;width:1000px;text-align:center;box-shadow:0 6px 30px #0008;pointer-events:none}",
});
await page.evaluate(() => {
  const caption = document.createElement("div");
  caption.id = "demo-caption";
  document.body.append(caption);
});
const start = Date.now();
const at = async (seconds, text, action) => {
  await page.waitForTimeout(Math.max(0, start + seconds * 1000 - Date.now()));
  await page
    .locator("#demo-caption")
    .evaluate((element, text) => (element.textContent = text), text);
  if (action) await action();
};
await at(
  0,
  "Oops, We Evolved! — When an agent’s API breaks, can its harness recover?",
  async () => {
    await page.getByRole("button", { name: "Auto orbit", exact: true }).click();
  },
);
await at(
  7,
  "Supply your incident brief. The first line is the answer we must recover.",
  async () => {
    await page
      .locator("#source-brief")
      .fill(
        "SF-104 // BACKUP CHANNEL VERIFIED\nIncident update: the primary channel is unavailable. Recover this exact headline from the ground archive.",
      );
  },
);
await at(
  14,
  "Run Mission executes real local tools. The primary tool actually throws.",
  async () => {
    await page.getByRole("button", { name: /Run Mission/ }).click();
  },
);
await at(
  20,
  "Recorded execution replay: Raindrop evidence drives a proposed harness repair.",
);
await at(
  28,
  "The repair must return the correct answer before it can be approved.",
  async () => {
    await page.locator(".mission-proof").scrollIntoViewIfNeeded();
  },
);
await at(
  35,
  "Inspect the real event ID, tool error, test results and persistence mode.",
  async () => {
    await page.getByRole("button", { name: /Inspect Evidence/ }).click();
  },
);
await at(
  42,
  "This capture uses local evidence and file storage. Live integrations are labeled separately.",
  async () => {
    await page.getByRole("button", { name: "Close evidence" }).click();
    await page.locator("#experiment").selectOption("corrupt-archive");
    await page.getByRole("button", { name: /Run Mission/ }).click();
  },
);
await at(
  48,
  "Now the fallback returns the wrong answer. A successful tool call is not enough.",
  async () => {
    await page.locator(".mission-proof").scrollIntoViewIfNeeded();
  },
);
await at(
  55,
  "Verification rejects the bad repair. Evidence before approval.",
  async () => {
    await page.locator(".stages button").nth(4).click();
  },
);
await at(60, "Oops, We Evolved! — Verified agent recovery.");
const video = page.video();
await context.close();
await rename(
  await video.path(),
  resolve("deliverables/oops-we-evolved-demo.webm"),
);
await browser.close();
console.log(
  "Recorded real browser demo: deliverables/oops-we-evolved-demo.webm",
);
