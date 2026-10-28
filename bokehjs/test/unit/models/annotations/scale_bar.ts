import {expect} from "#framework/assertions"
import {display, fig} from "#framework/layouts"

import {ScaleBar, ScaleBarView} from "@bokehjs/models/annotations/scale_bar"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import type {Range} from "@bokehjs/models/ranges/range"
import type {Orientation} from "@bokehjs/core/enums"
import type {Context2d} from "@bokehjs/core/util/canvas"

class InspectableScaleBarView extends ScaleBarView {
  declare model: InspectableScaleBar

  paints = 0

  protected override _paint(ctx: Context2d): void {
    this.paints++
    super._paint(ctx)
  }

  get resolved_range(): Range {
    return this.range
  }
}

class InspectableScaleBar extends ScaleBar {
  declare __view_type__: InspectableScaleBarView

  static {
    this.prototype.default_view = InspectableScaleBarView
  }
}

describe("ScaleBarView", () => {
  async function scale_bar(orientation: Orientation, range: "auto" | "y_range") {
    const p = fig([400, 300], {x_range: [0, 10], y_range: [0, 1000]})
    const scale_bar = InspectableScaleBar.create({
      orientation,
      range: range == "auto" ? "auto" : p.y_range,
      location: "top_left",
    })
    p.add_layout(scale_bar)
    const {view} = await display(p)
    const scale_bar_view = view.owner.get_one(scale_bar)
    return {view, scale_bar_view}
  }

  it("should resolve range='auto' from the current orientation", async () => {
    const {view, scale_bar_view} = await scale_bar("horizontal", "auto")
    const {x_range, y_range} = view.frame
    expect(scale_bar_view.resolved_range).to.be.equal(x_range)

    scale_bar_view.model.orientation = "vertical"
    await view.ready
    expect(scale_bar_view.resolved_range).to.be.equal(y_range)

    scale_bar_view.model.orientation = "horizontal"
    await view.ready
    expect(scale_bar_view.resolved_range).to.be.equal(x_range)
  })

  it("should follow changes to the range property", async () => {
    const {view, scale_bar_view} = await scale_bar("horizontal", "y_range")
    const r0 = Range1d.create({start: 0, end: 10})
    const r1 = Range1d.create({start: 0, end: 10})

    scale_bar_view.model.range = r0
    await view.ready
    expect(scale_bar_view.resolved_range).to.be.equal(r0)

    scale_bar_view.model.range = r1
    await view.ready
    expect(scale_bar_view.resolved_range).to.be.equal(r1)

    const {paints} = scale_bar_view
    r0.end = 20
    await view.ready
    expect(scale_bar_view.paints).to.be.equal(paints)

    r1.end = 20
    await view.ready
    expect(scale_bar_view.paints).to.be.above(paints)
  })
})
