import {test, expect} from "@playwright/test"
import {AxeBuilder} from "@axe-core/playwright"
import {urls} from "./urls"

const runA11yTest = async ({page, url}) => {
  await page.goto(url)

  await page.locator("article").waitFor() // Note: This will fail for the demo examples
  const a11yScanResults = await new AxeBuilder({page}).include("article").analyze()

  expect(a11yScanResults.violations).toEqual([])
}

test("has title", async ({page}) => {
  // The Base URL was set in the playwright config file
  await page.goto("/")

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Bokeh/)
})

urls.forEach((url, index) => {
  test(`Doc example test from url ${url}`, async ({page}) => {
    await runA11yTest({page, url})
  })
})
