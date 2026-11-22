import {expect} from "#framework/assertions"
import {display, fig} from "#framework/layouts"

import {ColorBar, ColumnDataSource, LinearColorMapper, LogColorMapper, LogScale, LogTicker, WeightedStackColorMapper} from "@bokehjs/models"
import type {Range1d} from "@bokehjs/models"
import {Spectral10} from "@bokehjs/api/palettes"
import {Float64NDArray} from "@bokehjs/core/util/ndarray"

describe("ColorBar", () => {

  describe("display cutoffs", () => {

    it("should be null by default", () => {
      const palette = Spectral10
      const color_mapper = LinearColorMapper.create({palette})
      const color_bar = ColorBar.create({color_mapper})

      expect(color_bar.display_low).to.be.null
      expect(color_bar.display_high).to.be.null
    })
  })

  describe("when its color mapper changes", () => {
    const palette = ["red", "green", "blue", "yellow"]

    function major_range(color_bar_view: unknown): [number, number] {
      const {start, end} = (color_bar_view as any)._major_range as Range1d // XXX: protected
      return [start, end]
    }

    it("should follow metrics of a replaced color_mapper", async () => {
      // Two 2x2 images of [1, 2, 3, 4]*k
      const image = (k: number) => new Float64NDArray([1*k, 2*k, 3*k, 4*k], [2, 2])
      const mapper0 = LinearColorMapper.create({palette})
      const mapper1 = LinearColorMapper.create({palette})
      const source1 = ColumnDataSource.create({data: {image: [image(1)]}})

      const p = fig([200, 200])
      p.image({image: [image(1)], x: 0, y: 0, dw: 1, dh: 1, color_mapper: mapper0})
      p.image({image: {field: "image"}, x: 1, y: 0, dw: 1, dh: 1, color_mapper: mapper1, source: source1})
      const color_bar = ColorBar.create({color_mapper: mapper0})
      p.add_layout(color_bar, "right")
      const {view} = await display(p)
      const color_bar_view = view.owner.get_one(color_bar)

      color_bar.color_mapper = mapper1
      await view.ready
      source1.data = {image: [image(10)]}
      await view.ready
      expect(major_range(color_bar_view)).to.be.equal([10, 40])
    })

    it("should follow alpha_mapper of a WeightedStackColorMapper", async () => {
      // Two 2x2 images of [1, 2, 3, 4]*k each, so the totals are [2, 4, 6, 8]*k
      function stack(k: number): Float64NDArray {
        const data = [1, 1, 2, 2, 3, 3, 4, 4].map((v) => v*k)
        return new Float64NDArray(data, [2, 2, 2])
      }

      const alpha_mapper = LinearColorMapper.create({palette: ["#0004", "#0008", "#000c", "#000f"]})
      const color_mapper = WeightedStackColorMapper.create({palette: ["red", "blue"], alpha_mapper, color_baseline: 0})
      const source = ColumnDataSource.create({data: {image: [stack(1)]}})

      const p = fig([200, 200])
      p.image_stack({image: {field: "image"}, x: 0, y: 0, dw: 1, dh: 1, color_mapper, source})
      const color_bar = ColorBar.create({color_mapper})
      p.add_layout(color_bar, "right")
      const {view} = await display(p)
      const color_bar_view = view.owner.get_one(color_bar)
      expect(major_range(color_bar_view)).to.be.equal([2, 8])

      source.data = {image: [stack(10)]}
      await view.ready
      expect(major_range(color_bar_view)).to.be.equal([20, 80])

      color_mapper.alpha_mapper = LogColorMapper.create({palette: alpha_mapper.palette})
      await view.ready
      const {_major_scale, _ticker} = color_bar_view as any // XXX: protected
      expect(_major_scale).to.be.instanceof(LogScale)
      expect(_ticker).to.be.instanceof(LogTicker)

      source.data = {image: [stack(1)]}
      await view.ready
      expect(major_range(color_bar_view)).to.be.equal([2, 8])
    })
  })
})
