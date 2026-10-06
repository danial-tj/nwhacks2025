import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const baseline = process.argv[2] || "http://127.0.0.1:3011";
const improved = process.argv[3] || "http://127.0.0.1:3012";
const browser = await chromium.launch({
  channel: "chrome",
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const measurements = [];
try {
  for (const [label, url, marker] of [
    ["baseline", baseline, "cosmic-baseline-ready"],
    ["improved", improved, "cosmic-ready:atom"],
  ]) {
    for (let run = 1; run <= 3; run++) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForFunction(
        (name) => performance.getEntriesByName(name).length > 0,
        marker,
        { timeout: 60000 },
      );
      const measurement = await page.evaluate(
        (name) => ({
          userAgent: navigator.userAgent,
          sceneReadyMs: performance.getEntriesByName(name).at(-1).startTime,
          assets: performance
            .getEntriesByType("resource")
            .filter((entry) => entry.name.includes("/models/"))
            .map((entry) => ({
              name: entry.name.split("/").pop(),
              bytes: entry.transferSize,
              decodedBytes: entry.decodedBodySize,
              durationMs: entry.duration,
            })),
        }),
        marker,
      );
      // Browser animation-frame intervals during the same horizontal orbit gesture.
      const sample = page.evaluate(
        () =>
          new Promise((resolve) => {
            const deltas = [];
            let last;
            function frame(time) {
              if (last) deltas.push(time - last);
              last = time;
              if (deltas.length < 90) requestAnimationFrame(frame);
              else {
                const sorted = deltas.slice().sort((a, b) => a - b);
                resolve({
                  medianMs: sorted[Math.floor(sorted.length / 2)],
                  p95Ms: sorted[Math.floor(sorted.length * 0.95)],
                });
              }
            }
            requestAnimationFrame(frame);
          }),
      );
      const box = await page.locator("canvas").boundingBox();
      if (box) {
        await page.mouse.move(
          box.x + box.width * 0.45,
          box.y + box.height * 0.5,
        );
        await page.mouse.down();
        await page.mouse.move(
          box.x + box.width * 0.65,
          box.y + box.height * 0.5,
          { steps: 60 },
        );
        await page.mouse.up();
      }
      measurement.orbitAnimationFrameIntervals = await sample;
      measurements.push({ label, run, ...measurement });
      await context.close();
    }
  }
  await mkdir("docs", { recursive: true });
  await writeFile(
    "docs/loading-measurements.json",
    JSON.stringify(
      {
        conditions:
          "Windows, Node 22.13.0, local HTTP, Chrome software WebGL, 1440x1000, no network/CPU throttling, fresh browser context each run. Baseline source on patched runtime (dev); improved production build. First baseline run may include compilation. Readiness marks are scheduled two animation frames after model mount.",
        measurements,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    JSON.stringify(
      measurements.map((m) => ({
        version: m.label,
        run: m.run,
        readyMs: Math.round(m.sceneReadyMs),
        modelAndEnvironmentBytes: m.assets.reduce(
          (sum, asset) => sum + asset.bytes,
          0,
        ),
        frameIntervals: m.orbitAnimationFrameIntervals,
      })),
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
