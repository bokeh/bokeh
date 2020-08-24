import {expect} from "assertions"

import {Glyph, GlyphView} from "@bokehjs/models/glyphs/glyph"
import {Selection} from "@bokehjs/models/selections"
import {PointGeometry, SpanGeometry, RectGeometry, PolyGeometry} from "@bokehjs/core/geometry"
import {SpatialIndex} from "@bokehjs/core/util/spatial"
import {Context2d} from "@bokehjs/core/util/canvas"
import {with_log_level} from "@bokehjs/core/logging"

import {create_glyph_view} from "./glyph_utils"
import {trap} from "../../../util"

describe("glyph module", () => {

  describe("GlyphView", () => {

    it("GlyphView.hit_test() should warn when requested geometry is not implemented", async () => {
      class SomeGlyphView extends GlyphView {
        model: SomeGlyph

        protected _index_data(index: SpatialIndex): void {
          index.add_empty()
        }

        protected _render(_ctx: Context2d, _indices: number[], {}: object): void {}

        scenterxy(): [number, number] {
          return [0, 0]
        }

        protected _hit_point?(_geometry: PointGeometry): Selection {
          return new Selection()
        }

        protected _hit_span?(_geometry: SpanGeometry): Selection {
          return new Selection()
        }
      }

      class SomeGlyph extends Glyph {
        static init_SomeGlyph(): void {
          this.prototype.default_view = SomeGlyphView
        }
      }
      SomeGlyph.init_SomeGlyph()

      const glyph = new SomeGlyph()
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
        expect(out_rect0.debug).to.be.equal("[bokeh] 'rect' selection not available for SomeGlyph\n")
        const out_rect1 = trap(() => {
          expect(glyph_view.hit_test(rect)).to.be.null
        })
        expect(out_rect1.debug).to.be.equal("")

        const poly: PolyGeometry = {type: "poly", sx: [0, 1, 2], sy: [0, 1, 2]}
        const out_poly0 = trap(() => {
          expect(glyph_view.hit_test(poly)).to.be.null
        })
        expect(out_poly0.debug).to.be.equal("[bokeh] 'poly' selection not available for SomeGlyph\n")
        const out_poly1 = trap(() => {
          expect(glyph_view.hit_test(poly)).to.be.null
        })
        expect(out_poly1.debug).to.be.equal("")
      })
    })
  })
})
