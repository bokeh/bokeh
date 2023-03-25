import {expect} from "assertions"

import {show} from "@bokehjs/api/io"
import {Plot, PlotView} from "@bokehjs/models/plots/plot"

describe("in api/plotting module", () => {
  describe("show() function", () => {
    it("must support specific view types", async () => {
      // tsc will fail with TS2740 if this doesn't produce the correct type
      const v: PlotView = await show(new Plot())
      expect(v).to.be.instanceof(PlotView)
    })
  })
})
