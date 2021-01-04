import {expect} from "assertions"

import {CategoricalScale} from "@bokehjs/models/scales/categorical_scale"
import {LinearScale} from "@bokehjs/models/scales/linear_scale"
import {CartesianFrame} from "@bokehjs/models/canvas/cartesian_frame"
import {FactorRange} from "@bokehjs/models/ranges/factor_range"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Scale} from "@bokehjs/models/scales/scale"

describe("CartesianFrame", () => {

  it("should report default scales", () => {
    const frame = new CartesianFrame(
      new LinearScale(),
      new LinearScale(),
      new Range1d({start: 0, end: 1}),
      new Range1d({start: 0, end: 1}))

    expect(frame.x_scales.get("default")).to.be.instanceof(Scale)
    expect(frame.y_scales.get("default")).to.be.instanceof(Scale)
  })

  describe("_get_scales method", () => {
    let frame: CartesianFrame
    let frame_range: Range1d

    before_each(() => {
      frame = new CartesianFrame(
        new LinearScale(),
        new LinearScale(),
        new Range1d(),
        new Range1d())
      frame_range = new Range1d({start: 0, end: 100})
    })

    it("should return scale if defined", () => {
      // scale = new LinearScale()
      const ranges = new Map([["default", new Range1d()]])
      const scales = frame._get_scales(frame.x_scale, ranges, frame_range)
      expect(scales.get("default")).to.be.instanceof(LinearScale)
      expect(scales.get("default")!.source_range).to.be.instanceof(Range1d)
      expect(scales.get("default")!.target_range).to.be.instanceof(Range1d)
    })

    it("should throw error for incompatible numeric scale and factor range", () => {
      const ranges = new Map([["default", new FactorRange()]])
      const scale = new LinearScale()
      expect(() => frame._get_scales(scale, ranges, frame_range)).to.throw()
    })

    it("should throw error for incompatible factor scale and numeric range", () => {
      const ranges = new Map([["default", new Range1d()]])
      const scale = new CategoricalScale()
      expect(() => frame._get_scales(scale, ranges, frame_range)).to.throw()
    })
  })
})
