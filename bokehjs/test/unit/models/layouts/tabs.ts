import {expect, expect_not_null} from "assertions"
import {display} from "framework"

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
      expect_not_null(tab.tooltip)
      expect(tab.tooltip.content).to.be.equal(`Tab #${i}`)
    }
  })

  describe("scrollable headers for issue #14417", () => {
    it("should render headers_wrapper element in DOM", async () => {
      const tabs = new_tabs(5)
      const {view} = await display(tabs, [400, 300])
      
      expect_not_null(view.headers_wrapper_el)
      expect(view.headers_wrapper_el.classList.contains("bk-headers-wrapper")).to.be.true
    })

    it("should place tab headers inside headers_wrapper", async () => {
      const tabs = new_tabs(3)
      const {view} = await display(tabs, [400, 300])
      
      expect_not_null(view.headers_wrapper_el)
      expect(view.header_els.length).to.be.equal(3)
      
      // Check that all headers are children of headers_wrapper
      for (const header_el of view.header_els) {
        expect(header_el.parentElement).to.be.equal(view.headers_wrapper_el)
      }
    })

    it("should have headers_wrapper as child of header_el", async () => {
      const tabs = new_tabs(2)
      const {view} = await display(tabs, [400, 300])
      
      expect_not_null(view.header_el)
      expect_not_null(view.headers_wrapper_el)
      expect(view.headers_wrapper_el.parentElement).to.be.equal(view.header_el)
    })

    it("should apply overflow styles for horizontal tabs", async () => {
      const tabs = new_tabs(10, false)
      tabs.tabs_location = "above"
      const {view} = await display(tabs, [400, 300])
      
      expect_not_null(view.headers_wrapper_el)
      const computed = window.getComputedStyle(view.headers_wrapper_el)
      expect(computed.overflowX).to.be.equal("auto")
    })

    it("should enable scrolling when many tabs exceed container width", async () => {
      const tabs = new_tabs(20)
      tabs.width = 400
      const {view} = await display(tabs, [450, 300])
      
      expect_not_null(view.headers_wrapper_el)
      
      // scrollWidth > clientWidth means scrollbar is present
      const has_horizontal_scroll = view.headers_wrapper_el.scrollWidth > view.headers_wrapper_el.clientWidth
      expect(has_horizontal_scroll).to.be.true
    })
  })
})

