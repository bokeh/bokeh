import {expect} from "assertions"

import {CrosshairTool} from "@bokehjs/models/tools/inspectors/crosshair_tool"

describe("Crosshair Tool", () => {

  describe("Model", () => {

    it("should add two new spans to the plot computed_overlays", () => {
      const crosshair = new CrosshairTool()
      const spans = [crosshair.spans.width, crosshair.spans.height]
      // Plot canvas should now have the two cross hair span renderers
      expect(crosshair.computed_overlays).to.be.equal(spans)
    })
  })
})
