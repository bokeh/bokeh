import {expect} from "#framework/assertions"

import {convert_to_uint32_palette} from "@bokehjs/models/mappers/color_mapper"
import {LinearColorMapper} from "@bokehjs/models/mappers/linear_color_mapper"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {Scatter} from "@bokehjs/models/glyphs/scatter"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {IndexedSubset} from "@bokehjs/models/sources/indexed_subset"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import {Indices} from "@bokehjs/core/types"

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
  })

  describe("LinearColorMapper with a domain", () => {

    it("Should not throw when a domain renderer's source is emptied (issue #15829)", () => {
      const domain_source = ColumnDataSource.create({data: {x: [0, 1], y: [0, 1], value: [10, 20]}})
      const domain_renderer = GlyphRenderer.create({
        data_source: domain_source,
        glyph: Scatter.create({x: 0, y: 0}),
      })
      domain_renderer.view.compute_indices(domain_source)

      const palette = ["red", "green", "blue"]
      const color_mapper = LinearColorMapper.create({palette, domain: [[domain_renderer, "value"]]})
      expect(color_mapper.metrics.min).to.be.equal(10)
      expect(color_mapper.metrics.max).to.be.equal(20)

      // Emptying the source leaves stale indices on the renderer's view until
      // the view recomputes them; _collect() must drop out-of-range rows instead
      // of collecting undefined values and throwing (issue #15829).
      domain_source.data = {x: [], y: [], value: []}
      expect(() => color_mapper.update_data()).to.not.throw()

      // Refilling with recomputed indices recovers the scan: the low/high
      // range follows the new data and colors map from it again.
      domain_source.data = {x: [0, 1], y: [0, 1], value: [5, 15]}
      domain_renderer.view.compute_indices(domain_source)
      color_mapper.update_data()
      expect(color_mapper.metrics.min).to.be.equal(5)
      expect(color_mapper.metrics.max).to.be.equal(15)
      expect(color_mapper.v_compute([5, 15])).to.be.equal(convert_to_uint32_palette(["red", "blue"]))
    })

    it("Should keep valid rows while filtered indices are stale after a source shrink (issue #15829)", () => {
      const domain_source = ColumnDataSource.create({data: {x: [0, 1, 2, 3, 4], y: [0, 1, 2, 3, 4], value: [10, 20, 30, 40, 50]}})
      const domain_renderer = GlyphRenderer.create({
        data_source: domain_source,
        glyph: Scatter.create({x: 0, y: 0}),
        view: IndexedSubset.create({filter: IndexFilter.create({indices: [0, 4]})}),
      })
      domain_renderer.view.compute_indices(domain_source)
      expect([...domain_renderer.view.indices.ones()]).to.be.equal([0, 4])
      expect(domain_renderer.view.indices.size).to.be.equal(5)

      const palette = ["red", "green", "blue"]
      const color_mapper = LinearColorMapper.create({palette, domain: [[domain_renderer, "value"]]})
      expect(color_mapper.metrics.min).to.be.equal(10)
      expect(color_mapper.metrics.max).to.be.equal(50)

      // Keep row 0 in the interim scan even though the stale set bit at
      // index 4 points past the new two-row column.
      domain_source.data = {x: [0, 1], y: [0, 1], value: [7, 8]}
      expect(() => color_mapper.update_data()).to.not.throw()
      // update_data() scans the domain but does not recompute the view's
      // indices, so this still exercises the stale state before recomputation.
      expect([...domain_renderer.view.indices.ones()]).to.be.equal([0, 4])
      expect(domain_renderer.view.indices.size).to.be.equal(5)
      expect(color_mapper.metrics.min).to.be.equal(7)
      expect(color_mapper.metrics.max).to.be.equal(7)
      const interim_metrics = {...color_mapper.metrics}

      // Recomputing on the shorter source drops the out-of-range filter index
      // 4 (BitSet.set() ignores it with a warning); the scan then follows the
      // surviving subset rows only.
      domain_renderer.view.compute_indices(domain_source)
      color_mapper.update_data()
      expect([...domain_renderer.view.indices.ones()]).to.be.equal([0])
      expect(color_mapper.metrics).to.be.equal(interim_metrics)
      expect(color_mapper.metrics.min).to.be.equal(7)
      expect(color_mapper.metrics.max).to.be.equal(7)
    })

    it("Should not throw when the view's mask is stale after the source is emptied (issue #15829)", () => {
      const domain_source = ColumnDataSource.create({data: {x: [0, 1], y: [0, 1], value: [10, 20]}})
      const domain_renderer = GlyphRenderer.create({
        data_source: domain_source,
        glyph: Scatter.create({x: 0, y: 0}),
      })
      domain_renderer.view.compute_indices(domain_source)

      const palette = ["red", "green", "blue"]
      const color_mapper = LinearColorMapper.create({palette, domain: [[domain_renderer, "value"]]})
      expect(color_mapper.metrics.min).to.be.equal(10)
      expect(color_mapper.metrics.max).to.be.equal(20)

      // Right after the source is emptied, the view's indices may already be
      // recomputed while the mask still describes the old rows (the real-world
      // ordering in issue #15829); _collect() must ignore the out-of-range
      // mask entries instead of collecting undefined values and throwing.
      domain_renderer.view.masked = Indices.all_set(2)
      domain_source.data = {x: [], y: [], value: []}
      domain_renderer.view.compute_indices(domain_source)
      expect(() => color_mapper.update_data()).to.not.throw()
    })

    it("Should not throw when the source's selection is stale after the source is emptied (issue #15829)", () => {
      const domain_source = ColumnDataSource.create({data: {x: [0, 1], y: [0, 1], value: [10, 20]}})
      const domain_renderer = GlyphRenderer.create({
        data_source: domain_source,
        glyph: Scatter.create({x: 0, y: 0}),
      })
      domain_renderer.view.compute_indices(domain_source)

      const palette = ["red", "green", "blue"]
      const color_mapper = LinearColorMapper.create({palette, domain: [[domain_renderer, "value"]]})
      expect(color_mapper.metrics.min).to.be.equal(10)
      expect(color_mapper.metrics.max).to.be.equal(20)

      // A selection made on the old rows lives on the source and survives the
      // data change, so it can still reference rows the emptied source no
      // longer has; _collect() must ignore the out-of-range selection indices
      // instead of collecting undefined values and throwing (issue #15829).
      // The selection is set after the view recomputes so this test isolates
      // the stale-selection path from the stale-indices one.
      domain_source.data = {x: [], y: [], value: []}
      domain_renderer.view.compute_indices(domain_source)
      expect(() => {
        domain_source.selected.indices = [0, 1]
        color_mapper.update_data()
      }).to.not.throw()
    })
  })
})
