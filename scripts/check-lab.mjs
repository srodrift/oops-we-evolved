import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

// Run against a local dev or production server. This check executes two real
// local experiments; only the final HTTP-error check uses an explicit fixture.
const baseURL = process.env.MORPH_BASE_URL || "http://localhost:3033";
const outputDir = process.env.MORPH_CAPTURE_DIR;
if (outputDir) await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--enable-unsafe-swiftshader"],
  ...(process.env.MORPH_BROWSER_PATH
    ? { executablePath: process.env.MORPH_BROWSER_PATH }
    : {}),
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1080 },
  });
  const errors = [];
  let missionRequests = 0;
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().endsWith("/api/cycle") && request.method() === "POST")
      missionRequests++;
  });
  const capture = async (name) => {
    if (outputDir)
      await page.screenshot({ path: resolve(outputDir, name), fullPage: true });
  };
  const stage = (index) => page.locator(".stages button").nth(index).click();
  await page.goto(baseURL);
  await page
    .getByRole("heading", { name: "Broken tools. Verified recovery." })
    .waitFor();
  await page
    .locator('.scene-canvas[data-render-mode="webgl"] canvas')
    .waitFor();
  const canvas = page.locator(".scene-canvas canvas");
  const cameraBefore = await canvas.getAttribute("data-orbit");
  await page.getByRole("button", { name: "Rotate right", exact: true }).click();
  await page.waitForTimeout(300);
  assert.notEqual(await canvas.getAttribute("data-orbit"), cameraBefore);
  const rotated = await canvas.getAttribute("data-orbit");
  await page.getByRole("button", { name: "Zoom in 3D", exact: true }).click();
  await page.waitForTimeout(300);
  assert.notEqual(await canvas.getAttribute("data-orbit"), rotated);
  await page.getByRole("button", { name: "Fit 3D scene", exact: true }).click();
  await page
    .locator("#source-brief")
    .fill(
      "OPERATOR SF-104 // BACKUP VERIFIED\nThis source was supplied by the person operating the demo.",
    );
  await capture("morph-lab-3d-ready.png");
  await page.getByRole("button", { name: "Blueprint", exact: true }).click();
  await capture("morph-lab-ready.png");
  assert.equal(
    await page.getByRole("button", { name: "Replay Execution" }).isEnabled(),
    false,
  );
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  assert.equal(
    await page.locator(".camera-controls span").textContent(),
    "120%",
  );
  const scene = page.locator(".map-wrap svg > g");
  const beforePan = await scene.getAttribute("transform");
  const bounds = await page.locator(".map-wrap svg").boundingBox();
  await page.mouse.move(
    bounds.x + bounds.width * 0.8,
    bounds.y + bounds.height * 0.8,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width * 0.8 + 35,
    bounds.y + bounds.height * 0.8 + 20,
    { steps: 4 },
  );
  await page.mouse.up();
  assert.notEqual(await scene.getAttribute("transform"), beforePan);
  await page.getByRole("button", { name: "Fit map", exact: true }).click();
  assert.equal(
    await page.locator(".camera-controls span").textContent(),
    "100%",
  );

  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/cycle"),
  );
  await page.getByRole("button", { name: /Run Mission/ }).click();
  const report = await (await responsePromise).json();
  assert.equal(report.scenario, "primary-outage");
  assert.equal(
    report.task.expectedHeadline,
    "OPERATOR SF-104 // BACKUP VERIFIED",
  );
  assert.equal(
    report.steps.find((step) => step.index === 7).evidence.headline,
    "OPERATOR SF-104 // BACKUP VERIFIED",
  );
  assert.equal(report.input.source, "operator");
  assert.ok(report.approvedVersion);
  assert.equal(report.steps.find((step) => step.index === 6).status, "saved");
  await page.getByRole("button", { name: "Ⅱ Pause", exact: true }).click();
  await stage(2);
  await page.getByRole("heading", { name: "RAINDROP", exact: true }).waitFor();
  assert.equal(
    await page.locator(".inline-event-id").textContent(),
    report.steps.find((step) => step.index === 3).evidence.raindrop.eventId,
  );
  assert.equal(await page.locator(".route-packet").count(), 2);
  assert.equal(
    await page
      .locator(".map-wrap svg")
      .evaluate((svg) => svg.animationsPaused()),
    true,
  );
  const getPacketPosition = () =>
    page
      .locator(".route-packet")
      .first()
      .evaluate((circle) => {
        const m = circle.getCTM();
        return [m.e, m.f];
      });
  const pausedPosition = await getPacketPosition();
  await page.waitForTimeout(180);
  assert.deepEqual(await getPacketPosition(), pausedPosition);
  await page.getByRole("button", { name: "▷ Play", exact: true }).click();
  await page.waitForTimeout(250);
  assert.notDeepEqual(await getPacketPosition(), pausedPosition);
  await capture("morph-lab-diagnosis.png");
  await page.getByRole("button", { name: "Ⅱ Pause", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(
    () => document.querySelectorAll(".route-packet").length === 0,
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await stage(3);
  await page.getByText("Inspect rules & guardrails").click();
  await capture("morph-lab-mutation.png");
  await stage(4);
  await page.getByRole("combobox", { name: "Replay speed" }).selectOption("2");
  await page.getByRole("button", { name: "▷ Play", exact: true }).click();
  await page
    .getByText("Recovery verified", { exact: true })
    .waitFor({ timeout: 20000 });
  await capture("morph-lab-recovered.png");
  await page.getByRole("button", { name: "3D Orbit", exact: true }).click();
  await page
    .locator('.scene-canvas[data-render-mode="webgl"] canvas')
    .waitFor();
  await capture("morph-lab-3d-recovered.png");
  await page.getByRole("button", { name: "Blueprint", exact: true }).click();
  await page.getByRole("button", { name: /Inspect Evidence/ }).click();
  await page.getByRole("dialog").waitFor();
  await capture("morph-lab-evidence.png");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Download execution JSON/ }).click();
  const download = await downloadPromise;
  const downloadStream = await download.createReadStream();
  let downloaded = "";
  for await (const chunk of downloadStream) downloaded += chunk;
  assert.deepEqual(JSON.parse(downloaded), report);
  await page.getByRole("button", { name: "Close evidence" }).click();
  assert.equal(
    await page.getByRole("button", { name: "World", exact: true }).count(),
    0,
  );
  await page.getByRole("button", { name: "Replay Execution" }).click();
  await page.getByRole("button", { name: "Reset View" }).click();
  assert.equal(missionRequests, 1);
  await page
    .getByRole("button", { name: "Inspect ORBITAL UPLINK", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("heading", { name: "ORBITAL UPLINK", exact: true })
    .waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await capture("morph-lab-mobile.png");
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.setViewportSize({ width: 1440, height: 1080 });

  await page.locator("#experiment").selectOption("corrupt-archive");
  await page
    .getByText(
      "Input changed. Run Mission to execute this brief and fault; the map still shows the previous report.",
    )
    .waitFor();
  const rejectPromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/cycle"),
  );
  await page.getByRole("button", { name: /Run Mission/ }).click();
  const rejected = await (await rejectPromise).json();
  assert.equal(rejected.approvedVersion, null);
  assert.equal(
    rejected.steps.find((step) => step.index === 5).status,
    "rejected",
  );
  assert.equal(
    rejected.steps.find((step) => step.index === 6).status,
    "skipped",
  );
  await page.getByRole("button", { name: "Ⅱ Pause", exact: true }).click();
  await stage(5);
  await page.getByText("Candidate rejected", { exact: true }).waitFor();
  assert.equal(
    await page.locator(".map-wrap").getAttribute("data-recovered"),
    "false",
  );
  assert.equal(await page.locator(".route-recovered").count(), 0);
  await capture("morph-lab-rejected.png");
  await page.getByRole("button", { name: "3D Orbit", exact: true }).click();
  await page
    .locator('.scene-canvas[data-render-mode="webgl"] canvas')
    .waitFor();
  await capture("morph-lab-3d-rejected.png");
  await page.getByRole("button", { name: "Blueprint", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await capture("morph-lab-mobile-rejected.png");
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  const bad = await page.request.post(`${baseURL}/api/cycle`, {
    data: { scenario: "unsupported" },
  });
  assert.equal(bad.status(), 400);
  const invalid = await page.request.post(`${baseURL}/api/cycle`, {
    data: "invalid json",
    headers: { "Content-Type": "application/json" },
  });
  assert.equal(invalid.status(), 400);
  await page.route("**/api/cycle", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Controlled browser error fixture" }),
    }),
  );
  await page.getByRole("button", { name: /Run Mission/ }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Controlled browser error fixture" })
    .waitFor();
  assert.equal(
    await page.getByRole("button", { name: /Inspect Evidence/ }).isEnabled(),
    false,
  );
  assert.equal(
    await page.getByRole("button", { name: "Replay Execution" }).isEnabled(),
    false,
  );
  assert.deepEqual(errors, []);
  console.log(
    "Oops, We Evolved! browser checks passed: real recovery/rejection, replay isolation, camera, packet pause, reduced motion, evidence export, keyboard, mobile and HTTP error handling.",
  );
} finally {
  await browser.close();
}
