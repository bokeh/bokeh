import {expect} from "assertions"
import * as sinon from "sinon"

import {create_glyph_view} from "./_util"
import {Scatter, ScatterView} from "@bokehjs/models/glyphs/scatter"
import type {Geometry} from "@bokehjs/core/geometry"
import {Range1d} from "@bokehjs/models/ranges/range1d"

describe("Glyph (using Scatter as a concrete Glyph)", () => {

  describe("GlyphView", () => {
    let stub: sinon.SinonStub
    let glyph: Scatter

    before_each(() => {
      stub = sinon.stub((ScatterView.prototype as any), "_bounds").callsFake((bounds) => bounds) // XXX: protected

      glyph = new Scatter({
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

    it("should calculate bounds based on data in an x-axis window", async () => {
      const data = {x: [1, 2, 3, 4], y: [-20, 10, 0, 30]}
      const glyph_view = await create_glyph_view(glyph, data, {x_range: new Range1d({start: 1.5, end: 3.5})})
      const bounds = glyph_view.bounds("x")

      expect(bounds).to.be.equal({x0: 2, y0: 0, x1: 3, y1: 10})
    })

    it("should calculate bounds based on data in a y-axis window", async () => {
      const data = {x: [1, 2, 3, 4], y: [-20, 10, 0, 30]}
      const glyph_view = await create_glyph_view(glyph, data, {y_range: new Range1d({start: -1, end: 12})})
      const bounds = glyph_view.bounds("y")

      expect(bounds).to.be.equal({x0: 2, y0: 0, x1: 3, y1: 10})
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

    it("should hit rects against an index", async () => {
      const data = {x: [20, 40, 60], y: [10, 10, 50]}
      const glyph = new Scatter({
        x: {field: "x"},
        y: {field: "y"},
      })

      const glyph_view = await create_glyph_view(glyph, data, {axis_type: "linear"})

      const geometry1: Geometry = {type: "rect", sx0: 0,  sy0: 200, sx1: 40,  sy1: 180}
      const geometry2: Geometry = {type: "rect", sx0: 60, sy0: 210, sx1: 80,  sy1: 150}
      const geometry3: Geometry = {type: "rect", sx0: 0,  sy0:  50, sx1: 200, sy1:  59}

      const result1 = glyph_view.hit_test(geometry1)
      const result2 = glyph_view.hit_test(geometry2)
      const result3 = glyph_view.hit_test(geometry3)

      expect(result1?.indices).to.be.equal([0])
      expect(result2?.indices).to.be.equal([1])
      expect(result3?.indices).to.be.equal([])
    })
  })
})

describe("Scatter", () => {

  describe("ScatterView", () => {
    let glyph: Scatter

    before_each(() => {
      glyph = new Scatter({
        x: {field: "x"},
        y: {field: "y"},
        size: 10,
      })
    })

    it("should calculate bounds based on data", async () => {
      const data = {x: [0, 1, 2, 3], y: [0, 1, 2, 3]}
      const glyph_view = await create_glyph_view(glyph, data)
      const bounds = glyph_view.bounds()

      expect(bounds).to.be.equal({x0: 0, y0: 0, x1: 3, y1: 3})
    })

    it("should calculate bounds based on data in an x-axis window", async () => {
      const data = {x: [1, 2, 3, 4], y: [-20, 10, 0, 30]}
      const glyph_view = await create_glyph_view(glyph, data, {x_range: new Range1d({start: 1.5, end: 3.5})})
      const bounds = glyph_view.bounds("x")

      expect(bounds).to.be.equal({x0: 2, y0: 0, x1: 3, y1: 10})
    })

    it("should calculate bounds based on data in a y-axis window", async () => {
      const data = {x: [1, 2, 3, 4], y: [-20, 10, 0, 30]}
      const glyph_view = await create_glyph_view(glyph, data, {y_range: new Range1d({start: -1, end: 12})})
      const bounds = glyph_view.bounds("y")

      expect(bounds).to.be.equal({x0: 2, y0: 0, x1: 3, y1: 10})
    })

    it("should calculate log bounds based on data values > 0", async () => {
      const data = {x: [1, 2, 3, 4], y: [-20, 0, 10, 30]}
      const glyph_view = await create_glyph_view(glyph, data)
      const log_bounds = glyph_view.log_bounds()

      expect(log_bounds).to.be.equal({x0: 1, y0: 10, x1: 4, y1: 30})
    })

    it("should calculate log bounds based on data", async () => {
      const data = {x: [0, 1, 2, 3], y: [0, 1, 2, 3]}
      const glyph_view = await create_glyph_view(glyph, data)
      const log_bounds = glyph_view.log_bounds()

      expect(log_bounds).to.be.equal({x0: 1, y0: 1, x1: 3, y1: 3})
    })

    describe("hit-testing", () => {

      describe("_hit_point", () => {

        it("should return indices of the scatter that was hit", async () => {
          const data = {x: [60, 100, 140], y: [60, 100, 140]}
          const glyph_view = await create_glyph_view(glyph, data, {axis_type: "linear"})

          const {x_scale, y_scale} = glyph_view.parent.coordinates
          function compute(x: number, y: number) {
            return {sx: x_scale.compute(x), sy: y_scale.compute(y)}
          }

          const geometry1: Geometry = {type: "point", ...compute(60, 60)}
          const geometry2: Geometry = {type: "point", ...compute(102, 98)}
          const geometry3: Geometry = {type: "point", ...compute(12, 9)}

          const result1 = glyph_view.hit_test(geometry1)
          const result2 = glyph_view.hit_test(geometry2)
          const result3 = glyph_view.hit_test(geometry3)

          expect(result1?.indices).to.be.equal([0])
          expect(result2?.indices).to.be.equal([1])
          expect(result3?.indices).to.be.equal([])
        })
      })
    })
  })
})
