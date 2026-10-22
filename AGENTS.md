# Holy Avenger (browser remake)

Vanilla JS remake of the RPG Maker 2003 fan game *Holy Avenger*. No RPG Maker code runs:
`tools/convert.py` turns the original project into JSON + PNG/OGG/WebM, and `js/` is this
repo's own runtime that reproduces RPG_RT's behaviour (EasyRPG Player sources were used as a
behaviour reference only; no code was copied from it).

- Runtime: plain script-tag globals, load order in `index.html`. No build step, no dependencies.
- Data: regenerate with `tools/convert.py` (see README); never hand-edit `data/` or `assets/`.
- Test hooks: `?map=ID&x=&y=`, `?battle=TROOP`, `?party=1,2`, `?seed=N` (js/debug_start.js).
- Dev server: `python3 tools/serve.py 8091` (launch.json entry `holy-avenger`).

## Testing and shipping (dev-playbook)

This repo follows the dev-playbook (`~/.claude/skills/dev-playbook/PLAYBOOK.md`).

- One gate: `scripts/check` (node unit tests + converter unittest + clean-code audit). The pre-push
  hook runs it (`git config core.hooksPath .githooks`). Never push with `--no-verify`.
- Bugs: write a failing regression test first, then fix.
- Never weaken, skip or delete a test to make it pass.
- UI changes: run the Playwright e2e (`npx playwright test`) and attach desktop (1280) + mobile (375)
  screenshots of every changed screen to the PR or final message.
- Risk class for this repo: none (a game; saves live in the player's localStorage).
  Save-format changes still need old saves to load (`tests/` save fixtures).
- No real paths, IPs, passwords or tokens in code, tests, fixtures or docs.
- Before finishing: run `/code-review` on the diff, then give the evidence package:
  summary, risk class, test results, screenshots, rollback steps.

## Clean code (dev-playbook CLEAN-CODE.md)

Language: vanilla JS (script-tag globals, ES5 style like the rest of `js/`) and Python 3 for `tools/`.
Formatter: none enforced yet; match the surrounding code, don't discuss style.

- Functions 4–20 lines. Files ≤300 lines, hard max 500. `scripts/clean-code-audit --strict` runs in
  `scripts/check` (it measures file length for JS and function length for Python).
- One responsibility per module. Layout: `js/<concern>.js`, `js/events/` (event commands),
  `js/battle/` (RPG Maker 2003 battle), `tools/rmconv/` (converter steps), `tests/`, `e2e/`.
- Names specific and searchable (<5 grep hits). Banned: `data`, `handler`, `utils`, `Manager`, `Service`
  (existing `data` fields mirror RPG Maker's own naming; don't add new ones).
- Types explicit: JSDoc `@param`/`@returns` on functions other files call; type hints on every Python `def`.
- Early returns, max 2 nested levels. Extract duplicated logic the second time it appears.
- Errors include the offending value and the expected shape
  (`ChangeClass: class 9 does not exist`).
- Comments: keep the ones you find, they carry intent. Write WHY, cite issue numbers / SHAs.
- Dependencies injected via parameters where tests need fakes (`tests/harness.mjs` loads scripts into a vm).
- Logging: plain text (browser console, CLI stderr).
- Defensive code this repo needs: none beyond input validation (a missing asset or map logs and continues).
- README has an "Architecture" section; update it when the shape changes.
- `scripts/setup` bootstraps a clean machine idempotently; `scripts/check` is the single validation command.
