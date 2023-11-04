import {expect, expect_not_null} from "assertions"

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
})
