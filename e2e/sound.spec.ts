import { test, expect } from "@playwright/test";
import { counter, openFilm, sceneLabel } from "./support";

test("opening hint invites a click, or a tap on touch screens", async ({ page, isMobile }) => {
  await openFilm(page);
  await expect(page.locator(".film-scroll-hint")).toHaveAccessibleName(
    `${isMobile ? "Toque" : "Clique"} para abrir as cortinas`,
  );
});

test("soundtrack is on by default and remembers when it's turned off", async ({ page }) => {
  await openFilm(page);
  const toggle = page.locator(".film-sound");
  // Browsers hold audible playback until a gesture; the opening hint is that gesture.
  await page.locator(".film-scroll-hint").click();
  await expect(toggle).toHaveText("Som ligado");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(counter(page)).toHaveText(sceneLabel(2));

  await toggle.click();
  await expect(toggle).toHaveText("Ativar som");

  // A fresh visit starts at the top; a reload would restore the scrolled scene instead.
  await openFilm(page);
  await page.locator(".film-scroll-hint").click();
  await expect(toggle).toHaveText("Ativar som");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
});
