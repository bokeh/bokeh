import {expect} from "chai"
import * as sinon from "sinon"

import {create_glyph_view, set_scales} from "./glyph_utils"
import {Rect, RectView} from "models/glyphs/rect"
import {LinearScale} from "models/scales/linear_scale"
import {Range1d} from "models/ranges/range1d"
import {Geometry} from "core/geometry"

describe("Glyph (using Rect as a concrete Glyph)", () => {

  describe("GlyphView", () => {
    let stub: sinon.SinonStub
    let glyph: Rect

    beforeEach(() => {
      stub = sinon.stub((RectView.prototype as any), '_bounds', (bounds: unknown) => bounds) // XXX: protected

      glyph = new Rect({
        x: {field: "x"},
        y: {field: "y"},
      })
    })

    afterEach(() => {
      stub.restore()
    })

    it("should calculate bounds based on data", () => {
      const data = {x: [1, 2, 3, 4], y: [-20, 10, 0, 30]}
      const glyph_view = create_glyph_view(glyph, data)
      const bounds = glyph_view.bounds()

      expect(bounds).to.be.deep.equal({ minX: 1, minY: -20, maxX: 4, maxY: 30 })
    })

    it("should calculate log bounds based on data values > 0", () => {
      const data = {x: [1, 2, 3, 4], y: [-20, 0, 10, 30]}
      const glyph_view = create_glyph_view(glyph, data)
      const log_bounds = glyph_view.log_bounds()

      expect(log_bounds).to.be.deep.equal({ minX: 1, minY: 10, maxX: 4, maxY: 30 })
    })

    it("should calculate log bounds when NaNs are present", () => {
      const data = {x: [1, 2, 3, 4], y: [-20, 0, 10, NaN]}
      const glyph_view = create_glyph_view(glyph, data)
      const log_bounds = glyph_view.log_bounds()

      expect(log_bounds).to.be.deep.equal({ minX: 1, minY: 10, maxX: 3, maxY: 10 })
    })

    it("should hit test rects against an index", () => {

      const data = {x: [20, 40, 60], y: [10, 10, 50]}
      const glyph = new Rect({
        x: {field: "x"},
        y: {field: "y"},
        width: {value: 10},
        height: {value: 20},
      })

      const glyph_view = create_glyph_view(glyph, data)
      set_scales(glyph_view, "linear")
      glyph_view.map_data()

      // rect is XYGlyph, will only put centers in index, box glyphs will put entire box
      const geometry1: Geometry = { type: "rect", sx0: 0,  sy0: 200, sx1: 40,  sy1: 180}
      const geometry2: Geometry = { type: "rect", sx0: 60, sy0: 210, sx1: 80,  sy1: 150}
      const geometry3: Geometry = { type: "rect", sx0: 0,  sy0:  50, sx1: 200, sy1:  59}

      const result1 = glyph_view.hit_test(geometry1)!
      const result2 = glyph_view.hit_test(geometry2)!
      const result3 = glyph_view.hit_test(geometry3)!

      expect(result1['1d'].indices).to.be.deep.equal([0])
      expect(result2['1d'].indices).to.be.deep.equal([1])
      expect(result3['1d'].indices).to.be.deep.equal([])
    })
  })
})

