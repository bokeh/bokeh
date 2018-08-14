import {expect} from "chai"

import {Panel, Tabs} from "models/layouts/tabs"
import {Plot} from "models/plots/plot"
import {Toolbar} from "models/tools/toolbar"
import {DataRange1d} from "models/ranges/data_range1d"

describe("Tabs", () => {

  function new_tabs() {
    const plot = new Plot({
      x_range: new DataRange1d(),
      y_range: new DataRange1d(),
      toolbar: new Toolbar(),
    })
    const panel = new Panel({child: plot})
    return new Tabs({tabs: [panel]})
  }

  it("should have children matching tabs.child after initialization", () => {
    const tabs = new_tabs()
    expect(tabs.tabs.length).to.be.equal(1)
  })
})
