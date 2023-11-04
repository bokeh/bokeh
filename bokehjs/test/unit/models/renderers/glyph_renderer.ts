import * as sinon from "sinon"

import {expect} from "assertions"
import {display, restorable} from "../../_util"
import {PlotActions, xy} from "../../../interactive"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {GlyphRenderer, GlyphRendererView} from "@bokehjs/models/renderers/glyph_renderer"
import {Circle} from "@bokehjs/models/glyphs"
import {build_view} from "@bokehjs/core/build_views"
import {Plot} from "@bokehjs/models/plots"
import {FactorRange} from "@bokehjs/models/ranges"
import {CategoricalScale} from "@bokehjs/models/scales"

function mkrenderer(glyph: Circle): GlyphRenderer {
  const data_source = new ColumnDataSource({
    data: {
      x: [10, 20, 30, 40],
      y: [1, 2, 3, 4],
      color: ["red", "green", "red", "green"],
      label: ["foo", "bar", "foo", "bar"],
    },
  })
  return new GlyphRenderer({glyph, data_source})
}

describe("GlyphRendererView", () => {
  // Basic case with no all glyphs going to their defaults
  async function make_grv() {
    const basic_circle = new Circle({fill_color: "red"})
    const glyph_renderer = mkrenderer(basic_circle)
    const grv = await build_view(
      glyph_renderer,
      {parent: await build_view(new Plot())},
    )
    return grv
  }

  describe("get_reference_point", () => {
    it("should return 0 if no field, value is passed", async () => {
      const grv = await make_grv()
      const index = grv.get_reference_point(null)
      expect(index).to.be.equal(0)
    })

    it("should return 0 if field not in column data source", async () => {
      const grv = await make_grv()
      const index = grv.get_reference_point("milk", "bar")
      expect(index).to.be.equal(0)
    })

    it("should return correct index if field and value in column data source", async () => {
      const grv = await make_grv()
      const index = grv.get_reference_point("label", "bar")
      expect(index).to.be.equal(1)
    })

    it("should return 0 index if field in column data source but value not available", async () => {
      const grv = await make_grv()
      const index = grv.get_reference_point("label", "baz")
      expect(index).to.be.equal(0)
    })
  })

  it("should have default selection_glyph equal to main glyph", async () => {
    const {glyph, selection_glyph} = await make_grv()
    expect(selection_glyph.model.attributes).to.be.equal(glyph.model.attributes)
  })

  it("should have default nonselection_glyph with 0.2 alpha", async () => {
    const {nonselection_glyph} = await make_grv()
    expect((nonselection_glyph.model as Circle).fill_alpha).to.be.equal({value: 0.2})
  })

  it("should have undefined hover_glyph if renderer hover_glyph is null", async () => {
    const grv = await make_grv()
    expect(grv.model.hover_glyph).to.be.null
    expect(grv.hover_glyph).to.be.undefined
  })

  it("should have default muted_glyph with 0.2 alpha", async () => {
    const {muted_glyph} = await make_grv()
    expect((muted_glyph.model as Circle).fill_alpha).to.be.equal({value: 0.2})
  })

  it("should have default decimated_glyph with 0.3 line alpha and color grey", async () => {
    const {decimated_glyph} = await make_grv()
    expect((decimated_glyph.model as Circle).line_alpha).to.be.equal({value: 0.3})
    expect((decimated_glyph.model as Circle).line_color).to.be.equal({value: "grey"})
  })

  it("should call set_data() once when working with FactorRange", async () => {
    const x_range = new FactorRange({factors: ["a", "b", "c"]})
    const y_range = new FactorRange({factors: ["u", "v", "w"]})

    const x_scale = new CategoricalScale()
    const y_scale = new CategoricalScale()

    const data_source = new ColumnDataSource({
      data: {
        x: ["a", "b", "c"],
        y: ["u", "v", "w"],
      },
    })
    const gr = new GlyphRenderer({glyph: new Circle({radius: 0.5}), data_source})

    const bare = {toolbar_location: null, title: null, min_border: 0}
    const p = new Plot({width: 300, height: 300, x_range, y_range, x_scale, y_scale, renderers: [gr], ...bare})

    using spy = restorable(sinon.spy(GlyphRendererView.prototype, "set_data"))
    const {view} = await display(p)

    const actions = new PlotActions(view, {units: "screen"})
    await actions.pan(xy(100, 100), xy(200, 200))

    expect(spy.callCount).to.be.equal(1) // only initial set_data()
  })
})
