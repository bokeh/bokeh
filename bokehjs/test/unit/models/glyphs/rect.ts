import {display, fig} from "../../_util"
import {expect} from "assertions"
import * as sinon from "sinon"

import {create_glyph_view} from "./_util"
import {Rect, RectView} from "@bokehjs/models/glyphs/rect"
//import {LinearScale} from "@bokehjs/models/scales/linear_scale"
//import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Geometry} from "@bokehjs/core/geometry"
import {NumberArray} from '@bokehjs/core/types'

describe("Glyph (using Rect as a concrete Glyph)", () => {

  describe("GlyphView", () => {
    let stub: sinon.SinonStub
    let glyph: Rect

    before_each(() => {
      stub = sinon.stub((RectView.prototype as any), '_bounds').callsFake((bounds) => bounds) // XXX: protected

      glyph = new Rect({
        x: {field: "x"},
        y: {field: "y"},
      })
    })

    after_each(() => {
      stub.restore()
    })

    it("should calculate bounds based on data", async () => {
      const data = {x: [1, 2, 3, 4], y: [-20, 10, 0, 30]}
      const glyph_view = await create_glyph_view(glyph, data)
      const bounds = glyph_view.bounds()

      expect(bounds).to.be.equal({x0: 1, y0: -20, x1: 4, y1: 30})
    })

    it("should calculate log bounds based on data values > 0", async () => {
      const data = {x: [1, 2, 3, 4], y: [-20, 0, 10, 30]}
      const glyph_view = await create_glyph_view(glyph, data)
      const log_bounds = glyph_view.log_bounds()

      expect(log_bounds).to.be.equal({x0: 1, y0: 10, x1: 4, y1: 30})
    })

    it("should calculate log bounds when NaNs are present", async () => {
      const data = {x: [1, 2, 3, 4], y: [-20, 0, 10, NaN]}
      const glyph_view = await create_glyph_view(glyph, data)
      const log_bounds = glyph_view.log_bounds()

      expect(log_bounds).to.be.equal({x0: 1, y0: 10, x1: 3, y1: 10})
    })

    it("should hit test rects against an index", async () => {
      const data = {x: [20, 40, 60], y: [10, 10, 50]}
      const glyph = new Rect({
        x: {field: "x"},
        y: {field: "y"},
        width: {value: 10},
        height: {value: 20},
      })

      const glyph_view = await create_glyph_view(glyph, data, {axis_type: "linear"})

      // rect is XYGlyph, will only put centers in index, box glyphs will put entire box
      const geometry1: Geometry = {type: "rect", sx0: 0,  sy0: 200, sx1: 40,  sy1: 180}
      const geometry2: Geometry = {type: "rect", sx0: 60, sy0: 210, sx1: 80,  sy1: 150}
      const geometry3: Geometry = {type: "rect", sx0: 0,  sy0:  50, sx1: 200, sy1:  59}

      const result1 = glyph_view.hit_test(geometry1)!
      const result2 = glyph_view.hit_test(geometry2)!
      const result3 = glyph_view.hit_test(geometry3)!

      expect(result1.indices).to.be.equal([0])
      expect(result2.indices).to.be.equal([1])
      expect(result3.indices).to.be.equal([])
    })
  })
})

