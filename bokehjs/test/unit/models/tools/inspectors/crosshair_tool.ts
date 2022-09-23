import {expect} from "assertions"

import {CrosshairTool} from "@bokehjs/models/tools/inspectors/crosshair_tool"
import {build_view} from "@bokehjs/core/build_views"

describe("CrosshairTool", () => {
  it("should add two spans to computed overlays when overlay=auto and dimensions=both", async () => {
    const crosshair = new CrosshairTool({overlay: "auto", dimensions: "both"})
    const crosshair_view = await build_view(crosshair, {parent: null})
    expect(crosshair_view.overlays.length).to.be.equal(2)
  })

  it("should add one span to computed overlays when overlay=auto and dimensions=width", async () => {
    const crosshair = new CrosshairTool({overlay: "auto", dimensions: "width"})
    const crosshair_view = await build_view(crosshair, {parent: null})
    expect(crosshair_view.overlays.length).to.be.equal(1)
  })

  it("should add one span to computed overlays when overlay=auto and dimensions=height", async () => {
    const crosshair = new CrosshairTool({overlay: "auto", dimensions: "height"})
    const crosshair_view = await build_view(crosshair, {parent: null})
    expect(crosshair_view.overlays.length).to.be.equal(1)
  })
})
