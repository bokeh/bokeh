import {expect, expect_instanceof} from "#framework/assertions"
import {trap} from "#framework/util"
import {display, fig} from "#framework/layouts"
import {require_glglyph, settle_webgl} from "#framework/webgl"

import {Glyph, GlyphView} from "@bokehjs/models/glyphs/glyph"
import {Selection} from "@bokehjs/models/selections"
import type {PointGeometry, SpanGeometry, RectGeometry, PolyGeometry} from "@bokehjs/core/geometry"
import type {SpatialIndex} from "@bokehjs/core/util/spatial"
import type {Context2d} from "@bokehjs/core/util/canvas"
import {with_log_level} from "@bokehjs/core/logging"
import {version} from "@bokehjs/version"
import {ndarray} from "@bokehjs/core/util/ndarray"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {IndexFilter} from "@bokehjs/models/filters/index_filter"
import {MultiLine, MultiLineView} from "@bokehjs/models/glyphs/multi_line"
import {Patches, PatchesView} from "@bokehjs/models/glyphs/patches"

import {create_glyph_view} from "./_util"

describe("glyph module", () => {

  describe("GlyphView", () => {

    for (const output_backend of ["canvas", "webgl"] as const) {
      for (const kind of ["MultiLine", "Patches"] as const) {
        it(`renders and filters shaped coordinate replacements for ${kind} with ${output_backend}`, async () => {
          const source = ColumnDataSource.create({data: {
            xs: [[1, 2, 1], [3, 4, 3]], ys: [[1, 1, 2], [3, 3, 4]],
          }})
          const attrs = {xs: {field: "xs"}, ys: {field: "ys"}, line_color: "red", line_width: 4}
          const model = kind == "MultiLine" ? MultiLine.create(attrs) : Patches.create(attrs)
          const renderer = GlyphRenderer.create({glyph: model, data_source: source})
          const plot = fig([200, 200], {output_backend, x_range: [0, 6], y_range: [0, 6], renderers: [renderer]})
          plot.xgrid.visible = false
          plot.ygrid.visible = false
          const {view} = await display(plot)
          const glyph = view.owner.get_one(renderer).glyph
          if (kind == "MultiLine") {
            expect_instanceof(glyph, MultiLineView)
          } else {
            expect_instanceof(glyph, PatchesView)
          }
          if (output_backend == "webgl") {
            require_glglyph(glyph)
          }
          const before = view.canvas_view.primary.canvas.toDataURL()

          source.data = {
            xs: ndarray(new Float64Array([1, 2, 1, 4, 5, 4]), {shape: [2, 3]}),
            ys: ndarray(new Float64Array([1, 1, 2, 4, 4, 5]), {shape: [2, 3]}),
          }
          await settle_webgl(view)
          expect(glyph.data_size).to.be.equal(2)
          expect(Array.from(glyph.xs.get(1))).to.be.equal([4, 5, 4])
          expect(Array.from(glyph.ys.get(1))).to.be.equal([4, 4, 5])
          expect(view.canvas_view.primary.canvas.toDataURL() != before).to.be.true

          renderer.view.filter = IndexFilter.create({indices: [1]})
          await settle_webgl(view)
          expect(glyph.data_size).to.be.equal(1)
          expect(Array.from(glyph.xs.get(0))).to.be.equal([4, 5, 4])
          expect(Array.from(glyph.ys.get(0))).to.be.equal([4, 4, 5])
          const {ctx, pixel_ratio} = view.canvas_view.primary
          const sx = Math.floor(view.frame.x_scale.compute(4.5)*pixel_ratio)
          const sy = Math.floor(view.frame.y_scale.compute(4)*pixel_ratio)
          expect([...ctx.getImageData(sx, sy, 1, 1).data]).to.be.equal([255, 0, 0, 255])

          source.data = {
            xs: ndarray(new Float32Array([1, 2, 1, 2, 3, 2, 4, 5, 4]), {shape: [3, 3]}),
            ys: ndarray(new Float32Array([1, 1, 2, 4, 4, 5, 1, 1, 2]), {shape: [3, 3]}),
          }
          await settle_webgl(view)
          expect(glyph.data_size).to.be.equal(1)
          expect(Array.from(glyph.xs.get(0))).to.be.equal([2, 3, 2])
          expect(Array.from(glyph.ys.get(0))).to.be.equal([4, 4, 5])

          renderer.view.filter = IndexFilter.create({indices: []})
          source.data = {
            xs: ndarray(new Float64Array(), {shape: [0, 3]}),
            ys: ndarray(new Float64Array(), {shape: [0, 3]}),
          }
          await settle_webgl(view)
          expect(glyph.data_size).to.be.equal(0)
          expect(glyph.xs.length).to.be.equal(0)
          expect(glyph.ys.length).to.be.equal(0)
        })
      }
    }

    it("GlyphView.hit_test() should warn when requested geometry is not implemented", async () => {
      class SomeGlyphView extends GlyphView {
        declare model: SomeGlyph

        protected _index_data(index: SpatialIndex): void {
          index.add_empty()
        }

        protected _paint(_ctx: Context2d, _indices: Int32Array, _data: object): void {}

        scenterxy(): [number, number] {
          return [0, 0]
        }

        protected override _hit_point?(_geometry: PointGeometry): Selection {
          return Selection.create()
        }

        protected override _hit_span?(_geometry: SpanGeometry): Selection {
          return Selection.create()
        }
      }

      class SomeGlyph extends Glyph {
        static {
          this.prototype.default_view = SomeGlyphView
        }
      }

      const glyph = SomeGlyph.create()
      const data = {}
      const glyph_view = await create_glyph_view(glyph, data) as SomeGlyphView // XXX

      with_log_level("debug", () => {
        const point: PointGeometry = {type: "point", sx: 0, sy: 0}
        const out_point = trap(() => {
          expect(glyph_view.hit_test(point)).to.be.instanceof(Selection)
        })
        expect(out_point.debug).to.be.equal("")

        const span: SpanGeometry = {type: "span", sx: 0, sy: 0, direction: "h"}
        const out_span = trap(() => {
          expect(glyph_view.hit_test(span)).to.be.instanceof(Selection)
        })
        expect(out_span.debug).to.be.equal("")

        const rect: RectGeometry = {type: "rect", sx0: 0, sy0: 0, sx1: 1, sy1: 1}
        const out_rect0 = trap(() => {
          expect(glyph_view.hit_test(rect)).to.be.null
        })
        expect(out_rect0.debug).to.be.equal(`[bokeh ${version}] 'rect' selection not available for SomeGlyph\n`)
        const out_rect1 = trap(() => {
          expect(glyph_view.hit_test(rect)).to.be.null
        })
        expect(out_rect1.debug).to.be.equal("")

        const poly: PolyGeometry = {type: "poly", sx: [0, 1, 2], sy: [0, 1, 2]}
        const out_poly0 = trap(() => {
          expect(glyph_view.hit_test(poly)).to.be.null
        })
        expect(out_poly0.debug).to.be.equal(`[bokeh ${version}] 'poly' selection not available for SomeGlyph\n`)
        const out_poly1 = trap(() => {
          expect(glyph_view.hit_test(poly)).to.be.null
        })
        expect(out_poly1.debug).to.be.equal("")
      })
    })
  })
})
