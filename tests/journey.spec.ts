import { test, expect, type Page } from "@playwright/test";
import { scenes } from "../lib/scenes";

// Compare pixels, allowing tiny compositing roundoff in transparent backgrounds.
async function changedPixels(page: Page, before: Buffer, after: Buffer) {
  return page.evaluate(async (sources) => {
    const pixels = await Promise.all(
      sources.map(async (source) => {
        const image = new Image();
        image.src = `data:image/png;base64,${source}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d")!;
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, canvas.width, canvas.height).data;
      }),
    );
    let changed = 0;
    for (let i = 0; i < pixels[0].length; i += 4) {
      if ([0, 1, 2].some((channel) =>
        Math.abs(pixels[0][i + channel] - pixels[1][i + channel]) > 2,
      )) changed++;
    }
    return changed;
  }, [before.toString("base64"), after.toString("base64")]);
}

test("all eight original models load, and navigation stays at its boundaries", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".viewer")).toHaveAttribute("data-ready", "true");
  const initial = await page.evaluate(() => ({
    userAgent: navigator.userAgent,
    sceneReadyMs: performance.getEntriesByName("cosmic-ready:atom").at(-1)
      ?.startTime,
    assets: performance
      .getEntriesByType("resource")
      .filter((entry) => entry.name.includes("/models/"))
      .map((entry) => ({
        name: entry.name.split("/").pop(),
        bytes: (entry as PerformanceResourceTiming).transferSize,
        durationMs: entry.duration,
      })),
  }));
  await info.attach("initial-loading.json", {
    body: JSON.stringify(initial, null, 2),
    contentType: "application/json",
  });
  expect(
    initial.assets.some((asset) => asset.name?.endsWith(".exr")),
  ).toBeFalsy();
  expect(initial.assets.map((asset) => asset.name)).toEqual(["atom.glb"]);
  await expect(
    page.getByRole("button", { name: "Previous smaller scale" }),
  ).toBeDisabled();
  for (const scene of scenes) {
    await page
      .getByRole("navigation", { name: "Choose a scale" })
      .getByRole("button", { name: new RegExp(scene.label) })
      .click();
    await expect(
      page.getByRole("heading", { name: scene.label, exact: true }),
    ).toBeVisible();
    await expect(page.locator(".viewer")).toHaveAttribute("data-ready", "true");
    await expect(page).toHaveURL(new RegExp(`#${scene.id}$`));
    if (scene.annotations.length) {
      const view = (await page.locator(".viewer").boundingBox())!;
      for (const marker of await page.locator(".hotspot").all()) {
        await expect(async () => {
          const box = (await marker.boundingBox())!;
          expect(box.x).toBeGreaterThan(view.x + view.width * 0.25);
          expect(box.x).toBeLessThan(view.x + view.width * 0.75);
        }).toPass({ timeout: 2000 });
      }
    }
    await page.screenshot({
      path: `test-results/${info.project.name}-${scene.id}.png`,
      fullPage: true,
    });
  }
  await expect(
    page.getByRole("button", { name: "Next larger scale" }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});

test("Solar System animation moves and pauses without resetting", async ({ page }, info) => {
  await page.goto("/#solar-system");
  await expect(page.locator(".viewer")).toHaveAttribute("data-ready", "true");
  const canvas = page.locator("canvas");
  await canvas.scrollIntoViewIfNeeded();
  const initial = await canvas.screenshot();
  await page.getByRole("button", { name: "Play animation" }).click();
  await expect.poll(async () => changedPixels(page, initial, await canvas.screenshot())).toBeGreaterThan(25);
  await page.getByRole("button", { name: "Pause animation" }).click();
  await canvas.scrollIntoViewIfNeeded();
  const paused = await canvas.screenshot({ path: info.outputPath("paused.png") });
  expect(await changedPixels(page, initial, paused)).toBeGreaterThan(25);
  // Elapsed time is essential here: a paused model must retain its current pose.
  await page.waitForTimeout(500);
  expect(await changedPixels(page, paused, await canvas.screenshot({ path: info.outputPath("still-paused.png") }))).toBe(0);
});

test("keyboard, wheel, source details and reduced motion work together", async ({
  page,
}, info) => {
  await page.goto("/#earth");
  await expect(page.locator(".viewer")).toHaveAttribute("data-ready", "true");
  await page.getByRole("region", { name: "Earth 3D view" }).press("ArrowLeft");
  await expect(
    page.getByRole("heading", { name: "Beaver", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("region", { name: "Beaver 3D view" })
    .press("ArrowRight");
  await expect(
    page.getByRole("heading", { name: "Earth", exact: true }),
  ).toBeVisible();
  if (info.project.name === "desktop") {
    await page.getByRole("region", { name: "Earth 3D view" }).focus();
    await page.locator(".viewer").hover();
    await page.mouse.wheel(0, 120);
    await expect(
      page.getByRole("heading", { name: "Solar System", exact: true }),
    ).toBeVisible();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    page.getByRole("button", { name: "Motion reduced" }),
  ).toBeDisabled();
  await page.getByText("About this scale & model", { exact: true }).click();
  await expect(page.locator(".scienceDetails a").first()).toBeVisible();
});

test("feature hotspots and HTML controls share selection; AI fails gracefully", async ({
  page,
}) => {
  await page.goto("/#dna");
  await expect(page.locator(".viewer")).toHaveAttribute("data-ready", "true");
  await page
    .locator(".featureButtons")
    .getByRole("button", { name: "Complementary base pairs" })
    .click();
  await expect(
    page.locator(".hotspot").filter({ hasText: "2" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".annotationText")).toContainText(
    "adenine with thymine",
  );
  await page.locator(".hotspot").filter({ hasText: "1" }).click();
  await expect(
    page
      .locator(".featureButtons")
      .getByRole("button", { name: "Sugar–phosphate backbone" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByText("Ask about DNA Helix", { exact: false }).click();
  await page.getByLabel("Your question").fill("What is this part?");
  await page.getByRole("button", { name: "Ask the guide" }).click();
  await expect(
    page.locator(".assistantPanel").getByRole("alert"),
  ).toContainText("offline");
  await page.getByRole("button", { name: "Reset view" }).click();
  await expect(page.locator(".annotationText")).toBeEmpty();
});

test("changing scenes cannot display a slow answer under new context", async ({
  page,
}) => {
  let sent: Record<string, string> = {};
  let complete: () => void = () => {};
  const finished = new Promise<void>((resolve) => {
    complete = resolve;
  });
  await page.route("**/api/ask", async (route) => {
    sent = route.request().postDataJSON();
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route
      .fulfill({
        json: {
          answer: "Old Earth answer",
          sources: [],
          sceneId: "earth",
          annotationId: "ocean",
        },
      })
      .catch(() => {});
    complete();
  });
  await page.goto("/#earth");
  await page
    .locator(".featureButtons")
    .getByRole("button", { name: "A world of water" })
    .click();
  await page.getByText("Ask about Earth", { exact: false }).click();
  await page.getByLabel("Your question").fill("What is this part?");
  const started = page.waitForRequest("**/api/ask");
  await page.getByRole("button", { name: "Ask the guide" }).click();
  await started;
  await page
    .getByRole("navigation", { name: "Choose a scale" })
    .getByRole("button", { name: /DNA Helix/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "DNA Helix", exact: true }),
  ).toBeVisible();
  await page.getByText("Ask about DNA Helix", { exact: false }).click();
  expect(sent).toMatchObject({ sceneId: "earth", annotationId: "ocean" });
  await finished;
  await expect(page.getByText("Old Earth answer")).toHaveCount(0);
});

test("missing model offers retry while notes and navigation stay usable", async ({
  page,
}) => {
  await page.route("**/models/atom.glb", (route) =>
    route.fulfill({ status: 404, body: "Missing asset" }),
  );
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Retry model" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Atom", exact: true }),
  ).toBeVisible();
  await page.unroute("**/models/atom.glb");
  await page.getByRole("button", { name: "Retry model" }).click();
  await expect(page.locator(".viewer")).toHaveAttribute("data-ready", "true");
});

test("legacy routes resolve real scenes or a proper 404", async ({
  page,
  request,
}) => {
  await page.goto("/earth");
  await expect(page).toHaveURL(/#earth$/);
  await expect(
    page.getByRole("heading", { name: "Earth", exact: true }),
  ).toBeVisible();
  expect((await request.get("/not-a-scene")).status()).toBe(404);
});

test("WebGL failure preserves science notes and navigation", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.includes("webgl")) return null;
      return original.call(this, type as "2d", ...args);
    } as typeof original;
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Retry 3D view" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Choose a scale" })
    .getByRole("button", { name: /Earth/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Earth", exact: true }),
  ).toBeVisible();
});
