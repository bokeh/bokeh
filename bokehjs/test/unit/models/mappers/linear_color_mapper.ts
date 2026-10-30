import {expect} from "#framework/assertions"

import {convert_to_uint32_color, convert_to_uint32_palette} from "@bokehjs/models/mappers/color_mapper"
import {LinearColorMapper} from "@bokehjs/models/mappers/linear_color_mapper"
import {linspace} from "@bokehjs/core/util/array"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {Scatter} from "@bokehjs/models/glyphs/scatter"

describe("LinearColorMapper module", () => {

  describe("LinearColorMapper.v_compute method", () => {

    it("Should map values along linear scale with high/low unset", () => {
      const palette = ["red", "green", "blue"]
      const color_mapper = LinearColorMapper.create({palette})

      const vals0 = color_mapper.v_compute([99.999, 67, 50, 32, 0.0001])
      expect(vals0).to.be.equal(convert_to_uint32_palette(["blue", "blue", "green", "red", "red"]))

      const vals1 = color_mapper.v_compute([0.0001, 32, 50, 67, 99.999])
      expect(vals1).to.be.equal(convert_to_uint32_palette(["red", "red", "green", "blue", "blue"]))

      const vals2 = color_mapper.v_compute([1, 2, 3])
      expect(vals2).to.be.equal(convert_to_uint32_palette(["red", "green", "blue"]))

      const vals3 = color_mapper.v_compute([3, 2, 1])
      expect(vals3).to.be.equal(convert_to_uint32_palette(["blue", "green", "red"]))

      const vals4 = color_mapper.v_compute([0, 1, 2])
      expect(vals4).to.be.equal(convert_to_uint32_palette(["red", "green", "blue"]))

      const vals5 = color_mapper.v_compute([2, 1, 0])
      expect(vals5).to.be.equal(convert_to_uint32_palette(["blue", "green", "red"]))

      const vals6 = color_mapper.v_compute([-1, 0, 1])
      expect(vals6).to.be.equal(convert_to_uint32_palette(["red", "green", "blue"]))

      const vals7 = color_mapper.v_compute([1, 0, -1])
      expect(vals7).to.be.equal(convert_to_uint32_palette(["blue", "green", "red"]))
    })

    it("Should map values along linear scale with high/low set", () => {
      const palette = ["red", "green", "blue"]
      const color_mapper = LinearColorMapper.create({low: 1, high: 3, palette})

      const vals = color_mapper.v_compute([1, 2, 3])
      expect(vals).to.be.equal(convert_to_uint32_palette(["red", "green", "blue"]))
    })

    it("Should map values along linear scale with high/low set in other direction", () => {
      const palette = ["red", "green", "blue"]
      const color_mapper = LinearColorMapper.create({low: 3, high: 1, palette})

      const vals = color_mapper.v_compute([1, 2, 3])
      expect(vals).to.be.equal(convert_to_uint32_palette(["blue", "green", "red"]))
    })

    it("Should map data below low value to low", () => {
      const palette = ["red", "green", "blue"]
      const color_mapper = LinearColorMapper.create({low: 1, high: 3, palette})

      const vals = color_mapper.v_compute([0, 1, 2])
      expect(vals).to.be.equal(convert_to_uint32_palette(["red", "red", "green"]))
    })

    it("Should map data above high value to high", () => {
      const palette = ["red", "green", "blue"]
      const color_mapper = LinearColorMapper.create({low: 1, high: 3, palette})

      const vals = color_mapper.v_compute([2, 3, 4])
      expect(vals).to.be.equal(convert_to_uint32_palette(["green", "blue", "blue"]))
    })

    it("Should map data NaN to nan_color value", () => {
      const palette = ["red", "green", "blue"]
      const color_mapper = LinearColorMapper.create({low: 1, high: 3, palette, nan_color: "gray"})

      const vals = color_mapper.v_compute([1, NaN, 3])
      expect(vals).to.be.equal(convert_to_uint32_palette(["red", "gray", "blue"]))
    })

    it("Should map data NaN to nan_color value when high/low not set", () => {
      const palette = ["red", "green", "blue"]
      const color_mapper = LinearColorMapper.create({palette, nan_color: "gray"})

      const vals = color_mapper.v_compute([1, NaN, 3])
      expect(vals).to.be.equal(convert_to_uint32_palette(["red", "gray", "blue"]))
    })

    it("Should map high/low values to high_color/low_color, if provided", () => {
      const palette = ["red", "green", "blue"]
      const color_mapper = LinearColorMapper.create({low: 0, high: 2, palette, low_color: "pink", high_color: "orange"})

      const vals = color_mapper.v_compute([-1, 0, 1, 2, 3])
      expect(vals).to.be.equal(convert_to_uint32_palette(["pink", "red", "green", "blue", "orange"]))
    })

    it("should treat nulls as NaNs", () => {
      const palette = ["red", "green", "blue"]
      const color_mapper = LinearColorMapper.create({palette, nan_color: "gray"})
      const vals = color_mapper.v_compute([10, null, 20, 30, null])
      expect(vals).to.be.equal(convert_to_uint32_palette(["red", "gray", "green", "blue", "gray"]))
      expect(color_mapper.metrics.min).to.be.equal(10)
      expect(color_mapper.metrics.max).to.be.equal(30)
    })

    function renderer_of(data: {[key: string]: unknown[]}): GlyphRenderer {
      const data_source = ColumnDataSource.create({data})
      const renderer = GlyphRenderer.create({data_source, glyph: Scatter.create()})
      renderer.view.compute_indices(data_source)
      return renderer
    }

    it("should scan all columns of the domain", () => {
      const renderer = renderer_of({a: [1, null, 3], b: [[10, 20], [30], [-5]]})
      const palette = ["red", "green"]
      const color_mapper = LinearColorMapper.create({palette, domain: [[renderer, ["a", "b"]]]})
      expect(color_mapper.metrics.min).to.be.equal(-5)
      expect(color_mapper.metrics.max).to.be.equal(30)
    })

    it("should scan a single column of the domain", () => {
      const renderer = renderer_of({a: [1, null, 3]})
      const palette = ["red", "green"]
      const color_mapper = LinearColorMapper.create({palette, domain: [[renderer, "a"]]})
      expect(color_mapper.metrics.min).to.be.equal(1)
      expect(color_mapper.metrics.max).to.be.equal(3)
    })

    function v_compute_check(data: number[], palette: string[], attrs: Partial<LinearColorMapper.Attrs> = {}) {
      const color_mapper = LinearColorMapper.create({palette, nan_color: "gray", ...attrs})
      const colors = [...color_mapper.v_compute(data)]

      // v_compute() uses a specialized implementation, so compare with the generic one
      const n = palette.length
      const uint32_palette = convert_to_uint32_palette(palette)
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
          return uint32_palette[index]
        }
      }))]
      expect(colors).to.be.equal(expected)
    }

    const palette = ["#000000", "#330000", "#660000", "#990000", "#cc0000", "#ff0000"]
    const data = [NaN, -Infinity, ...linspace(-10, 10, 201), Infinity, NaN]
    const finite_data = data.filter((v) => isFinite(v))

    it("should match value_to_index()", () => {
      v_compute_check(data, palette)
      v_compute_check(finite_data, palette)
      v_compute_check(finite_data, ["red"])
      v_compute_check([1, 1, 1], palette)
      v_compute_check([], palette)
    })

    it("should match value_to_index() with low and high", () => {
      const attrs = {low_color: "blue", high_color: "green"}
      v_compute_check(data, palette, {...attrs, low: -5, high: 5})
      v_compute_check(data, ["red"], {...attrs, low: -5, high: 5})
      v_compute_check(data, palette, {...attrs, low: 5, high: -5})
      v_compute_check(data, palette, {...attrs, low: 5, high: 5})
      v_compute_check(data, palette, {...attrs, low: -5})
      v_compute_check(data, palette, {...attrs, high: 5})
    })
  })
})
