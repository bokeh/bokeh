import {expect} from "assertions"

import {CrosshairTool} from "@bokehjs/models/tools/inspectors/crosshair_tool"

describe("Crosshair Tool", () => {

  describe("Model", () => {

    it("should add two new spans to the plot synthetic_renderers", () => {
      const crosshair = new CrosshairTool()
      const spans = [crosshair.spans.width, crosshair.spans.height]
      // Plot canvas should now have the two cross hair span renderers
      expect(crosshair.synthetic_renderers).to.be.equal(spans)
    })
  })
})