describe("Rect", () => {

  describe("RectView", () => {
    let glyph: Rect

    before_each(() => {
      glyph = new Rect({
        x: {field: "x"},
        y: {field: "y"},
        width: {value: 10},
        height: {value: 20},
      })
    })

    it("should calculate bounds based on data including width and height", async () => {
      const data = {x: [0, 1, 2, 3], y: [0, 1, 2, 3]}
      const glyph_view = await create_glyph_view(glyph, data)
      const bounds = glyph_view.bounds()

      expect(bounds).to.be.equal({x0: -5, y0: -10, x1: 8, y1: 13})
    })

    it("should calculate log bounds based on data including width and height", async () => {
      const data = {x: [0, 1, 2, 3], y: [0, 1, 2, 3]}
      const glyph_view = await create_glyph_view(glyph, data)
      const log_bounds = glyph_view.log_bounds()

      expect(log_bounds).to.be.equal({x0: -4, y0: -9, x1: 8, y1: 13})
    })

    it("`_map_data` should correctly map data if width and height units are 'data'", async () => {
      const data = {x: [1], y: [2]}
      const glyph_view = await create_glyph_view(glyph, data, {axis_type: "linear"})
      glyph_view.map_data()

      expect(glyph_view.sw).to.be.equal(NumberArray.of(20))
      expect(glyph_view.sh).to.be.equal(NumberArray.of(40))
    })

    it("`_map_data` should correctly map data if width and height units are 'screen'", async () => {
      glyph.properties.width.units = "screen"
      glyph.properties.height.units = "screen"

      const data = {x: [1], y: [2]}
      const glyph_view = await create_glyph_view(glyph, data, {axis_type: "linear"})
      glyph_view.map_data()

      expect(glyph_view.sw).to.be.equal(new NumberArray([10]))
      expect(glyph_view.sh).to.be.equal(new NumberArray([20]))
    })

    // XXX: needs update
    it.skip("`_map_data` should map values for x0 and y1 when width/height units are 'data'", async () => {
      const data = {x: [1], y: [2]}
      const glyph_view = await create_glyph_view(glyph, data)
      glyph_view.map_data()

      expect(glyph_view.sx0).to.be.equal(NumberArray.of(0))
      expect(glyph_view.sy1).to.be.equal(NumberArray.of(0))
    })

    // XXX: needs update
    it.skip("`_map_data` should map values for x0 and y1 when width/height units are 'screen'", async () => {
      glyph.properties.width.units = "screen"
      glyph.properties.height.units = "screen"

      const data = {x: [1], y: [2]}
      const glyph_view = await create_glyph_view(glyph, data)
      glyph_view.map_data()

      expect(glyph_view.sx0).to.be.equal(NumberArray.of(-5))
      expect(glyph_view.sy1).to.be.equal(NumberArray.of(-10))
    })

    /* XXX
    it("`_map_data` should map values for x0 and y1 with FactorRanges", async () => {
      const glyph = new Rect({
        x: {field: "x"},
        y: {field: "y"},
        width: {value: 0.5},
        height: {value: 0.5},
      })
      const data = {x: ['a'], y: ['b']}
      const glyph_view = await create_glyph_view(glyph, data)
      glyph_view.map_data()

      expect(glyph_view.sx0).to.be.equal({'0': 25})
      expect(glyph_view.sy1).to.be.equal({'0': 25})
    })
    */

    it("`_map_data` should map values for sw and sh when a height is 0", async () => {
      const glyph = new Rect({
        x: {field: "x"},
        y: {field: "y"},
        width: {value: 10},
        height: {field: "h"},
      })
      const data = {x: [5], y: [5], h: [0]}
      const glyph_view = await create_glyph_view(glyph, data, {axis_type: "linear"})
      glyph_view.map_data()

      expect(glyph_view.sw).to.be.equal(NumberArray.of(20))
      expect(glyph_view.sh).to.be.equal(NumberArray.of(0))
    })

    describe("hit-testing", () => {

      describe("_hit_point", () => {
        const geometry1: Geometry = {type: "point", sx: 190, sy: -20}
        const geometry2: Geometry = {type: "point", sx: 195, sy: -10}
        const geometry3: Geometry = {type: "point", sx: 186, sy:  14}

        it("should retu indices of the rect that was hit", async () => {
          const data = {x: [60, 100, 140], y: [60, 100, 140]}
          const glyph_view = await create_glyph_view(glyph, data, {axis_type: "linear"})

          const result1 = glyph_view.hit_test(geometry1)!
          const result2 = glyph_view.hit_test(geometry2)!
          const result3 = glyph_view.hit_test(geometry3)!

          expect(result1.indices).to.be.equal([1])
          expect(result2.indices).to.be.equal([1])
          expect(result3.indices).to.be.equal([])
        })

        it("should work when width and height units are 'screen'", async () => {
          glyph.properties.width.units = "screen"
          glyph.properties.height.units = "screen"

          const data = {x: [60, 100, 140], y: [60, 100, 140]}
          const glyph_view = await create_glyph_view(glyph, data, {axis_type: "linear"})

          const result1 = glyph_view.hit_test(geometry1)!
          const result2 = glyph_view.hit_test(geometry2)!
          const result3 = glyph_view.hit_test(geometry3)!

          expect(result1.indices).to.be.equal([])
          expect(result2.indices).to.be.equal([1])
          expect(result3.indices).to.be.equal([])
        })

        it("should work when rects are rotated", async () => {
          const glyph = new Rect({
            x: {field: "x"},
            y: {field: "y"},
            width: {value: 10},
            height: {value: 20},
            angle: {value: -0.785398},
          })

          const data = {x: [60, 100, 140], y: [60, 100, 140]}
          const glyph_view = await create_glyph_view(glyph, data, {axis_type: "linear"})

          const result1 = glyph_view.hit_test(geometry1)!
          const result2 = glyph_view.hit_test(geometry2)!
          const result3 = glyph_view.hit_test(geometry3)!

          expect(result1.indices).to.be.equal([])
          expect(result2.indices).to.be.equal([])
          expect(result3.indices).to.be.equal([1])
        })

        /*
        it("should work when rects are rotated and axes ranges are very different", async () => {
          const glyph = new Rect({
            x: {field: "x"},
            y: {field: "y"},
            width: {value: 10},
            height: {value: 20},
            angle: {value: -0.785398},
          })

          const data = {x: [60, 100, 140], y: [60, 100, 140]}
          const glyph_view = await create_glyph_view(glyph, data)

          const xscale = new LinearScale({
            source_range: new Range1d({start: 0, end: 100}),
            target_range: new Range1d({start: 95, end: 105}),
          })

          const yscale = new LinearScale({
            source_range: new Range1d({start: 0, end: 100}),
            target_range: new Range1d({start: 200, end: 0}),
          })

          glyph_view.renderer.xscale = xscale
          glyph_view.renderer.yscale = yscale
          glyph_view.renderer.plot_view.frame.xscales.default = xscale
          glyph_view.renderer.plot_view.frame.yscales.default = yscale

          const result1 = glyph_view.hit_test({type: "point", sx: 105, sy:   0})!
          const result2 = glyph_view.hit_test({type: "point", sx: 105, sy: -20})!
          const result3 = glyph_view.hit_test({type: "point", sx: 91,  sy:  14})!

          expect(result1.indices).to.be.equal([1])
          expect(result2.indices).to.be.equal([])
          expect(result3.indices).to.be.equal([1])
        })
        */

        it("should work when axis is log", async () => {
          const plot = fig([600, 600], {
            x_range: [1, 20000], y_range: [1, 20000],
            x_axis_type: "log", y_axis_type: "log",
          })
          const rect = plot.rect({
            x: [10, 100, 1000, 10000],
            y: [10, 100, 1000, 10000],
            width: [10, 100, 1000, 10000],
            height: [10, 100, 1000, 10000],
          })

          const {view} = await display(plot)
          const rect_view = view.renderer_view(rect)!.glyph as Rect["__view_type__"]

          function hit_test(x: number, y: number): number[] | undefined {
            const sx = view.frame.x_scale.compute(x)
            const sy = view.frame.y_scale.compute(y)
            return rect_view.hit_test({type: "point", sx, sy})?.indices
          }

          const e = 0.1 // FP error on rect boundary

          expect(hit_test(1, 1)).to.be.equal([])

          expect(hit_test(4, 4)).to.be.equal([])
          expect(hit_test(5+e, 5+e)).to.be.equal([0])
          expect(hit_test(10, 10)).to.be.equal([0])
          expect(hit_test(15-e, 15-e)).to.be.equal([0])
          expect(hit_test(16, 16)).to.be.equal([])

          expect(hit_test(49, 49)).to.be.equal([])
          expect(hit_test(50+e, 50+e)).to.be.equal([1])
          expect(hit_test(100, 100)).to.be.equal([1])
          expect(hit_test(150-e, 150-e)).to.be.equal([1])
          expect(hit_test(151, 151)).to.be.equal([])

          expect(hit_test(499, 499)).to.be.equal([])
          expect(hit_test(500+e, 500+e)).to.be.equal([2])
          expect(hit_test(1000, 1000)).to.be.equal([2])
          expect(hit_test(1500-e, 1500-e)).to.be.equal([2])
          expect(hit_test(1501, 1501)).to.be.equal([])

          expect(hit_test(4999, 4999)).to.be.equal([])
          expect(hit_test(5000+e, 5000+e)).to.be.equal([3])
          expect(hit_test(10000, 10000)).to.be.equal([3])
          expect(hit_test(15000-e, 15000-e)).to.be.equal([3])
          expect(hit_test(15001, 15001)).to.be.equal([])
        })
      })
    })
  })
})
