import {test, expect} from "@playwright/test"
import {AxeBuilder} from "@axe-core/playwright"

const interactionURL = "en/latest/docs/examples/interaction"
const widgetSubURL = "widgets"
const jsCallbacksSubURL = "js_callbacks"
const legendsSubURL = "legends"
const linkingSubURL = "linking"

const runA11yTest = async ({page, url}) => {
  await page.goto(url)

  await page.locator("article").waitFor();
  const a11yScanResults = await new AxeBuilder({page}).include("article").analyze();

  expect(a11yScanResults.violations).toEqual([])
}

test("has title", async ({page}) => {
  // The Base URL was set in the playwright config file
  await page.goto('/')

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Bokeh/)
})

test("multiselect test", async ({page}) => {
  await runA11yTest({ page, url: `/${interactionURL}/${widgetSubURL}/multiselect.html`})
})

test("multichoice test", async ({page}) => {
  await runA11yTest({page, url: `/${interactionURL}/${widgetSubURL}/multichoice.html`})
})

test("date_picker test", async ({page}) => {
  await runA11yTest({page, url: `/${interactionURL}/${widgetSubURL}/date_picker.html`})
})

test("dropdown test", async ({page}) => {
  await runA11yTest({page, url: `/${interactionURL}/${widgetSubURL}/dropdown.html`})
})

test("data_table test", async ({page}) => {
  await runA11yTest({page, url: `/${interactionURL}/${widgetSubURL}/data_table.html`})
})

test("data_cube test", async ({page}) => {
  await runA11yTest({page, url: `/${interactionURL}/${widgetSubURL}/data_cube.html`})
})

test("js_on_event test", async ({page}) => {
  await runA11yTest({page, url: `/${interactionURL}/${jsCallbacksSubURL}/js_on_event.html`})
})

test("slider test", async ({page}) => {
  await runA11yTest({page, url: `/${interactionURL}/${jsCallbacksSubURL}/slider.html`})
})

test("customjs_lasso_mean test", async ({page}) => {
  await runA11yTest({page, url: `/${interactionURL}/${jsCallbacksSubURL}/customjs_lasso_mean.html`})
})

test("color_sliders test", async ({page}) => {
  await runA11yTest({page, url: `/${interactionURL}/${jsCallbacksSubURL}/color_sliders.html`})
})

test("legend_mute test", async ({page}) => {
  await runA11yTest({page, url: `/${interactionURL}/${legendsSubURL}/legend_mute.html`})
})

test("legend_hide test", async ({page}) => {
  await runA11yTest({page, url: `/${interactionURL}/${legendsSubURL}/legend_hide.html`})
})

test("data_table_plot test", async ({page}) => {
  await runA11yTest({page, url: `/${interactionURL}/${linkingSubURL}/data_table_plot.html`})
})

test("linked_crosshair test", async ({page}) => {
  await runA11yTest({page, url: `/${interactionURL}/${linkingSubURL}/linked_crosshair.html`})
})

test("linked_brushing test", async ({page}) => {
  await runA11yTest({page, url: `/${interactionURL}/${linkingSubURL}/linked_brushing.html`})
})

test("range_tool test", async ({page}) => {
  await runA11yTest({page, url: `/${interactionURL}/tools/range_tool.html`})
})
