// Smoke: boots over a static server, title draws, EN/PT toggles, new game reaches the map,
// the main menu opens. Screenshots land in e2e/screenshots/ as evidence.
import { test, expect } from "@playwright/test";

function collectErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  return errors;
}

async function canvasDrawn(page) {
  return page.locator("#game").evaluate((c) => {
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    for (let i = 4; i < d.length; i += 4) if (d[i] !== d[0] || d[i + 1] !== d[1] || d[i + 2] !== d[2]) return true;
    return false;
  });
}

async function waitForScene(page, name) {
  await page.waitForFunction((n) => window.Game && Game.scene() instanceof window[n], name, { timeout: 30_000 });
}

test("title, language toggle, new game and menu", async ({ page }, info) => {
  const errors = collectErrors(page);
  await page.goto("/?seed=42");
  await waitForScene(page, "SceneTitle");
  await page.waitForTimeout(600);
  expect(await canvasDrawn(page)).toBe(true);
  await page.screenshot({ path: `e2e/screenshots/${info.project.name}-title.png` });

  const help = page.locator("#help");
  const before = await page.locator("#btn-lang").innerText();
  await page.locator("#btn-lang").click();
  expect(await page.locator("#btn-lang").innerText()).not.toBe(before);
  expect(await help.textContent()).toBeTruthy();

  await page.locator("#game").click();
  await page.keyboard.press("Enter");
  await waitForScene(page, "SceneMap");
  await page.waitForTimeout(1500);
  expect(await canvasDrawn(page)).toBe(true);
  await page.screenshot({ path: `e2e/screenshots/${info.project.name}-intro.png` });

  await page.evaluate(() => { GameMap.interpreter.list = null; MessageWindow.queue = null; Game.openMenu(); });
  await waitForScene(page, "SceneMenu");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `e2e/screenshots/${info.project.name}-menu.png` });
  expect(errors).toEqual([]);
});

test("a map loaded on demand through the debug entry", async ({ page }, info) => {
  const errors = collectErrors(page);
  await page.goto("/?map=2&x=10&y=10&seed=1");
  await waitForScene(page, "SceneMap");
  await page.waitForFunction(() => GameMap.id === 2);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `e2e/screenshots/${info.project.name}-map2.png` });
  expect(errors).toEqual([]);
});
