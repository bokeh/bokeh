import {expect} from "assertions"

import {EqHistColorMapper} from "@bokehjs/models/mappers/eqhist_color_mapper"

describe("EqHistColorMapper module", () => {

  describe("EqHistColorMapper.scan method", () => {

    function scan_check(values: number[]) {
      const n = values.length
      const palette = new Array(n).fill("red")  // Don't care what colors are
      const color_mapper = new EqHistColorMapper({palette})
      const scan = color_mapper.scan(values, n)

      const sorted = values.sort()
      expect(scan.min).to.be.equal(sorted[0])
      expect(scan.max).to.be.equal(sorted[n-1])
      expect(scan.binning[0]).to.be.equal(sorted[0])
      expect(scan.binning[n]).to.be.equal(sorted[n-1])

      for (let i = 1; i < n; i++) {
        expect(scan.binning[i]).to.be.above(sorted[i-1])
        expect(scan.binning[i]).to.be.below(sorted[i])
      }
    }

    it("Should scan equally-spaced values", () => {
      scan_check([1, 2, 3])
      scan_check([3, 2, 1])
      scan_check([3, 1, 2])
    })

    it("Should scan non-equally-spaced values", () => {
      scan_check([1, 1.001, 2])
      scan_check([1, 1.999, 2])
    })
  })
})
