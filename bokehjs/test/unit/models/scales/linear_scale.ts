import {expect} from "assertions"

import {LinearScale} from "@bokehjs/models/scales/linear_scale"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {NumberArray} from '@bokehjs/core/types'

describe("linear_scale module", () => {

  function mkscale(): LinearScale {
    return new LinearScale({
      source_range: new Range1d({start: 0, end: 10}),
      target_range: new Range1d({start: 20, end: 80}),
    })
  }

  describe("creation with Range1d ranges", () => {
    const scale = mkscale()

    it("should compute scale state", () => {
      expect(scale._linear_compute_state()).to.be.equal([6, 20])
    })

    it("should map values linearly", () => {
      expect(scale.compute(-1)).to.be.equal(14)
      expect(scale.compute(0)).to.be.equal(20)
      expect(scale.compute(5)).to.be.equal(50)
      expect(scale.compute(10)).to.be.equal(80)
      expect(scale.compute(11)).to.be.equal(86)
    })

    it("should vector map values linearly", () => {
      expect(scale.v_compute([-1, 0, 5, 10, 11])).to.be.equal(new NumberArray([14, 20, 50, 80, 86]))
    })

    it("should map to a NumberArray", () => {
      expect(scale.v_compute([-1, 0, 5, 10, 11])).to.be.instanceof(NumberArray)
    })

    it("should inverse map values linearly", () => {
      expect(scale.invert(14)).to.be.equal(-1)
      expect(scale.invert(20)).to.be.equal(0)
      expect(scale.invert(50)).to.be.equal(5)
      expect(scale.invert(80)).to.be.equal(10)
      expect(scale.invert(86)).to.be.equal(11)
    })

    it("should vector in inverse map values linearly", () => {
      expect(scale.v_invert([14, 20, 50, 80, 86])).to.be.equal(new NumberArray([-1, 0, 5, 10, 11]))
    })

    it("should inverse map to a NumberArray", () => {
      expect(scale.v_invert([-1, 0, 5, 10, 11])).to.be.instanceof(NumberArray)
    })
  })
})
