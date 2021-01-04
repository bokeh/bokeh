import {expect} from "assertions"

import {LogScale} from "@bokehjs/models/scales/log_scale"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {NumberArray} from '@bokehjs/core/types'

describe("LogScale module", () => {

  function mkscale(): LogScale {
    return new LogScale({
      source_range: new Range1d({start: 1, end: 10000}),
      target_range: new Range1d({start: 10, end: 110}),
    })
  }

  describe("_compute_state method", () => {

    it("should correctly compute the scale state", () => {
      const scale = mkscale()
      expect(scale._compute_state()).to.be.equal([ 100, 10, 9.210340371976184, 0 ])
    })
  })

  describe("compute method", () => {

    it("should map NaN values to NaN", () => {
      const scale = mkscale()
      expect(scale.compute(NaN)).to.be.NaN
    })

    it("should map infinity values to NaN", () => {
      const scale = mkscale()
      scale.source_range.start = 0
      expect(scale.compute(0)).to.be.NaN
    })

    it("should map values > start logly", () => {
      const scale = mkscale()
      expect(scale.compute(1)).to.be.equal(10)
      expect(scale.compute(10)).to.be.equal(35)
      expect(scale.compute(100)).to.be.equal(60)
      expect(scale.compute(10000)).to.be.equal(110)
    })
  })

  describe("v_compute method", () => {

    it("should vector map NaN values to NaN", () => {
      const scale = mkscale()
      expect(scale.v_compute([NaN])).to.be.equal(new NumberArray([NaN]))
    })

    it("should vector map infinity values to NaN", () => {
      const scale = mkscale()
      scale.source_range.start = 0
      expect(scale.v_compute([0])).to.be.equal(new NumberArray([NaN]))
    })

    it("should vector map values logly", () => {
      const scale = mkscale()
      expect(scale.v_compute([1, 10, 100, 10000])).to.be.equal(new NumberArray([10, 35, 60, 110]))
    })

    it("should map to a NumberArray", () => {
      const scale = mkscale()
      expect(scale.v_compute([-1, 0, 5, 10, 11])).to.be.instanceof(NumberArray)
    })
  })

  describe("invert method", () => {

    it("should inverse map values logly", () => {
      const scale = mkscale()
      const values = [-15, 10, 35, 60, 85, 110].map((v) => scale.invert(v))
      expect(values).to.be.similar([0.1, 1, 10, 100, 1000, 10000])
    })
  })

  describe("v_invert method", () => {

    it("should vector map inverse map values logly", () => {
      const scale = mkscale()
      const values = scale.v_invert([-15, 10, 35, 60, 85, 110])
      expect(values).to.be.similar(new NumberArray([0.1, 1, 10, 100, 1000, 10000]))
    })
  })
})
