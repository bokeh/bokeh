import {expect} from "assertions"

import {CrosshairTool} from "@bokehjs/models/tools/inspectors/crosshair_tool"
import {build_view} from "@bokehjs/core/build_views"

describe("Crosshair Tool", () => {
  it("should add two new spans to the plot computed_overlays", async () => {
    const crosshair = new CrosshairTool()
    const crosshair_view = await build_view(crosshair, {parent: null})
    const spans = [crosshair.spans.width, crosshair.spans.height]
    expect(crosshair_view.overlays).to.be.equal(spans)
  })
})
