import {expect, expect_instanceof} from "#framework/assertions"
import {display} from "#framework/layouts"

import {TabPanel} from "@bokehjs/models/layouts/tab_panel"
import {Tabs} from "@bokehjs/models/layouts/tabs"
import {Plot} from "@bokehjs/models/plots/plot"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Tooltip} from "@bokehjs/models/ui/tooltip"
import {range} from "@bokehjs/core/util/array"
import {enumerate} from "@bokehjs/core/util/iterator"
import {defer} from "@bokehjs/core/util/defer"

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

  it("should retain materialized tab child views", async () => {
    const tabs = new_tabs(3)
    const {view: tabs_view} = await display(tabs, null)

    const [view0] = tabs_view.sig_child_views
    expect(view0.model).to.be.identical(tabs.tabs[0].child)

    tabs.active = 1
    await defer()

    const [retained_view0, view1] = tabs_view.sig_child_views
    expect(retained_view0).to.be.identical(view0)
    expect(view1.model).to.be.identical(tabs.tabs[1].child)

    tabs.active = 0
    await defer()

    expect(tabs_view.sig_child_views).to.be.equal([view0, view1])
    expect(view0.is_destroyed).to.be.false
    expect(view1.is_destroyed).to.be.false
  })

  it("should prune materialized tab child views when tabs and children change", async () => {
    const tabs = new_tabs(3)
    const [tab0, tab1, tab2] = tabs.tabs
    const {view: tabs_view} = await display(tabs, null)

    tabs.active = 1
    await defer()
    await tabs_view.ready

    const [view0, view1] = tabs_view.sig_child_views
    tabs.tabs = [tab1, tab2]
    await defer()
    await tabs_view.ready

    const [retained_view1, view2] = tabs_view.sig_child_views
    expect(retained_view1).to.be.identical(view1)
    expect(view0.model).to.be.identical(tab0.child)
    expect(view0.is_destroyed).to.be.true
    expect(view2.model).to.be.identical(tab2.child)

    const replacement = new Plot({
      x_range: new Range1d({start: 0, end: 10}),
      y_range: new Range1d({start: 0, end: 10}),
    })
    tab2.child = replacement
    await defer()
    await tabs_view.ready

    const [still_retained_view1, replacement_view] = tabs_view.sig_child_views
    expect(still_retained_view1).to.be.identical(view1)
    expect(view2.is_destroyed).to.be.true
    expect(replacement_view.model).to.be.identical(replacement)

    tabs.tabs = []
    await defer()
    await tabs_view.ready

    expect(tabs_view.sig_child_views).to.be.equal([])
    expect(view1.is_destroyed).to.be.true
    expect(replacement_view.is_destroyed).to.be.true

    const restored = new_tabs(2).tabs
    tabs.tabs = restored
    await defer()
    await tabs_view.ready

    expect(tabs_view.sig_child_views.map((view) => view.model)).to.be.equal([restored[1].child])
  })

  it("should eagerly materialize all tab children only when layouts are linked", async () => {
    const tabs = new_tabs(3)
    tabs.link_layouts = true
    const {view: tabs_view} = await display(tabs, null)

    const linked_views = tabs_view.sig_child_views
    expect(linked_views.map((view) => view.model)).to.be.equal(tabs.tabs.map((tab) => tab.child))

    tabs.link_layouts = false
    await defer()
    await tabs_view.ready

    expect(tabs_view.sig_child_views.map((view) => view.model)).to.be.equal([tabs.tabs[0].child])
    expect(tabs_view.sig_child_views[0]).to.be.identical(linked_views[0])
    expect(linked_views[1].is_destroyed).to.be.true
    expect(linked_views[2].is_destroyed).to.be.true

    tabs.active = 1
    await defer()
    await tabs_view.ready

    expect(tabs_view.sig_child_views.map((view) => view.model)).to.be.equal([
      tabs.tabs[0].child,
      tabs.tabs[1].child,
    ])

    tabs.link_layouts = true
    await defer()
    await tabs_view.ready

    expect(tabs_view.sig_child_views.map((view) => view.model)).to.be.equal(tabs.tabs.map((tab) => tab.child))
  })
})
