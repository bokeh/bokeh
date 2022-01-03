import {expect} from "assertions"

import {LayoutDOM} from "@bokehjs/models/layouts/layout_dom"
import {ToolbarBox} from "@bokehjs/models/tools/toolbar_box"

describe("ToolbarBox", () => {

  it("should be an instance of LayoutDOM", () => {
    const box = new ToolbarBox()
    expect(box).to.be.instanceof(LayoutDOM)
  })
})
