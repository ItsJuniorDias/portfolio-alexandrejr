import { test, expect } from "@playwright/test";
import { openFilm, rect, stepToScene } from "./support";

test("never scrolls sideways", async ({ page }) => {
  await openFilm(page);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

// Scenes 2 (Biz Store), 11 (Spotify App) and 18 (recommendation letter) cover both card layouts.
for (const scene of [2, 11, 18]) {
  test(`scene ${scene} card stays on screen and clear of the toolbar`, async ({ page }) => {
    await openFilm(page);
    await stepToScene(page, scene);
    await expect(page.locator(".coded-card")).toBeVisible();

    const card = await rect(page, ".coded-card");
    const toolbar = await rect(page, ".film-toolbar");
    const viewport = page.viewportSize()!;
    const overlaps =
      card.left < toolbar.right &&
      card.right > toolbar.left &&
      card.top < toolbar.bottom &&
      card.bottom > toolbar.top;

    expect(card.top).toBeGreaterThanOrEqual(0);
    expect(card.bottom).toBeLessThanOrEqual(viewport.height);
    expect(overlaps, `card ${JSON.stringify(card)} × toolbar ${JSON.stringify(toolbar)}`).toBe(
      false,
    );
  });
}
