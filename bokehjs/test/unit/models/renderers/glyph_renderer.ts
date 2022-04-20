import {expect} from "assertions"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {Circle} from "@bokehjs/models/glyphs"
import {build_view} from "@bokehjs/core/build_views"
import {Plot} from "@bokehjs/models/plots"

function mkrenderer(glyph_obj: Circle): GlyphRenderer {
  const source = new ColumnDataSource({
    data: {
      x: [10, 20, 30, 40],
      y: [1, 2, 3, 4],
      color: ["red", "green", "red", "green"],
      label: ["foo", "bar", "foo", "bar"],
    },
  })
  return new GlyphRenderer({glyph: glyph_obj, data_source: source})
}

describe("GlyphRendererView", async () => {
  // Basic case with no all glyphs going to their defaults

  const basic_circle = new Circle({fill_color: "red"})
  const glyph_renderer = mkrenderer(basic_circle)
  const plot_view = await build_view(new Plot())
  const grv = await build_view(glyph_renderer, {parent: plot_view.frame})

  const {glyph, selection_glyph, nonselection_glyph, muted_glyph, decimated_glyph} = grv

  describe("get_reference_point", () => {
    it("should return 0 if no field, value is passed", () => {
      const index = grv.get_reference_point(null)
      expect(index).to.be.equal(0)
    })

    it("should return 0 if field not in column data source", () => {
      const index = grv.get_reference_point("milk", "bar")
      expect(index).to.be.equal(0)
    })

    it("should return correct index if field and value in column data source", () => {
      const index = grv.get_reference_point("label", "bar")
      expect(index).to.be.equal(1)
    })

    it("should return 0 index if field in column data source but value not available", () => {
      const index = grv.get_reference_point("label", "baz")
      expect(index).to.be.equal(0)
    })
  })

  it("should have default selection_glyph equal to main glyph", () => {
    expect(selection_glyph.model.attributes).to.be.equal(glyph.model.attributes)
  })

  it("should have default nonselection_glyph with 0.2 alpha", () => {
    expect((nonselection_glyph.model as Circle).fill_alpha).to.be.equal({value: 0.2})
  })

  it("should have undefined hover_glyph if renderer hover_glyph is null", () => {
    expect(grv.model.hover_glyph).to.be.null
    expect(grv.hover_glyph).to.be.undefined
  })

  it("should have default muted_glyph with 0.2 alpha", () => {
    expect((muted_glyph.model as Circle).fill_alpha).to.be.equal({value: 0.2})
  })

  it("should have default decimated_glyph with 0.3 line alpha and color grey", () => {
    expect((decimated_glyph.model as Circle).line_alpha).to.be.equal({value: 0.3})
    expect((decimated_glyph.model as Circle).line_color).to.be.equal({value: "grey"})
  })

})
