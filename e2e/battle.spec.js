// RPG Maker 2003 battle: ATB command input, an attack, auto battle to victory, and a scripted
// boss page (troop 88) that ends the battle with TerminateBattle. Screenshots as evidence.
import { test, expect } from "@playwright/test";

function collectErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  return errors;
}
const shot = (page, info, name) => page.screenshot({ path: `e2e/screenshots/${info.project.name}-${name}.png` });
async function tap(page, key) { await page.keyboard.down(key); await page.waitForTimeout(60); await page.keyboard.up(key); }

test("attack through the command window, then auto battle to victory", async ({ page }, info) => {
  const errors = collectErrors(page);
  await page.goto("/?battle=1&seed=3&party=1,2,3,4");
  await page.waitForFunction(() => Game.battleScene && Game.battleScene.input.phase === "options", null, { timeout: 30_000 });
  await page.waitForTimeout(400);
  await shot(page, info, "battle-options");
  await tap(page, "Enter");
  await page.waitForFunction(() => Game.battleScene.input.phase === "command", null, { timeout: 30_000 });
  await shot(page, info, "battle-command");
  await tap(page, "Enter");
  await page.waitForFunction(() => Game.battleScene.input.phase === "enemy");
  await shot(page, info, "battle-target");
  await tap(page, "Enter");
  await page.waitForFunction(() => Game.battleScene.turn >= 1, null, { timeout: 30_000 });

  await page.evaluate(() => { Game.battleScene.input.showOptions(true); Game.battleScene.input.onOption(1); });
  await page.waitForFunction(() => Game.battleScene.activeEnemies().length === 0, null, { timeout: 60_000 });
  await page.waitForTimeout(1800);
  await shot(page, info, "battle-victory");
  for (let i = 0; i < 8 && (await page.evaluate(() => !window.__lastBattleResult)); i++) { await tap(page, "Enter"); await page.waitForTimeout(400); }
  await page.waitForFunction(() => window.__lastBattleResult === "victory", null, { timeout: 20_000 });
  expect(await page.evaluate(() => Party.gold)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test("boss page at half HP plays its scene and terminates the battle", async ({ page }, info) => {
  const errors = collectErrors(page);
  await page.goto("/?battle=88&seed=5&party=1,2,3,4");
  await page.waitForFunction(() => Game.battleScene && Game.battleScene.input.phase === "options", null, { timeout: 30_000 });
  await page.evaluate(() => { Game.battleScene.enemies[0].hp = 150; Game.battleScene.runPages("after", null); });
  await page.waitForFunction(() => MessageWindow.busy(), null, { timeout: 10_000 });
  await shot(page, info, "battle-event-message");
  for (let i = 0; i < 80 && (await page.evaluate(() => !window.__lastBattleResult)); i++) { await tap(page, "Enter"); await page.waitForTimeout(350); }
  expect(await page.evaluate(() => window.__lastBattleResult)).toBe("abort");
  expect(errors).toEqual([]);
});

test("a boss killed in one blow gives a victory, not its 'half HP' TerminateBattle page", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/?battle=110&seed=2&party=1,2,3,4");
  await page.waitForFunction(() => Game.battleScene && Game.battleScene.input.phase === "options", null, { timeout: 30_000 });
  await page.evaluate(() => {
    BattleRules.normalDamage = () => 9999;   // every hit kills from full HP
    Game.battleScene.input.onOption(1);
  });
  for (let i = 0; i < 60 && (await page.evaluate(() => !window.__lastBattleResult)); i++) { await tap(page, "Enter"); await page.waitForTimeout(400); }
  expect(await page.evaluate(() => window.__lastBattleResult)).toBe("victory");
  expect(errors).toEqual([]);
});
