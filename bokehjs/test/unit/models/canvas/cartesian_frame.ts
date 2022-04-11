import {expect} from "assertions"

import {CartesianFrame} from "@bokehjs/models/canvas/cartesian_frame"
import {CategoricalScale} from "@bokehjs/models/scales/categorical_scale"
import {LinearScale} from "@bokehjs/models/scales/linear_scale"
import {FactorRange} from "@bokehjs/models/ranges/factor_range"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Scale} from "@bokehjs/models/scales/scale"
import {build_view} from "@bokehjs/core/build_views"

describe("CartesianFrame", () => {

  it("should report default scales", async () => {
    const frame = new CartesianFrame({
      x_scale: new LinearScale(),
      y_scale: new LinearScale(),
      x_range: new Range1d({start: 0, end: 1}),
      y_range: new Range1d({start: 0, end: 1}),
    })

    const fv = await build_view(frame, {parent: null})

    expect(fv.x_scales.get("default")).to.be.instanceof(Scale)
    expect(fv.y_scales.get("default")).to.be.instanceof(Scale)

    expect(fv.x_scales.get("default")).to.be.equal(fv.x_scale)
    expect(fv.y_scales.get("default")).to.be.equal(fv.y_scale)
  })

  it("should throw error for incompatible numeric scale and factor range", async () => {
    const frame = new CartesianFrame({
      x_scale: new LinearScale(),
      y_scale: new LinearScale(),
      x_range: new FactorRange(),
      y_range: new Range1d(),
    })

    await expect(async () =>
      await build_view(frame, {parent: null})
    ).to.throw()
  })

  it("should throw error for incompatible factor scale and numeric range", async () => {
    const frame = new CartesianFrame({
      x_scale: new CategoricalScale(),
      y_scale: new LinearScale(),
      x_range: new Range1d(),
      y_range: new Range1d(),
    })

    await expect(async () =>
      await build_view(frame, {parent: null})
    ).to.throw()
  })
})
