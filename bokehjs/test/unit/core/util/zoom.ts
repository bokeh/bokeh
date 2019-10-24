import {expect} from "assertions"

import * as zoom from "@bokehjs/core/util/zoom"

import {Range1d} from "@bokehjs/models/ranges/range1d"
import {FactorRange} from "@bokehjs/models/ranges/factor_range"
import {CategoricalScale} from "@bokehjs/models/scales/categorical_scale"

describe("zoom module", () => {

  describe("scale_highlow", () => {

    it("should scale continuous ranges around average center if no center is provided", () => {
      const r = new Range1d({start: 10, end: 20})
      expect(zoom.scale_highlow(r, 0.1)).to.be.equal([10.5, 19.5])
      expect(zoom.scale_highlow(r, -0.1)).to.be.equal([9.5, 20.5])
      expect(zoom.scale_highlow(r, 0)).to.be.equal([10, 20])
    })

    it("should scale continuous ranges around given center if center is provided", () => {
      const r = new Range1d({start: 10, end: 20})
      expect(zoom.scale_highlow(r, 0.1, 12)).to.be.equal([10.2, 19.2])
      expect(zoom.scale_highlow(r, -0.1, 12)).to.be.equal([9.8, 20.8])
      expect(zoom.scale_highlow(r, 0, 12)).to.be.equal([10, 20])
    })

    it("should scale factor ranges around average center if no center is provided", () => {
      const r = new FactorRange({factors: ['a', 'b', 'c', 'd', 'e'], range_padding: 0})
      expect(zoom.scale_highlow(r, 0.1)).to.be.equal([0.25, 4.75])
      expect(zoom.scale_highlow(r, -0.1)).to.be.equal([-0.25, 5.25])
      expect(zoom.scale_highlow(r, 0)).to.be.equal([0.0, 5.0])
    })

    it("should scale factor ranges around given center if center is provided", () => {
      const r = new FactorRange({factors: ['a', 'b', 'c', 'd', 'e'], range_padding: 0})
      expect(zoom.scale_highlow(r, 0.1, 2)).to.be.equal([0.2, 4.7])
      expect(zoom.scale_highlow(r, -0.1, 2)).to.be.equal([-0.2, 5.3])
      expect(zoom.scale_highlow(r, 0, 2)).to.be.equal([0, 5])
    })
  })

  describe("get_info", () => {

    it("should work with categorical scales", () => {
      const cm = new CategoricalScale({
        source_range: new FactorRange({factors: ['foo', 'bar', 'baz'], range_padding: 0}),
        target_range: new Range1d({start: 20, end: 80}),
      })
      const info0 = zoom.get_info(new Map([["foo", cm]]), [20, 80])
      expect(info0).to.be.equal(new Map([["foo", {start: 0, end: 3}]]))

      const info1 = zoom.get_info(new Map([["foo", cm]]), [50, 60])
      expect(info1).to.be.equal(new Map([["foo", {start: 1.5, end: 2}]]))
    })
  })
})
