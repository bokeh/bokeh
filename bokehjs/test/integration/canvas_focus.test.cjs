const assert = require("node:assert/strict")
const {readFileSync} = require("node:fs")
const {join} = require("node:path")
const {test} = require("node:test")

const {chromium} = require("playwright-core")

test("canvas outline follows pointer and keyboard focus", async () => {
  const browser = await chromium.launch({
    executablePath: process.env.BOKEH_CHROME ?? chromium.executablePath(),
  })

  try {
    const page = await browser.newPage()
    const css = readFileSync(join(__dirname, "../../build/css/canvas.css"), "utf8")
    await page.setContent(`<style>:root { --outline-width: 2px; --outline-style: solid; --highlight-color: blue; } ${css}</style><button>Before plot</button><div class="bk-events" tabindex="0">Plot</div>`)

    const plot = page.locator(".bk-events")
    await plot.click()
    assert.equal(await plot.evaluate((el) => el.matches(":focus")), true)
    assert.equal(await plot.evaluate((el) => el.matches(":focus-visible")), false)
    assert.equal(await plot.evaluate((el) => getComputedStyle(el).outlineStyle), "none")

    await page.keyboard.press("Shift+Tab")
    await page.keyboard.press("Tab")
    assert.equal(await plot.evaluate((el) => el.matches(":focus-visible")), true)
    assert.notEqual(await plot.evaluate((el) => getComputedStyle(el).outlineStyle), "none")
  } finally {
    await browser.close()
  }
})
