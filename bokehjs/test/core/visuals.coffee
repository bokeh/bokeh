{expect} = require "chai"
utils = require "../utils"
{create_glyph_view} = require "../models/glyphs/glyph_utils"

{Visuals} = utils.require "core/visuals"
{ColumnDataSource} = utils.require "models/sources/column_data_source"
{CDSView} = utils.require "models/sources/cds_view"
{IndexFilter} = utils.require "models/filters/index_filter"
{Circle} = utils.require "models/glyphs/circle"

describe "Visuals", ->

  it "should set the correct visual values when values are vectorized", ->
    source = new ColumnDataSource({data: {
        "fill_alpha": [0, 0.5, 1]
    }})
    attrs =
      fill_alpha: {"field": "fill_alpha"}

    circle = new Circle(attrs)
    visuals = new Visuals(circle)

    visuals.warm_cache(source)

    ctx = {}
    visuals.fill.set_vectorize(ctx, 1)
    expect(ctx.globalAlpha).to.be.equal(0.5)

  it "should set the correct visual values when values are vectorized and all_indices is set", ->
    source = new ColumnDataSource({data: {
        "fill_alpha": [0, 0.5, 1]
    }})
    attrs =
      fill_alpha: {"field": "fill_alpha"}

    circle = new Circle(attrs)
    visuals = new Visuals(circle)

    visuals.warm_cache(source)
    visuals.set_all_indices([1, 2])

    ctx = {}
    visuals.fill.set_vectorize(ctx, 1)
    expect(ctx.globalAlpha).to.be.equal(1)

  describe "interacting with GlyphViews", ->

    afterEach ->
      utils.unstub_canvas()
      utils.unstub_solver()

    beforeEach ->
      utils.stub_canvas()
      utils.stub_solver()

    it "set_all_indices should be called by the glyph view", ->
      attrs =
        fill_alpha: {"field": "fill_alpha"}

      circle = new Circle(attrs)
      renderer_view = create_glyph_view(circle, {"fill_alpha": [0, 0.5, 1]}, true)

      filter = new IndexFilter({"indices": [1, 2]})
      renderer_view.model.view = new CDSView({'source': renderer_view.model.data_source, 'filters': [filter]})
      #need to manually set_data because signals for renderer aren't connected by create_glyph_view util
      renderer_view.set_data()

      ctx = {}
      renderer_view.glyph.visuals.fill.set_vectorize(ctx, 1)
      expect(ctx.globalAlpha).to.be.equal(1)
