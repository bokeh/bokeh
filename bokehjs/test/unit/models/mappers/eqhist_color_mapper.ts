import {expect} from "assertions"

import {EqHistColorMapper} from "@bokehjs/models/mappers/eqhist_color_mapper"

describe("EqHistColorMapper module", () => {

  describe("EqHistColorMapper.scan method", () => {

    function scan_check(values: number[], expected_binning: number[]) {
      const n = values.length
      const palette = new Array(n).fill("red")  // Colors not used but needed for constructor
      const color_mapper = new EqHistColorMapper({palette})
      const scan = color_mapper.scan(values, n)

      const sorted = values.sort()
      expect(scan.min).to.be.equal(sorted[0])
      expect(scan.max).to.be.equal(sorted[n-1])
      expect(scan.binning).to.be.similar(expected_binning, 1e-6)
    }

    it("Should scan equally-spaced values", () => {
      scan_check([1, 2, 3], [1, 1.999975, 2.999964, 3])
      scan_check([3, 2, 1], [1, 1.999975, 2.999964, 3])
      scan_check([3, 1, 2], [1, 1.999975, 2.999964, 3])
    })

    it("Should scan non-equally-spaced values", () => {
      scan_check([1, 1.001, 2], [1, 1.000994, 1.999982, 2])
      scan_check([1, 1.999, 2], [1, 1.998995, 1.999982, 2])
    })
  })
})
