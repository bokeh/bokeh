import {expect} from "assertions"

import {TabPanel} from "@bokehjs/models/layouts/tab_panel"
import {Tabs} from "@bokehjs/models/layouts/tabs"
import {Plot} from "@bokehjs/models/plots/plot"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Tooltip} from "@bokehjs/models/ui/tooltip"

describe("Tabs", () => {
  function new_tabs(numPanels: number, addTooltip: boolean = false): Tabs {
    const createPanel = () => {
      const plot = new Plot({
        x_range: new Range1d({start: 0, end: 10}),
        y_range: new Range1d({start: 0, end: 10}),
      })
      const tooltip = addTooltip ? new Tooltip({content: "test tooltip", position: "right"}) : null
      return new TabPanel({child: plot, tooltip})
    }
    const panels = Array(numPanels).map(() => createPanel())
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
    tabs.tabs.forEach(tab => {
      expect(tab.tooltip).to.not.be.null
      expect(tab.tooltip?.content).to.be.equal("test tooltip")
    })
  })
})
