import assert from "node:assert/strict"
import {readFileSync} from "node:fs"
import {join} from "node:path"
import {test} from "node:test"

import {chromium} from "playwright-core"

void test("canvas outline follows pointer and keyboard focus", async () => {
  const browser = await chromium.launch({channel: "chromium"})

  try {
    const page = await browser.newPage()
    const css = readFileSync(join(process.cwd(), "build/css/canvas.css"), "utf8")
    await page.setContent(`<style>:root { --outline-width: 2px; --outline-style: solid; --highlight-color: blue; } ${css}</style><button>Before plot</button><div class="bk-events" tabindex="0">Plot</div>`)

    const plot = page.locator(".bk-events")
    await plot.click()
    assert.equal(await plot.evaluate((el) => el.matches(":focus")), true)
    assert.equal(await plot.evaluate((el) => el.matches(":focus-visible")), false)
    assert.equal(await plot.evaluate((el) => el.ownerDocument.defaultView!.getComputedStyle(el).outlineStyle), "none")

    await page.keyboard.press("Shift+Tab")
    await page.keyboard.press("Tab")
    assert.equal(await plot.evaluate((el) => el.matches(":focus-visible")), true)
    assert.notEqual(await plot.evaluate((el) => el.ownerDocument.defaultView!.getComputedStyle(el).outlineStyle), "none")
  } finally {
    await browser.close()
  }
})
