{expect} = require "chai"
utils = require "../utils"

{SelectionManager} = utils.require "core/selection_manager"

SomeMarker = utils.require("models/markers/index").CircleX
{GlyphRenderer} = utils.require("models/renderers/glyph_renderer")
{GlyphRendererView} = utils.require("models/renderers/glyph_renderer")
{ColumnDataSource} = utils.require("models/sources/column_data_source")
{LinearMapper} = utils.require("models/mappers/linear_mapper")
{Range1d} = utils.require("models/ranges/range1d")

hittest = utils.require "core/hittest"
empty_selection = hittest.create_hit_test_result()

describe "SelectionManager", ->

  source_normal = {start: 0, end: 10}
  source_reverse = {start: 10, end: 0}
  target = {start: 0, end: 100}

  mapper_normal = new LinearMapper({
    source_range: new Range1d(source_normal)
    target_range: new Range1d(target)
  })

  mapper_reverse = new LinearMapper({
    source_range: new Range1d(source_reverse)
    target_range: new Range1d(target)
  })

  # The objects defined below to stub out the Plot and PlotView depend on the current interfaces
  # of Plot and PlotView and the specific implementation of GlyphRenderer and GlyphRendererView
  # initialization. For example, the GlyphRendererView defines its x and y mapper through:

  # @xmapper = @plot_view.frame.x_mappers[@model.x_range_name]
  # @ymapper = @plot_view.frame.y_mappers[@model.y_range_name]

  # so we put the mappers (mapper_normal and mapper_reverse, defined above)
  # in the stub objects in the same "location".

  plot_model_stub = {
    use_map: false
    lod_factor: 1
    plot: {lod_factor: 0.1}
  }

  plot_view_stub_normal = {
    frame:
      'x_mappers':
        {'default': mapper_normal}
      'y_mappers':
        {'default': mapper_normal}
    canvas_view:
      ctx: {}
    model:
      plot_model_stub
  }

  plot_view_stub_reverse = {
    frame:
      'x_mappers':
        {'default': mapper_reverse}
      'y_mappers':
        {'default': mapper_reverse}
    canvas_view:
      ctx: {}
    model:
      plot_model_stub
  }

  column_data_source = new ColumnDataSource({
    data:
      x: [0, 1, 2, 3, 4]
      y: [0, 1, 2, 3, 4]
      z: [5, 6, 7, 8, 9]
  })

  glyph_renderer = new GlyphRenderer({
    data_source:  column_data_source
    glyph:        new SomeMarker({x: {field: "x"}, y: {field: "y"}})
  })

  glyph_renderer_view_normal = new GlyphRendererView({
    plot_model: plot_model_stub
    plot_view: plot_view_stub_normal
    model: glyph_renderer
  })

  glyph_renderer_view_reverse = new GlyphRendererView({
    plot_model: plot_model_stub
    plot_view: plot_view_stub_reverse
    model: glyph_renderer
  })

  glyph_renderer2 = new GlyphRenderer({
    data_source:  column_data_source
    glyph:        new SomeMarker({x: {field: "x"}, y: {field: "z"}})
  })

  glyph_renderer_view2 = new GlyphRendererView({
    plot_model: plot_model_stub
    plot_view: plot_view_stub_normal
    model: glyph_renderer2
  })

  sm = new SelectionManager()

  describe "using rect geometry (like that from box select tool)", ->

    geometry = {
      type: 'rect'
      vx0: 0
      vx1: 100
      vy0: 0
      vy1: 100
    }

    it "should update its data source's selected property", ->
      sm = new SelectionManager({'source': column_data_source})
      expect(sm.source.selected).to.deep.equal empty_selection
      sm.select('tool', [glyph_renderer_view_normal], geometry, true)
      expect(sm.source.selected).to.not.deep.equal empty_selection

    it "should update its selector", ->
      sm = new SelectionManager({'source': column_data_source})
      sm.select('tool', [glyph_renderer_view_normal], geometry, true)
      expect(sm.selector).to.not.deep.equal empty_selection

    it "should work when mappers are reversed", ->
      sm = new SelectionManager({'source': column_data_source})
      sm.select('tool', [glyph_renderer_view_reverse], geometry, true)
      expect(sm.source.selected).to.not.deep.equal empty_selection
      expect(sm.selector).to.not.deep.equal empty_selection

    geometry2 = {
      type: 'rect'
      vx0: 0
      vx1: 100
      vy0: 60
      vy1: 100
    }

    it "should select from multiple renderers", ->
      sm = new SelectionManager({'source': column_data_source})
      sm.select('tool', [glyph_renderer_view_normal], geometry2, true)
      expect(sm.source.selected).to.deep.equal empty_selection
      sm.select('tool', [glyph_renderer_view_normal, glyph_renderer_view2], geometry2, true)
      expect(sm.source.selected).not.to.deep.equal empty_selection
