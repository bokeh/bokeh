import assert from "node:assert/strict"
import {spawnSync} from "node:child_process"
import {mkdtempSync, rmSync} from "node:fs"
import {tmpdir} from "node:os"
import {join} from "node:path"
import {after, test} from "node:test"

const browsers = mkdtempSync(join(tmpdir(), "bokeh-missing-browser-"))
after(() => rmSync(browsers, {recursive: true, force: true}))

function test_info(env: NodeJS.ProcessEnv = {}, args: string[] = []): string {
  const result = spawnSync(process.execPath, ["make", "test:info", ...args], {
    env: {...process.env, BOKEH_CHROME: undefined, PLAYWRIGHT_BROWSERS_PATH: browsers, DEBUG: "pw:browser", ...env},
    encoding: "utf-8",
    timeout: 30_000,
  })
  assert.equal(result.error, undefined)
  assert.equal(result.status, 1)
  return result.stdout + result.stderr
}

void test("missing managed Chromium reports how to install it", () => {
  const output = test_info()
  assert.match(output, /managed Chromium not found/)
  assert.ok(output.includes(browsers))
  assert.match(output, /pixi run setup/)
  assert.match(output, /npx --no-install playwright-core install --with-deps --no-shell chromium/)
  assert.ok(!output.includes("<launching>"))
})

// Node is an existing executable that rejects Chrome flags immediately. This
// checks which executable reaches the launcher without requiring a browser.
function assert_override(output: string): void {
  assert.ok(output.includes(`<launching> ${process.execPath}`))
  assert.ok(!output.includes("managed Chromium not found"))
}

void test("BOKEH_CHROME overrides a missing managed browser", () => {
  assert_override(test_info({BOKEH_CHROME: process.execPath}))
})

void test("--executable takes precedence over BOKEH_CHROME", () => {
  assert_override(test_info({BOKEH_CHROME: join(browsers, "missing-override")}, [`--executable=${process.execPath}`]))
})
