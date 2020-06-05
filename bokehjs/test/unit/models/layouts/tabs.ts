import {expect} from "assertions"

import {Panel, Tabs} from "@bokehjs/models/layouts/tabs"
import {Plot} from "@bokehjs/models/plots/plot"
import {Range1d} from "@bokehjs/models/ranges/range1d"

describe("Tabs", () => {

  function new_tabs(): Tabs {
    const plot = new Plot({
      x_range: new Range1d({start: 0, end: 10}),
      y_range: new Range1d({start: 0, end: 10}),
    })
    const panel = new Panel({child: plot})
    return new Tabs({tabs: [panel]})
  }

  it("should have children matching tabs.child after initialization", () => {
    const tabs = new_tabs()
    expect(tabs.tabs.length).to.be.equal(1)
  })
})
