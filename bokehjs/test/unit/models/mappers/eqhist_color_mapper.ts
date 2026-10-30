import {expect} from "#framework/assertions"

import {EqHistColorMapper} from "@bokehjs/models/mappers/eqhist_color_mapper"
import {convert_to_uint32_color} from "@bokehjs/models/mappers/color_mapper"
import {linspace} from "@bokehjs/core/util/array"

describe("EqHistColorMapper module", () => {

  describe("EqHistColorMapper.v_compute method", () => {

    function v_compute_check(data: number[], palette: string[], attrs: Partial<EqHistColorMapper.Attrs> = {}) {
      const color_mapper = EqHistColorMapper.create({palette, nan_color: "gray", ...attrs})
      const colors = [...color_mapper.v_compute(data)]

      // v_compute() uses a specialized implementation, so compare with the generic one
      const n = palette.length
      const nan_color = convert_to_uint32_color("gray")
      const low_color = convert_to_uint32_color(attrs.low_color ?? palette[0])
      const high_color = convert_to_uint32_color(attrs.high_color ?? palette[n-1])
      const expected = [...new Uint32Array(data.map((value) => {
        if (isNaN(value)) {
          return nan_color
        }
        const index = color_mapper.value_to_index(value, n)
        if (index < 0) {
          return low_color
        } else if (index >= n) {
          return high_color
        } else {
          return convert_to_uint32_color(palette[index])
        }
      }))]
      expect(colors).to.be.equal(expected)
    }

    const palette = ["#000000", "#330000", "#660000", "#990000", "#cc0000", "#ff0000"]
    const data = [NaN, -Infinity, ...linspace(-10, 10, 201), Infinity, NaN]

    it("should match value_to_index()", () => {
      v_compute_check(data, palette)
      v_compute_check(data.filter((v) => isFinite(v)), palette)
      v_compute_check(data.filter((v) => isFinite(v)), ["red"])
      v_compute_check([1, 1, 1], palette)
      v_compute_check([], palette)
    })

    it("should match value_to_index() with low and high", () => {
      const attrs = {low: -5, high: 5, low_color: "blue", high_color: "green"}
      v_compute_check(data, palette, attrs)
      v_compute_check(data, ["red"], attrs)
      v_compute_check(data, palette, {...attrs, rescale_discrete_levels: true})
    })
  })

  describe("EqHistColorMapper.scan method", () => {

    function scan_check(values: number[], expected_binning: number[], ncolors: number = 3, rescale_discrete_levels: boolean = false, low_cutoff_index: number = 0) {
      const n = values.length
      const palette = new Array(ncolors).fill("red")  // Colors not used but needed for constructor
      const color_mapper = EqHistColorMapper.create({palette, rescale_discrete_levels})
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
