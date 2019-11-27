import {expect} from "chai"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"

describe("GlyphRenderer", () => {

  function mkrenderer(): GlyphRenderer {
    const source = new ColumnDataSource({
      data: {
        x: [10, 20, 30, 40],
        y: [1, 2, 3, 4],
        color: ['red', 'green', 'red', 'green'],
        label: ['foo', 'bar', 'foo', 'bar'],
      },
    })
    return new GlyphRenderer({data_source: source})
  }

  describe("get_reference_point", () => {
    const gr = mkrenderer()

    it("should return 0 if no field, value is passed", () => {
      const index = gr.get_reference_point(null)
      expect(index).to.be.equal(0)
    })

    it("should return 0 if field not in column data source", () => {
      const index = gr.get_reference_point('milk', 'bar')
      expect(index).to.be.equal(0)
    })

    it("should return correct index if field and value in column data source", () => {
      const index = gr.get_reference_point('label', 'bar')
      expect(index).to.be.equal(1)
    })

    it("should return 0 index if field in column data source but value not available", () => {
      const index = gr.get_reference_point('label', 'baz')
      expect(index).to.be.equal(0)
    })
  })

  /* XXX: TODO
  describe("hit_test_helper", () => {

    // Dummy GlyphView classes that implement `hit_test` method
    class HitTestNotImplemented
      hit_test: (geometry) -> return null

    class HitTestMiss
      hit_test: (geometry) -> return create_hit_test_result_from_hits([])

    class HitTestHit
      hit_test: (geometry) -> return create_hit_test_result_from_hits([[0], [1]])

    class DummyGlyphRendererView
      @glyph = null

    before_each () => {
      @glyph_renderer = new DummyGlyphRendererView()
    }

    it("should return null if @visible is false", () => {
      @gr.visible = false
      @glyph_renderer.glyph = new HitTestHit()
      expect(@gr.hit_test_helper("geometry", @glyph_renderer)).to.be.null
    })

    it("should return null if GlyphView doesn't have hit-testing and returns null", () => {
      @glyph_renderer.glyph = new HitTestNotImplemented()
      expect(@gr.hit_test_helper("geometry", @glyph_renderer)).to.be.null
    })

    it("should return an empty Selection if hit_test is a miss", () => {
      @glyph_renderer.glyph = new HitTestMiss()
      expect(@gr.hit_test_helper("geometry", @glyph_renderer)).to.be.instanceof(Selection)
      expect(@gr.hit_test_helper("geometry", @glyph_renderer).is_empty()).to.be.true
    })

    it("should return a Selection with the hit if hit_test is a hit", () => {
      @glyph_renderer.glyph = new HitTestHit()
      expect(@gr.hit_test_helper("geometry", @glyph_renderer)).to.be.instanceof(Selection)
      expect(@gr.hit_test_helper("geometry", @glyph_renderer).indices).to.be.deep.equal([0, 1])
    })
  })
  */
})
