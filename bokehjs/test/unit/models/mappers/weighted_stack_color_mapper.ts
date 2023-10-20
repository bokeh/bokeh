import {expect} from "assertions"

import {varying_alpha_palette} from "@bokehjs/api/palettes"
import {Float64NDArray} from "@bokehjs/core/util/ndarray"
import {EqHistColorMapper} from "@bokehjs/models/mappers/eqhist_color_mapper"
import {WeightedStackColorMapper} from "@bokehjs/models/mappers/weighted_stack_color_mapper"

describe("WeightedStackColorMapper module", () => {

  describe("WeightedStackColorMapper.rgba_mapper method", () => {
    // Synthetic data of shape (3, 3, 2), i.e. a stack of two 2D arrays of shape (3, 3) each.
    const data = [NaN, NaN, 11, 10, 14, 10, 10, 11, 11, 11, 14, 11, 10, 14, 11, 14, 14, 14]
    const array = new Float64NDArray(data, [3, 3, 2])

    function get_rgba_mapped(start_alpha: number = 40, nan_color: string = "#0000",
        rescale_discrete_levels: boolean = false, color_baseline: number | null = null) {
      const alpha_palette = varying_alpha_palette("black", 6, start_alpha)
      const alpha_mapper = new EqHistColorMapper({palette: alpha_palette, rescale_discrete_levels})
      const color_mapper = new WeightedStackColorMapper({palette: ["red", "blue"], nan_color, alpha_mapper, color_baseline})
      const rgba_mapper = color_mapper.rgba_mapper
      return Array.from(rgba_mapper.v_compute(array))  // Cannot directly compare Uint8ClampedArray
    }

    it("should support defaults", () => {
      const expected = [0, 0, 0, 0, 255, 0, 0, 40, 255, 0, 0, 169, 0, 0, 255, 40, 128, 0, 128, 40, 204, 0, 51, 212, 0, 0, 255, 169, 51, 0, 204, 212, 128, 0, 128, 255]
      expect(get_rgba_mapped()).to.be.equal(expected)
    })

    it("should support start alpha", () => {
      // Changes to alpha components that aren't 0 or 255
      const expected = [0, 0, 0, 0, 255, 0, 0, 80, 255, 0, 0, 185, 0, 0, 255, 80, 128, 0, 128, 80, 204, 0, 51, 220, 0, 0, 255, 185, 51, 0, 204, 220, 128, 0, 128, 255]
      expect(get_rgba_mapped(80)).to.be.equal(expected)
    })

    it("should support nan color", () => {
      // Changes in first color for which data is NaN
      const expected = [0, 128, 0, 255, 255, 0, 0, 40, 255, 0, 0, 169, 0, 0, 255, 40, 128, 0, 128, 40, 204, 0, 51, 212, 0, 0, 255, 169, 51, 0, 204, 212, 128, 0, 128, 255]
      expect(get_rgba_mapped(40, "green")).to.be.equal(expected)
    })

    it("should support rescale discrete levels", () => {
      // Changes to alpha components that aren't 0 or 255
      const expected = [0, 0, 0, 0, 255, 0, 0, 83, 255, 0, 0, 169, 0, 0, 255, 83, 128, 0, 128, 126, 204, 0, 51, 255, 0, 0, 255, 169, 51, 0, 204, 255, 128, 0, 128, 255]
      expect(get_rgba_mapped(40, "#0000", true)).to.be.equal(expected)
    })

    it("should support color baseline", () => {
      // Changes throughout
      const expected = [0, 0, 0, 0, 132, 0, 123, 40, 143, 0, 113, 169, 123, 0, 132, 40, 128, 0, 128, 40, 138, 0, 117, 212, 113, 0, 143, 169, 117, 0, 138, 212, 128, 0, 128, 255]
      expect(get_rgba_mapped(40, "#0000", false, -5)).to.be.equal(expected)
    })
  })
})
