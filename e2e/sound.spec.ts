import { test, expect } from "@playwright/test";
import { openFilm } from "./support";

test("soundtrack is on by default and remembers when it's turned off", async ({ page }) => {
  await openFilm(page);
  const toggle = page.locator(".film-sound");
  // Browsers hold audible playback until the visitor's first gesture.
  await page.locator(".film-viewport").click({ position: { x: 12, y: 12 } });
  await expect(toggle).toHaveText("Som ligado");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  await toggle.click();
  await expect(toggle).toHaveText("Ativar som");

  await page.reload();
  await expect(page.locator(".film-viewport")).toHaveClass(/film-ready/, { timeout: 60_000 });
  await page.locator(".film-viewport").click({ position: { x: 12, y: 12 } });
  await expect(toggle).toHaveText("Ativar som");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
});
