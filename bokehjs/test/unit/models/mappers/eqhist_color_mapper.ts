import {expect} from "assertions"

import {EqHistColorMapper} from "@bokehjs/models/mappers/eqhist_color_mapper"

describe("EqHistColorMapper module", () => {

  describe("EqHistColorMapper.scan method", () => {

    function scan_check(values: number[], expected_binning: number[], rescale_discrete_levels: boolean = false) {
      const n = values.length
      const palette = new Array(3).fill("red")  // Colors not used but needed for constructor
      const color_mapper = new EqHistColorMapper({palette, rescale_discrete_levels})
      const scan = color_mapper.scan(values, 3)

      const sorted = values.sort()
      if (rescale_discrete_levels)
        expect(scan.min).to.be.similar(expected_binning[0], 1e-6)
      else
        expect(scan.min).to.be.equal(sorted[0])
      expect(scan.max).to.be.equal(sorted[n-1])
      expect(scan.binning).to.be.similar(expected_binning, 1e-6)
    }

    it("Should scan equally-spaced values", () => {
      scan_check([1, 2, 3], [1, 1.666662, 2.333318, 3])
      scan_check([3, 2, 1], [1, 1.666662, 2.333318, 3])
      scan_check([3, 1, 2], [1, 1.666662, 2.333318, 3])
    })

    it("Should scan non-equally-spaced values", () => {
      scan_check([1, 1.001, 2], [1, 1.000669, 1.333997, 2])
      scan_check([1, 1.999, 2], [1, 1.666002, 1.999331, 2])
    })

    it("Should scan using rescale_discrete_levels", () => {
      const values = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 100]
      scan_check(values, [1, 6.999931, 39.999428, 100], false)
      scan_check(values, [-47.993395, 1.061971, 10.305641, 100], true)
    })
  })
})
