import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { openFilm } from "./support";

test("serves the real film instead of a Git LFS pointer", async ({ request }) => {
  const response = await request.get("/assets/film/codigo-em-cena-no-text.mp4", {
    headers: { Range: "bytes=0-63" },
  });
  const head = (await response.body()).toString("latin1");
  const total = Number(response.headers()["content-range"]?.split("/")[1]);

  expect(response.status()).toBe(206);
  expect(head).not.toContain("git-lfs");
  expect(head.slice(4, 8)).toBe("ftyp");
  expect(total).toBeGreaterThan(10_000_000);
});

test("loads the film without runtime errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await openFilm(page);
  await expect(page.locator(".film-loading")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("offers the résumé when the film itself can't load", async ({ page }) => {
  await page.route(/codigo-em-cena-no-text\.mp4/, (route) => route.abort());
  await page.goto("/");

  const fallback = page.locator(".film-error");
  await expect(fallback).toBeVisible({ timeout: 60_000 });
  await fallback.getByRole("button", { name: "Ler o currículo" }).click();
  await expect(page.getByRole("dialog", { name: "Alexandre Junior" })).toBeVisible();
});

test("keeps the page usable when the film code fails to download", async ({ page }) => {
  await page.route(/\/assets\/FilmStage-[\w-]+\.js$/, (route) => route.abort());
  await page.goto("/");

  await expect(page.locator(".film-error")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
});

test("exposes exactly one level-one heading", async ({ page }) => {
  await openFilm(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});

test("skip link is the first stop and leads to the printable résumé", async ({ page }) => {
  await openFilm(page);
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Ler currículo sem animação" });
  await expect(skip).toBeFocused();

  await skip.click();
  await expect(page).toHaveURL(/\/content\/curriculo\.html$/);
  await expect(page.getByRole("heading", { level: 1, name: "Alexandre Junior" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Experiência profissional" })).toBeVisible();
  await expect(page.locator("article").first()).toBeVisible();
});

test("has no serious or critical accessibility violations", async ({ page }) => {
  await openFilm(page);
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = violations
    .filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length})`);

  expect(blocking).toEqual([]);
});
