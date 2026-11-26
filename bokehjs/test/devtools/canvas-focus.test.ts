/// <reference lib="dom" />

import assert from "node:assert/strict"
import {join} from "node:path"
import {test} from "node:test"

import {BrowserManager, Failure} from "./browser.js"

void test("plot focus outline distinguishes pointer and keyboard input", async () => {
  const {BOKEH_TEST_CHROMIUM: executable, BOKEH_TEST_JS_DIR: js_dir} = process.env
  assert.ok(executable != null && js_dir != null, "Run node make test:canvas-focus")

  const browser = new BrowserManager(executable)
  try {
    await browser.launch()
    const page = browser.get_page()
    await page.setContent('<button id="before">Before plots</button><div id="first"></div><div id="second"></div>')
    await page.addScriptTag({path: join(js_dir, "bokeh.js")})
    await page.addScriptTag({path: join(js_dir, "bokeh-api.js")})
    const mounted = await browser.evaluate(`(async () => {
      for (const target of ["#first", "#second"]) {
        const plot = Bokeh.Plotting.figure({width: 200, height: 200, tools: "", toolbar_location: null})
        plot.scatter([1], [1])
        await Bokeh.Plotting.show(plot, target)
      }
    })()`)
    if (mounted instanceof Failure) {
      assert.fail(mounted.text)
    }

    const first = page.locator("#first .bk-events")
    const second = page.locator("#second .bk-events")
    const matches = (plot: typeof first, selector: string) => plot.evaluate((el, selector) => el.matches(selector), selector)
    const outline = (plot: typeof first) => plot.evaluate((el) => {
      const {outlineStyle, outlineOffset} = getComputedStyle(el)
      return {outlineStyle, outlineOffset}
    })

    const assert_outline = async (plot: typeof first) => {
      const {outlineStyle, outlineOffset} = await outline(plot)
      assert.notEqual(outlineStyle, "none")
      assert.equal(outlineOffset, "-1px")
    }

    await second.click()
    assert.equal(await matches(second, ":focus"), true)
    assert.equal(await matches(first, ":focus"), false)
    assert.equal(await matches(second, ":focus-visible"), false)
    assert.equal((await outline(second)).outlineStyle, "none")

    await page.locator("#before").focus()
    await page.keyboard.press("Tab")
    assert.equal(await matches(first, ":focus-visible"), true)
    await assert_outline(first)

    await page.keyboard.press("Tab")
    assert.equal(await matches(second, ":focus-visible"), true)
    await assert_outline(second)
    assert.equal(await matches(first, ":focus"), false)
  } finally {
    await browser.close()
  }
})
