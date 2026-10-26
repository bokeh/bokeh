import {expect} from "#framework/assertions"
import {display, fig} from "#framework/layouts"

import {ScaleBar, ScaleBarView} from "@bokehjs/models/annotations/scale_bar"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import type {Range} from "@bokehjs/models/ranges/range"
import type {BBox} from "@bokehjs/core/util/bbox"
import type {Orientation, Side} from "@bokehjs/core/enums"
import type {Context2d} from "@bokehjs/core/util/canvas"
import type {PlotView} from "@bokehjs/models/plots/plot"

class InspectableScaleBarView extends ScaleBarView {
  declare model: InspectableScaleBar

  paints = 0

  protected override _paint(ctx: Context2d): void {
    this.paints++
    super._paint(ctx)
  }

  get axis_side(): Side {
    return this.axis_view.panel.side
  }

  get axis_bbox(): BBox {
    return this.axis_view.bbox
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

function pixels(plot_view: PlotView): Uint8ClampedArray {
  const {ctx, canvas: {width, height}} = plot_view.canvas_view.compose()
  return ctx.getImageData(0, 0, width, height).data
}

function mismatches(actual: Uint8ClampedArray, expected: Uint8ClampedArray): number {
  let n = 0
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] != expected[i]) {
      n++
    }
  }
  return n
}

describe("ScaleBarView", () => {
  async function scale_bar(orientation: Orientation, range: "auto" | "y_range", update?: Orientation) {
    const p = fig([400, 300], {x_range: [0, 10], y_range: [0, 1000]})
    const scale_bar = InspectableScaleBar.create({
      orientation,
      range: range == "auto" ? "auto" : p.y_range,
      location: "top_left",
    })
    p.add_layout(scale_bar)
    const {view} = await display(p)
    if (update != null) {
      scale_bar.orientation = update
      await view.ready
    }
    const scale_bar_view = view.owner.get_one(scale_bar)
    return {view, scale_bar_view}
  }

  const cases: [Orientation, Orientation][] = [
    ["vertical", "horizontal"],
    ["horizontal", "vertical"],
  ]

  for (const range of ["auto", "y_range"] as const) {
    for (const [initial, updated] of cases) {
      it(`should support changing orientation from ${initial} to ${updated} with range=${range}`, async () => {
        const {view: expected_view, scale_bar_view: expected} = await scale_bar(updated, range)
        const {view: actual_view, scale_bar_view: actual} = await scale_bar(initial, range, updated)

        expect(actual.axis_side).to.be.equal(expected.axis_side)
        expect(actual.axis_bbox).to.be.equal(expected.axis_bbox)
        expect(actual.bbox).to.be.equal(expected.bbox)

        const expected_pixels = pixels(expected_view)
        const actual_pixels = pixels(actual_view)
        expect(actual_pixels.length).to.be.equal(expected_pixels.length)
        expect(mismatches(actual_pixels, expected_pixels)).to.be.equal(0)
      })
    }
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
