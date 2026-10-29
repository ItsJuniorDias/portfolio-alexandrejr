import { expect, type Page } from "@playwright/test";

export const SCENES = 19;

// Reduced motion makes navigation jump straight to the chapter, so assertions don't wait for playback.
export async function openFilm(page: Page, { reducedMotion = true } = {}) {
  await page.emulateMedia({ reducedMotion: reducedMotion ? "reduce" : "no-preference" });
  await page.goto("/");
  await expect(page.locator(".film-viewport")).toHaveClass(/film-ready/, { timeout: 60_000 });
  await expect(page.locator(".film-error")).toHaveCount(0);
}

export const sceneLabel = (scene: number) => `${String(scene).padStart(2, "0")} / ${SCENES}`;

export const counter = (page: Page) => page.locator(".film-navigation span");

export async function stepToScene(page: Page, scene: number) {
  const next = page.getByRole("button", { name: "Próxima cena" });
  const current = Number((await counter(page).textContent())?.split("/")[0]);

  for (let target = current + 1; target <= scene; target++) {
    await next.click();
    await expect(counter(page)).toHaveText(sceneLabel(target));
  }
}

export function rect(page: Page, selector: string) {
  return page
    .locator(selector)
    .first()
    .evaluate((element) => {
      const { left, top, right, bottom } = element.getBoundingClientRect();
      return { left, top, right, bottom };
    });
}
