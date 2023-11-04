import {expect} from "assertions"

import {EqHistColorMapper} from "@bokehjs/models/mappers/eqhist_color_mapper"

describe("EqHistColorMapper module", () => {

  describe("EqHistColorMapper.scan method", () => {

    function scan_check(values: number[], expected_binning: number[], ncolors: number = 3, rescale_discrete_levels: boolean = false, low_cutoff_index: number = 0) {
      const n = values.length
      const palette = new Array(ncolors).fill("red")  // Colors not used but needed for constructor
      const color_mapper = new EqHistColorMapper({palette, rescale_discrete_levels})
      const scan = color_mapper.scan(values, ncolors)

      let {binning} = scan
      if (low_cutoff_index > 0) {
        // Ignore values at start of binning array up to low_cutoff_index
        const n = binning.length - low_cutoff_index
        const cutoff_binning = new Array<number>(n)
        for (let i = 0; i < n; i++) {
          cutoff_binning[i] = binning[i + low_cutoff_index]
        }
        binning = cutoff_binning
      }

      const sorted = values.sort()
      if (rescale_discrete_levels) {
        expect(scan.min).to.be.similar(expected_binning[0], 1e-6)
      } else {
        expect(scan.min).to.be.equal(sorted[0])
      }
      expect(scan.max).to.be.equal(sorted[n-1])

      expect(binning).to.be.similar(expected_binning, 1e-6)
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
      scan_check(values, [1, 5.500137, 9.999519, 54.999382, 100], 4, false)
      scan_check(values, [1, 5.546049, 32.729042, 100], 4, true, 1)
    })
  })
})
