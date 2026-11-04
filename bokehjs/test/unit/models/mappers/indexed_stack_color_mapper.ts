import {expect} from "#framework/assertions"
import {display, fig} from "#framework/layouts"
import {async_trap, trap} from "#framework/util"

import * as sinon from "sinon"

import {ColorBar} from "@bokehjs/models/annotations/color_bar"
import type {ImageStackView} from "@bokehjs/models/glyphs/image_stack"
import {LogAxis} from "@bokehjs/models/axes/log_axis"
import {IndexedStackColorMapper} from "@bokehjs/models/mappers/indexed_stack_color_mapper"
import {LinearColorMapper} from "@bokehjs/models/mappers/linear_color_mapper"
import {LogColorMapper} from "@bokehjs/models/mappers/log_color_mapper"
import type {PlotView} from "@bokehjs/models/plots/plot"
import type {Range1d} from "@bokehjs/models/ranges/range1d"
import {LogScale} from "@bokehjs/models/scales/log_scale"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {BasicTicker} from "@bokehjs/models/tickers/basic_ticker"
import {LogTicker} from "@bokehjs/models/tickers/log_ticker"
import {Float64NDArray} from "@bokehjs/core/util/ndarray"
import {version} from "@bokehjs/version"

describe("IndexedStackColorMapper module", () => {
  const palette = ["red", "green", "blue", "yellow"]

  // Stack of shape (2, 2, 3), i.e. three 2D arrays of shape (2, 2) each.
  const slices = [
    [0, 1, 2, 3],
    [10, 20, 30, 40],
    [NaN, 5, 100, 50],
  ]

  function stack(): Float64NDArray {
    const n = slices[0].length
    const nstack = slices.length
    const data = new Float64Array(n*nstack)
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < nstack; k++) {
        data[i*nstack + k] = slices[k][i]
      }
    }
    return new Float64NDArray(data, [2, 2, nstack])
  }

  function rgba(mapper: IndexedStackColorMapper | LinearColorMapper, data: Float64NDArray | number[]): number[] {
    return Array.from(mapper.rgba_mapper.v_compute(data))
  }

  describe("IndexedStackColorMapper.rgba_mapper method", () => {

    it("should map the slice selected by index like slice_color_mapper does", () => {
      const slice_color_mapper = LinearColorMapper.create({palette})
      const mapper = IndexedStackColorMapper.create({slice_color_mapper})
      const data = stack()

      for (let index = 0; index < slices.length; index++) {
        mapper.index = index
        const expected = rgba(LinearColorMapper.create({palette}), slices[index])
        expect(rgba(mapper, data)).to.be.equal(expected)
      }
    })

    it("should use nan_color, low_color and high_color of slice_color_mapper", () => {
      const attrs = {palette, low: 1, high: 40, nan_color: "pink", low_color: "white", high_color: "black"}
      const mapper = IndexedStackColorMapper.create({slice_color_mapper: LinearColorMapper.create(attrs), index: 2})

      const expected = rgba(LinearColorMapper.create(attrs), slices[2])
      expect(rgba(mapper, stack())).to.be.equal(expected)
      expect("palette" in mapper.properties).to.be.false
      expect("nan_color" in mapper.properties).to.be.false
    })

    it("should scan the whole stack as one data set with scan_together", () => {
      const slice_color_mapper = LinearColorMapper.create({palette})
      const mapper = IndexedStackColorMapper.create({slice_color_mapper, index: 0, scan_together: true})

      const expected = rgba(LinearColorMapper.create({palette, low: 0, high: 100}), slices[0])
      expect(rgba(mapper, stack())).to.be.equal(expected)
      expect(slice_color_mapper.metrics.min).to.be.equal(0)
      expect(slice_color_mapper.metrics.max).to.be.equal(100)
    })

    it("should reuse scans when index or scan_together change back", () => {
      const slice_color_mapper = LinearColorMapper.create({palette})
      const mapper = IndexedStackColorMapper.create({slice_color_mapper})
      const scan = sinon.spy(slice_color_mapper, "_v_scan")
      const data = stack()

      rgba(mapper, data)
      mapper.index = 1
      rgba(mapper, data)
      mapper.index = 0
      const result = rgba(mapper, data)
      expect(scan.callCount).to.be.equal(2)
      expect(result).to.be.equal(rgba(LinearColorMapper.create({palette}), slices[0]))

      mapper.scan_together = true
      rgba(mapper, data)
      mapper.index = 2
      rgba(mapper, data)
      expect(scan.callCount).to.be.equal(3)
    })

    it("should drop scans of the arrays given to data_changed()", () => {
      const slice_color_mapper = LinearColorMapper.create({palette})
      const mapper = IndexedStackColorMapper.create({slice_color_mapper})
      const scan = sinon.spy(slice_color_mapper, "_v_scan")
      const data = stack()
      const other_data = stack()

      rgba(mapper, data)
      rgba(mapper, other_data)
      data[0] = -30  // in place, like a patch
      mapper.data_changed([data])
      rgba(mapper, data)
      expect(scan.callCount).to.be.equal(3)
      expect(slice_color_mapper.metrics.min).to.be.equal(-30)
      rgba(mapper, other_data)
      expect(scan.callCount).to.be.equal(3)
    })

    it("should drop scans and emit change when slice_color_mapper changes", () => {
      const slice_color_mapper = LinearColorMapper.create({palette})
      const mapper = IndexedStackColorMapper.create({slice_color_mapper})
      const scan = sinon.spy(slice_color_mapper, "_v_scan")
      const change = sinon.spy()
      mapper.change.connect(change)
      const data = stack()

      rgba(mapper, data)
      slice_color_mapper.palette = ["black", "white"]
      expect(change.called).to.be.true
      const expected = rgba(LinearColorMapper.create({palette: ["black", "white"]}), slices[0])
      expect(rgba(mapper, data)).to.be.equal(expected)
      expect(scan.callCount).to.be.equal(2)

      const other_mapper = LinearColorMapper.create({palette})
      mapper.slice_color_mapper = other_mapper
      change.resetHistory()
      slice_color_mapper.palette = palette
      expect(change.called).to.be.false
      other_mapper.palette = ["black", "white"]
      expect(change.called).to.be.true
    })

    it("should log an error and use nan_color when index is out of range", () => {
      const slice_color_mapper = LinearColorMapper.create({palette, nan_color: "pink"})
      const mapper = IndexedStackColorMapper.create({slice_color_mapper, index: 3})
      const scan = sinon.spy(slice_color_mapper, "_v_scan")

      let result: number[] = []
      const out = trap(() => result = rgba(mapper, stack()))
      expect(out.error).to.be.equal(`[bokeh ${version}] ${mapper}: expected index in the range [0, 3), got 3\n`)
      expect(result).to.be.equal(rgba(LinearColorMapper.create({palette, nan_color: "pink"}), [NaN, NaN, NaN, NaN]))
      expect(scan.called).to.be.false
    })
  })

  describe("IndexedStackColorMapper.display_mapper property", () => {
    it("should be slice_color_mapper, whose metrics_change is forwarded", () => {
      const slice_color_mapper = LinearColorMapper.create({palette})
      const mapper = IndexedStackColorMapper.create({slice_color_mapper})
      const metrics_change = sinon.spy()
      const display_mapper_change = sinon.spy()
      mapper.metrics_change.connect(metrics_change)
      mapper.display_mapper_change.connect(display_mapper_change)
      expect(mapper.display_mapper).to.be.equal(slice_color_mapper)

      rgba(mapper, stack())
      expect(metrics_change.called).to.be.true

      const other_mapper = LinearColorMapper.create({palette})
      mapper.slice_color_mapper = other_mapper
      expect(mapper.display_mapper).to.be.equal(other_mapper)
      expect(display_mapper_change.callCount).to.be.equal(1)

      metrics_change.resetHistory()
      slice_color_mapper.metrics_change.emit()
      expect(metrics_change.called).to.be.false
      other_mapper.metrics_change.emit()
      expect(metrics_change.callCount).to.be.equal(1)
    })
  })

  describe("in an ImageStack", () => {
    async function display_image_stack(images: Float64NDArray[]) {
      const slice_color_mapper = LinearColorMapper.create({palette})
      const color_mapper = IndexedStackColorMapper.create({slice_color_mapper})
      const source = ColumnDataSource.create({data: {image: images}})
      const p = fig([200, 200])
      p.image_stack({image: {field: "image"}, x: 0, y: 0, dw: 1, dh: 1, color_mapper, source})
      const {view} = await display(p)
      const scan = sinon.spy(slice_color_mapper, "_v_scan")
      return {view, color_mapper, slice_color_mapper, source, scan}
    }

    it("should reuse the scans made when it was displayed", async () => {
      const {view, color_mapper, scan} = await display_image_stack([stack()])

      color_mapper.index = 1
      await view.ready
      color_mapper.index = 0
      await view.ready
      expect(scan.callCount).to.be.equal(1)
    })

    it("should still render when index is out of range", async () => {
      const slice_color_mapper = LinearColorMapper.create({palette, nan_color: "pink"})
      const color_mapper = IndexedStackColorMapper.create({slice_color_mapper, index: 3})
      const color_bar = ColorBar.create({color_mapper})
      const p = fig([200, 200])
      const renderer = p.image_stack({image: [stack()], x: 0, y: 0, dw: 1, dh: 1, color_mapper})
      p.add_layout(color_bar, "right")

      let view!: PlotView
      const out = await async_trap(async () => {
        view = (await display(p)).view
      })
      expect(out.error.includes(`${color_mapper}: expected index in the range [0, 3), got 3`)).to.be.true

      function pixels(): number[] {
        const stack_view = view.owner.get_one(renderer).glyph as ImageStackView
        const canvas = stack_view.image_data![0]!
        const ctx = canvas.getContext("2d")!
        return Array.from(ctx.getImageData(0, 0, canvas.width, canvas.height).data)
      }

      expect(pixels()).to.be.equal(rgba(LinearColorMapper.create({palette, nan_color: "pink"}), [NaN, NaN, NaN, NaN]))

      color_mapper.index = 1
      await view.ready
      expect(pixels()).to.be.equal(rgba(LinearColorMapper.create({palette}), slices[1]))
      const {_major_range} = view.owner.get_one(color_bar) as any // XXX: protected
      expect(_major_range.start).to.be.equal(10)
      expect(_major_range.end).to.be.equal(40)
    })

    it("should drop scans only of the images that are patched", async () => {
      const {view, color_mapper, slice_color_mapper, source, scan} = await display_image_stack([stack(), stack()])

      source.patch({image: [[[0, 0, 0], [-30]]]})  // in place
      await view.ready
      expect(scan.callCount).to.be.equal(1)
      expect(slice_color_mapper.metrics.min).to.be.equal(-30)

      color_mapper.index = 1
      await view.ready
      color_mapper.index = 0
      await view.ready
      expect(scan.callCount).to.be.equal(3)
    })
  })

  describe("in a ColorBar", () => {
    it("should draw slice_color_mapper", async () => {
      const slice_color_mapper = LinearColorMapper.create({palette})
      const color_mapper = IndexedStackColorMapper.create({slice_color_mapper})
      const color_bar = ColorBar.create({color_mapper})
      const p = fig([200, 200])
      p.add_layout(color_bar, "right")
      const {view} = await display(p)
      const color_bar_view = view.owner.get_one(color_bar)
      expect(color_bar_view.color_mapper).to.be.equal(slice_color_mapper)
    })

    async function display_color_bar(color_mapper: IndexedStackColorMapper) {
      const color_bar = ColorBar.create({color_mapper})
      const p = fig([200, 200])
      p.image_stack({image: [stack()], x: 0, y: 0, dw: 1, dh: 1, color_mapper})
      p.add_layout(color_bar, "right")
      const {view} = await display(p)
      const color_bar_view = view.owner.get_one(color_bar)

      const internals = () => color_bar_view as any // XXX: protected

      // The range and the major ticks of the color bar's axis.
      function state() {
        const {_major_range, _axis_view} = internals()
        const {start, end} = _major_range as Range1d
        const ticks = _axis_view.tick_coords.major[_axis_view.dimension] as number[]
        return {start, end, ticks}
      }

      return {view, color_bar_view, internals, state}
    }

    it("should follow slice_color_mapper after it's replaced", async () => {
      const color_mapper = IndexedStackColorMapper.create({slice_color_mapper: LinearColorMapper.create({palette}), index: 1})
      const {view, color_bar_view, state} = await display_color_bar(color_mapper)
      expect(state()).to.be.similar({start: 10, end: 40, ticks: [10, 15, 20, 25, 30, 35, 40]})

      const slice_color_mapper = LinearColorMapper.create({palette})
      color_mapper.slice_color_mapper = slice_color_mapper
      await view.ready
      expect(color_bar_view.color_mapper).to.be.equal(slice_color_mapper)

      color_mapper.index = 2
      await view.ready
      expect(state()).to.be.similar({start: 5, end: 100, ticks: [20, 40, 60, 80, 100]})
    })

    it("should rebuild its axis when slice_color_mapper is replaced with another type", async () => {
      const color_mapper = IndexedStackColorMapper.create({slice_color_mapper: LinearColorMapper.create({palette}), index: 1})
      const {view, color_bar_view, internals, state} = await display_color_bar(color_mapper)
      expect(internals()._ticker).to.be.instanceof(BasicTicker)

      const slice_color_mapper = LogColorMapper.create({palette})
      color_mapper.slice_color_mapper = slice_color_mapper
      await view.ready
      expect(color_bar_view.color_mapper).to.be.equal(slice_color_mapper)

      const {_major_scale, _ticker, _axis} = internals()
      expect(_major_scale).to.be.instanceof(LogScale)
      expect(_ticker).to.be.instanceof(LogTicker)
      expect(_axis).to.be.instanceof(LogAxis)
      expect(state()).to.be.similar({start: 10, end: 40, ticks: [10, 15, 20, 25, 30, 35, 40]})

      color_mapper.index = 2
      await view.ready
      expect(state()).to.be.similar({start: 5, end: 100, ticks: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]})
    })
  })
})
