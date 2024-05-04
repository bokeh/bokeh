import {expect} from "assertions"

import {CategoricalScale} from "@bokehjs/models/scales/categorical_scale"
import {LinearScale} from "@bokehjs/models/scales/linear_scale"
import {CartesianFrame} from "@bokehjs/models/canvas/cartesian_frame"
import {FactorRange} from "@bokehjs/models/ranges/factor_range"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {build_view} from "@bokehjs/core/build_views"
import {BBox} from "@bokehjs/core/util/bbox"

describe("CartesianFrame", () => {

  async function build_frame(frame: CartesianFrame) {
    const frame_view = await build_view(frame, {parent: null})
    frame_view.set_geometry(new BBox({x: 0, y: 0, width: 100, height: 100}))
    return frame_view
  }

  it("should report default scales", async () => {
    const frame = new CartesianFrame({
      x_range: new Range1d({start: 0, end: 1}),
      y_range: new Range1d({start: 0, end: 1}),
      x_scale: new LinearScale(),
      y_scale: new LinearScale(),
    })

    const frame_view = await build_frame(frame)
    const {x_scales, y_scales} = frame_view

    expect(x_scales.get("default")).to.be.instanceof(LinearScale)
    expect(x_scales.get("default")?.source_range).to.be.instanceof(Range1d)
    expect(x_scales.get("default")?.target_range).to.be.instanceof(Range1d)

    expect(y_scales.get("default")).to.be.instanceof(LinearScale)
    expect(y_scales.get("default")?.source_range).to.be.instanceof(Range1d)
    expect(y_scales.get("default")?.target_range).to.be.instanceof(Range1d)
  })

  it("should throw an error for incompatible numeric scale and factor range", async () => {
    const frame = new CartesianFrame({
      x_range: new FactorRange({factors: ["x", "y", "z"]}),
      y_range: new Range1d(),
      x_scale: new LinearScale(),
      y_scale: new LinearScale(),
    })

    expect(async () => await build_frame(frame)).to.throw(Error, "'FactorRange' is incompatible 'LinearScale'")
  })

  it("should throw an error for incompatible factor scale and numeric range", () => {
    const frame = new CartesianFrame({
      x_range: new Range1d(),
      y_range: new Range1d(),
      x_scale: new CategoricalScale(),
      y_scale: new LinearScale(),
    })

    expect(async () => await build_frame(frame)).to.throw(Error, "'Range1d' is incompatible 'CategoricalScale'")
  })
})
