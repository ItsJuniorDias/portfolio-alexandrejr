import { test, expect } from "@playwright/test";
import { counter, openFilm, sceneLabel, stepToScene } from "./support";

test("scrolling plays the film forward into the next chapter", async ({ page }) => {
  await openFilm(page, { reducedMotion: false });
  await expect(counter(page)).toHaveText(sceneLabel(1));

  await page.evaluate(() =>
    window.scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * 0.05 }),
  );
  await expect(counter(page)).toHaveText(sceneLabel(2));
  await expect(page.locator(".coded-card h2")).toHaveText("Biz Store");
});

const destinations = [
  { menu: "Trajetória", scene: 2, card: "Biz Store" },
  { menu: "Projetos", scene: 11, card: "Spotify App" },
  { menu: "Indicação", scene: 18, card: "Tarcisio Bezerra" },
  { menu: "Contato ↗", scene: 19, card: null },
];

for (const { menu, scene, card } of destinations) {
  test(`menu "${menu}" jumps to scene ${scene}`, async ({ page }) => {
    await openFilm(page);
    await page
      .getByRole("navigation", { name: "Navegação principal" })
      .getByRole("button", { name: menu })
      .click();

    await expect(counter(page)).toHaveText(sceneLabel(scene));
    if (card) await expect(page.locator(".coded-card")).toContainText(card);
    else await expect(page.locator(".coded-card")).toHaveCount(0);
  });
}

test("arrows step through scenes and stop at the edges", async ({ page }) => {
  await openFilm(page);
  const previous = page.getByRole("button", { name: "Cena anterior" });
  await expect(previous).toBeDisabled();

  await stepToScene(page, 3);
  await previous.click();
  await expect(counter(page)).toHaveText(sceneLabel(2));
});

test("chapter button opens the matching program section, even between acts", async ({ page }) => {
  await openFilm(page);
  // Scene 13 is "sistemas-intro", which used to open a section that doesn't exist.
  await stepToScene(page, 13);
  await page.locator(".film-toolbar .chapter-button").click();

  const program = page.getByRole("dialog", { name: "Alexandre Junior" });
  await expect(program).toBeVisible();
  await expect(program.locator('[data-section="trajetoria"]')).toBeInViewport();

  await page.keyboard.press("Escape");
  await expect(program).toBeHidden();
});

test("program dialog opens from the menu button and closes from its close button", async ({
  page,
}) => {
  await openFilm(page);
  await page.getByRole("button", { name: "Abrir currículo completo" }).click();

  const program = page.getByRole("dialog", { name: "Alexandre Junior" });
  await expect(program).toBeVisible();
  await expect(program.getByRole("heading", { name: "Trajetória" })).toBeVisible();
  await expect(program.locator(".experience-entry")).toHaveCount(8);

  await program.getByRole("button", { name: "Fechar programa" }).click();
  await expect(program).toBeHidden();
});
