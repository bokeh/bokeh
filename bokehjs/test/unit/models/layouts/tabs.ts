import {expect, expect_instanceof} from "#framework/assertions"

import {TabPanel} from "@bokehjs/models/layouts/tab_panel"
import {Tabs} from "@bokehjs/models/layouts/tabs"
import {Plot} from "@bokehjs/models/plots/plot"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Tooltip} from "@bokehjs/models/ui/tooltip"
import {range} from "@bokehjs/core/util/array"
import {enumerate} from "@bokehjs/core/util/iterator"

describe("Tabs", () => {
  function new_tabs(num_panels: number, add_tooltip: boolean = false): Tabs {
    const create_panel = (i: number) => {
      const plot = new Plot({
        x_range: new Range1d({start: 0, end: 10}),
        y_range: new Range1d({start: 0, end: 10}),
      })
      const tooltip = add_tooltip ? new Tooltip({content: `Tab #${i}`, position: "bottom_center"}) : null
      return new TabPanel({child: plot, tooltip})
    }
    const panels = range(num_panels).map(create_panel)
    return new Tabs({tabs: panels})
  }

  it("should have children matching tabs.child after initialization", () => {
    const tabs = new_tabs(1)
    expect(tabs.tabs.length).to.be.equal(1)
  })

  it("should support multiple tabs", () => {
    const tabs = new_tabs(3)
    expect(tabs.tabs.length).to.be.equal(3)
  })

  it("should accept a tooltip", () => {
    const tabs = new_tabs(2, true)
    for (const [tab, i] of enumerate(tabs.tabs)) {
      expect_instanceof(tab.tooltip, Tooltip)
      expect(tab.tooltip.content).to.be.equal(`Tab #${i}`)
    }
  })

  it("should update active tab correctly when active tab is closed", async () => {
    const {build_view} = await import("@bokehjs/core/build_views")
    const tabs = new_tabs(3)
    tabs.active = 1
    tabs.tabs[0].disabled = true
    tabs.tabs[0].closable = true
    tabs.tabs[1].closable = true
    tabs.tabs[2].closable = true

    const view = await build_view(tabs)
    view.render_to(document.body)

    const close_btns = view.shadow_el.querySelectorAll(".bk-close")
    const close_btn = close_btns[1] as HTMLElement // The second tab is active, index 1
    close_btn.click()

    expect(tabs.active).to.be.equal(1) // was index 2, now shifted to index 1
    expect(tabs.tabs.length).to.be.equal(2)
  })

  it("should handle closing the last remaining tab", async () => {
    const {build_view} = await import("@bokehjs/core/build_views")
    const tabs = new_tabs(1)
    tabs.active = 0
    tabs.tabs[0].closable = true

    const view = await build_view(tabs)
    view.render_to(document.body)

    const close_btn = view.shadow_el.querySelector(".bk-close") as HTMLElement
    close_btn.click()

    expect(tabs.active).to.be.equal(0)
    expect(tabs.tabs.length).to.be.equal(0)
  })

  it("should handle closing a tab when zero activable tabs are left", async () => {
    const {build_view} = await import("@bokehjs/core/build_views")
    const tabs = new_tabs(2)
    tabs.active = 1
    tabs.tabs[0].disabled = true
    tabs.tabs[0].closable = true
    tabs.tabs[1].closable = true

    const view = await build_view(tabs)
    view.render_to(document.body)

    const close_btns = view.shadow_el.querySelectorAll(".bk-close")
    const close_btn = close_btns[1] as HTMLElement // The second tab is active
    close_btn.click()

    expect(tabs.active).to.be.equal(0) // Falls back to 0
    expect(tabs.tabs.length).to.be.equal(1)
  })

  it("should select the 'lower' (left) tab when the 'higher' (right) tab is disabled", async () => {
    const {build_view} = await import("@bokehjs/core/build_views")
    const tabs = new_tabs(3)
    tabs.active = 1
    tabs.tabs[0].closable = true
    tabs.tabs[1].closable = true
    tabs.tabs[2].disabled = true
    tabs.tabs[2].closable = true

    const view = await build_view(tabs)
    view.render_to(document.body)

    const close_btns = view.shadow_el.querySelectorAll(".bk-close")
    const close_btn = close_btns[1] as HTMLElement // The second tab is active
    close_btn.click()

    expect(tabs.active).to.be.equal(0) // Should select index 0 because index 2 is disabled
    expect(tabs.tabs.length).to.be.equal(2)
  })

  it("should select the 'higher' (right) tab when the 'lower' (left) tab is disabled", async () => {
    const {build_view} = await import("@bokehjs/core/build_views")
    const tabs = new_tabs(3)
    tabs.active = 1
    tabs.tabs[0].disabled = true
    tabs.tabs[0].closable = true
    tabs.tabs[1].closable = true
    tabs.tabs[2].closable = true

    const view = await build_view(tabs)
    view.render_to(document.body)

    const close_btns = view.shadow_el.querySelectorAll(".bk-close")
    const close_btn = close_btns[1] as HTMLElement // The second tab is active
    close_btn.click()

    expect(tabs.active).to.be.equal(1) // Should select old index 2, which is now index 1
    expect(tabs.tabs.length).to.be.equal(2)
  })
})
