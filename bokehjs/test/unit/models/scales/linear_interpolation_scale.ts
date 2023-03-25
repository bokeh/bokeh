import {expect} from "assertions"

import {LinearInterpolationScale} from "@bokehjs/models/scales/linear_interpolation_scale"
import {Range1d} from "@bokehjs/models/ranges/range1d"

describe("models/scales/linear_interpolation_scale module", () => {

  describe("LinearInterpolationScale model", () => {

    it("should support vector mapping values", () => {
      const scale = new LinearInterpolationScale({
        binning: [0, 1, 2, 300, 39999],
        source_range: new Range1d({start: 0, end: 40000}),
        target_range: new Range1d({start: 20, end: 80}),
      })

      const vs = [-1, 0, 0.5, 2, 3.95, 3.98, 40000, 50000]
      const svs = [20, 20, 27.5, 50, 50.0981559753418, 50.09966278076172, 80, 80]

      expect(scale.v_compute(vs)).to.be.similar(new Float32Array(svs))
    })
  })
})
