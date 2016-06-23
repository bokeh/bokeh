{expect} = require "chai"
utils = require "../utils"

SelectionManager = utils.require "common/selection_manager"

SomeMarker = utils.require("models/markers/circle_x").Model
GlyphRenderer = utils.require("models/renderers/glyph_renderer").Model
GlyphRendererView = utils.require("models/renderers/glyph_renderer").View
ColumnDataSource = utils.require("models/sources/column_data_source").Model
LinearMapper = utils.require("models/mappers/linear_mapper").Model
Range1d = utils.require("models/ranges/range1d").Model

hittest = utils.require "common/hittest"
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

  plot_view_stub_normal = {
    frame:
      get: (param) ->
        if param is 'x_mappers' or param is 'y_mappers'
          {'default': mapper_normal}
    canvas_view:
      ctx: {'glcanvas': null}
  }

  plot_view_stub_reverse = {
    frame:
      get: (param) ->
        if param is 'x_mappers' or param is 'y_mappers'
          {'default': mapper_reverse}
    canvas_view:
      ctx: {'glcanvas': null}
  }

  plot_model_stub = {
    use_map: false
    get: (param) -> 1 if param is 'lod_factor'
    plot: {lod_factor: 0.1}
  }

  column_data_source = new ColumnDataSource({
    data:
      x: [0, 1, 2, 3, 4]
      y: [0, 1, 2, 3, 4]
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

  sm = new SelectionManager()

  it "should start with no selectors", ->
    expect(sm.selectors).to.deep.equal {}

  selector = null

  it "should add a selector when encountering a new renderer", ->
    utils.require("core/util/underscore").patch()
    selector = sm._get_selector(glyph_renderer_view_normal)
    expect(Object.keys(sm.selectors)).to.have.lengthOf(1)
    expect(sm.selectors).to.have.property glyph_renderer_view_normal.model.id

  it "should create a selector with an empty selection", ->
    expect(selector.get('indices')).to.deep.equal empty_selection

  it "should return the right selector", ->
    selector2 = sm._get_selector(glyph_renderer_view_normal)
    expect(Object.keys(sm.selectors)).to.have.lengthOf(1)
    expect(selector2).to.equal(selector)

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
      expect(sm.get('source').get('selected')).to.deep.equal empty_selection
      sm.select('tool', glyph_renderer_view_normal, geometry, true)
      expect(sm.get('source').get('selected')).to.not.deep.equal empty_selection

    it "should update its selectors", ->
      sm = new SelectionManager({'source': column_data_source})
      sm.select('tool', glyph_renderer_view_normal, geometry, true)
      expect(sm.selectors[glyph_renderer_view_normal.model.id]).to.not.deep.equal empty_selection

    it "should work when mappers are reversed", ->
      sm = new SelectionManager({'source': column_data_source})
      sm.select('tool', glyph_renderer_view_reverse, geometry, true)
      expect(sm.get('source').get('selected')).to.not.deep.equal empty_selection
      expect(sm.selectors[glyph_renderer_view_reverse.model.id]).to.not.deep.equal empty_selection