describe("Rect", () => {

  describe("RectView", () => {
    let glyph: Rect

    beforeEach(() => {
      glyph = new Rect({
        x: {field: "x"},
        y: {field: "y"},
        width: {value: 10},
        height: {value: 20},
      })
    })

    it("should calculate bounds based on data including width and height", () => {
      const data = {x: [0, 1, 2, 3], y: [0, 1, 2, 3]}
      const glyph_view = create_glyph_view(glyph, data)
      const bounds = glyph_view.bounds()

      expect(bounds).to.be.deep.equal({ minX: -5, minY: -10, maxX: 8, maxY: 13 })
    })

    it("should calculate log bounds based on data including width and height", () => {
      const data = {x: [0, 1, 2, 3], y: [0, 1, 2, 3]}
      const glyph_view = create_glyph_view(glyph, data)
      const log_bounds = glyph_view.log_bounds()

      expect(log_bounds).to.be.deep.equal({ minX: -4, minY: -9, maxX: 8, maxY: 13 })
    })

    it("`_map_data` should correctly map data if width and height units are 'data'", () => {
      const data = {x: [1], y: [2]}
      const glyph_view = create_glyph_view(glyph, data)

      set_scales(glyph_view, "linear")
      glyph_view.map_data()
      expect(glyph_view.sw).to.be.deep.equal(Float64Array.of(20))
      expect(glyph_view.sh).to.be.deep.equal(Float64Array.of(40))
    })

    it("`_map_data` should correctly map data if width and height units are 'screen'", () => {
      const data = {x: [1], y: [2]}
      const glyph_view = create_glyph_view(glyph, data)

      glyph_view.model.properties.width.units = "screen"
      glyph_view.model.properties.height.units = "screen"

      set_scales(glyph_view, "linear")
      glyph_view.map_data()
      expect(glyph_view.sw).to.be.deep.equal([10])
      expect(glyph_view.sh).to.be.deep.equal([20])
    })

    // XXX: needs update
    it.skip("`_map_data` should map values for x0 and y1 when width/height units are 'data'", () => {
      const data = {x: [1], y: [2]}
      const glyph_view = create_glyph_view(glyph, data)

      glyph_view.map_data()
      expect(glyph_view.sx0).to.be.deep.equal(Float64Array.of(0))
      expect(glyph_view.sy1).to.be.deep.equal(Float64Array.of(0))
    })

    // XXX: needs update
    it.skip("`_map_data` should map values for x0 and y1 when width/height units are 'screen'", () => {
      const data = {x: [1], y: [2]}
      const glyph_view = create_glyph_view(glyph, data)

      glyph_view.model.properties.width.units = "screen"
      glyph_view.model.properties.height.units = "screen"

      glyph_view.map_data()
      expect(glyph_view.sx0).to.be.deep.equal(Float64Array.of(-5))
      expect(glyph_view.sy1).to.be.deep.equal(Float64Array.of(-10))
    })

    it("`_map_data` should map values for x0 and y1 with reversed ranges", () => {
      const data = {x: [1], y: [2]}
      const glyph_view = create_glyph_view(glyph, data)

      set_scales(glyph_view, "linear", true)
      glyph_view.map_data()
      expect(glyph_view.sx0).to.be.deep.equal(Float64Array.of(188))
      // XXX? expect(glyph_view.sy1).to.be.deep.equal({'0': -216})
    })

    /* XXX
    it("`_map_data` should map values for x0 and y1 with FactorRanges", () => {
      const glyph = new Rect({
        x: {field: "x"},
        y: {field: "y"},
        width: {value: 0.5},
        height: {value: 0.5},
      })
      const data = {x: ['a'], y: ['b']}
      const glyph_view = create_glyph_view(glyph, data)
      glyph_view.map_data()
      expect(glyph_view.sx0).to.be.deep.equal({'0': 25})
      expect(glyph_view.sy1).to.be.deep.equal({'0': 25})
    })
    */

    it("`_map_data` should map values for sw and sh when a height is 0", () => {
      const glyph = new Rect({
        x: {field: "x"},
        y: {field: "y"},
        width: {value: 10},
        height: {field: "h"},
      })
      const data = {x: [5], y: [5], h: [0]}
      const glyph_view = create_glyph_view(glyph, data)

      set_scales(glyph_view, "linear")
      glyph_view.map_data()
      expect(glyph_view.sw).to.be.deep.equal(Float64Array.of(20))
      expect(glyph_view.sh).to.be.deep.equal(Float64Array.of(0))
    })

    describe("hit-testing", () => {

      describe("_hit_point", () => {

        const geometry1: Geometry = { type: "point", sx: 190, sy: -20 }
        const geometry2: Geometry = { type: "point", sx: 195, sy: -10 }
        const geometry3: Geometry = { type: "point", sx: 186, sy:  14 }

        it("should return the indices of the rect that was hit", () => {
          const data = {x: [60, 100, 140], y: [60, 100, 140]}
          const glyph_view = create_glyph_view(glyph, data)

          set_scales(glyph_view, "linear")
          glyph_view.map_data()

          const result1 = glyph_view.hit_test(geometry1)!
          const result2 = glyph_view.hit_test(geometry2)!
          const result3 = glyph_view.hit_test(geometry3)!

          expect(result1['1d'].indices).to.be.deep.equal([1])
          expect(result2['1d'].indices).to.be.deep.equal([1])
          expect(result3['1d'].indices).to.be.deep.equal([])
        })

        it("should work when width and height units are 'screen'", () => {
          const data = {x: [60, 100, 140], y: [60, 100, 140]}
          const glyph_view = create_glyph_view(glyph, data)

          glyph_view.model.properties.width.units = "screen"
          glyph_view.model.properties.height.units = "screen"

          set_scales(glyph_view, "linear")
          glyph_view.map_data()

          const result1 = glyph_view.hit_test(geometry1)!
          const result2 = glyph_view.hit_test(geometry2)!
          const result3 = glyph_view.hit_test(geometry3)!

          expect(result1['1d'].indices).to.be.deep.equal([])
          expect(result2['1d'].indices).to.be.deep.equal([1])
          expect(result3['1d'].indices).to.be.deep.equal([])
        })

        it("should work when rects are rotated", () => {
          const glyph = new Rect({
            x: {field: "x"},
            y: {field: "y"},
            width: {value: 10},
            height: {value: 20},
            angle: {value: -0.785398},
          })

          const data = {x: [60, 100, 140], y: [60, 100, 140]}
          const glyph_view = create_glyph_view(glyph, data)

          set_scales(glyph_view, "linear")
          glyph_view.map_data()

          const result1 = glyph_view.hit_test(geometry1)!
          const result2 = glyph_view.hit_test(geometry2)!
          const result3 = glyph_view.hit_test(geometry3)!

          expect(result1['1d'].indices).to.be.deep.equal([])
          expect(result2['1d'].indices).to.be.deep.equal([])
          expect(result3['1d'].indices).to.be.deep.equal([1])
        })

        it("should work when rects are rotated and axes ranges are very different", () => {
          const glyph = new Rect({
            x: {field: "x"},
            y: {field: "y"},
            width: {value: 10},
            height: {value: 20},
            angle: {value: -0.785398},
          })

          const data = {x: [60, 100, 140], y: [60, 100, 140]}
          const glyph_view = create_glyph_view(glyph, data)

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
          glyph_view.map_data()

          const result1 = glyph_view.hit_test({type: "point", sx: 105, sy:   0})!
          const result2 = glyph_view.hit_test({type: "point", sx: 105, sy: -20})!
          const result3 = glyph_view.hit_test({type: "point", sx: 91,  sy:  14})!

          expect(result1['1d'].indices).to.be.deep.equal([1])
          expect(result2['1d'].indices).to.be.deep.equal([])
          expect(result3['1d'].indices).to.be.deep.equal([1])
        })

        it("should work when axis is log", () => {
          const data = {x: [1, 10, 100, 1000], y: [1, 10, 100, 1000]}
          const glyph_view = create_glyph_view(glyph, data)

          set_scales(glyph_view, "log")
          glyph_view.map_data()

          const result4 = glyph_view.hit_test({type: "point",  sx: 66.666,  sy: 133.333 })!
          const result5 = glyph_view.hit_test({type: "point",  sx: 133.333, sy:  66.666 })!

          expect(result4['1d'].indices).to.be.deep.equal([])
          expect(result5['1d'].indices).to.be.deep.equal([])
        })
      })
    })
  })
})
