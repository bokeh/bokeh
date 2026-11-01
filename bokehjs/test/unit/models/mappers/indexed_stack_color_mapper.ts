import {expect} from "#framework/assertions"
import {display, fig} from "#framework/layouts"

import * as sinon from "sinon"

import {ColorBar} from "@bokehjs/models/annotations/color_bar"
import {LogAxis} from "@bokehjs/models/axes/log_axis"
import {IndexedStackColorMapper} from "@bokehjs/models/mappers/indexed_stack_color_mapper"
import {LinearColorMapper} from "@bokehjs/models/mappers/linear_color_mapper"
import {LogColorMapper} from "@bokehjs/models/mappers/log_color_mapper"
import type {Range1d} from "@bokehjs/models/ranges/range1d"
import {LogScale} from "@bokehjs/models/scales/log_scale"
import {BasicTicker} from "@bokehjs/models/tickers/basic_ticker"
import {LogTicker} from "@bokehjs/models/tickers/log_ticker"
import {Float64NDArray} from "@bokehjs/core/util/ndarray"

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

    it("should map the slice selected by index like single_color_mapper does", () => {
      const single_color_mapper = LinearColorMapper.create({palette})
      const mapper = IndexedStackColorMapper.create({single_color_mapper})
      const data = stack()

      for (let index = 0; index < slices.length; index++) {
        mapper.index = index
        const expected = rgba(LinearColorMapper.create({palette}), slices[index])
        expect(rgba(mapper, data)).to.be.equal(expected)
      }
    })

    it("should use nan_color, low_color and high_color of single_color_mapper", () => {
      const attrs = {palette, low: 1, high: 40, nan_color: "pink", low_color: "white", high_color: "black"}
      const mapper = IndexedStackColorMapper.create({single_color_mapper: LinearColorMapper.create(attrs), index: 2})

      const expected = rgba(LinearColorMapper.create(attrs), slices[2])
      expect(rgba(mapper, stack())).to.be.equal(expected)
      expect("palette" in mapper.properties).to.be.false
      expect("nan_color" in mapper.properties).to.be.false
    })

    it("should support map_all scanning the whole stack", () => {
      const single_color_mapper = LinearColorMapper.create({palette})
      const mapper = IndexedStackColorMapper.create({single_color_mapper, index: 0, map_all: true})

      const expected = rgba(LinearColorMapper.create({palette, low: 0, high: 100}), slices[0])
      expect(rgba(mapper, stack())).to.be.equal(expected)
      expect(single_color_mapper.metrics.min).to.be.equal(0)
      expect(single_color_mapper.metrics.max).to.be.equal(100)
    })

    it("should reuse scans when index or map_all change back", () => {
      const single_color_mapper = LinearColorMapper.create({palette})
      const mapper = IndexedStackColorMapper.create({single_color_mapper})
      const scan = sinon.spy(single_color_mapper, "_v_scan")
      const data = stack()

      rgba(mapper, data)
      mapper.index = 1
      rgba(mapper, data)
      mapper.index = 0
      const result = rgba(mapper, data)
      expect(scan.callCount).to.be.equal(2)
      expect(result).to.be.equal(rgba(LinearColorMapper.create({palette}), slices[0]))

      mapper.map_all = true
      rgba(mapper, data)
      mapper.index = 2
      rgba(mapper, data)
      expect(scan.callCount).to.be.equal(3)
    })

    it("should drop scans in data_changed()", () => {
      const single_color_mapper = LinearColorMapper.create({palette})
      const mapper = IndexedStackColorMapper.create({single_color_mapper})
      const scan = sinon.spy(single_color_mapper, "_v_scan")
      const data = stack()

      rgba(mapper, data)
      data[0] = -30  // in place, like a patch
      mapper.data_changed()
      rgba(mapper, data)
      expect(scan.callCount).to.be.equal(2)
      expect(single_color_mapper.metrics.min).to.be.equal(-30)
    })

    it("should drop scans and emit change when single_color_mapper changes", () => {
      const single_color_mapper = LinearColorMapper.create({palette})
      const mapper = IndexedStackColorMapper.create({single_color_mapper})
      const scan = sinon.spy(single_color_mapper, "_v_scan")
      const change = sinon.spy()
      mapper.change.connect(change)
      const data = stack()

      rgba(mapper, data)
      single_color_mapper.palette = ["black", "white"]
      expect(change.called).to.be.true
      const expected = rgba(LinearColorMapper.create({palette: ["black", "white"]}), slices[0])
      expect(rgba(mapper, data)).to.be.equal(expected)
      expect(scan.callCount).to.be.equal(2)

      const other_mapper = LinearColorMapper.create({palette})
      mapper.single_color_mapper = other_mapper
      change.resetHistory()
      single_color_mapper.palette = palette
      expect(change.called).to.be.false
      other_mapper.palette = ["black", "white"]
      expect(change.called).to.be.true
    })

    it("should throw when index is out of range", () => {
      const mapper = IndexedStackColorMapper.create({single_color_mapper: LinearColorMapper.create({palette}), index: 3})
      expect(() => rgba(mapper, stack())).to.throw(Error, /Expected index in the range \[0, 3\), got 3/)
    })
  })

  describe("IndexedStackColorMapper.palette_mapper property", () => {
    it("should be single_color_mapper, whose metrics_change is forwarded", () => {
      const single_color_mapper = LinearColorMapper.create({palette})
      const mapper = IndexedStackColorMapper.create({single_color_mapper})
      const metrics_change = sinon.spy()
      const palette_mapper_change = sinon.spy()
      mapper.metrics_change.connect(metrics_change)
      mapper.palette_mapper_change.connect(palette_mapper_change)
      expect(mapper.palette_mapper).to.be.equal(single_color_mapper)

      rgba(mapper, stack())
      expect(metrics_change.called).to.be.true

      const other_mapper = LinearColorMapper.create({palette})
      mapper.single_color_mapper = other_mapper
      expect(mapper.palette_mapper).to.be.equal(other_mapper)
      expect(palette_mapper_change.callCount).to.be.equal(1)

      metrics_change.resetHistory()
      single_color_mapper.metrics_change.emit()
      expect(metrics_change.called).to.be.false
      other_mapper.metrics_change.emit()
      expect(metrics_change.callCount).to.be.equal(1)
    })
  })

  describe("in a ColorBar", () => {
    it("should draw single_color_mapper", async () => {
      const single_color_mapper = LinearColorMapper.create({palette})
      const color_mapper = IndexedStackColorMapper.create({single_color_mapper})
      const color_bar = ColorBar.create({color_mapper})
      const p = fig([200, 200])
      p.add_layout(color_bar, "right")
      const {view} = await display(p)
      const color_bar_view = view.owner.get_one(color_bar)
      expect(color_bar_view.color_mapper).to.be.equal(single_color_mapper)
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

    it("should follow single_color_mapper after it's replaced", async () => {
      const color_mapper = IndexedStackColorMapper.create({single_color_mapper: LinearColorMapper.create({palette}), index: 1})
      const {view, color_bar_view, state} = await display_color_bar(color_mapper)
      expect(state()).to.be.similar({start: 10, end: 40, ticks: [10, 15, 20, 25, 30, 35, 40]})

      const single_color_mapper = LinearColorMapper.create({palette})
      color_mapper.single_color_mapper = single_color_mapper
      await view.ready
      expect(color_bar_view.color_mapper).to.be.equal(single_color_mapper)

      color_mapper.index = 2
      await view.ready
      expect(state()).to.be.similar({start: 5, end: 100, ticks: [20, 40, 60, 80, 100]})
    })

    it("should rebuild its axis when single_color_mapper is replaced with another type", async () => {
      const color_mapper = IndexedStackColorMapper.create({single_color_mapper: LinearColorMapper.create({palette}), index: 1})
      const {view, color_bar_view, internals, state} = await display_color_bar(color_mapper)
      expect(internals()._ticker).to.be.instanceof(BasicTicker)

      const single_color_mapper = LogColorMapper.create({palette})
      color_mapper.single_color_mapper = single_color_mapper
      await view.ready
      expect(color_bar_view.color_mapper).to.be.equal(single_color_mapper)

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
