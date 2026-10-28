import {assert} from "@bokehjs/core/util/assert"
import {PathDecoration} from "@bokehjs/models/graphics/decoration"
import * as sinon from "sinon"

import {expect} from "#framework/assertions"
import {display} from "#framework/layouts"
import {restorable} from "#framework/util"
import {PlotActions, xy} from "#framework/interactive"

import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {GlyphRenderer, GlyphRendererView} from "@bokehjs/models/renderers/glyph_renderer"
import {Arc, Circle, MultiLine, Rect, Scatter, Segment} from "@bokehjs/models/glyphs"
import {NormalHead} from "@bokehjs/models/annotations/arrow_head"
import {build_view} from "@bokehjs/core/build_views"
import {Plot} from "@bokehjs/models/plots"
import {FactorRange, Range1d} from "@bokehjs/models/ranges"
import {CategoricalScale} from "@bokehjs/models/scales"

function mkrenderer(glyph: Scatter): GlyphRenderer {
  const data_source = ColumnDataSource.create({
    data: {
      x: [10, 20, 30, 40],
      y: [1, 2, 3, 4],
      color: ["red", "green", "red", "green"],
      label: ["foo", "bar", "foo", "bar"],
    },
  })
  return GlyphRenderer.create({glyph, data_source})
}

describe("GlyphRenderer", () => {
  it("should attach both named and fractional Arc decorations", () => {
    const renderer = GlyphRenderer.create({glyph: Arc.create()})
    const decoration = renderer.add_path_decoration(NormalHead.create(), {node: "middle"})
    const fractional = renderer.add_path_markings(NormalHead.create(), {positions: [0.5]})
    expect(renderer.glyph.decorations).to.be.equal([decoration, fractional])
  })

  it("should reject unsupported path decorations without partially changing glyphs", () => {
    for (const renderer of [
      GlyphRenderer.create({glyph: Rect.create()}),
      GlyphRenderer.create({glyph: Segment.create(), selection_glyph: Rect.create()}),
    ]) {
      expect(() => renderer.add_path_markings(NormalHead.create(), {positions: [0.25]})).to.throw(Error)
      expect(renderer.glyph.decorations).to.be.equal([])
    }
  })

  it("should reject invalid fractions before attaching decorations", () => {
    const renderer = GlyphRenderer.create({glyph: Segment.create()})
    for (const placement of [-0.1, 1.1, NaN, Infinity]) {
      expect(() => renderer.add_path_markings(NormalHead.create(), {positions: [placement]})).to.throw(Error)
      expect(renderer.glyph.decorations).to.be.equal([])
    }
  })

  it("should add vectorized decorations with state-specific markings", () => {
    const glyph = MultiLine.create()
    const selection_glyph = MultiLine.create()
    const nonselection_glyph = MultiLine.create()
    const renderer = GlyphRenderer.create({
      data_source: ColumnDataSource.create({data: {inset: [12]}}),
      glyph,
      selection_glyph,
      nonselection_glyph,
    })
    const marking = NormalHead.create({fill_color: "gray"})
    const selection_marking = NormalHead.create({fill_color: "orange"})

    const decoration = renderer.add_path_decoration(marking, {
      node: "end",
      inset: {field: "inset"},
      selection_marking,
      nonselection_marking: null,
    })

    expect(glyph.decorations).to.be.equal([decoration])
    expect(decoration.inset).to.be.equal({field: "inset"})
    expect(selection_glyph.decorations.length).to.be.equal(1)
    assert(selection_glyph.decorations[0] instanceof PathDecoration)
    expect(selection_glyph.decorations[0].marking).to.be.equal(selection_marking)
    expect(selection_glyph.decorations[0].inset).to.be.equal({field: "inset"})
    expect(nonselection_glyph.decorations).to.be.equal([])
  })
})

describe("GlyphRendererView", () => {
  // Basic case with no all glyphs going to their defaults
  async function make_grv() {
    const basic_circle = Scatter.create({fill_color: "red"})
    const glyph_renderer = mkrenderer(basic_circle)
    const grv = await build_view(
      glyph_renderer,
      {parent: await build_view(Plot.create())},
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
    expect((nonselection_glyph.model as Scatter).fill_alpha).to.be.equal({value: 0.2})
  })

  it("should have undefined hover_glyph if renderer hover_glyph is null", async () => {
    const grv = await make_grv()
    expect(grv.model.hover_glyph).to.be.null
    expect(grv.hover_glyph).to.be.undefined
  })

  it("should have default muted_glyph with 0.2 alpha", async () => {
    const {muted_glyph} = await make_grv()
    expect((muted_glyph.model as Scatter).fill_alpha).to.be.equal({value: 0.2})
  })

  it("should have default decimated_glyph with 0.3 line alpha and color grey", async () => {
    const {decimated_glyph} = await make_grv()
    expect((decimated_glyph.model as Scatter).line_alpha).to.be.equal({value: 0.3})
    expect((decimated_glyph.model as Scatter).line_color).to.be.equal({value: "grey"})
  })

  it("should paint overlapping selected glyphs in data order after nonselected glyphs", async () => {
    const data_source = ColumnDataSource.create({data: {x: [0, 0, 0], y: [0, 0, 0], color: ["red", "green", "blue"]}})
    const gr = GlyphRenderer.create({glyph: Scatter.create({size: 20, fill_color: {field: "color"}}), data_source})
    const plot = Plot.create({
      width: 200, height: 200, renderers: [gr],
      x_range: Range1d.create({start: -1, end: 1}),
      y_range: Range1d.create({start: -1, end: 1}),
    })
    const {view} = await display(plot)
    const grv = view.renderer_views.get(gr)
    assert(grv instanceof GlyphRendererView)
    using selected = restorable(sinon.spy(grv.selection_glyph, "paint"))
    using nonselected = restorable(sinon.spy(grv.nonselection_glyph, "paint"))
    data_source.selected.indices = [0, 2]
    // Exercise both orders directly, including the insertion order used before normalization.
    for (let i = 0; i < 2; i++) {
      data_source.selected.indices.reverse()
      grv.paint(view.canvas_view.primary.ctx)
      expect(Array.from(nonselected.lastCall.args[1])).to.be.equal([1])
      expect(Array.from(selected.lastCall.args[1])).to.be.equal([0, 2])
      expect(nonselected.lastCall.calledBefore(selected.lastCall)).to.be.true
    }
    expect(data_source.get_array("color")).to.be.equal(["red", "green", "blue"])
  })

  it("should call set_data() once when working with FactorRange", async () => {
    const x_range = FactorRange.create({factors: ["a", "b", "c"]})
    const y_range = FactorRange.create({factors: ["u", "v", "w"]})

    const x_scale = CategoricalScale.create()
    const y_scale = CategoricalScale.create()

    const data_source = ColumnDataSource.create({
      data: {
        x: ["a", "b", "c"],
        y: ["u", "v", "w"],
      },
    })
    const gr = GlyphRenderer.create({glyph: Circle.create({radius: 0.5}), data_source})

    const bare = {toolbar_location: null, title: null, min_border: 0}
    const p = Plot.create({width: 300, height: 300, x_range, y_range, x_scale, y_scale, renderers: [gr], ...bare})

    using spy = restorable(sinon.spy(GlyphRendererView.prototype, "set_data"))
    const {view} = await display(p)

    const actions = new PlotActions(view, {units: "screen"})
    await actions.pan(xy(100, 100), xy(200, 200))

    expect(spy.callCount).to.be.equal(1) // only initial set_data()
  })
})
